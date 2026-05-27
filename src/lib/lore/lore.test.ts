import { describe, expect, it } from "vitest";
import {
  ALL_LORE_ENTRIES,
  DEATH_PATHWAY_LORE,
  FIFTH_EPOCH_LORE,
  FOOL_PATHWAY_LORE,
  getLoreByCategory,
  getLoreByCity,
  getLoreByNpc,
  getLoreByPathway,
  getLoreBySequence,
  getLoreBySlug,
  getLoreByTag,
  NPC_LORE,
  ORGANIZATION_LORE,
  SUN_PATHWAY_LORE,
  TINGEN_LORE,
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

  it("covers all 4 MVP pathways (Seq 9-5)", () => {
    for (const lore of [
      FOOL_PATHWAY_LORE,
      VISIONARY_PATHWAY_LORE,
      SUN_PATHWAY_LORE,
      DEATH_PATHWAY_LORE,
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
    for (const pathway of ["fool", "visionary", "sun", "death"]) {
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

describe("Total lore corpus", () => {
  it("aggregates all sub-collections", () => {
    const expected =
      TINGEN_LORE.length +
      FIFTH_EPOCH_LORE.length +
      ORGANIZATION_LORE.length +
      NPC_LORE.length +
      FOOL_PATHWAY_LORE.length +
      VISIONARY_PATHWAY_LORE.length +
      SUN_PATHWAY_LORE.length +
      DEATH_PATHWAY_LORE.length;
    expect(ALL_LORE_ENTRIES.length).toBe(expected);
  });

  it("total token count is within expected MVP range", () => {
    const total = ALL_LORE_ENTRIES.reduce((sum, e) => sum + e.tokenCount, 0);
    expect(total).toBeGreaterThan(5000);
    expect(total).toBeLessThan(80000);
  });
});
