import type { SessionFact } from "@/lib/ai";
import { getSequence } from "@/lib/rules";
import type { RitualStep } from "@/lib/types/rules";

import { clamp } from "./math";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Advancement rituals — begun once, then matured naturally over play
// (issue #209; supersedes the per-step click-counting of issue #99 Part C)
// ---------------------------------------------------------------------------
//
// From Sequence 5 an Advancement Ritual is canon: its purpose is to survive the
// surge of the Beyonder characteristic at the moment of drinking the next potion.
// Canon also says it CAN be forgone — but then "the likelihood of success
// plummets to a dangerous point, with losing control being the most likely
// outcome."
//
// The rite is NOT a list of click-through steps and NOT a fixed number of turns.
// The player BEGINS it once ("Perform the rite"), which the React layer pairs
// with an IMMEDIATE narrated turn so the rite opens in the current scene. From
// then on it MATURES NATURALLY over the turns of normal play (`advanceRitual`,
// wired into the per-turn tick) — there is no set length to wait out. The player
// drinks whenever they judge it ready; advancing on a half-formed rite is
// allowed, and entirely their call.
//
// Progress is the `fidelity` (0..1): each turn closes part of the gap to a fully
// faithful rite, scaled by how favourable the scene is RIGHT THEN
// (`ritualCircumstanceFidelity`) — a private, unhurt, unhunted moment matures it
// quickly; witnesses, wounds, or active pursuers slow it, and real danger stalls
// it. So WHERE and WHEN the rite plays out shapes how far it gets. The stored
// fidelity is folded into the climb odds by `advancement.ts`
// (`advancementSuccessChance`/`advancementHighRisk`); skipping the rite outright
// (never beginning it) reads as fidelity 0.
//
// `RitualState` is a single optional sub-state on the session (mirroring
// `formulaPursuit`): strictly validated, preserved on the deserialize `...s`
// spread, never seeded. No DB migration (it serializes inside the session blob).
//
// Pure + deterministic; the React layer triggers `beginRitual`, runs the rite's
// narrated turn, ticks `advanceRitual` each turn, and persists.

/** An Advancement Ritual the player has begun and is letting mature. */
export interface RitualState {
  /** The pathway whose rite this is. */
  pathwayId: number;
  /** The sequence being advanced INTO (one rung lower than the current one). */
  targetSeq: number;
  /**
   * How far the rite has matured, in [0, 1]. Accrues each turn (scaled by the
   * scene's favourability) toward a fully faithful rite; the climb may be taken
   * at any point, at whatever fidelity has accrued.
   */
  fidelity: number;
}

/**
 * The core issue-#220 guardrail sentence, shared verbatim by both the advancement
 * (`ritualNarratorContext`) and apex (`ascensionRiteNarratorContext`) narrator
 * blocks so a future rewording can never drift between the two paths.
 */
export const RITE_IN_PROGRESS_GUARD =
  "never narrate the ascension as accomplished, and do not declare the rite " +
  'finished or announce it is "ready".';

/** Fraction of the remaining gap to a faithful rite closed per ideal turn. */
export const RITUAL_PROGRESS_RATE = 0.3;
/** At/above this fidelity the rite counts as fully matured (avoids endless churn). */
export const RITUAL_FIDELITY_CAP = 0.99;

/** Fidelity progress lost to performing the rite with witnesses (a crowd) near. */
export const RITUAL_WITNESS_PENALTY = 0.3;
/** Fidelity progress lost to performing the rite while wounded (in/after a fight). */
export const RITUAL_WOUNDED_PENALTY = 0.4;
/** Fidelity progress lost to performing the rite while actively hunted. */
export const RITUAL_HUNTED_PENALTY = 0.4;

/**
 * The ordered steps of the rite for `targetSeq`: the corpus-tagged `steps`
 * (materials + lived conditions) when present, else the hand-authored fallback
 * `requirements` treated as conditions, else empty (the target has no rite).
 * Used to surface the rite's canon materials/conditions in the UI — never a
 * clickable list.
 */
