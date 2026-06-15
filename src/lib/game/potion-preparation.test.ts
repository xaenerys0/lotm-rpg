import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";
import type { Item } from "@/lib/types/rules";

import { targetSequence } from "./advancement";
import { STARTING_FUNDS, getFunds } from "./marketplace";
import {
  acquisitionCost,
  acquisitionDepthFactor,
  acquisitionMethodsFor,
  deliverHuntedItem,
  huntLootReward,
  nextPotionItems,
  potionPreparationPlan,
  purchasePotionItem,
  ACQUISITION_DEPTH_STEP,
  HUNT_LOOT_BASE,
  MAIN_INGREDIENT_HUNT_ONLY_AT_OR_BELOW,
} from "./potion-preparation";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A fully-digested Beyonder on `sequenceLevel` with an empty satchel and a purse,
// so each test can decide which prerequisites it already carries.
function stuck(sequenceLevel: number, funds = 100_000, pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const gameState = {
    ...base,
    sequenceLevel,
    funds,
    inventory: [] as Item[],
    digestion: { pathwayId, sequenceLevel, progress: 100, complete: true },
  };
  return createSession(gameState, "session-1");
}

// The target potion's prerequisite items, split by the categories we exercise.
function targetItems(sequenceLevel: number, pathwayId = 1) {
  const target = targetSequence(sequenceLevel);
  const items = getSequence(pathwayId, target)?.prerequisiteItems ?? [];
  return {
    target,
    items,
    main: items.find((i) => i.category === "main-ingredient"),
    formula: items.find((i) => i.category === "potion-formula"),
    supplementary: items.find((i) => i.category === "supplementary-ingredient"),
  };
}

const MAIN: Item = {
  name: "Characteristic",
  description: "",
  category: "main-ingredient",
};
const FORMULA: Item = { name: "Formula", description: "", category: "potion-formula" };
const SUPP: Item = {
  name: "Reagents",
  description: "",
  category: "supplementary-ingredient",
};

describe("depth scaling", () => {
  it("treats the first climb (target 8) as the 1× baseline and deepens per rung", () => {
    expect(acquisitionDepthFactor(8)).toBe(1);
    expect(acquisitionDepthFactor(7)).toBe(1 + ACQUISITION_DEPTH_STEP);
    expect(acquisitionDepthFactor(1)).toBeCloseTo(1 + 7 * ACQUISITION_DEPTH_STEP);
  });

  it("never drops below the baseline for out-of-range targets", () => {
    expect(acquisitionDepthFactor(9)).toBe(1);
    expect(acquisitionDepthFactor(99)).toBe(1);
  });

  it("scales purchase cost and hunt spoils with the rung", () => {
    expect(huntLootReward(8)).toBe(HUNT_LOOT_BASE);
    expect(huntLootReward(1)).toBe(
      Math.round(HUNT_LOOT_BASE * acquisitionDepthFactor(1)),
    );
    expect(acquisitionCost(FORMULA, 1)).toBeGreaterThan(acquisitionCost(FORMULA, 8));
  });
});

describe("acquisitionMethodsFor", () => {
  it("lets the main ingredient be hunted or bought at the shallow rungs", () => {
    expect(acquisitionMethodsFor(MAIN, 8)).toEqual(["hunt", "purchase"]);
  });

  it("makes the main ingredient hunt-only from the gated rung onward", () => {
    expect(acquisitionMethodsFor(MAIN, MAIN_INGREDIENT_HUNT_ONLY_AT_OR_BELOW)).toEqual([
      "hunt",
    ]);
    expect(
      acquisitionMethodsFor(MAIN, MAIN_INGREDIENT_HUNT_ONLY_AT_OR_BELOW - 1),
    ).toEqual(["hunt"]);
  });

  it("keeps the formula and supplementary reagents purchase-only", () => {
    expect(acquisitionMethodsFor(FORMULA, 8)).toEqual(["purchase"]);
    expect(acquisitionMethodsFor(SUPP, 1)).toEqual(["purchase"]);
  });
});

describe("potionPreparationPlan", () => {
  it("lists every prerequisite as unowned for a stuck Beyonder, with costs", () => {
    const session = stuck(9);
    const plan = potionPreparationPlan(session);
    const { items } = targetItems(9);
    expect(plan.targetSeq).toBe(8);
    expect(plan.items).toHaveLength(items.length);
    expect(plan.items.every((status) => !status.owned)).toBe(true);
    expect(plan.allOwned).toBe(false);
    // Purchasable items quote a positive cost; hunt-only items quote 0.
    for (const status of plan.items) {
      if (status.methods.includes("purchase")) {
        expect(status.cost).toBeGreaterThan(0);
      } else {
        expect(status.cost).toBe(0);
      }
    }
  });

  it("reports allOwned once every prerequisite is carried", () => {
    const { items } = targetItems(9);
    const session = stuck(9);
    const carrying: GameSession = {
      ...session,
      gameState: { ...session.gameState, inventory: [...items] },
    };
    const plan = potionPreparationPlan(carrying);
    expect(plan.items.every((status) => status.owned)).toBe(true);
    expect(plan.allOwned).toBe(true);
  });

  it("ignores a mundane item that merely shares a prerequisite's name (issue #90)", () => {
    const { formula } = targetItems(9);
    expect(formula).toBeDefined();
    const session = stuck(9);
    // A mundane decoy named exactly like the required formula must NOT count.
    const decoy: Item = { ...formula!, category: "mundane" };
    const carrying: GameSession = {
      ...session,
      gameState: { ...session.gameState, inventory: [decoy] },
    };
    const status = potionPreparationPlan(carrying).items.find(
      (s) => s.item.name === formula!.name,
    );
    expect(status?.owned).toBe(false);
    // …and it must not soft-lock the real purchase as "already-owned".
    expect(purchasePotionItem(carrying, formula!.name).outcome).toBe("purchased");
  });
});

