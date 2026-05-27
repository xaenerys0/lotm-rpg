import { describe, expect, it } from "vitest";
import type {
  AdvancementAttempt,
  CharacteristicTransfer,
  ConvergenceCheck,
  Item,
  WorldCharacteristicLedger,
} from "@/lib/types/rules";
import {
  ALL_PATHWAYS,
  FOOL_PATHWAY,
  VISIONARY_PATHWAY,
  SUN_PATHWAY,
  DEATH_PATHWAY,
  getPathway,
  getSequence,
  areNeighboringPathways,
} from "./pathways";
import { PATHWAY_GROUPS, getGroupForPathway, areInSameGroup } from "./groups";
import {
  validateIndestructibility,
  validateConservation,
  validateConvergence,
  validatePrerequisites,
  validateCharacteristicTransfer,
} from "./laws";
import { validateAdvancement, validateTransfer } from "./validation";

// ---------------------------------------------------------------------------
// Pathway definitions
// ---------------------------------------------------------------------------
describe("pathway definitions", () => {
  it("defines exactly 4 MVP pathways", () => {
    expect(ALL_PATHWAYS).toHaveLength(4);
  });

  it.each([
    [FOOL_PATHWAY, "Fool", 1],
    [VISIONARY_PATHWAY, "Visionary", 2],
    [SUN_PATHWAY, "Sun", 3],
    [DEATH_PATHWAY, "Death", 4],
  ])("pathway %s has correct name and id", (pathway, name, id) => {
    expect(pathway.name).toBe(name);
    expect(pathway.id).toBe(id);
  });

  it("each pathway has sequences 9 through 5", () => {
    for (const pathway of ALL_PATHWAYS) {
      const levels = pathway.sequences.map((s) => s.level).sort((a, b) => b - a);
      expect(levels).toEqual([9, 8, 7, 6, 5]);
    }
  });

  it("every sequence has at least one ability", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        expect(seq.abilities.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("every sequence has acting requirements", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        expect(seq.actingRequirements.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("every sequence has prerequisite items including a potion formula", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        expect(seq.prerequisiteItems.length).toBeGreaterThanOrEqual(1);
        const formula = seq.prerequisiteItems.find(
          (i) => i.category === "potion-formula",
        );
        expect(formula).toBeDefined();
      }
    }
  });

  it("sequences 8-5 have advancement rituals, sequence 9 does not", () => {
    for (const pathway of ALL_PATHWAYS) {
      const seq9 = pathway.sequences.find((s) => s.level === 9);
      expect(seq9?.advancementRitual).toBeUndefined();

      for (const seq of pathway.sequences) {
        if (seq.level < 9) {
          expect(seq.advancementRitual).toBeDefined();
        }
      }
    }
  });

  it("Seq 9 and 8 are Low classification, Seq 7 is Low, Seq 6 and 5 are Mid", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        if (seq.level >= 7) {
          expect(seq.classification).toBe("Low");
        } else {
          expect(seq.classification).toBe("Mid");
        }
      }
    }
  });

  it("getPathway returns correct pathway by id", () => {
    expect(getPathway(1)?.name).toBe("Fool");
    expect(getPathway(2)?.name).toBe("Visionary");
    expect(getPathway(3)?.name).toBe("Sun");
    expect(getPathway(4)?.name).toBe("Death");
    expect(getPathway(999)).toBeUndefined();
  });

  it("getSequence returns correct sequence", () => {
    expect(getSequence(1, 9)?.name).toBe("Seer");
    expect(getSequence(1, 5)?.name).toBe("Marionettist");
    expect(getSequence(2, 9)?.name).toBe("Spectator");
    expect(getSequence(3, 9)?.name).toBe("Bard");
    expect(getSequence(4, 9)?.name).toBe("Corpse Collector");
    expect(getSequence(1, 4)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Pathway groups and neighboring relationships
// ---------------------------------------------------------------------------
describe("pathway groups", () => {
  it("defines three groups", () => {
    expect(Object.keys(PATHWAY_GROUPS)).toHaveLength(3);
  });

  it("Fool and Visionary share Sefirah Castle group", () => {
    expect(areInSameGroup(1, 2)).toBe(true);
  });

  it("Fool and Sun are not in the same group", () => {
    expect(areInSameGroup(1, 3)).toBe(false);
  });

  it("getGroupForPathway returns correct group", () => {
    expect(getGroupForPathway(1)?.id).toBe("sefirah-castle");
    expect(getGroupForPathway(3)?.id).toBe("pillar-of-light");
    expect(getGroupForPathway(4)?.id).toBe("underworld");
    expect(getGroupForPathway(999)).toBeUndefined();
  });

  it("Fool and Visionary are neighboring pathways", () => {
    expect(areNeighboringPathways(1, 2)).toBe(true);
    expect(areNeighboringPathways(2, 1)).toBe(true);
  });

  it("non-neighboring pathways return false", () => {
    expect(areNeighboringPathways(1, 3)).toBe(false);
    expect(areNeighboringPathways(3, 4)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Indestructibility law
// ---------------------------------------------------------------------------
describe("indestructibility law", () => {
  it("passes when total weight is unchanged", () => {
    const before: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const after: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const result = validateIndestructibility(before, after);
    expect(result.valid).toBe(true);
  });

  it("rejects when characteristics are created (weight increases)", () => {
    const before: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const after: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 2 }],
    };
    const result = validateIndestructibility(before, after);
    expect(result.valid).toBe(false);
    expect(result.violations[0].law).toBe("indestructibility");
    expect(result.violations[0].message).toContain("cannot be created");
  });

  it("rejects when characteristics are destroyed (weight decreases)", () => {
    const before: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 2 }],
    };
    const after: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const result = validateIndestructibility(before, after);
    expect(result.valid).toBe(false);
    expect(result.violations[0].law).toBe("indestructibility");
    expect(result.violations[0].message).toContain("cannot be destroyed");
  });

  it("allows count-neutral transformations (advancement consumes 1, produces 1)", () => {
    const before: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const after: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }],
    };
    const result = validateIndestructibility(before, after);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Characteristic transfer validation
// ---------------------------------------------------------------------------
describe("characteristic transfer", () => {
  it("allows valid transfer", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 3 }],
    };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player-1",
      characteristic: { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      source: "trade",
    };
    const result = validateCharacteristicTransfer(transfer, ledger);
    expect(result.valid).toBe(true);
  });

  it("rejects transfer of more than available", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player-1",
      characteristic: { pathwayId: 1, sequenceLevel: 9, quantity: 5 },
      source: "trade",
    };
    const result = validateCharacteristicTransfer(transfer, ledger);
    expect(result.valid).toBe(false);
    expect(result.violations[0].law).toBe("indestructibility");
  });

  it("rejects transfer of zero quantity", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player-1",
      characteristic: { pathwayId: 1, sequenceLevel: 9, quantity: 0 },
      source: "hunt",
    };
    const result = validateCharacteristicTransfer(transfer, ledger);
    expect(result.valid).toBe(false);
  });

  it("rejects transfer of non-existent characteristic", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [],
    };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player-1",
      characteristic: { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      source: "death-drop",
    };
    const result = validateCharacteristicTransfer(transfer, ledger);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Conservation law
