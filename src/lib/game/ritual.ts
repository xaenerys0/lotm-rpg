import { getSequence } from "@/lib/rules";

import { RITUAL_STEPS } from "./input-modes";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Advancement rituals performed across turns (issue #99 Part C)
// ---------------------------------------------------------------------------
//
// From Sequence 5 an Advancement Ritual is canon and mandatory. It used to be
// auto-satisfied — the gate passed simply because the pathway *defined* a ritual
// — so the player never actually performed it. This module makes the rite
// something the Beyonder carries out STEP BY STEP across several turns before
// the climb unlocks, for immersion: each step is enacted as a narrated action,
// the engine marks progress, and only a fully-performed ritual lets
// `advancement.ts` proceed.
//
// `RitualState` is a single optional sub-state on the session (mirroring
// `anchorState`): strictly validated, preserved on the deserialize `...s`
// spread, never seeded — absent simply means no rite in progress. No DB
// migration (it serializes inside the session blob, like `hunts`).
//
// Pure + deterministic; the React layer composes each step's action through the
// normal turn pipeline and persists, exactly like every other subsystem.

/** An advancement ritual being performed across turns. */
export interface RitualState {
  /** The pathway whose rite this is. */
  pathwayId: number;
  /** The sequence being advanced INTO (one rung lower than the current one). */
  targetSeq: number;
  /** How many steps of the rite have been enacted. */
  stepsCompleted: number;
  /** Total steps the rite demands (derived from the target's ritual). */
  totalSteps: number;
  /** True once every step has been performed. */
  complete: boolean;
}

/**
 * The ordered steps to perform for the advancement into `targetSeq`. Canon
 * comes first: the target sequence's `advancementRitual.requirements` (the
 * material/observance list the rite demands). When the ritual carries no
 * explicit requirements, the generic ceremony (`RITUAL_STEPS` from the
 * input-mode helpers) stands in, so any defined rite is still performed. Empty
 * only when the target has no ritual at all (the advancement gate handles that
 * case separately).
 */
export function ritualStepsFor(session: GameSession, targetSeq: number): string[] {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  if (!ritual) return [];
  return ritual.requirements.length > 0 ? [...ritual.requirements] : [...RITUAL_STEPS];
}

/**
 * Begin (or re-target) the rite for `targetSeq`. Idempotent for the same target
 * — returns the session unchanged if a rite for that target is already under
 * way — and resets when the target changed (e.g. after a previous climb). A
 * ritual with no steps is born already complete. Pure.
 */
export function beginRitual(
  session: GameSession,
  targetSeq: number,
  now: number = Date.now(),
): GameSession {
  const existing = session.ritualState;
  if (existing && existing.targetSeq === targetSeq) return session;

  const totalSteps = ritualStepsFor(session, targetSeq).length;
  return {
    ...session,
    ritualState: {
      pathwayId: session.gameState.pathwayId,
      targetSeq,
      stepsCompleted: 0,
      totalSteps,
      complete: totalSteps === 0,
    },
    updatedAt: now,
  };
}

/**
 * Enact the next step of the rite for `targetSeq`, beginning (or re-targeting)
 * it first when needed so the caller can drive the whole thing through this one
 * call. Increments `stepsCompleted` (capped at `totalSteps`) and flips
 * `complete` when the last step is performed. A no-op once already complete.
 * Pure.
 */
export function advanceRitualStep(
  session: GameSession,
  targetSeq: number,
  now: number = Date.now(),
): GameSession {
  const begun = beginRitual(session, targetSeq, now);
  const state = begun.ritualState!;
  if (state.complete) return begun;

  const stepsCompleted = Math.min(state.stepsCompleted + 1, state.totalSteps);
  return {
    ...begun,
    ritualState: {
      ...state,
      stepsCompleted,
      complete: stepsCompleted >= state.totalSteps,
    },
    updatedAt: now,
  };
}

/**
 * Whether the rite for `targetSeq` has been fully performed. False when no rite
 * is in progress or it is tracking a different target — the player must perform
 * the ritual for the sequence they are actually climbing into.
 */
export function isRitualComplete(session: GameSession, targetSeq: number): boolean {
  const state = session.ritualState;
  return state !== undefined && state.targetSeq === targetSeq && state.complete;
}

/**
 * How many steps of the rite for `targetSeq` have been performed — 0 when no
 * rite is in progress or it is tracking a different target. The single source of
 * truth for "where am I in this rite", shared by `currentRitualStep` and the UI
 * progress display.
 */
export function ritualProgress(session: GameSession, targetSeq: number): number {
  return session.ritualState?.targetSeq === targetSeq
    ? session.ritualState.stepsCompleted
    : 0;
}

/** The text of the next step to enact, or `null` when there is none/done. */
export function currentRitualStep(
  session: GameSession,
  targetSeq: number,
): string | null {
  const steps = ritualStepsFor(session, targetSeq);
  const done = ritualProgress(session, targetSeq);
  return done < steps.length ? steps[done] : null;
}

/** Drop any rite in progress (consumed on a successful climb, or abandoned). */
export function clearRitual(session: GameSession, now: number = Date.now()): GameSession {
  if (session.ritualState === undefined) return session;
  return { ...session, ritualState: undefined, updatedAt: now };
}

export function isValidRitualStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Number.isFinite(s.pathwayId)) return false;
  if (!Number.isFinite(s.targetSeq)) return false;
  if (!Number.isInteger(s.stepsCompleted) || (s.stepsCompleted as number) < 0) {
    return false;
  }
  if (!Number.isInteger(s.totalSteps) || (s.totalSteps as number) < 0) return false;
  if ((s.stepsCompleted as number) > (s.totalSteps as number)) return false;
  if (typeof s.complete !== "boolean") return false;
  return true;
}
