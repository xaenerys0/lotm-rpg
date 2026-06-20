import { describe, it, expect } from "vitest";

import { DEMIGOD_ABILITIES, applyCanonDemigodAbilities } from "./demigod-abilities";
import { getSequence } from "./pathways";

// Pathways 10–22 are the later groups whose demigod rungs (Seq 4–1) carried
// "themed but invented" placeholders before issue #120 overlaid corpus-derived
// abilities from the wiki `<Pathway>/Abilities` pages.
const LATER_PATHWAY_IDS = Array.from({ length: 13 }, (_, i) => i + 10); // 10..22
const DEMIGOD_LEVELS = [4, 3, 2, 1];

describe("DEMIGOD_ABILITIES (corpus-derived overlay, issue #120)", () => {
  it("covers Seq 4–1 of every later pathway (10–22) with non-empty abilities", () => {
    for (const id of LATER_PATHWAY_IDS) {
      const byLevel = DEMIGOD_ABILITIES[id];
      expect(byLevel, `pathway ${id} missing from DEMIGOD_ABILITIES`).toBeDefined();
      for (const level of DEMIGOD_LEVELS) {
        const abilities = byLevel![level];
        expect(abilities, `pathway ${id} Seq ${level} missing`).toBeDefined();
        expect(abilities!.length).toBeGreaterThan(0);
      }
    }
  });

  it("every overlaid ability has a name, a real description, and a valid type", () => {
    for (const byLevel of Object.values(DEMIGOD_ABILITIES)) {
      for (const abilities of Object.values(byLevel)) {
        for (const ability of abilities) {
          expect(ability.name.length).toBeGreaterThan(0);
          expect(ability.description.length).toBeGreaterThan(20);
          expect(["active", "passive"]).toContain(ability.type);
        }
      }
    }
  });

  it("does not touch the original nine pathways", () => {
    for (let id = 1; id <= 9; id++) {
      expect(DEMIGOD_ABILITIES[id]).toBeUndefined();
    }
  });

  it("is actually applied to ALL_PATHWAYS at module load", () => {
    // getSequence reads the overlaid ALL_PATHWAYS — the live demigod abilities
    // must equal the corpus-derived overlay, proving the placeholders are gone.
    for (const id of LATER_PATHWAY_IDS) {
      for (const level of DEMIGOD_LEVELS) {
        const live = getSequence(id, level)!.abilities.map((x) => x.name);
        const overlay = DEMIGOD_ABILITIES[id]![level]!.map((x) => x.name);
        expect(live).toEqual(overlay);
      }
    }
  });

  it("leaves Seq 9–5 (already authored from the novel) untouched by the overlay", () => {
    // The overlay only carries Seq 4–1; higher rungs must not be present.
    for (const byLevel of Object.values(DEMIGOD_ABILITIES)) {
      for (const level of [9, 8, 7, 6, 5]) {
        expect(byLevel[level]).toBeUndefined();
      }
    }
  });

  it("applyCanonDemigodAbilities overlays in place and ignores unknown pathways", () => {
    const fake = [
      {
        id: 10,
        sequences: [
          {
            level: 1,
            abilities: [{ name: "x", description: "y", type: "active" as const }],
          },
        ],
      },
      {
        id: 999, // not in the map — left untouched
        sequences: [
          {
            level: 1,
            abilities: [{ name: "keep", description: "z", type: "active" as const }],
          },
        ],
      },
    ];
    const result = applyCanonDemigodAbilities(fake);
    expect(result).toBe(fake); // same array, mutated in place
    expect(fake[0]!.sequences[0]!.abilities.map((a) => a.name)).toEqual(
      DEMIGOD_ABILITIES[10]![1]!.map((a) => a.name),
    );
    expect(fake[1]!.sequences[0]!.abilities[0]!.name).toBe("keep");
  });
});
