import { describe, expect, it } from "vitest";

import { selectCuratedLore } from "./selection";

describe("selectCuratedLore", () => {
  it("selects pathway lore, the epoch setting, then city lore, deduped by slug", () => {
    const ctx = selectCuratedLore("fool", "Tingen City", 100000);
    expect(ctx.entries.length).toBeGreaterThan(0);
    const slugs = ctx.entries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(ctx.entries.some((e) => e.pathway === "fool")).toBe(true);
    expect(ctx.entries.some((e) => e.city === "tingen")).toBe(true);
    // The Fifth-Epoch world overview (metaphysics) is injected as setting context.
    expect(ctx.entries.some((e) => e.slug === "fifth-epoch-overview")).toBe(true);
    expect(ctx.totalTokens).toBe(ctx.entries.reduce((sum, e) => sum + e.tokenCount, 0));
  });

  it("stops at the first entry that would overflow the budget", () => {
    const unbounded = selectCuratedLore("fool", "Tingen City", 100000);
    const first = unbounded.entries[0];
    const ctx = selectCuratedLore("fool", "Tingen City", first.tokenCount);
    expect(ctx.entries).toEqual([first]);
    expect(ctx.totalTokens).toBe(first.tokenCount);
  });

  it("returns only the epoch setting for an unknown pathway and location", () => {
    const ctx = selectCuratedLore("nonexistent", "Nowhere", 100000);
    // No pathway/city match, but the character's epoch (default Fifth) still
    // carries its world-setting overview entries.
    expect(ctx.entries.length).toBeGreaterThan(0);
    expect(ctx.entries.every((e) => e.epoch === 5 && e.category === "metaphysics")).toBe(
      true,
    );
  });

  it("matches city lore on the first word of the location", () => {
    const byFullName = selectCuratedLore("nonexistent", "Tingen City", 100000);
    const byFirstWord = selectCuratedLore("nonexistent", "Tingen", 100000);
    expect(byFullName.entries).toEqual(byFirstWord.entries);
  });

  it("isolates epochs: a non-Fifth character gets its own setting, never Tingen", () => {
    // Even asked for "fool" + "Tingen City", a First-Epoch character receives
    // neither the Fifth-flavored fool pathway prose nor the Fifth-Epoch city —
    // only First-Epoch lore. (Pathway mechanics reach them via the rules engine.)
    const first = selectCuratedLore("fool", "Tingen City", 100000, 1);
    const slugs = first.entries.map((e) => e.slug);
    expect(slugs).toContain("first-epoch-overview");
    expect(slugs.some((s) => s.startsWith("tingen"))).toBe(false);
    expect(slugs).not.toContain("fifth-epoch-overview");
    expect(slugs.some((s) => s.endsWith("pathway-overview"))).toBe(false);
    // Every selected entry belongs to the First Epoch — no crossover.
    expect(first.entries.every((e) => e.epoch === 1)).toBe(true);
  });

  it("gives each non-Fifth epoch its own setting overview", () => {
    for (const [epoch, slug] of [
      [1, "first-epoch-overview"],
      [2, "second-epoch-overview"],
      [3, "third-epoch-overview"],
      [4, "fourth-epoch-overview"],
    ] as const) {
      const ctx = selectCuratedLore("nonexistent", "Nowhere", 100000, epoch);
      expect(ctx.entries.map((e) => e.slug)).toContain(slug);
    }
  });
});
