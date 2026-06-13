import { describe, expect, it } from "vitest";
import {
  ALL_LORE_ENTRIES,
  BACKLUND_LORE,
  BAYAM_LORE,
  cityNarrationDirective,
  DARKNESS_PATHWAY_LORE,
  DEATH_PATHWAY_LORE,
  DOOR_PATHWAY_LORE,
  ERROR_PATHWAY_LORE,
  FIFTH_EPOCH_LORE,
  FOOL_PATHWAY_LORE,
  getLoreByCategory,
  getLoreByCity,
  getLoreByEpoch,
  getLoreByNpc,
  getLoreByPathway,
  getLoreBySequence,
  getLoreBySlug,
  getLoreByTag,
  HANGED_MAN_PATHWAY_LORE,
  WHITE_TOWER_PATHWAY_LORE,
  TWILIGHT_GIANT_PATHWAY_LORE,
  JUSTICIAR_PATHWAY_LORE,
  BLACK_EMPEROR_PATHWAY_LORE,
  RED_PRIEST_PATHWAY_LORE,
  DEMONESS_PATHWAY_LORE,
  MOTHER_PATHWAY_LORE,
  MOON_PATHWAY_LORE,
  HERMIT_PATHWAY_LORE,
  PARAGON_PATHWAY_LORE,
  WHEEL_OF_FORTUNE_PATHWAY_LORE,
  ABYSS_PATHWAY_LORE,
  CHAINED_PATHWAY_LORE,
  NPC_LORE,
  ORGANIZATION_LORE,
  SUN_PATHWAY_LORE,
  TINGEN_LORE,
  TRIER_LORE,
  TYRANT_PATHWAY_LORE,
  VISIONARY_PATHWAY_LORE,
} from "./index";
import type { LoreCategory } from "./types";

describe("Lore data integrity", () => {
  it("has no duplicate slugs", () => {
    const slugs = ALL_LORE_ENTRIES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all entries have non-empty required fields", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(entry.slug).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.content.trim().length).toBeGreaterThan(0);
      expect(entry.tokenCount).toBeGreaterThan(0);
    }
  });

  it("all entries have valid categories", () => {
    const valid: LoreCategory[] = [
      "pathway",
      "npc",
      "location",
      "event",
      "organization",
      "metaphysics",
    ];
    for (const entry of ALL_LORE_ENTRIES) {
      expect(valid).toContain(entry.category);
    }
  });

  it("token counts are within RAG chunk range (100-800)", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(entry.tokenCount).toBeGreaterThanOrEqual(100);
      expect(entry.tokenCount).toBeLessThanOrEqual(800);
    }
  });

  it("slugs are URL-safe", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("arrays default to empty, not undefined", () => {
    for (const entry of ALL_LORE_ENTRIES) {
      expect(Array.isArray(entry.npcs)).toBe(true);
      expect(Array.isArray(entry.sequences)).toBe(true);
      expect(Array.isArray(entry.tags)).toBe(true);
    }
  });

  it("pathway entries have pathway metadata set", () => {
    const pathwayEntries = ALL_LORE_ENTRIES.filter((e) => e.category === "pathway");
    for (const entry of pathwayEntries) {
      expect(entry.pathway).toBeTruthy();
    }
  });
});

