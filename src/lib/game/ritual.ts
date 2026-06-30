import type { SessionFact } from "@/lib/ai";
import { getSequence } from "@/lib/rules";
import type { Ritual, RitualStep } from "@/lib/types/rules";

import { clamp } from "./math";
import { acquisitionDepthFactor } from "./potion-preparation";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Advancement rituals — a lived, pathway-specific ordeal that spans turns
// (issue #209; supersedes the per-step click-counting of issue #99 Part C)
// ---------------------------------------------------------------------------
//
// From Sequence 5 an Advancement Ritual is canon and mandatory: its purpose is
// to survive the surge of the Beyonder characteristic at the moment of drinking
// the next potion. Canon also says it CAN be forgone — but then "the likelihood
// of success plummets to a dangerous point, with losing control being the most
// likely outcome."
//
// The rite is no longer a list of click-through steps that read the same for
// every pathway. It is ONE trigger ("Perform the rite") that the Beyonder begins
// once and then LIVES OUT over however many turns it demands — mirroring the
// tracked multi-turn quests `formula-pursuit.ts` / `hunt.ts`. Each turn of play
// advances the rite (`advanceRitual`, wired into the same per-turn tick chain as
// `advanceFormulaPursuit`); the narrator weaves that pathway's OWN canon rite
// into the scene via the AI-visible quest label + facts. The rite's MATERIALS
// are the potion's reagents (already required and consumed by the ingredients
// gate / the climb); its CONDITIONS are the lived deeds, enacted symbolically.
//
// How faithfully the rite is performed feeds a 0..1 FIDELITY factor that
// `advancement.ts` folds into the climb odds: each advancing turn is judged
// faithful or botched by the Beyonder's sanity at that moment, and the grueling
// rite drains a little sanity per turn — so enduring a long rite on a fraying
// mind degrades it (faithful-but-costly), while skipping it outright tanks the
// odds (canon-dangerous). The rite no longer HARD-gates the climb — fidelity
// does the work.
//
// `RitualState` is a single optional sub-state on the session (mirroring
// `formulaPursuit`): strictly validated, preserved on the deserialize `...s`
// spread, never seeded — absent simply means no rite in progress. No DB
// migration (it serializes inside the session blob).
//
// Pure + deterministic; the React layer triggers `beginRitual`/`skipRitual` and
// ticks `advanceRitual` each turn, then persists.

/** An advancement ritual being lived out across turns. */
export interface RitualState {
  /** The pathway whose rite this is. */
  pathwayId: number;
  /** The sequence being advanced INTO (one rung lower than the current one). */
  targetSeq: number;
  /** Total turns the rite demands (scaled by rung + rite). */
  totalTurns: number;
  /** Turns of the rite still to live out; 0 = the rite is performed. */
  turnsRemaining: number;
  /**
   * Accumulated faithfulness credit (0..totalTurns) — each turn adds 1 when
   * endured with a steady mind, less when endured while frayed.
   */
  fidelityScore: number;
  /** True when the player deliberately forwent the rite (a perilous shortcut). */
  skipped: boolean;
  /** True once every turn has been lived out (or the rite was skipped). */
  complete: boolean;
}

/** Base turns the shallowest rite spans, before depth + condition scaling. */
export const RITUAL_BASE_TURNS = 2;

/**
 * A turn of the rite endured with at least this fraction of max sanity intact
 * counts as faithful; below it the beat is botched and credits less fidelity.
 */
export const RITUAL_BEAT_SANITY_RATIO = 0.5;

/** Fidelity credit a botched (frayed-mind) turn of the rite still earns. */
export const RITUAL_BOTCHED_BEAT_CREDIT = 0.4;

/** Sanity the grueling rite costs per turn lived out (the survival pressure). */
export const RITUAL_TURN_SANITY_COST = 2;

/**
 * The ordered steps of the rite for `targetSeq`: the corpus-tagged `steps`
 * (materials + lived conditions) when present, else the hand-authored fallback
 * `requirements` treated as conditions, else empty (the target has no rite).
 * Used to size the rite and surface its canon materials/conditions — never a
 * clickable list.
 */
export function ritualStepsFor(session: GameSession, targetSeq: number): RitualStep[] {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  return stepsForRitual(ritual);
}

/** Steps of a ritual definition (pathway-agnostic — used by `ritualTurns`). */
function stepsForRitual(ritual: Ritual | undefined): RitualStep[] {
  if (!ritual) return [];
  if (ritual.steps && ritual.steps.length > 0) return [...ritual.steps];
  // Hand-authored fallback rituals carry only flat `requirements` prose, which
  // describe lived conditions (the place/hour/observance), not tangible items.
  return ritual.requirements.map((text) => ({ kind: "condition", text }));
}

