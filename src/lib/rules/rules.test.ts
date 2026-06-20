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
  DARKNESS_PATHWAY,
  TYRANT_PATHWAY,
  DOOR_PATHWAY,
  ERROR_PATHWAY,
  HANGED_MAN_PATHWAY,
  getPathway,
  getSequence,
  getCumulativeAbilities,
  getCumulativeAbilityGroups,
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
  it("defines all 22 pathways", () => {
    expect(ALL_PATHWAYS).toHaveLength(22);
  });

  it("pathway ids are unique and cover 1..22", () => {
    const ids = ALL_PATHWAYS.map((p) => p.id).sort((a, b) => a - b);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  });

  it("the 13 additional pathways have their canon names and ids (issue #28)", () => {
    const expected: Array<[number, string]> = [
      [10, "White Tower"],
      [11, "Twilight Giant"],
      [12, "Justiciar"],
      [13, "Black Emperor"],
      [14, "Red Priest"],
      [15, "Demoness"],
      [16, "Mother"],
      [17, "Moon"],
      [18, "Hermit"],
      [19, "Paragon"],
      [20, "Wheel of Fortune"],
      [21, "Abyss"],
      [22, "Chained"],
    ];
    for (const [id, name] of expected) {
      expect(ALL_PATHWAYS.find((p) => p.id === id)?.name).toBe(name);
    }
  });

  it.each([
    [FOOL_PATHWAY, "Fool", 1],
    [VISIONARY_PATHWAY, "Visionary", 2],
    [SUN_PATHWAY, "Sun", 3],
    [DEATH_PATHWAY, "Death", 4],
    [DARKNESS_PATHWAY, "Darkness", 5],
    [TYRANT_PATHWAY, "Tyrant", 6],
    [DOOR_PATHWAY, "Door", 7],
    [ERROR_PATHWAY, "Error", 8],
    [HANGED_MAN_PATHWAY, "Hanged Man", 9],
  ])("pathway %s has correct name and id", (pathway, name, id) => {
    expect(pathway.name).toBe(name);
    expect(pathway.id).toBe(id);
  });

  it("every pathway runs the full Seq 9 → 1 (all 22 completed, issue #99)", () => {
    // All twenty-two pathways now carry every rung Seq 9-1. The demigod tiers
    // (Seq 4-1) of the thirteen later pathways were completed in issue #99 Part
    // A: the sequence NAMES are canon (wiki Module:Sequence/standard, reconciled
    // by sequence-names-canon.test.ts); their abilities/acting are provisional.
    for (const pathway of ALL_PATHWAYS) {
      const levels = pathway.sequences.map((s) => s.level).sort((a, b) => b - a);
      expect(levels).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    }
  });

  it("every pathway's sequence names are unique", () => {
    for (const pathway of ALL_PATHWAYS) {
      const names = pathway.sequences.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
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

  // Canon (novel + wiki Module:Sequence/standard): an Advancement Ritual is
  // mandatory only from Sequence 5 onward. Higher rungs (Seq 9-6) carry none.
  it("sequences 5-1 have advancement rituals, sequences 9-6 do not", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        if (seq.level >= 6) {
          expect(seq.advancementRitual).toBeUndefined();
        } else {
          expect(seq.advancementRitual).toBeDefined();
        }
      }
    }
  });

  it("draws Sequence 5 advancement rituals from the canon corpus", () => {
    // The Fool's Sequence 5 (Marionettist) rite is the canonical reference.
    const marionettist = ALL_PATHWAYS.find((p) => p.id === 1)?.sequences.find(
      (s) => s.level === 5,
    );
    expect(marionettist?.advancementRitual?.description).toMatch(/mermaid/i);
  });

  it("classifications scale with sequence: Low (9-8), Mid (7-5), High (4-3), Demigod (2-1)", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        if (seq.level >= 8) {
          expect(seq.classification).toBe("Low");
        } else if (seq.level >= 5) {
          expect(seq.classification).toBe("Mid");
        } else if (seq.level >= 3) {
          expect(seq.classification).toBe("High");
        } else {
          expect(seq.classification).toBe("Demigod");
        }
      }
    }
  });

  it("getPathway returns correct pathway by id", () => {
    expect(getPathway(1)?.name).toBe("Fool");
    expect(getPathway(2)?.name).toBe("Visionary");
    expect(getPathway(3)?.name).toBe("Sun");
    expect(getPathway(4)?.name).toBe("Death");
    expect(getPathway(5)?.name).toBe("Darkness");
    expect(getPathway(6)?.name).toBe("Tyrant");
    expect(getPathway(7)?.name).toBe("Door");
    expect(getPathway(8)?.name).toBe("Error");
    expect(getPathway(9)?.name).toBe("Hanged Man");
    expect(getPathway(999)).toBeUndefined();
  });

  it("getSequence returns correct Sequence 9 name for every pathway", () => {
    expect(getSequence(1, 9)?.name).toBe("Seer");
    expect(getSequence(1, 5)?.name).toBe("Marionettist");
    expect(getSequence(2, 9)?.name).toBe("Spectator");
    expect(getSequence(3, 9)?.name).toBe("Bard");
    expect(getSequence(4, 9)?.name).toBe("Corpse Collector");
    expect(getSequence(5, 9)?.name).toBe("Sleepless");
    expect(getSequence(6, 9)?.name).toBe("Sailor");
    expect(getSequence(7, 9)?.name).toBe("Apprentice");
    expect(getSequence(8, 9)?.name).toBe("Marauder");
    expect(getSequence(9, 9)?.name).toBe("Secrets Suppliant");
    expect(getSequence(1, 0)).toBeUndefined();
  });

  it("canon Sequence 5 names for the new pathways", () => {
    expect(getSequence(5, 5)?.name).toBe("Spirit Warlock");
    expect(getSequence(6, 5)?.name).toBe("Ocean Songster");
    expect(getSequence(7, 5)?.name).toBe("Traveler");
    expect(getSequence(8, 5)?.name).toBe("Dream Stealer");
    expect(getSequence(9, 5)?.name).toBe("Shepherd");
  });

  it("canon Saint (Seq 4) names for every pathway", () => {
    expect(getSequence(1, 4)?.name).toBe("Bizarro Sorcerer");
    expect(getSequence(2, 4)?.name).toBe("Manipulator");
    expect(getSequence(3, 4)?.name).toBe("Unshadowed");
    expect(getSequence(4, 4)?.name).toBe("Undying");
    expect(getSequence(5, 4)?.name).toBe("Nightwatcher");
    expect(getSequence(6, 4)?.name).toBe("Cataclysmic Interrer");
    expect(getSequence(7, 4)?.name).toBe("Secrets Sorcerer");
    expect(getSequence(8, 4)?.name).toBe("Parasite");
    expect(getSequence(9, 4)?.name).toBe("Black Knight");
  });

  it("canon Sequence 3 names for every pathway", () => {
    expect(getSequence(1, 3)?.name).toBe("Scholar of Yore");
    expect(getSequence(2, 3)?.name).toBe("Dream Weaver");
    expect(getSequence(3, 3)?.name).toBe("Justice Mentor");
    expect(getSequence(4, 3)?.name).toBe("Ferryman");
    expect(getSequence(5, 3)?.name).toBe("Horror Bishop");
    expect(getSequence(6, 3)?.name).toBe("Sea King");
    expect(getSequence(7, 3)?.name).toBe("Wanderer");
    expect(getSequence(8, 3)?.name).toBe("Mentor of Deceit");
    expect(getSequence(9, 3)?.name).toBe("Trinity Templar");
  });

  it("canon Sequence 2 names for every pathway", () => {
    expect(getSequence(1, 2)?.name).toBe("Miracle Invoker");
    expect(getSequence(2, 2)?.name).toBe("Discerner");
    expect(getSequence(3, 2)?.name).toBe("Lightseeker");
    expect(getSequence(4, 2)?.name).toBe("Death Consul");
    expect(getSequence(5, 2)?.name).toBe("Servant of Concealment");
    expect(getSequence(6, 2)?.name).toBe("Calamity");
    expect(getSequence(7, 2)?.name).toBe("Planeswalker");
    expect(getSequence(8, 2)?.name).toBe("Trojan Horse of Destiny");
    expect(getSequence(9, 2)?.name).toBe("Profane Presbyter");
  });

  it("canon Angel (Seq 1) names for every pathway", () => {
    expect(getSequence(1, 1)?.name).toBe("Attendant of Mysteries");
    expect(getSequence(2, 1)?.name).toBe("Author");
    expect(getSequence(3, 1)?.name).toBe("White Angel");
    expect(getSequence(4, 1)?.name).toBe("Pale Emperor");
    expect(getSequence(5, 1)?.name).toBe("Knight of Misfortune");
    expect(getSequence(6, 1)?.name).toBe("Thunder God");
    expect(getSequence(7, 1)?.name).toBe("Key of Stars");
    expect(getSequence(8, 1)?.name).toBe("Worm of Time");
    expect(getSequence(9, 1)?.name).toBe("Dark Angel");
  });

  it("each sequence has 1-5 well-formed abilities", () => {
    // The original nine pathways were hand-authored at 2-4 abilities per rung;
    // the corpus-derived demigod overlay for pathways 10-22 (issue #120) follows
    // canon counts instead, which legitimately range from a single defining
    // King-of-Angels authority (e.g. White Tower Seq 1 "Omniscience") up to the
    // five a busy Saint rung carries (Black Emperor Seq 4) — so the bound is
    // widened to the real corpus span and kept tight so a stray sixth trips it.
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        expect(seq.abilities.length).toBeGreaterThanOrEqual(1);
        expect(seq.abilities.length).toBeLessThanOrEqual(5);
        for (const ability of seq.abilities) {
          expect(ability.name.length).toBeGreaterThan(0);
          expect(ability.description.length).toBeGreaterThan(0);
          expect(["active", "passive"]).toContain(ability.type);
        }
      }
    }
  });

  it("each sequence has exactly 3 acting requirements, all non-empty", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        expect(seq.actingRequirements).toHaveLength(3);
        for (const requirement of seq.actingRequirements) {
          expect(requirement.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("each sequence's prerequisites include a formula and a main ingredient", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const seq of pathway.sequences) {
        expect(seq.prerequisiteItems.some((i) => i.category === "potion-formula")).toBe(
          true,
        );
        expect(seq.prerequisiteItems.some((i) => i.category === "main-ingredient")).toBe(
          true,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Cumulative abilities — abilities are retained across every rung climbed,
// with earlier-rung powers enhanced on advancement.
// ---------------------------------------------------------------------------
describe("cumulative abilities", () => {
  it("returns only the current rung's abilities at Sequence 9", () => {
    const seq9 = getSequence(1, 9)!;
    const cumulative = getCumulativeAbilities(1, 9);
    expect(cumulative.map((a) => a.name)).toEqual(seq9.abilities.map((a) => a.name));
    expect(cumulative.every((a) => a.sourceLevel === 9)).toBe(true);
    expect(cumulative.every((a) => a.enhanced === false)).toBe(true);
  });

  it("carries every rung's abilities at a deeper Sequence, current rung first", () => {
    const cumulative = getCumulativeAbilities(1, 7);
    const reachedLevels = [9, 8, 7];
    const expectedCount = reachedLevels.reduce(
      (sum, level) => sum + getSequence(1, level)!.abilities.length,
      0,
    );
    // No duplicate names collapse expected for distinct-named Fool rungs.
    expect(cumulative).toHaveLength(expectedCount);
    // Current rung (7) appears first; the earliest reached (9) last.
    expect(cumulative[0].sourceLevel).toBe(7);
    expect(cumulative[cumulative.length - 1].sourceLevel).toBe(9);
  });

  it("marks abilities from earlier rungs as enhanced, the current rung as not", () => {
    const cumulative = getCumulativeAbilities(1, 7);
    for (const ability of cumulative) {
      expect(ability.enhanced).toBe(ability.sourceLevel > 7);
    }
    expect(cumulative.some((a) => a.enhanced)).toBe(true);
    expect(cumulative.some((a) => !a.enhanced)).toBe(true);
  });

  it("collapses repeated ability names to the current-rung definition", () => {
    const cumulative = getCumulativeAbilities(1, 1);
    const names = cumulative.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("returns nothing for an unknown pathway or unreached level", () => {
    expect(getCumulativeAbilities(999, 9)).toEqual([]);
    expect(getCumulativeAbilities(1, 99)).toEqual([]);
  });

  it("groups cumulative abilities by rung, current first and earlier flagged", () => {
    const groups = getCumulativeAbilityGroups(1, 7);
    expect(groups.map((g) => g.level)).toEqual([7, 8, 9]);
    expect(groups[0].enhanced).toBe(false);
    expect(groups.slice(1).every((g) => g.enhanced)).toBe(true);
    expect(groups[0].name).toBe(getSequence(1, 7)!.name);
    // Each group carries its own rung's abilities verbatim.
    expect(groups[0].abilities).toEqual(getSequence(1, 7)!.abilities);
  });

  it("returns no groups for an unknown pathway", () => {
    expect(getCumulativeAbilityGroups(999, 9)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Pathway groups and neighboring relationships
// ---------------------------------------------------------------------------
describe("pathway groups", () => {
  it("defines nine groups partitioning all 22 pathways", () => {
    expect(Object.keys(PATHWAY_GROUPS)).toHaveLength(9);
    // Every pathway belongs to exactly one group; the groups cover 1..22.
    const allIds = Object.values(PATHWAY_GROUPS)
      .flatMap((g) => g.pathwayIds)
      .sort((a, b) => a - b);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  });

  it("Visionary and Sun share God Almighty group", () => {
    expect(areInSameGroup(2, 3)).toBe(true);
  });

  it("Fool and Visionary are not in the same group", () => {
    expect(areInSameGroup(1, 2)).toBe(false);
  });

  it("getGroupForPathway returns the canon group for every pathway", () => {
    // Lord of the Mysteries (Sefirah Castle): Fool, Door, Error.
    expect(getGroupForPathway(1)?.id).toBe("mysteries");
    expect(getGroupForPathway(7)?.id).toBe("mysteries");
    expect(getGroupForPathway(8)?.id).toBe("mysteries");
    // God Almighty (Chaos Sea): Visionary, Sun, Tyrant, Hanged Man.
    expect(getGroupForPathway(2)?.id).toBe("god-almighty");
    expect(getGroupForPathway(3)?.id).toBe("god-almighty");
    expect(getGroupForPathway(6)?.id).toBe("god-almighty");
    expect(getGroupForPathway(9)?.id).toBe("god-almighty");
    // Eternal Darkness (River of Eternal Darkness): Death, Darkness.
    expect(getGroupForPathway(4)?.id).toBe("eternal-darkness");
    expect(getGroupForPathway(5)?.id).toBe("eternal-darkness");
    expect(getGroupForPathway(999)).toBeUndefined();
  });

  it("every pathway's group matches its membership in PATHWAY_GROUPS", () => {
    for (const pathway of ALL_PATHWAYS) {
      const group = getGroupForPathway(pathway.id);
      expect(group?.id).toBe(pathway.group);
      expect(group?.pathwayIds).toContain(pathway.id);
    }
  });

  it("Visionary and Sun are neighboring pathways", () => {
    expect(areNeighboringPathways(2, 3)).toBe(true);
    expect(areNeighboringPathways(3, 2)).toBe(true);
  });

  it("Fool neighbors Door and Error within the Mysteries group", () => {
    expect(areNeighboringPathways(1, 7)).toBe(true);
    expect(areNeighboringPathways(1, 8)).toBe(true);
    expect(areNeighboringPathways(7, 8)).toBe(true);
  });

  it("Death and Darkness neighbor each other in Eternal Darkness", () => {
    expect(areNeighboringPathways(4, 5)).toBe(true);
    expect(areNeighboringPathways(5, 4)).toBe(true);
  });

  it("neighbor relationships are symmetric", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const neighborId of pathway.neighboringPathways) {
        const neighbor = getPathway(neighborId);
        expect(neighbor).toBeDefined();
        expect(neighbor!.neighboringPathways).toContain(pathway.id);
      }
    }
  });

  it("neighboring pathways always belong to the same group", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (const neighborId of pathway.neighboringPathways) {
        expect(areInSameGroup(pathway.id, neighborId)).toBe(true);
      }
    }
  });

  it("non-neighboring pathways return false", () => {
    expect(areNeighboringPathways(1, 4)).toBe(false);
    expect(areNeighboringPathways(3, 4)).toBe(false);
  });

  it("areNeighboringPathways returns false for unknown pathway", () => {
    expect(areNeighboringPathways(999, 1)).toBe(false);
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
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
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
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validateConservation(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.message.includes("skip"))).toBe(true);
  });

  it("rejects advancement to a higher (weaker) sequence", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 8,
      targetSequence: 9,
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 8, quantity: 1 }],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validateConservation(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.message.includes("must be lower"))).toBe(true);
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
      characterPathwayId: 2,
      characterSequence: 9,
      nearbyCharacteristics: [{ pathwayId: 3, sequenceLevel: 9, quantity: 1 }],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("weak");
    expect(result.attracted).toHaveLength(1);
  });

  it("returns none for unrelated pathway characteristics", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 1,
      characterSequence: 9,
      nearbyCharacteristics: [{ pathwayId: 4, sequenceLevel: 9, quantity: 1 }],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("none");
    expect(result.attracted).toHaveLength(0);
  });

  it("filters mixed characteristics, only attracting same/neighboring", () => {
    const check: ConvergenceCheck = {
      characterPathwayId: 2,
      characterSequence: 9,
      nearbyCharacteristics: [
        { pathwayId: 2, sequenceLevel: 7, quantity: 1 },
        { pathwayId: 3, sequenceLevel: 9, quantity: 1 },
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
        { pathwayId: 4, sequenceLevel: 8, quantity: 1 },
      ],
    };
    const result = validateConvergence(check);
    expect(result.strength).toBe("strong");
    expect(result.attracted).toHaveLength(2);
    expect(result.attracted.map((c) => c.pathwayId).sort()).toEqual([2, 3]);
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
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
      availableItems: makeItems(1, 8),
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(true);
  });

  it("rejects when potion formula is missing", () => {
    const items = makeItems(1, 8).filter((i) => i.category !== "potion-formula");
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
      availableItems: items,
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.message.includes("potion formula"))).toBe(
      true,
    );
  });

  it("rejects when a main ingredient is missing", () => {
    const items = makeItems(1, 8).filter((i) => i.category !== "main-ingredient");
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
      availableItems: items,
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.message.includes("main ingredient"))).toBe(
      true,
    );
  });

  it("rejects when ritual is not completed for sequences that require it", () => {
    // Canon: rituals are mandatory from Sequence 5, so advancing 6 → 5 requires
    // one (advancing to Seq 8 does not).
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 6,
      targetSequence: 5,
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 6, quantity: 1 }],
      availableItems: makeItems(1, 5),
      ritualCompleted: false,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.message.includes("ritual"))).toBe(true);
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
    expect(result.violations.some((v) => v.message.includes("Unknown pathway"))).toBe(
      true,
    );
  });

  it("rejects unknown target sequence for a valid pathway", () => {
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 1,
      // Sequence 0 (True God) is not yet implemented — an unknown target.
      targetSequence: 0,
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 1, quantity: 1 }],
      availableItems: [],
      ritualCompleted: true,
    };
    const result = validatePrerequisites(attempt);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.message.includes("Unknown target sequence")),
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
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
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

  it("accepts advancement when target sequence already exists in the ledger", () => {
    const ledger: WorldCharacteristicLedger = {
      characteristics: [
        { pathwayId: 1, sequenceLevel: 9, quantity: 1 },
        { pathwayId: 1, sequenceLevel: 8, quantity: 1 },
      ],
    };
    const attempt: AdvancementAttempt = {
      characterId: "player-1",
      currentPathwayId: 1,
      currentSequence: 9,
      targetSequence: 8,
      consumedCharacteristics: [{ pathwayId: 1, sequenceLevel: 9, quantity: 1 }],
      availableItems: makeItems(1, 8),
      ritualCompleted: true,
    };
    const result = validateAdvancement(attempt, ledger);
    expect(result.valid).toBe(true);
  });

  it("validates every pathway's Seq 9→8 advancement with correct items", () => {
    for (const pathway of ALL_PATHWAYS) {
      const ledger: WorldCharacteristicLedger = {
        characteristics: [{ pathwayId: pathway.id, sequenceLevel: 9, quantity: 1 }],
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
