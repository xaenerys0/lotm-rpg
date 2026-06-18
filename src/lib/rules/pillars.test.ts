import { describe, expect, it } from "vitest";

import { getPathway } from "./index";
import {
  getPillar,
  PILLARS,
  pillarForPathway,
  siblingPathwayIds,
  siblingPathwayNames,
  type Pillar,
} from "./pillars";

// ---------------------------------------------------------------------------
// The Pillars — canon data (issue #99 Part B)
// ---------------------------------------------------------------------------

describe("PILLARS", () => {
  it("defines exactly the four Pillars with ids 1-4", () => {
    expect(PILLARS).toHaveLength(4);
    expect(PILLARS.map((p) => p.id)).toEqual([1, 2, 3, 4]);
    const names = PILLARS.map((p) => p.name);
    expect(names).toEqual([
      "Lord of Mysteries",
      "God Almighty",
      "Eternal Darkness",
      "Mother Goddess of Depravity",
    ]);
  });

  it("covers exactly the thirteen god-family pathways, disjointly", () => {
    const all = PILLARS.flatMap((p) => p.pathwayIds);
    // No pathway belongs to two Pillars.
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17,
    ]);
  });

  it("maps each family to the pathways' own canon sefirah", () => {
    // The Pillar mapping must agree with the per-pathway `sefirah`/`group` data
    // (issue #99 Part B leans on that canon family grouping).
    for (const pillar of PILLARS) {
      for (const pathwayId of pillar.pathwayIds) {
        expect(getPathway(pathwayId)?.sefirah, `pathway ${pathwayId}`).toBe(
          pillar.sefirah,
        );
      }
    }
  });

  it("seats the canon families on the right Pillar", () => {
    const find = (name: string): Pillar => PILLARS.find((p) => p.name === name)!;
    expect(find("Lord of Mysteries").pathwayIds).toEqual([1, 7, 8]);
    expect(find("God Almighty").pathwayIds).toEqual([2, 3, 6, 9, 10]);
    expect(find("Eternal Darkness").pathwayIds).toEqual([4, 5, 11]);
    expect(find("Mother Goddess of Depravity").pathwayIds).toEqual([16, 17]);
  });
});

describe("pillarForPathway", () => {
  it("returns the family Pillar for a god-family pathway", () => {
    expect(pillarForPathway(1)?.name).toBe("Lord of Mysteries"); // Fool
    expect(pillarForPathway(10)?.name).toBe("God Almighty"); // White Tower
    expect(pillarForPathway(11)?.name).toBe("Eternal Darkness"); // Twilight Giant
    expect(pillarForPathway(17)?.name).toBe("Mother Goddess of Depravity"); // Moon
  });

  it("returns undefined for the nine pathways that cap at Sequence 0", () => {
    for (const id of [12, 13, 14, 15, 18, 19, 20, 21, 22]) {
      expect(pillarForPathway(id), `pathway ${id}`).toBeUndefined();
    }
  });
});

describe("getPillar", () => {
  it("looks a Pillar up by id", () => {
    expect(getPillar(3)?.name).toBe("Eternal Darkness");
    expect(getPillar(99)).toBeUndefined();
  });
});

describe("siblingPathwayIds / siblingPathwayNames", () => {
  it("returns the family's other pathways (excluding self)", () => {
    expect(siblingPathwayIds(1)).toEqual([7, 8]); // Fool → Door, Error
    expect(siblingPathwayNames(1)).toEqual(["Door", "Error"]);
    expect(siblingPathwayIds(10)).toEqual([2, 3, 6, 9]); // White Tower's God-Almighty siblings
  });

  it("returns nothing for a pathway with no Pillar", () => {
    expect(siblingPathwayIds(20)).toEqual([]);
    expect(siblingPathwayNames(20)).toEqual([]);
  });
});
