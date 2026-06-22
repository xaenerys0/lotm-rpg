import { describe, expect, it } from "vitest";
import { getPathway } from "@/lib/rules";
import {
  CANON_PLAYABLE_CHARACTERS,
  getCanonCharacter,
  matchCanonCharacter,
  matchCanonCharacterByName,
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

  it("uses a dossier-listed name for any preset that HAS a canonical NPC dossier", () => {
    // Not every canon figure has a dedicated `npcs.ts` dossier (Trissy, Xio do
    // not); a dossier is not required for takeover (suppression works by name).
    // But where one exists, the preset's display name must be one it lists.
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      const entry = NPC_LORE.find((e) => e.slug === `npc-${preset.id}`);
      if (!entry) continue;
      expect(entry.npcs).toContain(preset.displayName);
    }
  });

  it("seeds the documented roster across many pathways", () => {
    const ids = CANON_PLAYABLE_CHARACTERS.map((p) => p.id).sort();
    expect(ids).toEqual(
      [
        "audrey-hall",
        "daly-simone",
        "derrick-berg",
        "dunn-smith",
        "emlyn-white",
        "fors-wall",
        "isengard-stanton",
        "klein-moretti",
        "leonard-mitchell",
        "old-neil",
        "trissy",
        "xio-derecha",
      ].sort(),
    );
  });

  it("spans pathways well beyond the original 1-9 range", () => {
    const pathwayIds = new Set(CANON_PLAYABLE_CHARACTERS.map((p) => p.pathwayId));
    // Sun(3), Door(7), White Tower(10), Justiciar(12), Demoness(15), Moon(17),
    // Hermit(18) — none of these are in the original "ids 1-9" assumption.
    for (const id of [3, 7, 10, 12, 15, 17, 18]) {
      expect(pathwayIds.has(id)).toBe(true);
    }
  });

  it("seeds origin access flags for a character native to a sealed continent", () => {
    const derrick = getCanonCharacter("derrick-berg")!;
    expect(derrick.accessFlags).toEqual(["dream-world-passage", "silver-city-passage"]);
    // A mainland figure carries none.
    expect(getCanonCharacter("klein-moretti")!.accessFlags).toBeUndefined();
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
    // Corpus: Leonard introduces himself as "Sequence 8's Midnight Poet";
    // Dunn is a Sequence 7 Nightmare.
    expect(matchCanonCharacter("Leonard Mitchell", 5)?.startSequence).toBe(8);
    expect(matchCanonCharacter("Dunn Smith", 5)?.startSequence).toBe(7);
  });
});

describe("matchCanonCharacterByName (name-only, pre-pathway takeover detection)", () => {
  it("matches a display name regardless of pathway", () => {
    expect(matchCanonCharacterByName("Leonard Mitchell")?.id).toBe("leonard-mitchell");
    expect(matchCanonCharacterByName("Audrey Hall")?.id).toBe("audrey-hall");
  });

  it("matches an alias, case- and whitespace-insensitively", () => {
    expect(matchCanonCharacterByName("  mr.  fool ")?.id).toBe("klein-moretti");
    expect(matchCanonCharacterByName("Tris")?.id).toBe("trissy");
  });

  it("returns null for an unknown, blank, or missing name", () => {
    expect(matchCanonCharacterByName("Nobody Atall")).toBeNull();
    expect(matchCanonCharacterByName("   ")).toBeNull();
    expect(matchCanonCharacterByName(undefined)).toBeNull();
  });
});

describe("becomesOnScreen + personalityTraits (issue follow-up)", () => {
  it("every preset carries a non-empty personality and a boolean becomesOnScreen", () => {
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      expect(typeof preset.becomesOnScreen).toBe("boolean");
      expect(preset.personalityTraits.trim().length).toBeGreaterThan(0);
    }
  });

  it("marks only the corpus-verified become-on-screen figures", () => {
    const onScreen = CANON_PLAYABLE_CHARACTERS.filter((p) => p.becomesOnScreen)
      .map((p) => p.id)
      .sort();
    // Klein (Seer), Audrey (Spectator), Derrick (Bard) drink their first potion
    // on-screen at their introduction; everyone else is already a Beyonder.
    expect(onScreen).toEqual(["audrey-hall", "derrick-berg", "klein-moretti"]);
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
