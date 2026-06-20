"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

import {
  buildSceneArtPrompt,
  generateImage,
  imageArtSupported,
  type ImageProviderConfig,
  type SceneArtContext,
} from "@/lib/ai";
import { IMAGE_PROVIDER_CONFIG_KEY } from "@/lib/game";
import { noopSubscribe } from "@/lib/react";

// Dev-only scene-art testbench (gated by NEXT_PUBLIC_DEV_TOOLS at the route).
// It exercises the REAL image path — saved BYOK provider config → generateImage
// → transport → response parse → <img> render — for each trigger moment's
// prompt, WITHOUT any game progression or AI text turn. It deliberately does
// NOT use the SceneArt component (which replays from IndexedDB): each run calls
// generateImage directly and renders the returned data-URL, so re-testing always
// re-generates and never pollutes the real scene-art cache.

interface Sample {
  eventType: string;
  context: SceneArtContext;
}

// One representative context per scene-art trigger eventType. The eventType
// itself doesn't change the prompt (buildSceneArtPrompt reads summary/location/
// pathwayName); these just give the provider four distinct scenes to render.
const SAMPLES: Sample[] = [
  {
    eventType: "advancement",
    context: {
      summary: "A Beyonder drinks the next potion and ascends a Sequence",
      location: "Tingen City",
      pathwayName: "Seer",
    },
  },
  {
    eventType: "combat",
    context: {
      summary: "A desperate clash with a lurking Beyonder in the fog",
      location: "Backlund",
      pathwayName: "Seer",
    },
  },
  {
    eventType: "death",
    context: {
      summary: "The descent into madness as a Beyonder loses control",
      location: "Tingen City",
    },
  },
  {
    eventType: "major-event",
    context: {
      summary: "A revelation shakes a secret order above the gray fog",
      location: "Trier",
    },
  },
];

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; src: string }
  | { status: "error"; message: string };

function loadImageConfig(): ImageProviderConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IMAGE_PROVIDER_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as ImageProviderConfig) : null;
  } catch {
    return null;
  }
}

export function DevSceneArtHarness() {
  // getSnapshot must return a STABLE reference — loadImageConfig JSON-parses a
  // fresh object each call, which would trip React's "getSnapshot should be
  // cached" infinite loop once a config exists. Cache the first read (the same
  // useRef pattern image-provider-config.tsx uses). `undefined` = not-yet-read,
  // since `null` (no config) is a valid resolved value.
  const cacheRef = useRef<ImageProviderConfig | null | undefined>(undefined);
  const config = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === undefined) cacheRef.current = loadImageConfig();
      return cacheRef.current;
    },
    () => null,
  );
  const supported = imageArtSupported(config);
  const [results, setResults] = useState<Record<string, Result>>({});

  const run = useCallback(
    async (sample: Sample) => {
      if (!config) return;
      setResults((prev) => ({ ...prev, [sample.eventType]: { status: "loading" } }));
      try {
        const src = await generateImage(config, buildSceneArtPrompt(sample.context));
        setResults((prev) => ({
          ...prev,
          [sample.eventType]: { status: "done", src },
        }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [sample.eventType]: {
            status: "error",
            message: err instanceof Error ? err.message : String(err),
          },
        }));
      }
    },
    [config],
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div
        role="status"
        className="rounded-md border border-border bg-surface px-4 py-3 text-sm"
      >
        {config ? (
          <p className="text-foreground">
            Image provider:{" "}
            <span className="font-mono text-amber">{config.providerId}</span>
            {config.model ? (
              <>
                {" · model "}
                <span className="font-mono text-amber">{config.model}</span>
              </>
            ) : null}
            {supported ? null : (
              <span className="text-sanity-low">
                {" "}
                — not generatable (missing key or model). Configure it in Settings → Scene
                art.
              </span>
            )}
          </p>
        ) : (
          <p className="text-sanity-low">
            No image provider configured. Set one in Settings → Scene art first.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SAMPLES.map((sample) => {
          const result = results[sample.eventType] ?? { status: "idle" };
          return (
            <div
              key={sample.eventType}
              className="space-y-3 rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-base font-semibold text-foreground">
                  {sample.eventType}
                </h2>
                <button
                  type="button"
                  onClick={() => void run(sample)}
                  disabled={!supported || result.status === "loading"}
                  aria-label={`Generate ${sample.eventType} illustration`}
                  className="min-h-[24px] rounded-md border border-amber/40 bg-amber/[0.08] px-3 py-1.5 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/60 hover:bg-amber/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {result.status === "loading" ? "Generating…" : "Generate"}
                </button>
              </div>

              <p className="text-xs leading-relaxed text-muted">
                {sample.context.summary}
              </p>

              {result.status === "loading" && (
                <p role="status" className="text-sm italic text-muted animate-pulse">
                  An illustration takes shape in the fog…
                </p>
              )}
              {result.status === "error" && (
                <p role="alert" className="text-sm text-sanity-low">
                  {result.message}
                </p>
              )}
              {result.status === "done" && (
                <figure className="m-0">
                  {/* Data-URL/hosted output from the generator — next/image adds nothing. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.src}
                    alt={`Generated illustration for ${sample.eventType}: ${sample.context.summary}`}
                    className="w-full rounded-md border border-border/70"
                  />
                </figure>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
