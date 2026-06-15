import type { GameState, ValidatedAIResponse, MemoryState, SessionFact } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import type { ActingEvaluation, StateChange } from "@/lib/ai";
import { addSessionFact, addTurn, buildTurnRecord } from "@/lib/ai";
import { applyDigestionProgress, createDigestionState } from "./digestion";
import { tickInjuries } from "./combat";
import { adjustFunds, FUNDS_DISCOVERED_CAP } from "./marketplace";
import { clamp } from "./math";

const AI_MUTABLE_FIELDS = new Set(["location", "activeQuests", "npcsPresent"]);

/**
 * Item categories the rules engine alone may grant. Advancement prerequisites —
 * the next potion's formula, Beyonder Characteristic (main ingredient), and
 * supplementary reagents — are acquired ONLY through the potion-preparation
 * framework (buy/hunt), combat spoils, or echoes. AI narration may not mint them
 * into inventory, so they are stripped from `itemsDiscovered` and turned into a
 * story lead instead (see `partitionDiscoveredItems` / `discoveredItemLeadFact`).
 */
const ENGINE_ONLY_CATEGORIES = new Set<Item["category"]>([
  "main-ingredient",
  "supplementary-ingredient",
  "potion-formula",
]);

/**
 * Split AI-discovered items into the `mundane` loot the player may actually
 * carry and the advancement-critical reagents that must come through the
 * framework. Pure.
 */
export function partitionDiscoveredItems(items: Item[]): {
  carried: Item[];
  blocked: Item[];
} {
  const carried: Item[] = [];
  const blocked: Item[] = [];
  for (const item of items) {
    (ENGINE_ONLY_CATEGORIES.has(item.category) ? blocked : carried).push(item);
  }
  return { carried, blocked };
}

/**
 * Turn a blocked advancement-critical item the AI tried to grant into a story
 * lead: a `quest-progress` memory fact pointing the player at the proper
 * acquisition route (the preparation framework) rather than silently dropping
 * the narration. Pure.
 */
export function discoveredItemLeadFact(item: Item, turnNumber: number): SessionFact {
  const description =
    item.category === "potion-formula"
      ? `A lead surfaced toward the formula "${item.name}" — it must still be obtained through the proper channels for the next potion.`
      : item.category === "main-ingredient"
        ? `Word of the ${item.name} Beyonder Characteristic surfaced — it must still be hunted or bought for the next potion.`
        : `Learned where ${item.name} might be acquired for the next potion.`;
  return { type: "quest-progress", description, turnNumber };
}

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

  // Only `mundane` loot enters inventory from AI narration; advancement-critical
  // reagents are stripped and recorded as story leads, so narration cannot
  // bypass the potion-preparation framework (issue #90).
  const { carried, blocked } = partitionDiscoveredItems(response.itemsDiscovered ?? []);
  if (carried.length > 0) {
    updated = addDiscoveredItems(updated, carried);
  }

  // Money found (or lost) in the fiction reaches the wallet, bounded per turn so
  // it cannot be conjured to buy a deep-Sequence ingredient outright.
  if (response.fundsDiscovered) {
    const clamped = clamp(
      Math.trunc(response.fundsDiscovered),
      -FUNDS_DISCOVERED_CAP,
      FUNDS_DISCOVERED_CAP,
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

  // Build the turn record from a response carrying only the carried (mundane)
  // items, so the memory fact extractor and recent-summary bullet never report a
  // blocked reagent as "discovered". The blocked items become lead facts instead.
  const sanitizedResponse = { ...response, itemsDiscovered: carried };
  const turn = buildTurnRecord(turnCount, playerAction, sanitizedResponse);
  let updatedMemory = addTurn(memory, turn);
  for (const item of blocked) {
    updatedMemory = addSessionFact(
      updatedMemory,
      discoveredItemLeadFact(item, turnCount),
    );
  }

  return { gameState: updated, memory: updatedMemory, digestionDelta };
}
