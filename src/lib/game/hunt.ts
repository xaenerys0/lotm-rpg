import type { SessionFact } from "@/lib/ai";

import { isAdvanceableSequence, targetSequence } from "./advancement";
import { hasItemMatching } from "./inventory";
import {
  acquisitionDepthFactor,
  acquisitionMethodsFor,
  nextPotionItems,
} from "./potion-preparation";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Hunt quests (advancement/combat streamline) — tracking a Beyonder
// Characteristic's creature before the fight.
// ---------------------------------------------------------------------------
//
// Hunting a Characteristic for the next potion is no longer an immediate jump to
// combat: it begins a tracked, multi-turn QUEST to find the creature that
// carries it. The deeper the rung, the longer and harder the search (canon —
// "higher Sequences require extra effort"; we reuse the same
// `acquisitionDepthFactor` that scales the potion economy). Each normal turn of
// play closes the distance; once the quarry is cornered the player engages it
// through the one unified combat system (`combat.ts`), and victory delivers the
// Characteristic via `deliverHuntedItem` exactly as before.
//
// Several hunts can run at once — the player may be tracking more than one
// Characteristic — so the state is a list on the session, kept in sync with the
// AI-visible `activeQuests` so the narrator weaves the search into the story.
//
// Pure + deterministic; storage, journaling and the combat encounter itself
// live in the React layer like every other session subsystem.

/** A single in-progress hunt for one Beyonder Characteristic. */
export interface HuntState {
  /** The Characteristic (next-potion prerequisite) this hunt is after. */
  targetItemName: string;
  /** The sequence being prepared for (one rung lower than the current one). */
  targetSeq: number;
  /** Tracking turns left before the quarry is found; 0 = ready to engage. */
  turnsRemaining: number;
  /** Total tracking turns the hunt started with (for the progress display). */
  totalTurns: number;
}

/** Base tracking turns for the shallowest rung, before depth scaling. */
export const HUNT_BASE_TRACKING_TURNS = 2;

/**
 * How many turns of tracking a hunt at `targetSeq` demands. Scales with the same
 * depth factor as the potion economy, so deeper (more powerful) Characteristics
 * take longer to run down. Always at least one turn.
 */
export function huntTrackingTurns(targetSeq: number): number {
  return Math.max(
    1,
    Math.round(HUNT_BASE_TRACKING_TURNS * acquisitionDepthFactor(targetSeq)),
  );
}

/**
 * The canonical `activeQuests` string for a hunt — the single source of truth so
 * the label added on start matches the one removed on completion/abandon (the AI
 * sees this entry and narrates the search).
 */
export function huntQuestLabel(state: HuntState): string {
  return `Hunt the ${state.targetItemName} for the Sequence ${state.targetSeq} potion`;
}

/** True once the tracking is done and the quarry can be engaged in combat. */
export function isHuntReady(state: HuntState): boolean {
  return state.turnsRemaining <= 0;
}

/** Find an active hunt for a given Characteristic, if one exists. */
export function findHunt(session: GameSession, itemName: string): HuntState | undefined {
  return (session.hunts ?? []).find((h) => h.targetItemName === itemName);
}

export type HuntStartOutcome =
  | "started"
  | "not-required"
  | "already-owned"
  | "not-huntable"
  | "already-hunting";

export interface HuntStartResult {
  outcome: HuntStartOutcome;
  session?: GameSession;
}

/**
 * Begin tracking a Characteristic. Validates — exactly like `deliverHuntedItem`
 * — that the item is a missing, huntable prerequisite for the current target
 * sequence, and that it is not already being hunted. On success it records the
 * hunt, seeds a `quest-progress` memory fact, and adds the AI-visible quest
 * label. Pure.
 */
export function startHunt(
  session: GameSession,
  itemName: string,
  now: number = Date.now(),
): HuntStartResult {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);
  if (!isAdvanceableSequence(state.sequenceLevel)) return { outcome: "not-required" };

  const item = nextPotionItems(session).find((candidate) => candidate.name === itemName);
  if (!item) return { outcome: "not-required" };
  if (hasItemMatching(state.inventory, item)) return { outcome: "already-owned" };
  if (!acquisitionMethodsFor(item, target).includes("hunt")) {
    return { outcome: "not-huntable" };
  }
  if (findHunt(session, itemName)) return { outcome: "already-hunting" };

  const totalTurns = huntTrackingTurns(target);
  const hunt: HuntState = {
    targetItemName: itemName,
    targetSeq: target,
    turnsRemaining: totalTurns,
    totalTurns,
  };

  const fact: SessionFact = {
    type: "quest-progress",
    description: `Began tracking the creature that carries the ${itemName} — the hunt for the next potion's Beyonder Characteristic is on.`,
    turnNumber: session.turnCount,
  };

  const label = huntQuestLabel(hunt);
  const activeQuests = state.activeQuests.includes(label)
    ? state.activeQuests
    : [...state.activeQuests, label];

  return {
    outcome: "started",
    session: {
      ...session,
      gameState: { ...state, activeQuests },
      hunts: [...(session.hunts ?? []), hunt],
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, fact],
      },
      updatedAt: now,
    },
  };
}

/** Advance one hunt by a turn of tracking (floored at 0 — ready to engage). */
export function advanceHunt(state: HuntState): HuntState {
  if (state.turnsRemaining <= 0) return state;
  return { ...state, turnsRemaining: state.turnsRemaining - 1 };
}

/**
 * Advance every active hunt by one turn and keep the AI-visible quest labels in
 * sync. The labels are re-added idempotently because `activeQuests` is
 * AI-mutable — the narrator could drop one — but the engine's truth is `hunts`,
 * never the string. A no-op when no hunts are active. Pure.
 */
export function advanceActiveHunts(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const hunts = session.hunts ?? [];
  if (hunts.length === 0) return session;

  const advanced = hunts.map(advanceHunt);
  let activeQuests = session.gameState.activeQuests;
  for (const hunt of advanced) {
    const label = huntQuestLabel(hunt);
    if (!activeQuests.includes(label)) activeQuests = [...activeQuests, label];
  }

  return {
    ...session,
    gameState: { ...session.gameState, activeQuests },
    hunts: advanced,
    updatedAt: now,
  };
}

/**
 * Remove a hunt (on a victorious kill, or when the player abandons it) and drop
 * its quest label from `activeQuests`. A no-op when no such hunt exists. Pure.
 */
export function clearHunt(
  session: GameSession,
  itemName: string,
  now: number = Date.now(),
): GameSession {
  const hunts = session.hunts ?? [];
  const hunt = hunts.find((h) => h.targetItemName === itemName);
  if (!hunt) return session;

  const label = huntQuestLabel(hunt);
  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: session.gameState.activeQuests.filter((q) => q !== label),
    },
    hunts: hunts.filter((h) => h.targetItemName !== itemName),
    updatedAt: now,
  };
}

export function isValidHuntStateShape(obj: unknown): boolean {
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

/** Strict shape check for a session's `hunts` list (empty list is valid). */
export function isValidHuntsShape(obj: unknown): boolean {
  if (!Array.isArray(obj)) return false;
  return obj.every(isValidHuntStateShape);
}