describe("purchasePotionItem", () => {
  it("buys a prerequisite: deducts funds, delivers the item, records a fact", () => {
    const { formula } = targetItems(9);
    expect(formula).toBeDefined();
    const session = stuck(9, 100_000);
    const before = getFunds(session.gameState);
    const result = purchasePotionItem(session, formula!.name, 123);

    expect(result.outcome).toBe("purchased");
    expect(
      result.session!.gameState.inventory.some((i) => i.name === formula!.name),
    ).toBe(true);
    expect(getFunds(result.session!.gameState)).toBe(before - result.cost!);
    expect(result.session!.updatedAt).toBe(123);
    expect(
      result.session!.memory.sessionFacts.some((f) =>
        f.description.includes(formula!.name),
      ),
    ).toBe(true);
    // Original is untouched.
    expect(session.gameState.inventory).toHaveLength(0);
    expect(getFunds(session.gameState)).toBe(before);
  });

  it("refuses an item already carried", () => {
    const { formula } = targetItems(9);
    const session = stuck(9);
    const carrying: GameSession = {
      ...session,
      gameState: { ...session.gameState, inventory: [formula!] },
    };
    expect(purchasePotionItem(carrying, formula!.name).outcome).toBe("already-owned");
  });

  it("refuses an item that is not a prerequisite, or a non-advanceable rung", () => {
    expect(purchasePotionItem(stuck(9), "Nonexistent Brew").outcome).toBe("not-required");
    const { formula } = targetItems(9);
    // Sequence 1 cannot advance through this engine (apotheosis territory).
    expect(purchasePotionItem(stuck(1), formula?.name ?? "x").outcome).toBe(
      "not-required",
    );
  });

  it("refuses to buy a hunt-only main ingredient at the deep rungs", () => {
    const seqLevel = MAIN_INGREDIENT_HUNT_ONLY_AT_OR_BELOW + 1; // target == gated rung
    const { main } = targetItems(seqLevel);
    expect(main).toBeDefined();
    expect(purchasePotionItem(stuck(seqLevel), main!.name).outcome).toBe(
      "not-purchasable",
    );
  });

  it("refuses an unaffordable purchase without mutating funds or inventory", () => {
    const { formula } = targetItems(9);
    const session = stuck(9, 0);
    const result = purchasePotionItem(session, formula!.name);
    expect(result.outcome).toBe("unaffordable");
    expect(result.cost).toBeGreaterThan(0);
    expect(result.session).toBeUndefined();
  });

  it("works for legacy saves that predate currency", () => {
    const { formula } = targetItems(9);
    const session = stuck(9);
    // Strip funds entirely — getFunds seeds STARTING_FUNDS, but the formula costs
    // more than that, so this also proves the affordability gate.
    const legacy: GameSession = {
      ...session,
      gameState: { ...session.gameState, funds: undefined },
    };
    expect(getFunds(legacy.gameState)).toBe(STARTING_FUNDS);
    expect(purchasePotionItem(legacy, formula!.name).outcome).toBe("unaffordable");
  });
});

describe("deliverHuntedItem", () => {
  it("grants a hunted main ingredient plus spoils and a memory fact", () => {
    const { main, target } = targetItems(9);
    expect(main).toBeDefined();
    const session = stuck(9, 50);
    const result = deliverHuntedItem(session, main!.name, 456);

    expect(result.outcome).toBe("delivered");
    expect(result.loot).toBe(huntLootReward(target));
    expect(result.session!.gameState.inventory.some((i) => i.name === main!.name)).toBe(
      true,
    );
    expect(getFunds(result.session!.gameState)).toBe(50 + result.loot!);
    expect(result.session!.updatedAt).toBe(456);
    // Original untouched.
    expect(session.gameState.inventory).toHaveLength(0);
  });

  it("refuses to 'hunt' a purchase-only formula", () => {
    const { formula } = targetItems(9);
    expect(deliverHuntedItem(stuck(9), formula!.name).outcome).toBe("not-huntable");
  });

  it("refuses an already-owned item, an unknown item, or a non-advanceable rung", () => {
    const { main } = targetItems(9);
    const carrying: GameSession = {
      ...stuck(9),
      gameState: { ...stuck(9).gameState, inventory: [main!] },
    };
    expect(deliverHuntedItem(carrying, main!.name).outcome).toBe("already-owned");
    expect(deliverHuntedItem(stuck(9), "Phantom").outcome).toBe("not-required");
    expect(deliverHuntedItem(stuck(1), main?.name ?? "x").outcome).toBe("not-required");
  });
});

describe("nextPotionItems", () => {
  it("returns the target potion's prerequisite list", () => {
    expect(nextPotionItems(stuck(9))).toEqual(targetItems(9).items);
  });
});
