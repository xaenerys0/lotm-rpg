import { describe, expect, it } from "vitest";

import { selectCuratedLore } from "./selection";

describe("selectCuratedLore", () => {
  it("selects pathway lore first, then city lore, deduped by slug", () => {
    const ctx = selectCuratedLore("fool", "Tingen City", 100000);
    expect(ctx.entries.length).toBeGreaterThan(0);
    const slugs = ctx.entries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(ctx.entries.some((e) => e.pathway === "fool")).toBe(true);
    expect(ctx.entries.some((e) => e.city === "tingen")).toBe(true);
    expect(ctx.totalTokens).toBe(ctx.entries.reduce((sum, e) => sum + e.tokenCount, 0));
  });

  it("stops at the first entry that would overflow the budget", () => {
    const unbounded = selectCuratedLore("fool", "Tingen City", 100000);
    const first = unbounded.entries[0];
    const ctx = selectCuratedLore("fool", "Tingen City", first.tokenCount);
    expect(ctx.entries).toEqual([first]);
    expect(ctx.totalTokens).toBe(first.tokenCount);
  });

  it("returns an empty context for an unknown pathway and location", () => {
    const ctx = selectCuratedLore("nonexistent", "Nowhere", 4000);
    expect(ctx.entries).toEqual([]);
    expect(ctx.totalTokens).toBe(0);
  });

  it("matches city lore on the first word of the location", () => {
    const byFullName = selectCuratedLore("nonexistent", "Tingen City", 100000);
    const byFirstWord = selectCuratedLore("nonexistent", "Tingen", 100000);
    expect(byFullName.entries).toEqual(byFirstWord.entries);
  });
});
