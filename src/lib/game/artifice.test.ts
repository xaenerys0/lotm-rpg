import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/rules";

import {
  ARTISAN_SEQUENCE,
  COMMISSION_FEE_BY_GRADE,
  PARAGON_PATHWAY_ID,
  SELF_CRAFT_MATERIALS_COST_BY_GRADE,
  canCraftArtifact,
  craftArtifact,
  craftCapability,
  craftFee,
  gradeForCharacteristicSequence,
  parseCharacteristicItem,
} from "./artifice";
import { MAX_CUSTOM_ARTIFACTS, type CustomArtifact } from "./custom-artifacts";
import { getFunds } from "./marketplace";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

function characteristic(seq: number, pathway = "Paragon"): Item {
  return {
    name: `Sequence ${seq} ${pathway} Beyonder Characteristic`,
    description: "A precipitated characteristic.",
    category: "main-ingredient",
  };
}

function session(
  pathwayId: number,
  sequenceLevel: number,
  inventory: Item[] = [],
  funds = 100_000,
): GameSession {
  const base = createDefaultGameState(pathwayId, "c1", "Tester");
  return createSession({ ...base, sequenceLevel, inventory, funds }, "s1");
}

describe("craftCapability", () => {
  it("a Paragon at Seq <= 6 may self-craft; others must commission", () => {
    expect(craftCapability(session(PARAGON_PATHWAY_ID, ARTISAN_SEQUENCE))).toEqual({
      canSelfCraft: true,
      canCommission: true,
    });
    expect(craftCapability(session(PARAGON_PATHWAY_ID, 7)).canSelfCraft).toBe(false);
    expect(craftCapability(session(1, 6)).canSelfCraft).toBe(false);
    expect(canCraftArtifact(session(1, 9))).toBe(true); // commission is always open
  });
});

describe("gradeForCharacteristicSequence", () => {
  it("maps the user's bands and forbids a god-tier characteristic", () => {
    expect([9, 8, 7].map(gradeForCharacteristicSequence)).toEqual([3, 3, 3]);
    expect([6, 5].map(gradeForCharacteristicSequence)).toEqual([2, 2]);
    expect([4, 3].map(gradeForCharacteristicSequence)).toEqual([1, 1]);
    expect([2, 1].map(gradeForCharacteristicSequence)).toEqual([0, 0]);
    expect(gradeForCharacteristicSequence(0)).toBeNull();
    expect(gradeForCharacteristicSequence(10)).toBeNull();
  });
});

describe("parseCharacteristicItem", () => {
  it("parses a true Characteristic and rejects everything else", () => {
    expect(parseCharacteristicItem(characteristic(6))).toEqual({
      pathwayId: PARAGON_PATHWAY_ID,
      sequence: 6,
    });
    expect(parseCharacteristicItem(characteristic(9, "Fool"))).toEqual({
      pathwayId: 1,
      sequence: 9,
    });
    // Wrong category.
    expect(
      parseCharacteristicItem({
        name: "Sequence 6 Paragon Beyonder Characteristic",
        description: "",
        category: "mundane",
      }),
    ).toBeUndefined();
    // A creature-material main ingredient (no "Beyonder Characteristic" form).
    expect(
      parseCharacteristicItem({
        name: "True Root of a Mist Treant",
        description: "",
        category: "main-ingredient",
      }),
    ).toBeUndefined();
    // An unknown pathway name.
    expect(parseCharacteristicItem(characteristic(6, "Nonexistent"))).toBeUndefined();
  });
});

describe("craftFee", () => {
  it("commission costs more than self-craft, both grade-scaled", () => {
    expect(craftFee("self", 2)).toBe(SELF_CRAFT_MATERIALS_COST_BY_GRADE[2]);
    expect(craftFee("commission", 2)).toBe(COMMISSION_FEE_BY_GRADE[2]);
    expect(craftFee("commission", 0)).toBeGreaterThan(craftFee("self", 0));
  });
});

