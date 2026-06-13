import type { ProviderConfig } from "./types";
import { AIError } from "./errors";

// ---------------------------------------------------------------------------
// AI scene art (issue #20)
// ---------------------------------------------------------------------------
//
// Illustrations for key story moments, generated browser-direct with the
// player's own key (the BYOK pattern — we never proxy or pay).
//
// Research summary (issue task):
//   - OpenAI Images (dall-e-3 / gpt-image-1): browser-CORS friendly, works
//     with the OpenAI key players already configure; ~$0.04 per 1024px
//     standard dall-e-3 image. CHOSEN — zero new credentials.
//   - Stability AI: cheaper per image but a second API key + no benefit.
//   - Midjourney: no official API. Local SD: no setup-free path.
//   Cost guidance: at one image per key event (~every 5-10 turns), art adds
//   roughly $0.04-0.30/session — hence OPT-IN (default off) via preferences.
//
// Style consistency comes from one fixed style prelude; per-event content is
// appended from the journal entry that triggered the moment. Images are
// cached client-side (IndexedDB, components layer) keyed by session+turn so
// a moment is never paid for twice.

/** Journal event types that warrant an illustration. */
const ART_TRIGGERS = new Set(["advancement", "death", "combat", "major-event"]);

export function shouldGenerateSceneArt(eventType: string): boolean {
  return ART_TRIGGERS.has(eventType);
}

/** The fixed style prelude — every image shares it for visual coherence. */
export const SCENE_ART_STYLE =
  "Victorian-era occult illustration, 1890s gaslight city, thick fog, muted sepia and amber palette with deep blacks, ink-and-wash engraving style with fine crosshatching, dramatic chiaroscuro lamplight, cosmic-horror undertone, no text, no lettering, no borders";

const MAX_SCENE_DESCRIPTION = 400;

export interface SceneArtContext {
  /** One-line event summary (journal entry summary). */
  summary: string;
  location: string;
  /** Optional pathway flavor, e.g. "Seer of the Fool pathway". */
  pathwayName?: string;
}

/** Compose the full generation prompt: fixed style first, then the moment. */
export function buildSceneArtPrompt(context: SceneArtContext): string {
  const scene = [
    context.summary,
    `Setting: ${context.location}.`,
    context.pathwayName ? `The figure is a ${context.pathwayName}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, MAX_SCENE_DESCRIPTION);
  return `${SCENE_ART_STYLE}. Scene: ${scene}`;
}

/** Scene art rides the player's OpenAI key; other providers have no
 * browser-reachable image endpoint, so the feature simply stays hidden. */
export function sceneArtSupported(config: ProviderConfig | null): boolean {
  return config?.providerId === "openai" && !!config.apiKey;
}

export const SCENE_ART_MODEL = "dall-e-3";

/**
 * Generate one illustration, returning a `data:` URL ready for an <img> and
 * the IndexedDB cache. Browser-direct; errors map onto the shared AIError
 * codes so the UI's existing handling applies.
 */
export async function generateSceneArt(
  config: ProviderConfig,
  prompt: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  if (!sceneArtSupported(config)) {
    throw new AIError("VALIDATION_FAILED", "Scene art requires an OpenAI key.");
  }
  const response = await fetchFn("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: SCENE_ART_MODEL,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new AIError("AUTH_ERROR", "The provider rejected your API key.");
    }
    if (response.status === 429) {
      throw new AIError("RATE_LIMITED", "Image generation is rate limited.");
    }
    throw new AIError("PROVIDER_ERROR", `Image generation failed (${response.status}).`);
  }

  const payload = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    throw new AIError("MALFORMED_OUTPUT", "The provider returned no image data.");
  }
  return `data:image/png;base64,${b64}`;
}

/** Cache key for one illustrated moment: a session's turn is the identity. */
export function sceneArtKey(sessionId: string, turnNumber: number): string {
  return `${sessionId}:${turnNumber}`;
}