/** The lived condition beats of the rite (the deeds, distinct from materials). */
function conditionBeats(ritual: Ritual | undefined): RitualStep[] {
  return stepsForRitual(ritual).filter((s) => s.kind === "condition");
}

/**
 * How many turns the rite for `targetSeq` spans. Scales with the same depth
 * factor as the rest of the potion economy (a deeper rung is a longer ordeal)
 * plus one turn per canon condition beat (a richer rite takes longer to live
 * out). Always at least the base length.
 */
export function ritualTurns(targetSeq: number, ritual: Ritual | undefined): number {
  const base = Math.round(RITUAL_BASE_TURNS * acquisitionDepthFactor(targetSeq));
  return Math.max(RITUAL_BASE_TURNS, base + conditionBeats(ritual).length);
}

/**
 * The canonical `activeQuests` string for a rite in progress — one source of
 * truth so the label added on begin matches the one removed on completion (the
 * narrator sees this entry and weaves the pathway's own rite into the scene).
 */
export function ritualQuestLabel(targetSeq: number): string {
  return `Perform the Advancement Ritual for the Sequence ${targetSeq} ascent`;
}

function withQuestLabel(quests: string[], label: string): string[] {
  return quests.includes(label) ? quests : [...quests, label];
}

function withoutQuestLabel(quests: string[], label: string): string[] {
  return quests.filter((q) => q !== label);
}

/**
 * Begin the rite for `targetSeq` — the single "Perform the rite" trigger. Seeds
 * the turn-based state, adds the AI-visible quest label, and records a
 * `quest-progress` fact carrying the canon rite text so the narrator foregrounds
 * it. Idempotent for the same target (returns unchanged if already under way),
 * resets when the target changed. A rite with no turns is born already complete.
 * Pure.
 */
