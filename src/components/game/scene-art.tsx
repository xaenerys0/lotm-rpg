"use client";

import { useEffect, useState } from "react";

import {
  buildSceneArtPrompt,
  generateImage,
  imageArtSupported,
  type ImageProviderConfig,
  type SceneArtContext,
} from "@/lib/ai";

import { getCachedArt, putCachedArt } from "./scene-art-cache";

// Scene illustration (issue #20): renders a cached image immediately; when
// absent (and the player has opted in with a configured image provider) it
// generates once, caches, and fades in. Failures stay silent — art is
// garnish, never a blocker. The image provider/model is configured separately
// from the text narrator (image model selection).

export function SceneArt({
  artKey,
  context,
  imageConfig,
  enabled,
}: {
  artKey: string;
  context: SceneArtContext;
  imageConfig: ImageProviderConfig | null;
  enabled: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cached = await getCachedArt(artKey);
      if (cancelled) return;
      if (cached) {
        setSrc(cached);
        return;
      }
      if (!enabled || !imageConfig || !imageArtSupported(imageConfig)) return;
      setGenerating(true);
      try {
        const dataUrl = await generateImage(imageConfig, buildSceneArtPrompt(context));
        await putCachedArt(artKey, dataUrl);
        if (!cancelled) setSrc(dataUrl);
      } catch (err) {
        // Art is optional — never surface an error to the player. But DO log it:
        // a silent failure (wrong/unsupported image model, unreachable endpoint)
        // is otherwise impossible to diagnose. The key is never part of `err`.
        console.error("[scene-art] image generation failed", {
          provider: imageConfig.providerId,
          model: imageConfig.model,
          reason: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Regenerate only when the moment itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artKey, enabled]);

  if (src) {
    return (
      <figure className="my-4 animate-fade-in">
        {/* Data-URL output from the generator — next/image adds nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Illustration: ${context.summary}`}
          className="mx-auto w-full max-w-md rounded-lg border border-border/70 shadow-[0_0_32px_rgba(0,0,0,0.5)]"
        />
        <figcaption className="mt-2 text-center font-serif text-xs italic text-muted">
          {context.summary}
        </figcaption>
      </figure>
    );
  }

  if (generating) {
    return (
      <p
        role="status"
        className="my-4 text-center font-serif text-xs italic text-muted animate-pulse"
      >
        An illustration takes shape in the fog…
      </p>
    );
  }

  return null;
}