// ---------------------------------------------------------------------------
describe("conservation law", () => {
  it("passes for valid single-step advancement", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validateConservation(attempt);
    expect(result.valid).toBe(true);
  });

  it("rejects advancement that skips a sequence", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 7,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validateConservation(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.message.includes("skip"))).toBe(
      true,
    );
  });

  it("rejects advancement to a higher (weaker) sequence", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 8,
      targetSequence: 9,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
      ],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validateConservation(attempt);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.message.includes("must be lower")),
    ).toBe(true);
  });

  it("rejects advancement without consuming the correct characteristic", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validateConservation(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations[0].message).toContain("consuming");
  });
});

// ---------------------------------------------------------------------------
// Convergence law
// ---------------------------------------------------------------------------
describe("convergence law", () => {
  it("detects strong convergence for same-pathway characteristics", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 1,
      characterSequence: 9,
      nearbyCharacteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("strong");
    expect(result.attracted).toHaveLength(1);
  });

  it("detects weak convergence for neighboring-pathway characteristics", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 1,
      characterSequence: 9,
      nearbyCharacteristics: [{ pathwayId: 2, sequenceLevel: 9, quantity: 1 }],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("weak");
    expect(result.attracted).toHaveLength(1);
  });

  it("returns none for unrelated pathway characteristics", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 1,
      characterSequence: 9,
      nearbyCharacteristics: [{ pathwayId: 3, sequenceLevel: 9, quantity: 1 }],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("none");
    expect(result.attracted).toHaveLength(0);
  });

  it("filters mixed characteristics, only attracting same/neighboring", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 1,
      characterSequence: 9,
      nearbyCharacteristics: [
        { pathwayId: 1, sequenceLevel: 7, quantity: 1 },
        { pathwayId: 2, sequenceLevel: 9, quantity: 1 },
        { pathwayId: 3, sequenceLevel: 9, quantity: 1 },
        { pathwayId: 4, sequenceLevel: 8, quantity: 1 },
      ],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("strong");
    expect(result.attracted).toHaveLength(2);
    expect(result.attracted.map((c) => c.pathwayId).sort()).toEqual([1, 2]);
  });

  it("returns none when there are no nearby characteristics", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 1,
      characterSequence: 9,
      nearbyCharacteristics: [],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("none");
    expect(result.attracted).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Prerequisite validation
// ---------------------------------------------------------------------------
describe("prerequisite validation", () => {
  function makeItems(pathway: number, targetSeq: number): Item[] {
    const seq = getSequence(pathway, targetSeq);
    return seq?.prerequisiteItems ?? [];
  }

  it("passes when all prerequisites are met", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: makeItems(1, 8),
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(true);
  });

  it("rejects when potion formula is missing", () => {
    const items = makeItems(1, 8).filter(
      (i) => i.category !== "potion-formula",
    );
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: items,
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.message.includes("potion formula")),
    ).toBe(true);
  });

  it("rejects when a main ingredient is missing", () => {
    const items = makeItems(1, 8).filter(
      (i) => i.category !== "main-ingredient",
    );
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: items,
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.message.includes("main ingredient")),
    ).toBe(true);
  });

  it("rejects when ritual is not completed for sequences that require it", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: makeItems(1, 8),
      ritualCompleted: false,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.message.includes("ritual")),
    ).toBe(true);
  });

  it("rejects unknown pathway", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 999,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.message.includes("Unknown pathway")),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full validation API (combined)