describe("Lore content coverage", () => {
  it("has Tingen City location entries", () => {
    expect(TINGEN_LORE.length).toBeGreaterThanOrEqual(5);
    expect(TINGEN_LORE.every((e) => e.category === "location")).toBe(true);
  });

  it("has Backlund, Trier, and Bayam city location sets", () => {
    for (const [lore, city] of [
      [BACKLUND_LORE, "backlund"],
      [TRIER_LORE, "trier"],
      [BAYAM_LORE, "bayam"],
    ] as const) {
      expect(lore.length).toBeGreaterThanOrEqual(5);
      // Every entry carries the city field that selection/narration match on.
      expect(lore.every((e) => e.city === city)).toBe(true);
      // Each set leads with an overview entry.
      expect(lore.some((e) => e.slug === `${city}-city-overview`)).toBe(true);
    }
  });

  it("has Fifth Epoch baseline entries", () => {
    expect(FIFTH_EPOCH_LORE.length).toBeGreaterThanOrEqual(3);
  });

  it("has Nighthawks organization entries", () => {
    const nighthawk = ORGANIZATION_LORE.filter((e) => e.tags.includes("nighthawks"));
    expect(nighthawk.length).toBeGreaterThanOrEqual(2);
  });

  it("has key Tingen NPC entries", () => {
    const names = NPC_LORE.flatMap((e) => e.npcs);
    expect(names).toContain("Dunn Smith");
    expect(names).toContain("Leonard Mitchell");
    expect(names).toContain("Klein Moretti");
    expect(names).toContain("Old Neil");
    expect(names).toContain("Daly Simone");
    expect(names).toContain("Azik Eggers");
  });

  it("covers all 9 pathways (Seq 9-5)", () => {
    for (const lore of [
      FOOL_PATHWAY_LORE,
      VISIONARY_PATHWAY_LORE,
      SUN_PATHWAY_LORE,
      DEATH_PATHWAY_LORE,
      DARKNESS_PATHWAY_LORE,
      TYRANT_PATHWAY_LORE,
      DOOR_PATHWAY_LORE,
      ERROR_PATHWAY_LORE,
      HANGED_MAN_PATHWAY_LORE,
    ]) {
      expect(lore.length).toBeGreaterThanOrEqual(6);
      const seqs = lore.flatMap((e) => e.sequences);
      expect(seqs).toContain(9);
      expect(seqs).toContain(8);
      expect(seqs).toContain(7);
      expect(seqs).toContain(6);
      expect(seqs).toContain(5);
    }
  });

  it("each pathway has an overview entry", () => {
    for (const pathway of [
      "fool",
      "visionary",
      "sun",
      "death",
      "darkness",
      "tyrant",
      "door",
      "error",
      "hanged-man",
    ]) {
      const overview = ALL_LORE_ENTRIES.find(
        (e) => e.slug === `${pathway}-pathway-overview`,
      );
      expect(overview).toBeDefined();
    }
  });
});

describe("Lore query helpers", () => {
  it("getLoreByCategory filters correctly", () => {
    const locations = getLoreByCategory("location");
    expect(locations.length).toBeGreaterThan(0);
    expect(locations.every((e) => e.category === "location")).toBe(true);
  });

  it("getLoreByPathway filters correctly", () => {
    const fool = getLoreByPathway("fool");
    expect(fool.length).toBeGreaterThan(0);
    expect(fool.every((e) => e.pathway === "fool")).toBe(true);
  });

  it("getLoreByCity filters correctly", () => {
    const tingen = getLoreByCity("tingen");
    expect(tingen.length).toBeGreaterThan(0);
    expect(tingen.every((e) => e.city === "tingen")).toBe(true);
  });

  it("getLoreByEpoch filters correctly", () => {
    const epoch5 = getLoreByEpoch(5);
    expect(epoch5.length).toBeGreaterThan(0);
    expect(epoch5.every((e) => e.epoch === 5)).toBe(true);
  });

  it("getLoreBySlug returns unique entry", () => {
    const entry = getLoreBySlug("npc-dunn-smith");
    expect(entry).toBeDefined();
    expect(entry!.title).toContain("Dunn Smith");
  });

  it("getLoreBySlug returns undefined for missing slug", () => {
    expect(getLoreBySlug("nonexistent")).toBeUndefined();
  });

  it("getLoreByTag filters correctly", () => {
    const nighthawk = getLoreByTag("nighthawks");
    expect(nighthawk.length).toBeGreaterThan(0);
    expect(nighthawk.every((e) => e.tags.includes("nighthawks"))).toBe(true);
  });

  it("getLoreByNpc filters correctly", () => {
    const klein = getLoreByNpc("Klein Moretti");
    expect(klein.length).toBeGreaterThan(0);
    expect(klein.every((e) => e.npcs.includes("Klein Moretti"))).toBe(true);
  });

  it("getLoreBySequence filters correctly", () => {
    const seq9 = getLoreBySequence(9);
    expect(seq9.length).toBeGreaterThan(0);
    expect(seq9.every((e) => e.sequences.includes(9))).toBe(true);
  });
});

