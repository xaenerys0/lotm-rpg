import type { GameState } from "@/lib/ai";
import { classifySanityTier, type SanityTier } from "@/lib/ai";

import { clamp } from "./math";

/**
 * Sanity / madness engine (issue #9).
 *
 * The tier classification and AI narration directives live in `@/lib/ai`
 * (alongside `GameState` and the prompt assembly that consumes them). This
 * module builds the *game-facing* concerns on top of that single source of
 * truth:
 *
 * - `SANITY_EFFECTS`: per-tier UI-effect profiles (CSS class, distortion level,
 *   which narrative degradations are active) consumed by the React layer.
 * - Drain / recovery / decay triggers: pure functions mapping a gameplay event
 *   to a sanity delta (negative drains, positive recovers).
 * - Loss-of-control evaluation at zero sanity, ready to integrate with the
 *   death/failure system (issue #12).
 *
 * Pure functions only — no side effects, no AI calls.
 */

export type { SanityTier } from "@/lib/ai";
export { classifySanityTier, sanityPercent, SANITY_TIER_THRESHOLDS } from "@/lib/ai";

export const SANITY_MIN = 0;

/** Highest (weakest) sequence level a starting Beyonder occupies. */
const MAX_SEQUENCE_LEVEL = 9;

// ─── UI Effect Profiles ──────────────────────────────────────────────

export interface SanityEffectProfile {
  tier: SanityTier;
  /** CSS class applied to the game surface to drive the visual distortion. */
  className: string;
  /** In-world descriptor shown when the player reveals the (still-qualitative) state. */
  label: string;
  /** Distortion intensity, 0 (none) to 1 (full corruption). Drives overlay opacity. */
  distortion: number;
  /** Narration is unreliable at this tier (matches the AI directive). */
  unreliableNarration: boolean;
  /** Irrational / false choices may appear among the options. */
  falseChoices: boolean;
  /** Hallucinated scenes may be narrated as if real. */
  hallucinations: boolean;
}

export const SANITY_EFFECTS: Record<SanityTier, SanityEffectProfile> = {
  high: {
    tier: "high",
    className: "sanity-fx-high",
    label: "Composed",
    distortion: 0,
    unreliableNarration: false,
    falseChoices: false,
    hallucinations: false,
  },
  medium: {
    tier: "medium",
    className: "sanity-fx-medium",
    label: "Unsettled",
    distortion: 0.25,
    unreliableNarration: false,
    falseChoices: false,
    hallucinations: false,
  },
  low: {
    tier: "low",
    className: "sanity-fx-low",
    label: "Fraying",
    distortion: 0.6,
    unreliableNarration: true,
    falseChoices: true,
    hallucinations: false,
  },
  critical: {
    tier: "critical",
    className: "sanity-fx-critical",
    label: "Shattering",
    distortion: 1,
    unreliableNarration: true,
    falseChoices: true,
    hallucinations: true,
  },
};

/** The UI-effect profile for a given sanity value. */
export function sanityEffects(sanity: number, maxSanity: number): SanityEffectProfile {
  return SANITY_EFFECTS[classifySanityTier(sanity, maxSanity)];
}

// ─── Drain / Recovery / Decay Triggers ───────────────────────────────

/**
 * A gameplay event that moves the sanity meter. The engine — not the AI —
 * decides the magnitude, so these costs are deterministic and balanced.
 *
 * Sequence levels run 9 (low/weakest) down to 0 (True God). A *lower* number
 * means a *higher* sequence and more powerful — hence more taxing — abilities.
 */
export type SanityEvent =
  | { type: "ability-use"; sequenceLevel: number }
  | { type: "horror-encounter"; playerSequence: number; horrorSequence: number }
  | { type: "advancement" }
  | { type: "outer-deity" }
  | { type: "acting-success"; alignment: number }
  | { type: "rest" }
  | { type: "human-connection" }
  | { type: "routine" }
  | { type: "acting-neglect" };

// Drain magnitudes (applied as negative deltas).
export const ABILITY_USE_BASE_DRAIN = 2;
export const ABILITY_USE_PER_SEQUENCE = 1.5;
export const HORROR_BASE_DRAIN = 4;
export const HORROR_PER_GAP = 4;
export const MAX_HORROR_DRAIN = 30;
export const ADVANCEMENT_DRAIN = 25;
export const OUTER_DEITY_DRAIN = 60;

