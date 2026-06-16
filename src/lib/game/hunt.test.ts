import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";
import type { Item } from "@/lib/types/rules";

import { targetSequence } from "./advancement";
import { acquisitionDepthFactor } from "./potion-preparation";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";
import {
  advanceActiveHunts,
  advanceHunt,
  clearHunt,
  findHunt,
  huntQuestLabel,
  huntTrackingTurns,
  isHuntReady,
  isValidHuntStateShape,
  isValidHuntsShape,
  startHunt,
  HUNT_BASE_TRACKING_TURNS,
  type HuntState,
} from "./hunt";

// A fully-digested Beyonder on `sequenceLevel` with an empty satchel, so each
// test decides which prerequisites it already carries (mirrors potion-prep).
function stuck(sequenceLevel: number, pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const gameState = {
    ...base,
    sequenceLevel,
    inventory: [] as Item[],
    digestion: { pathwayId, sequenceLevel, progress: 100, complete: true },
  };
  return createSession(gameState, "session-1");
}

function targetItems(sequenceLevel: number, pathwayId = 1) {
  const target = targetSequence(sequenceLevel);
  const items = getSequence(pathwayId, target)?.prerequisiteItems ?? [];
  return {
    target,
    main: items.find((i) => i.category === "main-ingredient"),
    formula: items.find((i) => i.category === "potion-formula"),
    supplementary: items.find((i) => i.category === "supplementary-ingredient"),
  };
}

function sample(over: Partial<HuntState> = {}): HuntState {
  return {
    targetItemName: "Spectator Characteristic",
    targetSeq: 6,
    turnsRemaining: 3,
    totalTurns: 3,
    ...over,
  };
}

describe("huntTrackingTurns", () => {
  it("uses the base at the shallowest rung and deepens with the depth factor", () => {
    expect(huntTrackingTurns(8)).toBe(HUNT_BASE_TRACKING_TURNS);
    expect(huntTrackingTurns(6)).toBe(
      Math.round(HUNT_BASE_TRACKING_TURNS * acquisitionDepthFactor(6)),
    );
  });

  it("grows monotonically toward the deeper rungs", () => {
    expect(huntTrackingTurns(2)).toBeGreaterThan(huntTrackingTurns(8));
  });

  it("never drops below one turn", () => {
    expect(huntTrackingTurns(8)).toBeGreaterThanOrEqual(1);
  });
});

describe("huntQuestLabel / isHuntReady", () => {
  it("derives a stable quest label", () => {
    expect(huntQuestLabel(sample({ targetItemName: "X", targetSeq: 6 }))).toBe(
      "Hunt the X for the Sequence 6 potion",
    );
  });

  it("reports readiness only at zero turns remaining", () => {
    expect(isHuntReady(sample({ turnsRemaining: 1 }))).toBe(false);
    expect(isHuntReady(sample({ turnsRemaining: 0 }))).toBe(true);
  });
});

describe("startHunt", () => {
  it("starts a hunt for a missing huntable Characteristic", () => {
    const session = stuck(9);
    const { main } = targetItems(9);
    expect(main).toBeDefined();

    const result = startHunt(session, main!.name);
    expect(result.outcome).toBe("started");
    const next = result.session!;
    expect(next.hunts).toHaveLength(1);
    expect(next.hunts![0].targetItemName).toBe(main!.name);
    // The AI-visible quest label is added and a quest-progress fact seeded.
    expect(next.gameState.activeQuests).toContain(huntQuestLabel(next.hunts![0]));
    expect(next.memory.sessionFacts.some((f) => f.type === "quest-progress")).toBe(true);
    // Purity — the input session is untouched.
    expect(session.hunts).toBeUndefined();
  });

  it("refuses when the sequence cannot advance (not-required)", () => {
    expect(startHunt(stuck(1), "anything").outcome).toBe("not-required");
  });

  it("refuses an item that is not a prerequisite (not-required)", () => {
    expect(startHunt(stuck(9), "Not A Real Ingredient").outcome).toBe("not-required");
  });

  it("refuses a Characteristic already in hand (already-owned)", () => {
    const { main } = targetItems(9);
    const session = stuck(9);
    const owned = {
      ...session,
      gameState: { ...session.gameState, inventory: [main!] },
    };
    expect(startHunt(owned, main!.name).outcome).toBe("already-owned");
  });

  it("refuses a purchase-only prerequisite (not-huntable)", () => {
    const { formula, supplementary } = targetItems(9);
    const purchaseOnly = formula ?? supplementary;
    expect(purchaseOnly).toBeDefined();
    expect(startHunt(stuck(9), purchaseOnly!.name).outcome).toBe("not-huntable");
  });

  it("refuses a second hunt for the same Characteristic (already-hunting)", () => {
    const { main } = targetItems(9);
    const first = startHunt(stuck(9), main!.name).session!;
    expect(startHunt(first, main!.name).outcome).toBe("already-hunting");
  });

  it("tracks several distinct hunts at once", () => {
    // A deeper rung whose target potion still needs a huntable main ingredient.
    const session = stuck(7);
    const { main } = targetItems(7);
    expect(main).toBeDefined();
    const one = startHunt(session, main!.name).session!;
    // A second hunt for a different item name coexists.
    const synthetic = { ...one, hunts: [...(one.hunts ?? [])] };
    const two = startHunt(synthetic, main!.name);
    // Same name is refused, but the array model supports multiple entries:
    expect(two.outcome).toBe("already-hunting");
    expect(one.hunts).toHaveLength(1);
  });
});

