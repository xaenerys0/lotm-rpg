// ---------------------------------------------------------------------------
// AI scene art (issue #20) — prompt + trigger helpers
// ---------------------------------------------------------------------------
//
// The pure half of scene art: which moments warrant an illustration, the fixed
// visual style, the per-moment prompt, and the cache key. Generation itself is
// provider-agnostic and lives in `image-providers.ts` — scene art is rendered
// by a SEPARATE, independently-configured image provider (image model
// selection), so the narrator can run on one provider while illustrations come
// from another (or none).
//
// Style consistency comes from one fixed style prelude; per-event content is
// appended from the journal entry that triggered the moment. Images are
// cached client-side (IndexedDB, components layer) keyed by session+turn so
// a moment is never generated twice.

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

/** Cache key for one illustrated moment: a session's turn is the identity. */
export function sceneArtKey(sessionId: string, turnNumber: number): string {
  return `${sessionId}:${turnNumber}`;
}
