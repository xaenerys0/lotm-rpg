import { describe, expect, it } from "vitest";
import { getPathway } from "@/lib/rules";
import {
  CANON_PLAYABLE_CHARACTERS,
  getCanonCharacter,
  matchCanonCharacter,
  normalizeCanonName,
} from "./canon-characters";
import { NPC_LORE } from "./npcs";

describe("canon-characters data integrity", () => {
  it("every preset has a unique id and display name", () => {
    const ids = CANON_PLAYABLE_CHARACTERS.map((p) => p.id);
    const names = CANON_PLAYABLE_CHARACTERS.map((p) => p.displayName);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every preset uses a real playable pathway (any of the 22)", () => {
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      expect(preset.pathwayId).toBeGreaterThanOrEqual(1);
      expect(preset.pathwayId).toBeLessThanOrEqual(22);
      expect(getPathway(preset.pathwayId)).toBeDefined();
    }
  });

  it("every preset starts UNDER Sequence 6 (a low Beyonder: 7-9)", () => {
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      expect(preset.startSequence).toBeGreaterThanOrEqual(7);
      expect(preset.startSequence).toBeLessThanOrEqual(9);
    }
  });

  it("every preset carries non-empty aliases, background, location, and a positive canon position", () => {
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      expect(preset.aliases.length).toBeGreaterThan(0);
      expect(preset.aliases.every((a) => a.trim().length > 0)).toBe(true);
      expect(preset.background.trim().length).toBeGreaterThan(0);
      expect(preset.startLocation.trim().length).toBeGreaterThan(0);
      expect(preset.epoch).toBe(5);
      expect(preset.canonPosition).toBeGreaterThanOrEqual(1);
    }
  });

  it("background and openingRecap are distinct durable slots (never duplicated)", () => {
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      if (preset.openingRecap) {
        expect(preset.openingRecap.trim()).not.toBe(preset.background.trim());
      }
    }
  });

  it("each preset id matches an existing canonical NPC lore slug stem", () => {
    const slugs = new Set(NPC_LORE.map((e) => e.slug));
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      expect(slugs.has(`npc-${preset.id}`)).toBe(true);
    }
  });

  it("seeds the documented roster across pathways beyond the original nine", () => {
    const ids = CANON_PLAYABLE_CHARACTERS.map((p) => p.id).sort();
    expect(ids).toEqual(
      [
        "audrey-hall",
        "daly-simone",
        "dunn-smith",
        "isengard-stanton",
        "klein-moretti",
        "leonard-mitchell",
        "old-neil",
      ].sort(),
    );
  });

  it("covers pathways outside the original 1-9 range (Hermit, White Tower)", () => {
    const pathwayIds = new Set(CANON_PLAYABLE_CHARACTERS.map((p) => p.pathwayId));
    expect(pathwayIds.has(18)).toBe(true); // Hermit — Old Neil
    expect(pathwayIds.has(10)).toBe(true); // White Tower — Isengard Stanton
  });
});

describe("normalizeCanonName", () => {
  it("lowercases, collapses whitespace, and trims", () => {
    expect(normalizeCanonName("  Klein   Moretti ")).toBe("klein moretti");
    expect(normalizeCanonName("MR. FOOL")).toBe("mr. fool");
  });
});

describe("matchCanonCharacter", () => {
  it("matches an exact display name on the correct pathway", () => {
    const hit = matchCanonCharacter("Klein Moretti", 1);
    expect(hit?.id).toBe("klein-moretti");
  });

  it("matches an alias", () => {
    expect(matchCanonCharacter("Mr. Fool", 1)?.id).toBe("klein-moretti");
    expect(matchCanonCharacter("Ma'am Daly", 4)?.id).toBe("daly-simone");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(matchCanonCharacter("  klein   MORETTI ", 1)?.id).toBe("klein-moretti");
  });

  it("returns null when the name is right but the pathway is wrong", () => {
    expect(matchCanonCharacter("Klein Moretti", 5)).toBeNull();
  });

  it("returns null for an unknown name", () => {
    expect(matchCanonCharacter("Nobody Atall", 1)).toBeNull();
  });

  it("returns null for a missing or blank name", () => {
    expect(matchCanonCharacter(undefined, 1)).toBeNull();
    expect(matchCanonCharacter("   ", 1)).toBeNull();
  });

  it("disambiguates two characters that share a pathway by name", () => {
    // Leonard and Dunn are both Darkness (id 5) but at different sequences.
    expect(matchCanonCharacter("Leonard Mitchell", 5)?.startSequence).toBe(9);
    expect(matchCanonCharacter("Dunn Smith", 5)?.startSequence).toBe(7);
  });
});

describe("getCanonCharacter", () => {
  it("looks up a preset by id", () => {
    expect(getCanonCharacter("audrey-hall")?.displayName).toBe("Audrey Hall");
  });

  it("returns null for an unknown id", () => {
    expect(getCanonCharacter("not-a-character")).toBeNull();
  });
});