// Recovery magnitudes (applied as positive deltas).
export const ACTING_SUCCESS_RECOVERY = 8;
export const REST_RECOVERY = 8;
export const HUMAN_CONNECTION_RECOVERY = 6;
export const ROUTINE_RECOVERY = 4;

// Slow decay from neglecting the acting method.
export const ACTING_NEGLECT_DECAY = 3;

/**
 * The sanity delta for a gameplay event. Negative values drain sanity, positive
 * values recover it. The caller applies the delta via `applySanityImpact`,
 * which clamps to [0, maxSanity].
 */
export function sanityDelta(event: SanityEvent): number {
  switch (event.type) {
    case "ability-use": {
      // Higher sequences (lower number) cost more.
      const seq = clamp(event.sequenceLevel, 0, MAX_SEQUENCE_LEVEL);
      const drain =
        ABILITY_USE_BASE_DRAIN + (MAX_SEQUENCE_LEVEL - seq) * ABILITY_USE_PER_SEQUENCE;
      return -Math.round(drain);
    }
    case "horror-encounter": {
      // The gap is how much stronger the horror is than the player. A lower
      // sequence number is stronger, so a positive gap = a more powerful horror.
      const gap = event.playerSequence - event.horrorSequence;
      const drain = HORROR_BASE_DRAIN + Math.max(0, gap) * HORROR_PER_GAP;
      return -Math.min(MAX_HORROR_DRAIN, Math.round(drain));
    }
    case "advancement":
      return -ADVANCEMENT_DRAIN;
    case "outer-deity":
      return -OUTER_DEITY_DRAIN;
    case "acting-success": {
      // Scale recovery from neutral (0.5) up to full (1.0); below neutral the
      // acting did not succeed and yields no recovery.
      const a = clamp(event.alignment, 0, 1);
      if (a < 0.5) return 0;
      const t = (a - 0.5) / 0.5;
      return Math.round(t * ACTING_SUCCESS_RECOVERY);
    }
    case "rest":
      return REST_RECOVERY;
    case "human-connection":
      return HUMAN_CONNECTION_RECOVERY;
    case "routine":
      return ROUTINE_RECOVERY;
    case "acting-neglect":
      return -ACTING_NEGLECT_DECAY;
  }
}

// ─── Hybrid sanity: AI event tags (issue #95) ────────────────────────

/**
 * The subset of `SanityEvent` types the AI may fire per turn as lightweight
 * *tags*. The engine — not the AI — owns the magnitude: each tag maps to a
 * `sanityDelta()` event, so per-turn sanity stays consistent and learnable
 * while the AI keeps only a small residual free-form `sanityImpact` (±5) for
 * narrative nuance.
 */
export type SanityEventTag =
  | "rest"
  | "human-connection"
  | "routine"
  | "ability-use"
  | "horror-encounter";

export const SANITY_EVENT_TAGS: readonly SanityEventTag[] = [
  "rest",
  "human-connection",
  "routine",
  "ability-use",
  "horror-encounter",
];

/**
 * A horror met in an ordinary turn is modeled as one rung above the player — a
 * real-but-survivable brush with the uncanny rather than an Outer Deity. Feeds
 * the `horror-encounter` gap so the drain scales with the player's own
 * Sequence (a stronger Beyonder is less rattled by the same encounter).
 */
export const HORROR_TAG_GAP = 1;

/**
 * Cap on the AI's residual free-form sanity nuance per turn (issue #95). The
 * engine owns the bulk of per-turn sanity through `sanityEventTags`; this bounds
 * the small remainder so a single `sanityImpact` can't swing the meter wildly.
 */
export const SANITY_RESIDUAL_CAP = 5;

/**
 * Narrow a loosely-typed AI `sanityEventTags` array to the known set. The AI
 * boundary already normalizes, but the engine never trusts it. Pure.
 */
export function knownSanityTags(tags: readonly string[] | undefined): SanityEventTag[] {
  if (!tags) return [];
  return tags.filter((t): t is SanityEventTag =>
    (SANITY_EVENT_TAGS as readonly string[]).includes(t),
  );
}

