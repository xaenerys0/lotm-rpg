import type { DigestionState } from "@/lib/ai";

/**
 * Acting Method digestion engine.
 *
 * A Beyonder digests a potion by *acting* in accordance with the sequence's
 * role. The AI evaluates how well recent player actions align with the
 * sequence's acting requirements and returns an `alignment` score in [0, 1].
 * This module maps that score onto a 0-100 digestion progress value.
 *
 * Pure functions only — no side effects, no AI calls. The UI orchestrates the
 * AI evaluation; this engine turns the resulting score into state changes.
 */

export const DIGESTION_MIN = 0;
export const DIGESTION_MAX = 100;

/**
 * Alignment at which digestion neither accelerates strongly nor reverses —
 * the player is acting acceptably in character.
 */
export const NEUTRAL_ALIGNMENT = 0.5;

/**
 * Below this alignment the player is actively acting *against* the role, which
 * reverses digestion (Task: reverse progress).
 */
export const CONTRADICTION_THRESHOLD = 0.35;

/** Progress gained from a perfectly in-character action (alignment === 1). */
export const MAX_PROGRESS_PER_EVAL = 12;

/** Progress lost from a maximally out-of-character action (alignment === 0). */
export const MAX_REVERSE_PER_EVAL = 8;

/**
 * Anti-stagnation floor. Any non-contradictory action advances digestion by at
 * least this much, so a player who keeps acting (even imperfectly) in character
 * can never get permanently stuck (Acceptance: minimum progress per session).
 */
export const MIN_PROGRESS_PER_SESSION = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createDigestionState(
  pathwayId: number,
  sequenceLevel: number,
): DigestionState {
  return { pathwayId, sequenceLevel, progress: DIGESTION_MIN, complete: false };
}

/**
 * Map an acting alignment score in [0, 1] to a digestion progress delta.
 *
 * - alignment in [0.5, 1] → forward progress, scaled from the anti-stagnation
 *   floor up to `MAX_PROGRESS_PER_EVAL`.
 * - alignment in [0.35, 0.5) → mediocre but not contradictory acting; the floor
 *   still applies so the player keeps inching forward.
 * - alignment in [0, 0.35) → contradictory acting; digestion reverses, scaled
 *   down to `-MAX_REVERSE_PER_EVAL`.
 */
export function computeProgressDelta(alignment: number): number {
  const a = clamp(alignment, 0, 1);

  if (a >= NEUTRAL_ALIGNMENT) {
    const t = (a - NEUTRAL_ALIGNMENT) / (1 - NEUTRAL_ALIGNMENT);
    const delta =
      MIN_PROGRESS_PER_SESSION + t * (MAX_PROGRESS_PER_EVAL - MIN_PROGRESS_PER_SESSION);
    return Math.round(delta);
  }

  if (a >= CONTRADICTION_THRESHOLD) {
    return MIN_PROGRESS_PER_SESSION;
  }

  const t = (CONTRADICTION_THRESHOLD - a) / CONTRADICTION_THRESHOLD;
  return -Math.round(t * MAX_REVERSE_PER_EVAL);
}

/**
 * Apply an alignment score to a digestion state, returning the next state and
 * the *applied* delta (after clamping to [0, 100] — may differ from the raw
 * computed delta at the bounds).
 */
export function applyDigestionProgress(
  state: DigestionState,
  alignment: number,
): { state: DigestionState; delta: number } {
  const rawDelta = computeProgressDelta(alignment);
  const newProgress = clamp(state.progress + rawDelta, DIGESTION_MIN, DIGESTION_MAX);
  const appliedDelta = newProgress - state.progress;

  return {
    state: {
      ...state,
      progress: newProgress,
      complete: newProgress >= DIGESTION_MAX,
    },
    delta: appliedDelta,
  };
}

export function isDigestionComplete(state: DigestionState): boolean {
  return state.progress >= DIGESTION_MAX;
}

/**
 * Produce in-world narrative feedback describing the digestion change. Kept
 * deterministic (rather than asking the AI) so the message is always coherent
 * with the actual progress number shown in the UI.
 */
export function digestionFeedback(
  roleName: string,
  state: DigestionState,
  delta: number,
): string {
  const role = roleName || "Beyonder";

  if (state.complete) {
    return `The essence of the ${role} has become wholly your own — the potion is fully digested. You sense you could now reach for what lies beyond.`;
  }

  if (delta > 0) {
    if (state.progress >= 75) {
      return `The ${role}'s mask feels almost like your own face now.`;
    }
    if (state.progress >= 40) {
      return `The ${role}'s mannerisms come more naturally to you with each passing moment.`;
    }
    return `Something of the ${role} settles a little deeper within you.`;
  }

  if (delta < 0) {
    return `The ${role}'s essence resists you — acting against its nature has loosened your grip on the potion.`;
  }

  return `The ${role}'s essence stirs but does not settle further.`;
}