describe("craftArtifact", () => {
  it("self-crafts: consumes the Characteristic, debits the fee, mints the relic", () => {
    const char = characteristic(6); // grade 2
    const s = session(PARAGON_PATHWAY_ID, 6, [char], 100_000);
    const result = craftArtifact(
      s,
      { characteristicItemName: char.name, mode: "self", name: "Maker's Mask" },
      123,
    );
    expect(result.outcome).toBe("crafted");
    expect(result.item?.name).toBe("Sealed Artifact C2-001 — Maker's Mask");
    expect(result.fee).toBe(SELF_CRAFT_MATERIALS_COST_BY_GRADE[2]);
    const next = result.session!;
    // Characteristic consumed, minted artifact present.
    expect(next.gameState.inventory.some((i) => i.name === char.name)).toBe(false);
    expect(next.gameState.inventory.some((i) => i.name === result.item!.name)).toBe(true);
    // Funds debited.
    expect(getFunds(next.gameState)).toBe(
      100_000 - SELF_CRAFT_MATERIALS_COST_BY_GRADE[2],
    );
    // Registry + memory fact.
    expect(next.customArtifactState?.artifacts).toHaveLength(1);
    expect(next.memory.sessionFacts.at(-1)?.description).toContain("Maker's Mask");
    expect(next.updatedAt).toBe(123);
  });

  it("commissions for a non-Paragon at the commission fee", () => {
    const char = characteristic(9, "Fool"); // grade 3
    const s = session(1, 9, [char], 100_000);
    const result = craftArtifact(s, {
      characteristicItemName: char.name,
      mode: "commission",
      name: "Foolish Charm",
    });
    expect(result.outcome).toBe("crafted");
    expect(result.fee).toBe(COMMISSION_FEE_BY_GRADE[3]);
  });

  it("refuses self-craft without the Paragon capability", () => {
    const char = characteristic(6, "Fool");
    const s = session(1, 6, [char]);
    expect(
      craftArtifact(s, { characteristicItemName: char.name, mode: "self", name: "X" })
        .outcome,
    ).toBe("no-capability");
  });

  it("refuses a missing or unfusable characteristic", () => {
    const s = session(PARAGON_PATHWAY_ID, 6, []);
    expect(
      craftArtifact(s, { characteristicItemName: "nope", mode: "self", name: "X" })
        .outcome,
    ).toBe("missing-characteristic");
    const beast: Item = {
      name: "Fire Salamander gland",
      description: "",
      category: "main-ingredient",
    };
    const s2 = session(PARAGON_PATHWAY_ID, 6, [beast]);
    expect(
      craftArtifact(s2, {
        characteristicItemName: beast.name,
        mode: "self",
        name: "X",
      }).outcome,
    ).toBe("missing-characteristic");
  });

  it("forbids a god-tier (Seq 0) characteristic", () => {
    const char = characteristic(0, "Fool");
    const s = session(1, 1, [char], 100_000);
    expect(
      craftArtifact(s, {
        characteristicItemName: char.name,
        mode: "commission",
        name: "X",
      }).outcome,
    ).toBe("god-tier-forbidden");
  });

  it("rejects a blank name", () => {
    const char = characteristic(6);
    const s = session(PARAGON_PATHWAY_ID, 6, [char], 100_000);
    expect(
      craftArtifact(s, { characteristicItemName: char.name, mode: "self", name: "   " })
        .outcome,
    ).toBe("invalid-name");
  });

  it("refuses when the character cannot afford the fee", () => {
    const char = characteristic(6); // grade 2 → self fee 250
    const s = session(PARAGON_PATHWAY_ID, 6, [char], 10);
    const result = craftArtifact(s, {
      characteristicItemName: char.name,
      mode: "self",
      name: "Too Poor",
    });
    expect(result.outcome).toBe("unaffordable");
    expect(result.fee).toBe(SELF_CRAFT_MATERIALS_COST_BY_GRADE[2]);
  });

  it("refuses at registry capacity without consuming anything", () => {
    const char = characteristic(6);
    const filled: CustomArtifact[] = Array.from(
      { length: MAX_CUSTOM_ARTIFACTS },
      (_, i) => ({
        code: `C2-${String(i).padStart(3, "0")}`,
        name: `Relic ${i}`,
        grade: 2,
        sourcePathwayId: 1,
        sourceSequence: 5,
        effects: [],
        drawback: "x",
        craftedAtTurn: 0,
      }),
    );
    const s: GameSession = {
      ...session(PARAGON_PATHWAY_ID, 6, [char], 100_000),
      customArtifactState: { artifacts: filled, nextOrdinal: MAX_CUSTOM_ARTIFACTS + 1 },
    };
    const result = craftArtifact(s, {
      characteristicItemName: char.name,
      mode: "self",
      name: "Overflow",
    });
    expect(result.outcome).toBe("at-capacity");
    // Nothing consumed.
    expect(result.session).toBeUndefined();
  });
});
