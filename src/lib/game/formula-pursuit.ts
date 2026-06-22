import type { SessionFact } from "@/lib/ai";

import { isAdvanceableSequence, targetSequence } from "./advancement";
import { hasItemMatching } from "./inventory";
import { addItemToInventory } from "./marketplace";
import { acquisitionDepthFactor, isFormula, nextPotionItems } from "./potion-preparation";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Formula pursuit (issue #171, "The Climb") — seeking the next potion's
// closely-guarded recipe through the story.
// ---------------------------------------------------------------------------
//
// The formula is the canon gate to advancement: a Beyonder gathers a potion's
// reagents only once they hold the recipe (enforced in `potion-preparation.ts`).
// There are two corpus-true ways to get one — TRADE for it (buy it from whoever
// holds it, when you can afford the price; the existing `purchasePotionItem`
// path) or SEEK IT OUT through the story. This module is the second route: a
// tracked, multi-turn QUEST to chase the recipe down, mirroring the hunt for a
// Beyonder Characteristic (`hunt.ts`). Deeper potions guard their formulae more
// jealously, so the deeper the rung the longer the search (the same
// `acquisitionDepthFactor` that scales the rest of the potion economy).
//
// Only one formula is ever in play at a time (the next potion's), so the state
// is a single optional sub-state on the session — mirroring `ritualState`, not
// the list-shaped `hunts`. Unlike a hunt, securing the formula does NOT cost
// funds: the price was paid in the turns and risks of the search itself.
//
// Pure + deterministic; storage, journaling and the narrated "recipe secured"
// beat live in the React layer like every other session subsystem.

/** A single in-progress pursuit of the next potion's formula. */
export interface FormulaPursuitState {
  /** The formula item (next-potion prerequisite) being sought. */
  targetItemName: string;
  /** The sequence being prepared for (one rung lower than the current one). */
  targetSeq: number;
  /** Turns of seeking left before the recipe is run down; 0 = ready to secure. */
  turnsRemaining: number;
  /** Total seeking turns the pursuit started with (for the progress display). */
  totalTurns: number;
}

/** Base seeking turns for the shallowest rung, before depth scaling. */
export const FORMULA_PURSUIT_BASE_TURNS = 3;

/**
 * How many turns of seeking a formula at `targetSeq` demands. Scales with the
 * same depth factor as the rest of the potion economy, so a deeper (more
 * jealously guarded) recipe takes longer to chase down. Always at least one.
 */
export function formulaPursuitTurns(targetSeq: number): number {
  return Math.max(
    1,
    Math.round(FORMULA_PURSUIT_BASE_TURNS * acquisitionDepthFactor(targetSeq)),
  );
}

/**
 * The canonical `activeQuests` string for a formula pursuit — one source of
 * truth so the label added on start matches the one removed on completion (the
 * AI sees this entry and weaves the search into the story).
 */
export function formulaPursuitQuestLabel(state: FormulaPursuitState): string {
  return `Seek the formula for the Sequence ${state.targetSeq} potion`;
}

/** True once the seeking is done and the recipe can be secured. */
export function isFormulaPursuitReady(state: FormulaPursuitState): boolean {
  return state.turnsRemaining <= 0;
}

/** The next potion's formula prerequisite, if it has one. */
function nextFormulaItem(session: GameSession) {
  return nextPotionItems(session).find(isFormula);
}

export type FormulaPursuitOutcome =
  | "started"
  | "not-required"
  | "already-owned"
  | "already-pursuing";

export interface FormulaPursuitResult {
  outcome: FormulaPursuitOutcome;
  session?: GameSession;
}

/**
 * Begin seeking the next potion's formula through the story. Validates that the
 * target potion actually has a formula prerequisite the player does not yet
 * hold, and that a pursuit is not already under way. On success it records the
 * pursuit, seeds a `quest-progress` memory fact, and adds the AI-visible quest
 * label. Pure.
 */
export function beginFormulaPursuit(
  session: GameSession,
  now: number = Date.now(),
): FormulaPursuitResult {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);
  if (!isAdvanceableSequence(state.sequenceLevel)) return { outcome: "not-required" };

  const formula = nextFormulaItem(session);
  if (!formula) return { outcome: "not-required" };
  if (hasItemMatching(state.inventory, formula)) return { outcome: "already-owned" };
  if (session.formulaPursuit) return { outcome: "already-pursuing" };

  const totalTurns = formulaPursuitTurns(target);
  const pursuit: FormulaPursuitState = {
    targetItemName: formula.name,
    targetSeq: target,
    turnsRemaining: totalTurns,
    totalTurns,
  };

  const fact: SessionFact = {
    type: "quest-progress",
    description: `Set out to track down the closely-guarded ${formula.name} — the recipe the next Sequence ${target} potion cannot be brewed without.`,
    turnNumber: session.turnCount,
  };

  const label = formulaPursuitQuestLabel(pursuit);
  const activeQuests = state.activeQuests.includes(label)
    ? state.activeQuests
    : [...state.activeQuests, label];

  return {
    outcome: "started",
    session: {
      ...session,
      gameState: { ...state, activeQuests },
      formulaPursuit: pursuit,
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, fact],
      },
      updatedAt: now,
    },
  };
}