export function ritualStepsFor(session: GameSession, targetSeq: number): RitualStep[] {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  if (!ritual) return [];
  if (ritual.steps && ritual.steps.length > 0) return [...ritual.steps];
  // Hand-authored fallback rituals carry only flat `requirements` prose, which
  // describe lived conditions (the place/hour/observance), not tangible items.
  return ritual.requirements.map((text) => ({ kind: "condition", text }));
}

/**
 * How favourable the CURRENT scene is for the rite, in [0, 1]. A private, unhurt,
 * unhunted moment is ideal (1.0); each adverse circumstance — witnesses present
 * (a crowd), open wounds (mid-/post-fight), or active pursuers (being hunted) —
 * lowers it, and enough danger stalls the rite entirely (0). This is the
 * "isolated vs crowd vs battle" signal that shapes how fast the rite matures each
 * turn, so the player can seek the right moment. Pure.
 */
export function ritualCircumstanceFidelity(session: GameSession): number {
  const { npcsPresent, injuries } = session.gameState;
  const pursuers = (session.trackedNpcState?.roster ?? []).filter(
    (npc) => npc.disposition === "hostile" && npc.follows,
  );
  let fidelity = 1;
  if ((injuries?.length ?? 0) > 0) fidelity -= RITUAL_WOUNDED_PENALTY;
  if (pursuers.length > 0) fidelity -= RITUAL_HUNTED_PENALTY;
  if ((npcsPresent?.length ?? 0) > 0) fidelity -= RITUAL_WITNESS_PENALTY;
  return clamp(fidelity, 0, 1);
}

/** Close part of the remaining gap to a faithful rite, scaled by the scene. */
function accrueFidelity(current: number, circumstance: number): number {
  return clamp(current + (1 - current) * RITUAL_PROGRESS_RATE * circumstance, 0, 1);
}

/**
 * The canonical `activeQuests` string for a rite under way — one source of truth
 * so the label added on begin matches the one removed on the climb (the narrator
 * sees this entry and keeps weaving the maturing rite into the scene).
 */
export function ritualQuestLabel(targetSeq: number): string {
  return `Let the Advancement Ritual for the Sequence ${targetSeq} ascent mature`;
}

function withQuestLabel(quests: string[], label: string): string[] {
  return quests.includes(label) ? quests : [...quests, label];
}

function withoutQuestLabel(quests: string[], label: string): string[] {
  return quests.filter((q) => q !== label);
}

/**
 * Begin the rite for `targetSeq` — the single "Perform the rite" trigger. Seeds
 * the rite with a first turn of progress (scaled by the current scene), adds the
 * AI-visible quest label, and records the act so the narrator opens it in
 * context. Idempotent once a rite for this target is under way (does not reset
 * accrued progress). The React layer pairs this with an immediate narrated turn.
 * Pure.
 */
export function beginRitual(
  session: GameSession,
  targetSeq: number,
  now: number = Date.now(),
): GameSession {
  const existing = session.ritualState;
  if (existing && existing.targetSeq === targetSeq) return session;

  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  const fidelity = accrueFidelity(0, ritualCircumstanceFidelity(session));
  const label = ritualQuestLabel(targetSeq);
  // Re-targeting (a stale rite for a different rung) — drop its label first so a
  // superseded quest can't linger in `activeQuests`.
  const quests = existing
    ? withoutQuestLabel(
        session.gameState.activeQuests,
        ritualQuestLabel(existing.targetSeq),
      )
    : session.gameState.activeQuests;

  const fact: SessionFact = {
    type: "event",
    description: ritual
      ? `Began the Advancement Ritual to ascend to Sequence ${targetSeq}: ${ritual.description}`
      : `Began the Advancement Ritual to ascend to Sequence ${targetSeq}.`,
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(quests, label),
    },
    ritualState: { pathwayId: session.gameState.pathwayId, targetSeq, fidelity },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Mature the rite under way by one turn of play — the per-turn tick (wired
 * alongside `advanceFormulaPursuit`). Closes part of the remaining gap to a
 * faithful rite, scaled by the scene's favourability that turn, and keeps the
 * quest label in sync. A no-op when no rite is under way or it has already fully
 * matured (so a long chronicle does not churn). Pure.
 */
export function advanceRitual(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const state = session.ritualState;
  if (!state) return session;

  const label = ritualQuestLabel(state.targetSeq);
  const labelled = session.gameState.activeQuests.includes(label);
  const fidelity = accrueFidelity(state.fidelity, ritualCircumstanceFidelity(session));

  // Nothing to commit when the rite is already labelled AND this turn changed
  // nothing — either it has fully matured (past the cap) or the scene is so
  // hostile it cannot progress at all (circumstance 0). Avoids per-turn churn.
  if (
    labelled &&
    (state.fidelity >= RITUAL_FIDELITY_CAP || fidelity === state.fidelity)
  ) {
    return session;
  }

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(session.gameState.activeQuests, label),
    },
    ritualState: { ...state, fidelity },
    updatedAt: now,
  };
}

