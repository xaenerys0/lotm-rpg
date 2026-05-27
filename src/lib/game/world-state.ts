import type { GameState, ValidatedAIResponse, MemoryState } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import type { StateChange } from "@/lib/ai";
import { addTurn, buildTurnRecord } from "@/lib/ai";

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
        next = { ...next, location: String(change.newValue) };
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

export function applyResolution(
  gameState: GameState,
  memory: MemoryState,
  result: ValidatedAIResponse,
  turnCount: number,
  playerAction: string,
): { gameState: GameState; memory: MemoryState } {
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

  const turn = buildTurnRecord(turnCount, playerAction, response);
  const updatedMemory = addTurn(memory, turn);

  return { gameState: updated, memory: updatedMemory };
}