/**
 * Advance the active formula pursuit by one turn of seeking (floored at 0 =
 * ready to secure) and keep its AI-visible quest label in sync — re-added
 * idempotently because `activeQuests` is AI-mutable, but the engine's truth is
 * `formulaPursuit`, never the string. A no-op when none is under way. Pure.
 */
export function advanceFormulaPursuit(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const pursuit = session.formulaPursuit;
  if (!pursuit) return session;

  const advanced: FormulaPursuitState =
    pursuit.turnsRemaining <= 0
      ? pursuit
      : { ...pursuit, turnsRemaining: pursuit.turnsRemaining - 1 };

  const label = formulaPursuitQuestLabel(advanced);
  const activeQuests = session.gameState.activeQuests.includes(label)
    ? session.gameState.activeQuests
    : [...session.gameState.activeQuests, label];

  return {
    ...session,
    gameState: { ...session.gameState, activeQuests },
    formulaPursuit: advanced,
    updatedAt: now,
  };
}

export type FormulaSecureOutcome =
  | "secured"
  | "no-pursuit"
  | "not-ready"
  | "already-owned";

export interface FormulaSecureResult {
  outcome: FormulaSecureOutcome;
  session?: GameSession;
}

/**
 * Claim the formula at the end of a completed pursuit — earned through the
 * story, so (unlike the trade route) it costs no funds. Validates that a
 * pursuit is under way and ready; then delivers the formula item, records a
 * memory fact, and clears the pursuit and its quest label. The React layer
 * narrates the "recipe secured" beat through `ENGINE_RESOLUTION`. Pure.
 */
export function secureFormulaThroughStory(
  session: GameSession,
  now: number = Date.now(),
): FormulaSecureResult {
  const pursuit = session.formulaPursuit;
  if (!pursuit) return { outcome: "no-pursuit" };
  if (!isFormulaPursuitReady(pursuit)) return { outcome: "not-ready" };

  const cleared = clearFormulaPursuit(session, now);
  const formula = nextFormulaItem(session);
  if (!formula) return { outcome: "no-pursuit", session: cleared };
  if (hasItemMatching(session.gameState.inventory, formula)) {
    return { outcome: "already-owned", session: cleared };
  }

  const fact: SessionFact = {
    type: "event",
    description: `Secured the closely-guarded ${formula.name} through the chase — the recipe for the next Sequence ${pursuit.targetSeq} potion is finally in hand.`,
    turnNumber: session.turnCount,
  };

  return {
    outcome: "secured",
    session: {
      ...cleared,
      gameState: addItemToInventory(cleared.gameState, formula),
      memory: {
        ...cleared.memory,
        sessionFacts: [...cleared.memory.sessionFacts, fact],
      },
      updatedAt: now,
    },
  };
}

/**
 * Remove the active formula pursuit (on a successful secure, or when the player
 * abandons it) and drop its quest label. A no-op when none is under way. Pure.
 */
export function clearFormulaPursuit(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const pursuit = session.formulaPursuit;
  if (!pursuit) return session;

  const label = formulaPursuitQuestLabel(pursuit);
  return {
    ...session,
    formulaPursuit: undefined,
    gameState: {
      ...session.gameState,
      activeQuests: session.gameState.activeQuests.filter((q) => q !== label),
    },
    updatedAt: now,
  };
}

export function isValidFormulaPursuitShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const s = obj as Record<string, unknown>;
  if (typeof s.targetItemName !== "string" || s.targetItemName.length === 0) {
    return false;
  }
  if (!Number.isFinite(s.targetSeq)) return false;
  if (!Number.isFinite(s.turnsRemaining) || (s.turnsRemaining as number) < 0) {
    return false;
  }
  if (!Number.isFinite(s.totalTurns) || (s.totalTurns as number) <= 0) return false;
  return true;
}
