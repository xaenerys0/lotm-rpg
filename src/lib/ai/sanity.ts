/**
 * Sanity tiers and the narration directives they impose on the AI narrator.
 *
 * The tier classification lives in the AI layer because `GameState` (and the
 * prompt assembly that consumes the tier) lives here. The game layer
 * (`src/lib/game/sanity.ts`) builds its UI-effect profiles and drain/recovery
 * mechanics on top of this single source of truth.
 *
 * Pure functions only — no side effects.
 */

export type SanityTier = "high" | "medium" | "low" | "critical";

/**
 * Lower bound (inclusive, as a percentage of max sanity) for each tier, per the
 * game design spec:
 * - High: 75-100%
 * - Medium: 40-74%
 * - Low: 15-39%
 * - Critical: 0-14%
 */
export const SANITY_TIER_THRESHOLDS = {
  high: 75,
  medium: 40,
  low: 15,
} as const;

/** Sanity as a percentage of the maximum, clamped to [0, 100]. */
export function sanityPercent(sanity: number, maxSanity: number): number {
  if (maxSanity <= 0) return 0;
  const pct = (sanity / maxSanity) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Classify a sanity value into its qualitative tier. */
export function classifySanityTier(sanity: number, maxSanity: number): SanityTier {
  const pct = sanityPercent(sanity, maxSanity);
  if (pct >= SANITY_TIER_THRESHOLDS.high) return "high";
  if (pct >= SANITY_TIER_THRESHOLDS.medium) return "medium";
  if (pct >= SANITY_TIER_THRESHOLDS.low) return "low";
  return "critical";
}

/**
 * The narration directive injected into the prompt for a given sanity tier.
 * High sanity returns an empty string — a reliable narrator needs no special
 * instruction, and omitting the layer saves tokens.
 */
export function sanityNarrationDirective(tier: SanityTier): string {
  switch (tier) {
    case "high":
      return "";
    case "medium":
      return `## Narrator State — Strained (Medium Sanity)
The character's mind is fraying at the edges. Narrate reliably, but:
- Let an occasional detail feel subtly *off* — a shadow that lingers a beat too long, a sound with no source — without confirming whether it is real.
- Have NPCs occasionally remark on the character's tired, haunted, or unsettled appearance.
- Keep all choices rational and grounded.`;
    case "low":
      return `## Narrator State — Unreliable (Low Sanity)
The character's perception is failing. Narrate as an UNRELIABLE narrator:
- Introduce sensory inconsistencies and contradictions (a detail described one way, then another). Do not flag them as hallucinations — present them plainly.
- Make the prose surreal and dreamlike where it serves the dread.
- Include exactly ONE irrational or self-destructive option among the choices, framed as if it were reasonable to the character. This requirement OVERRIDES the "Choice Design" grounded-choice rule for that one option — surface it even though it is not what a clear-headed person would weigh; the rest of the choices stay grounded.
- NPCs react to the character with visible unease or fear.`;
    case "critical":
      return `## Narrator State — Shattering (Critical Sanity)
The character's grip on reality is collapsing. Narrate as a deeply UNRELIABLE narrator:
- Describe hallucinated people, voices, or scenes AS IF THEY ARE REAL. Never label them as unreal.
- Contradict earlier details freely; let the scene feel genuinely unstable.
- Among the choices, include at least one FALSE choice — an option that references something that may not exist, or that leads nowhere coherent. This requirement OVERRIDES the "Choice Design" grounded-choice rule for that one option — surface it even though it is ungrounded; the remaining choices stay coherent.
- The world should feel hostile and dissolving. Restraint is abandoned; dread is total.`;
  }
}