// ---------------------------------------------------------------------------
describe("validation API", () => {
  function makeItems(pathway: number, targetSeq: number): Item[] {
    const seq = getSequence(pathway, targetSeq);
    return seq?.prerequisiteItems ?? [];
  }

  it("accepts a fully valid advancement", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
    };
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
      ],
      availableItems: makeItems(1, 8),
      ritualCompleted: true,
    };
    const result = validateAdvancement(attempt, ledger);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("rejects advancement that violates multiple laws at once", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [],
    };
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 7,
      consumedCharacteristics: [],
      availableItems: [],
      ritualCompleted: false,
    };
    const result = validateAdvancement(attempt, ledger);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });

  it("validates transfer correctly", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 2, sequenceLevel: 9, quantity: 2 }],
    };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player-1",
      characteristic: { pathwayId: 2, sequenceLevel: 9, quantity: 1 },
      source: "death-drop",
    };
    const result = validateTransfer(transfer, ledger);
    expect(result.valid).toBe(true);
  });

  it("rejects transfer exceeding world supply", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [{ pathwayId: 2, sequenceLevel: 9, quantity: 1 }],
    };
    const transfer: CharacteristicTransfer = {
      toEntityId: "player-1",
      characteristic: { pathwayId: 2, sequenceLevel: 9, quantity: 5 },
      source: "trade",
    };
    const result = validateTransfer(transfer, ledger);
    expect(result.valid).toBe(false);
  });

  it("validates all four pathways' Seq 9→8 advancement with correct items", () => {
    for (const pathway of ALL_PATHWAYS) {
      const ledger: WorldCharacteristicLedger = {
        characteristics: [
          { pathwayId: pathway.id, sequenceLevel: 9, quantity: 1 },
        ],
      };
      const attempt: AdvancementAttempt = {
        characterId: "player-1",
        currentPathwayId: pathway.id,
        currentSequence: 9,
        targetSequence: 8,
        consumedCharacteristics: [
          { pathwayId: pathway.id, sequenceLevel: 9, quantity: 1 },
        ],
        availableItems: makeItems(pathway.id, 8),
        ritualCompleted: true,
      };
      const result = validateAdvancement(attempt, ledger);
      expect(result.valid).toBe(true);
    }
  });
});
