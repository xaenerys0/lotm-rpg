import type { SessionFact } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import { getSequence } from "@/lib/rules";

import {
  isAdvanceableSequence,
  MAX_ADVANCEABLE_SEQUENCE,
  targetSequence,
} from "./advancement";
import { hasItem } from "./inventory";
import {
  addItemToInventory,
  adjustFunds,
  canAfford,
  PRICE_GUIDANCE,
} from "./marketplace";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Potion preparation (issue #84) — assembling the NEXT potion so the engine's
// advancement gate can actually be met in normal play.
// ---------------------------------------------------------------------------
//
// The advancement engine (`advancement.ts`) requires the target potion's exact
// ingredients in inventory, but nothing in normal play granted them — inventory
// is not AI-mutable — so a fully-digested Beyonder could never legitimately
// climb, and the AI would narrate an advancement the engine never committed
// (status bar stuck a Sequence behind the story). This module is the missing
// acquisition path: a Beyonder gathers the next potion's formula and reagents by
// **buying** them or **hunting** the Beyonder Characteristic, and the deeper the
// rung the more it costs / the more it must be hunted. The rules engine — never
// the AI — owns every grant here, exactly like advancement itself.
//
// Pure + deterministic; storage, journaling and the hunt's combat encounter live
// in the React layer like every other session subsystem.

export type AcquisitionMethod = "purchase" | "hunt";

/**
 * Target sequence at or below which a Beyonder Characteristic can no longer be
 * bought on any market — it must be hunted from the creature/Beyonder that
 * carries it. Higher rungs (the deeper, more powerful potions) demand the hunt.
 */
export const MAIN_INGREDIENT_HUNT_ONLY_AT_OR_BELOW = 6;

/** Per-rung multiplier step on costs and hunt spoils — deeper potions cost far more. */
export const ACQUISITION_DEPTH_STEP = 0.25;

/** Base spoils (pence) recovered from a successful hunt, before depth scaling. */
export const HUNT_LOOT_BASE = 500;

/**
 * How much dearer the target potion's reagents are than the shallowest rung.
 * Sequence 8 (the first climb) is the baseline (1×); every rung deeper adds
 * `ACQUISITION_DEPTH_STEP`.
 */
export function acquisitionDepthFactor(targetSeq: number): number {
  const depth = Math.max(0, MAX_ADVANCEABLE_SEQUENCE - 1 - targetSeq);
  return 1 + depth * ACQUISITION_DEPTH_STEP;
}

/** The purchase price (pence) of one prerequisite item for the target potion. */
export function acquisitionCost(item: Item, targetSeq: number): number {
  return Math.round(
    PRICE_GUIDANCE[item.category].min * acquisitionDepthFactor(targetSeq),
  );
}

/** Spoils (pence) from a successful hunt — scales with the rung, funding the rest. */
export function huntLootReward(targetSeq: number): number {
  return Math.round(HUNT_LOOT_BASE * acquisitionDepthFactor(targetSeq));
}

/**
 * Which methods can obtain a given prerequisite item. The Beyonder
 * Characteristic (the main ingredient) can always be hunted, and bought too at
 * the shallow rungs; the formula and supplementary reagents are bought.
 */
export function acquisitionMethodsFor(
  item: Item,
  targetSeq: number,
): AcquisitionMethod[] {
  if (item.category === "main-ingredient") {
    return targetSeq <= MAIN_INGREDIENT_HUNT_ONLY_AT_OR_BELOW
      ? ["hunt"]
      : ["hunt", "purchase"];
  }
  return ["purchase"];
}

export interface PotionItemStatus {
  item: Item;
  owned: boolean;
  methods: AcquisitionMethod[];
  /** Purchase cost in pence; 0 when the item cannot be bought. */
  cost: number;
}

export interface PotionPreparationPlan {
  /** The sequence being prepared for (one rung lower than the current one). */
  targetSeq: number;
  items: PotionItemStatus[];
  /** Every prerequisite item is already carried. */
  allOwned: boolean;
}

/**
 * The shared success tail for both acquisition paths: deliver the item, adjust
 * funds (negative for a purchase, positive for hunt spoils), record a memory
 * fact, and stamp the session. Pure.
 */
function grantItem(
  session: GameSession,
  item: Item,
  fundDelta: number,
  description: string,
  now: number,
): GameSession {
  const fact: SessionFact = {
    type: "event",
    description,
    turnNumber: session.turnCount,
  };
  return {
    ...session,
    gameState: addItemToInventory(adjustFunds(session.gameState, fundDelta), item),
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/** The target potion's prerequisite items (formula + ingredients), if any. */
export function nextPotionItems(session: GameSession): Item[] {
  const target = targetSequence(session.gameState.sequenceLevel);
  return getSequence(session.gameState.pathwayId, target)?.prerequisiteItems ?? [];
}

/**
 * The preparation checklist for the next potion: each prerequisite item with
 * whether it is carried, how it can be acquired, and its purchase cost.
 */
export function potionPreparationPlan(session: GameSession): PotionPreparationPlan {
  const target = targetSequence(session.gameState.sequenceLevel);
  const items = nextPotionItems(session).map((item): PotionItemStatus => {
    const methods = acquisitionMethodsFor(item, target);
    return {
      item,
      owned: hasItem(session.gameState.inventory, item.name),
      methods,
      cost: methods.includes("purchase") ? acquisitionCost(item, target) : 0,
    };
  });
  return { targetSeq: target, items, allOwned: items.every((status) => status.owned) };
}

export type PurchaseOutcome =
  | "purchased"
  | "not-required"
  | "already-owned"
  | "not-purchasable"
  | "unaffordable";

export interface PurchaseResult {
  outcome: PurchaseOutcome;
  session?: GameSession;
  /** The price involved (on success or on an unaffordable refusal). */
  cost?: number;
}

/**
 * Buy one prerequisite item for the next potion. The engine validates that the
 * item really is a missing prerequisite for the current target, that it can be
 * bought, and that the player can afford it — then deducts funds, delivers the
 * item, and records a memory fact. Never trusts AI-supplied data.
 */
export function purchasePotionItem(
  session: GameSession,
  itemName: string,
  now: number = Date.now(),
): PurchaseResult {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);
  if (!isAdvanceableSequence(state.sequenceLevel)) return { outcome: "not-required" };

  const item = nextPotionItems(session).find((candidate) => candidate.name === itemName);
  if (!item) return { outcome: "not-required" };
  if (hasItem(state.inventory, itemName)) return { outcome: "already-owned" };
  if (!acquisitionMethodsFor(item, target).includes("purchase")) {
    return { outcome: "not-purchasable" };
  }

  const cost = acquisitionCost(item, target);
  if (!canAfford(state, cost)) return { outcome: "unaffordable", cost };

  return {
    outcome: "purchased",
    cost,
    session: grantItem(
      session,
      item,
      -cost,
      `Acquired ${item.name} for the next potion (${cost} pence).`,
      now,
    ),
  };
}

export type HuntOutcome = "delivered" | "not-required" | "already-owned" | "not-huntable";

export interface HuntResult {
  outcome: HuntOutcome;
  session?: GameSession;
  /** Spoils awarded on a successful hunt. */
  loot?: number;
}

/**
 * Deliver a hunted prerequisite item after a victorious hunt (the React layer
 * runs the combat encounter and calls this only on victory). The engine
 * validates the item is a missing, huntable prerequisite, then grants it plus
 * the depth-scaled spoils and records a memory fact.
 */
export function deliverHuntedItem(
  session: GameSession,
  itemName: string,
  now: number = Date.now(),
): HuntResult {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);
  if (!isAdvanceableSequence(state.sequenceLevel)) return { outcome: "not-required" };

  const item = nextPotionItems(session).find((candidate) => candidate.name === itemName);
  if (!item) return { outcome: "not-required" };
  if (hasItem(state.inventory, itemName)) return { outcome: "already-owned" };
  if (!acquisitionMethodsFor(item, target).includes("hunt")) {
    return { outcome: "not-huntable" };
  }

  const loot = huntLootReward(target);
  return {
    outcome: "delivered",
    loot,
    session: grantItem(
      session,
      item,
      loot,
      `Hunted and claimed ${item.name}, taking ${loot} pence in spoils.`,
      now,
    ),
  };
}