export interface SanityBreakdown {
  /** Engine-scored magnitude of the tagged events. */
  tagDelta: number;
  /** The AI's residual free-form nuance, clamped to ±`SANITY_RESIDUAL_CAP`. */
  residual: number;
  /** `tagDelta + residual` — the sanity delta actually applied this turn. */
  total: number;
}

/**
 * The single source of truth for hybrid per-turn sanity (issue #95): engine-owned
 * tag magnitudes (against the player's Sequence) plus the AI's clamped residual.
 * `applyResolution` commits this on Continue; the consequences panel previews it —
 * both call this one helper so the previewed and applied numbers can never drift.
 * Pure.
 */
export function previewSanityImpact(
  tags: readonly string[] | undefined,
  sanityImpact: number | undefined,
  playerSequence: number,
): SanityBreakdown {
  const tagDelta = sanityDeltaForTags(knownSanityTags(tags), playerSequence);
  const residual = clamp(sanityImpact ?? 0, -SANITY_RESIDUAL_CAP, SANITY_RESIDUAL_CAP);
  return { tagDelta, residual, total: tagDelta + residual };
}

/**
 * Sum the engine-owned sanity delta for a set of AI-emitted event tags. The
 * sequence-scaled tags resolve against the player's current Sequence:
 * `ability-use` costs more at higher Sequences, and `horror-encounter` is
 * modeled as a horror one rung above the player (`HORROR_TAG_GAP`). The flat
 * recovery tags (`rest`/`human-connection`/`routine`) ignore the sequence.
 * Pure — an empty tag list yields 0.
 */
export function sanityDeltaForTags(
  tags: readonly SanityEventTag[],
  playerSequence: number,
): number {
  let total = 0;
  for (const tag of tags) {
    switch (tag) {
      case "ability-use":
        total += sanityDelta({ type: "ability-use", sequenceLevel: playerSequence });
        break;
      case "horror-encounter":
        total += sanityDelta({
          type: "horror-encounter",
          playerSequence,
          horrorSequence: playerSequence - HORROR_TAG_GAP,
        });
        break;
      case "rest":
        total += sanityDelta({ type: "rest" });
        break;
      case "human-connection":
        total += sanityDelta({ type: "human-connection" });
        break;
      case "routine":
        total += sanityDelta({ type: "routine" });
        break;
    }
  }
  return total;
}

// ─── Loss of Control ─────────────────────────────────────────────────

/**
 * Loss-of-control severity at zero sanity, per the Death and Failure spec:
 * - `setback`: recoverable — blackout, wake elsewhere, minor consequences.
 * - `transformation`: body mutates, abilities run wild, significant setback.
 * - `fatal`: full loss of control — the character becomes a monster (permadeath).
 */
export type LossOfControlSeverity = "setback" | "transformation" | "fatal";

export interface LossOfControlContext {
  sequenceLevel: number;
  /**
   * Whether the character is in a fragile, high-risk moment (mid-advancement
   * digestion, an active Outer Deity influence, etc.). Escalates severity by
   * one step.
   */
  highRisk?: boolean;
}

/** True once sanity has bottomed out and control is lost. */
export function isLossOfControl(state: GameState): boolean {
  return state.sanity <= SANITY_MIN;
}

const SEVERITY_ORDER: LossOfControlSeverity[] = ["setback", "transformation", "fatal"];

/**
 * Evaluate how catastrophic a zero-sanity loss of control is. Higher sequences
 * (lower numbers) wield more power and fail more catastrophically; a high-risk
 * moment escalates the outcome by one step. Deterministic so the rules engine —
 * not the AI — owns the consequence (integrates with the death/failure system,
 * issue #12).
 */
export function evaluateLossOfControl(
  context: LossOfControlContext,
): LossOfControlSeverity {
  let base: LossOfControlSeverity;
  if (context.sequenceLevel <= 2) {
    base = "fatal";
  } else if (context.sequenceLevel <= 5) {
    base = "transformation";
  } else {
    base = "setback";
  }

  if (!context.highRisk) return base;

  const escalated = Math.min(SEVERITY_ORDER.indexOf(base) + 1, SEVERITY_ORDER.length - 1);
  return SEVERITY_ORDER[escalated];
}