describe("cityNarrationDirective", () => {
  it("returns a tone sentence for each new city, matching the first word", () => {
    expect(cityNarrationDirective("Backlund")).toContain("capital");
    expect(cityNarrationDirective("Empress Borough, Backlund")).toBeNull();
    expect(cityNarrationDirective("Backlund — East Borough")).toContain("Dust");
    expect(cityNarrationDirective("Trier")).toContain("Intis");
    expect(cityNarrationDirective("Bayam Harbour")).toContain("Archipelago");
  });

  it("returns null for unknown or unmapped locations", () => {
    expect(cityNarrationDirective("Tingen City")).toBeNull();
    expect(cityNarrationDirective("Backwater Village")).toBeNull();
    expect(cityNarrationDirective("")).toBeNull();
    expect(cityNarrationDirective("   ")).toBeNull();
  });

  it("is case-insensitive on the leading word", () => {
    expect(cityNarrationDirective("BAYAM")).toBe(cityNarrationDirective("bayam"));
  });
});

describe("Total lore corpus", () => {
  it("aggregates all sub-collections", () => {
    const expected =
      TINGEN_LORE.length +
      BACKLUND_LORE.length +
      TRIER_LORE.length +
      BAYAM_LORE.length +
      FIFTH_EPOCH_LORE.length +
      ORGANIZATION_LORE.length +
      NPC_LORE.length +
      FOOL_PATHWAY_LORE.length +
      VISIONARY_PATHWAY_LORE.length +
      SUN_PATHWAY_LORE.length +
      DEATH_PATHWAY_LORE.length +
      DARKNESS_PATHWAY_LORE.length +
      TYRANT_PATHWAY_LORE.length +
      DOOR_PATHWAY_LORE.length +
      ERROR_PATHWAY_LORE.length +
      HANGED_MAN_PATHWAY_LORE.length +
      WHITE_TOWER_PATHWAY_LORE.length +
      TWILIGHT_GIANT_PATHWAY_LORE.length +
      JUSTICIAR_PATHWAY_LORE.length +
      BLACK_EMPEROR_PATHWAY_LORE.length +
      RED_PRIEST_PATHWAY_LORE.length +
      DEMONESS_PATHWAY_LORE.length +
      MOTHER_PATHWAY_LORE.length +
      MOON_PATHWAY_LORE.length +
      HERMIT_PATHWAY_LORE.length +
      PARAGON_PATHWAY_LORE.length +
      WHEEL_OF_FORTUNE_PATHWAY_LORE.length +
      ABYSS_PATHWAY_LORE.length +
      CHAINED_PATHWAY_LORE.length;
    expect(ALL_LORE_ENTRIES.length).toBe(expected);
  });

  it("total token count is within expected MVP range", () => {
    const total = ALL_LORE_ENTRIES.reduce((sum, e) => sum + e.tokenCount, 0);
    expect(total).toBeGreaterThan(5000);
    expect(total).toBeLessThan(80000);
  });

  it("every one of the 22 pathways has retrievable overview lore (issue #28)", () => {
    // getLoreByPathway is separator/case-insensitive, so selectCuratedLore
    // resolves a pathway by its rules-engine name (e.g. "Hanged Man" → "hanged
    // man") even though the stored field is hyphenated. These keys mirror the
    // lowercased ALL_PATHWAYS names selectCuratedLore passes.
    const pathwayKeys = [
      "fool",
      "visionary",
      "sun",
      "death",
      "darkness",
      "tyrant",
      "door",
      "error",
      "hanged man",
      "white tower",
      "twilight giant",
      "justiciar",
      "black emperor",
      "red priest",
      "demoness",
      "mother",
      "moon",
      "hermit",
      "paragon",
      "wheel of fortune",
      "abyss",
      "chained",
    ];
    for (const key of pathwayKeys) {
      expect(getLoreByPathway(key).length).toBeGreaterThan(0);
    }
  });
});