/**
 * How faithfully the rite for `targetSeq` has matured, in [0, 1]. `1` when the
 * rung needs no rite. `0` when no rite was begun for this target (i.e. the player
 * forwent it). Otherwise the accrued fidelity. Drives the climb-odds penalty in
 * `advancement.ts`.
 */
export function ritualFidelity(session: GameSession, targetSeq: number): number {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  if (!ritual) return 1;
  const state = session.ritualState;
  if (!state || state.targetSeq !== targetSeq) return 0;
  return clamp(state.fidelity, 0, 1);
}

/**
 * Whether a rite for `targetSeq` is under way (begun, maturing). False when the
 * player has not begun one for this target. The UI shows the maturing-progress
 * surface when true, the "Perform the rite" trigger when false.
 */
export function ritualInProgress(session: GameSession, targetSeq: number): boolean {
  const state = session.ritualState;
  return state !== undefined && state.targetSeq === targetSeq;
}

/**
 * The binding `## Ritual in Progress` narrator block (threaded via
 * `GenerateOptions.ritualContext` → `prompts.ts`), or `null` when no advancement
 * rite is under way. Tells the narrator that beginning/performing the rite is NOT
 * the advancement itself: the character remains their current role and has not
 * ascended — portray the rite forming and the surge building, never a completed
 * becoming, which only the engine-committed climb may narrate (issue #220). Pure.
 */
export function ritualNarratorContext(session: GameSession): string | null {
  const state = session.ritualState;
  if (!state) return null;

  const { pathwayId, sequenceLevel } = session.gameState;
  // Only surface the rite the character can actually be performing now — a stale
  // rite for a rung they are no longer one below is inert (never fed to advancement).
  if (state.targetSeq !== sequenceLevel - 1) return null;

  const targetRole =
    getSequence(pathwayId, state.targetSeq)?.name ?? `Sequence ${state.targetSeq}`;
  const currentRole =
    getSequence(pathwayId, sequenceLevel)?.name ?? `Sequence ${sequenceLevel}`;

  return (
    `An Advancement Ritual toward Sequence ${state.targetSeq}, ${targetRole}, is ` +
    `under way. This rite is the protective scaffolding a Beyonder performs to ` +
    `survive the surge of the new Beyonder characteristic at the moment of drinking ` +
    `the next potion — it is NOT the advancement itself, and beginning or performing ` +
    `it does NOT make the character that role. The character REMAINS ${currentRole} ` +
    `and has NOT ascended, become ${targetRole}, or gained its powers. Portray the ` +
    `rite taking shape and the coming characteristic's pressure building — the strain, ` +
    `the danger, the threshold drawing nearer — but ${RITE_IN_PROGRESS_GUARD} ` +
    `Whether the character truly becomes ${targetRole} is decided only later, when ` +
    `they drink the potion and the game commits the change.`
  );
}

/** Drop any rite under way (consumed on a successful climb, or abandoned). */
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
  if (
    !Number.isFinite(s.fidelity) ||
    (s.fidelity as number) < 0 ||
    (s.fidelity as number) > 1
  ) {
    return false;
  }
  return true;
}
