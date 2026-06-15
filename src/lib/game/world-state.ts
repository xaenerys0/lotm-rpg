import type { GameState, ValidatedAIResponse, MemoryState } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import type { ActingEvaluation, StateChange } from "@/lib/ai";
import { addTurn, buildTurnRecord } from "@/lib/ai";
import { applyDigestionProgress, createDigestionState } from "./digestion";
import { tickInjuries } from "./combat";
import { adjustFunds, FUNDS_DISCOVERED_CAP } from "./marketplace";

const AI_MUTABLE_FIELDS = new Set(["location", "activeQuests", "npcsPresent"]);

export function applyWorldStateChanges(
  state: GameState,
  changes: StateChange[],
): GameState {
  let next = { ...state };

  for (const change of changes) {
    if (!AI_MUTABLE_FIELDS.has(change.field)) {
      continue;
    }

    switch (change.field) {
      case "location":
        if (typeof change.newValue === "string") {
          next = { ...next, location: change.newValue };
        }
        break;
      case "activeQuests":
        if (Array.isArray(change.newValue)) {
          next = { ...next, activeQuests: change.newValue.map(String) };
        }
        break;
      case "npcsPresent":
        if (Array.isArray(change.newValue)) {
          next = { ...next, npcsPresent: change.newValue.map(String) };
        }
        break;
    }
  }

  return next;
}

export function applySanityImpact(state: GameState, impact: number): GameState {
  const newSanity = Math.max(0, Math.min(state.maxSanity, state.sanity + impact));
  return { ...state, sanity: newSanity };
}

export function addDiscoveredItems(state: GameState, items: Item[]): GameState {
  return { ...state, inventory: [...state.inventory, ...items] };
}

/**
 * Advance (or reverse) digestion of the current potion based on the AI's acting
 * evaluation. Re-seeds the digestion state if it is missing or no longer
 * matches the character's current pathway/sequence (e.g. after advancement).
 */
export function applyDigestion(
  state: GameState,
  evaluation: ActingEvaluation,
): { state: GameState; delta: number } {
  const current = state.digestion;
  const digestion =
    current &&
    current.pathwayId === state.pathwayId &&
    current.sequenceLevel === state.sequenceLevel
      ? current
      : createDigestionState(state.pathwayId, state.sequenceLevel);

  const { state: nextDigestion, delta } = applyDigestionProgress(
    digestion,
    evaluation.alignment,
  );

  return { state: { ...state, digestion: nextDigestion }, delta };
}

export function applyResolution(
  gameState: GameState,
  memory: MemoryState,
  result: ValidatedAIResponse,
  turnCount: number,
  playerAction: string,
): { gameState: GameState; memory: MemoryState; digestionDelta: number } {
  let updated = { ...gameState };
  const response = result.response;

  if (response.sanityImpact !== undefined) {
    updated = applySanityImpact(updated, response.sanityImpact);
  }

  if (response.worldStateChanges && response.worldStateChanges.length > 0) {
    updated = applyWorldStateChanges(updated, response.worldStateChanges);
  }

  if (response.itemsDiscovered && response.itemsDiscovered.length > 0) {
    updated = addDiscoveredItems(updated, response.itemsDiscovered);
  }

  // Money found (or lost) in the fiction reaches the wallet, bounded per turn so
  // it cannot be conjured to buy a deep-Sequence ingredient outright.
  if (response.fundsDiscovered) {
    const clamped = Math.max(
      -FUNDS_DISCOVERED_CAP,
      Math.min(FUNDS_DISCOVERED_CAP, Math.trunc(response.fundsDiscovered)),
    );
    updated = adjustFunds(updated, clamped);
  }

  let digestionDelta = 0;
  if (response.actingEvaluation) {
    const digestionResult = applyDigestion(updated, response.actingEvaluation);
    updated = digestionResult.state;
    digestionDelta = digestionResult.delta;
  }

  // A turn of normal play heals active combat injuries (issue #10).
  updated = tickInjuries(updated);

  const turn = buildTurnRecord(turnCount, playerAction, response);
  const updatedMemory = addTurn(memory, turn);

  return { gameState: updated, memory: updatedMemory, digestionDelta };
}
