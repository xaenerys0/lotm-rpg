import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/rules";

import {
  hasItem,
  hasItemMatching,
  isReagentCategory,
  removeItemsByName,
} from "./inventory";

const formula: Item = {
  name: "Spectator Potion Formula",
  description: "recipe",
  category: "potion-formula",
};
const mundaneSameName: Item = {
  name: "Spectator Potion Formula",
  description: "a worthless scrap that shares the name",
  category: "mundane",
};
const key: Item = { name: "Brass Key", description: "a key", category: "mundane" };

describe("hasItem", () => {
  it("matches by name only", () => {
    expect(hasItem([formula], "Spectator Potion Formula")).toBe(true);
    expect(hasItem([formula], "Something Else")).toBe(false);
  });
});

describe("hasItemMatching", () => {
  it("matches only when BOTH category and name agree", () => {
    expect(hasItemMatching([formula], formula)).toBe(true);
    expect(hasItemMatching([key], key)).toBe(true);
  });

  it("rejects a same-named item of a different category", () => {
    // The crux of issue #90: a mundane item named like a reagent must not count.
    expect(hasItemMatching([mundaneSameName], formula)).toBe(false);
  });

  it("returns false for an empty inventory", () => {
    expect(hasItemMatching([], formula)).toBe(false);
  });
});

describe("isReagentCategory", () => {
  it("is true for the three advancement reagents, false for mundane/uniqueness", () => {
    expect(isReagentCategory("main-ingredient")).toBe(true);
    expect(isReagentCategory("supplementary-ingredient")).toBe(true);
    expect(isReagentCategory("potion-formula")).toBe(true);
    expect(isReagentCategory("mundane")).toBe(false);
    expect(isReagentCategory("uniqueness")).toBe(false);
  });
});

describe("removeItemsByName", () => {
  it("removes one match per entry and ignores unmatched names", () => {
    expect(removeItemsByName([formula, key], [key])).toEqual([formula]);
    expect(removeItemsByName([formula], [key])).toEqual([formula]);
  });
});