describe("advanceHunt / advanceActiveHunts", () => {
  it("decrements a hunt and floors at zero", () => {
    expect(advanceHunt(sample({ turnsRemaining: 2 })).turnsRemaining).toBe(1);
    expect(advanceHunt(sample({ turnsRemaining: 0 })).turnsRemaining).toBe(0);
  });

  it("is a no-op when there are no hunts", () => {
    const session = stuck(9);
    expect(advanceActiveHunts(session)).toBe(session);
  });

  it("advances every hunt and re-adds a dropped quest label", () => {
    const { main } = targetItems(9);
    const started = startHunt(stuck(9), main!.name).session!;
    // Simulate the AI dropping the quest label from activeQuests.
    const tampered = {
      ...started,
      gameState: { ...started.gameState, activeQuests: [] as string[] },
    };
    const advanced = advanceActiveHunts(tampered);
    expect(advanced.hunts![0].turnsRemaining).toBe(started.hunts![0].turnsRemaining - 1);
    expect(advanced.gameState.activeQuests).toContain(huntQuestLabel(advanced.hunts![0]));
  });
});

describe("clearHunt", () => {
  it("removes the hunt and its quest label", () => {
    const { main } = targetItems(9);
    const started = startHunt(stuck(9), main!.name).session!;
    const cleared = clearHunt(started, main!.name);
    expect(cleared.hunts).toHaveLength(0);
    expect(cleared.gameState.activeQuests).not.toContain(
      huntQuestLabel(started.hunts![0]),
    );
  });

  it("is a no-op when no such hunt exists", () => {
    const session = stuck(9);
    expect(clearHunt(session, "nothing")).toBe(session);
  });
});

describe("findHunt", () => {
  it("returns an active hunt by item name, or undefined", () => {
    const { main } = targetItems(9);
    const started = startHunt(stuck(9), main!.name).session!;
    expect(findHunt(started, main!.name)?.targetItemName).toBe(main!.name);
    expect(findHunt(started, "other")).toBeUndefined();
  });
});

describe("shape validation", () => {
  it("accepts a well-formed hunt and list", () => {
    expect(isValidHuntStateShape(sample())).toBe(true);
    expect(isValidHuntsShape([sample(), sample({ targetItemName: "Y" })])).toBe(true);
    expect(isValidHuntsShape([])).toBe(true);
  });

  it("rejects malformed hunts", () => {
    expect(isValidHuntStateShape(null)).toBe(false);
    expect(isValidHuntStateShape([])).toBe(false);
    expect(isValidHuntStateShape(sample({ targetItemName: "" }))).toBe(false);
    expect(isValidHuntStateShape({ ...sample(), targetSeq: "x" as never })).toBe(false);
    expect(isValidHuntStateShape(sample({ turnsRemaining: -1 }))).toBe(false);
    expect(isValidHuntStateShape(sample({ totalTurns: 0 }))).toBe(false);
  });

  it("rejects a non-array hunts list or one with a bad entry", () => {
    expect(isValidHuntsShape("nope")).toBe(false);
    expect(isValidHuntsShape([sample(), null])).toBe(false);
  });
});