export function beginRitual(
  session: GameSession,
  targetSeq: number,
  now: number = Date.now(),
): GameSession {
  const existing = session.ritualState;
  // Short-circuit only a rite genuinely IN PROGRESS for this target; a finished
  // (complete/skipped) same-target state is re-seeded so the rite can be
  // performed again — e.g. after a survived advancement setback left it stranded.
  if (
    existing &&
    existing.targetSeq === targetSeq &&
    !existing.complete &&
    !existing.skipped
  ) {
    return session;
  }

  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  const totalTurns = ritualTurns(targetSeq, ritual);
  const label = ritualQuestLabel(targetSeq);

  const fact: SessionFact = {
    type: "quest-progress",
    description: ritual
      ? `Began the Advancement Ritual to ascend to Sequence ${targetSeq}: ${ritual.description}`
      : `Began the Advancement Ritual to ascend to Sequence ${targetSeq}.`,
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(session.gameState.activeQuests, label),
    },
    ritualState: {
      pathwayId: session.gameState.pathwayId,
      targetSeq,
      totalTurns,
      turnsRemaining: totalTurns,
      fidelityScore: 0,
      skipped: false,
      complete: totalTurns === 0,
    },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Advance the rite in progress by one turn of play — the per-turn tick (wired
 * alongside `advanceFormulaPursuit`). Lives out one turn: accrues fidelity
 * (full credit when the mind is steady, partial when frayed), drains a little
 * sanity for the ordeal, and keeps the quest label in sync. On the turn that
 * finishes the rite it flips `complete`, drops the label, and seeds a completion
 * fact. A no-op when no rite is under way, or it is already complete/skipped.
 * Pure.
 */
export function advanceRitual(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const state = session.ritualState;
  if (!state || state.complete || state.skipped) return session;

  const { sanity, maxSanity } = session.gameState;
  const survived = sanity >= maxSanity * RITUAL_BEAT_SANITY_RATIO;
  const fidelityScore = state.fidelityScore + (survived ? 1 : RITUAL_BOTCHED_BEAT_CREDIT);
  const turnsRemaining = Math.max(0, state.turnsRemaining - 1);
  const complete = turnsRemaining <= 0;
  const label = ritualQuestLabel(state.targetSeq);

  const facts: SessionFact[] = complete
    ? [
        {
          type: "quest-progress",
          description: `Completed the Advancement Ritual for the Sequence ${state.targetSeq} ascent.`,
          turnNumber: session.turnCount,
        },
      ]
    : [];

  return {
    ...session,
    gameState: {
      ...session.gameState,
      sanity: clamp(sanity - RITUAL_TURN_SANITY_COST, 0, maxSanity),
      activeQuests: complete
        ? withoutQuestLabel(session.gameState.activeQuests, label)
        : withQuestLabel(session.gameState.activeQuests, label),
    },
    ritualState: { ...state, turnsRemaining, fidelityScore, complete },
    memory:
      facts.length > 0
        ? {
            ...session.memory,
            sessionFacts: [...session.memory.sessionFacts, ...facts],
          }
        : session.memory,
    updatedAt: now,
  };
}

/**
 * Deliberately forgo the rite (the canon-dangerous shortcut). Marks it skipped
 * and complete with zero fidelity so the climb unlocks at the steep penalty
 * `advancement.ts` applies, drops the quest label, and records the choice.
 * Begins the state first when none is under way. Pure.
 */
export function skipRitual(
  session: GameSession,
  targetSeq: number,
  now: number = Date.now(),
): GameSession {
  const begun = beginRitual(session, targetSeq, now);
  const state = begun.ritualState!;
  const label = ritualQuestLabel(targetSeq);

  const fact: SessionFact = {
    type: "quest-progress",
    description: `Forwent the Advancement Ritual for the Sequence ${targetSeq} ascent — a perilous shortcut that makes losing control the likely outcome.`,
    turnNumber: session.turnCount,
  };

  return {
    ...begun,
    gameState: {
      ...begun.gameState,
      activeQuests: withoutQuestLabel(begun.gameState.activeQuests, label),
    },
    ritualState: { ...state, fidelityScore: 0, skipped: true, complete: true },
    memory: {
      ...begun.memory,
      sessionFacts: [...begun.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * How faithfully the rite for `targetSeq` was performed, in [0, 1]. `1` when the
 * rung needs no rite. `0` when none was begun for this target, or it was
 * skipped. Otherwise the share of faithful turns lived out (a partial rite gives
 * partial fidelity). Drives the climb-odds penalty in `advancement.ts`.
 */
export function ritualFidelity(session: GameSession, targetSeq: number): number {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  if (!ritual) return 1;
  const state = session.ritualState;
  if (!state || state.targetSeq !== targetSeq || state.skipped) return 0;
  if (state.totalTurns <= 0) return 1;
  return clamp(state.fidelityScore / state.totalTurns, 0, 1);
}

/**
 * Whether the rite for `targetSeq` has been fully lived out (or skipped — a
 * skipped rite reads complete so the climb unlocks). False when no rite is in
 * progress or it tracks a different target.
 */
export function isRitualComplete(session: GameSession, targetSeq: number): boolean {
  const state = session.ritualState;
  return state !== undefined && state.targetSeq === targetSeq && state.complete;
}

/**
 * Whether a rite for `targetSeq` is under way but not yet resolved (begun, not
 * complete, not skipped) — the UI shows the progress + skip surface for it.
 */
export function ritualInProgress(session: GameSession, targetSeq: number): boolean {
  const state = session.ritualState;
  return (
    state !== undefined &&
    state.targetSeq === targetSeq &&
    !state.complete &&
    !state.skipped
  );
}

/**
 * Turns of the rite for `targetSeq` lived out so far — 0 when no rite is in
 * progress or it tracks a different target. The source of truth for the UI
 * progress display.
 */
export function ritualProgress(session: GameSession, targetSeq: number): number {
  const state = session.ritualState;
  return state?.targetSeq === targetSeq ? state.totalTurns - state.turnsRemaining : 0;
}

/** Drop any rite in progress (consumed on a successful climb, or abandoned). */
export function clearRitual(session: GameSession, now: number = Date.now()): GameSession {
  const state = session.ritualState;
  if (state === undefined) return session;
  const label = ritualQuestLabel(state.targetSeq);
  return {
    ...session,
    ritualState: undefined,
    gameState: {
      ...session.gameState,
      activeQuests: withoutQuestLabel(session.gameState.activeQuests, label),
    },
    updatedAt: now,
  };
}

export function isValidRitualStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Number.isFinite(s.pathwayId)) return false;
  if (!Number.isFinite(s.targetSeq)) return false;
  if (!Number.isInteger(s.totalTurns) || (s.totalTurns as number) < 0) return false;
  if (!Number.isInteger(s.turnsRemaining) || (s.turnsRemaining as number) < 0) {
    return false;
  }
  if ((s.turnsRemaining as number) > (s.totalTurns as number)) return false;
  if (!Number.isFinite(s.fidelityScore) || (s.fidelityScore as number) < 0) return false;
  if ((s.fidelityScore as number) > (s.totalTurns as number)) return false;
  if (typeof s.skipped !== "boolean") return false;
  if (typeof s.complete !== "boolean") return false;
  return true;
}
