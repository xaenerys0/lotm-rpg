import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/rules";

import {
  hasItem,
  hasItemMatching,
  isReagentCategory,
  isConsumable,
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

  it("is false for a Sealed Artifact — it is church-gated, never a tradable reagent", () => {
    expect(isReagentCategory("sealed-artifact")).toBe(false);
  });
});

describe("isConsumable", () => {
  it("defaults a Sealed Artifact and the Uniqueness to non-consumable (§4.6)", () => {
    expect(
      isConsumable({ name: "Quill", description: "", category: "sealed-artifact" }),
    ).toBe(false);
    expect(
      isConsumable({ name: "Uniqueness", description: "", category: "uniqueness" }),
    ).toBe(false);
  });

  it("defaults reagents and mundane items to consumable", () => {
    expect(isConsumable(formula)).toBe(true);
    expect(isConsumable(key)).toBe(true);
    expect(
      isConsumable({ name: "Toad", description: "", category: "main-ingredient" }),
    ).toBe(true);
  });

  it("honours an explicit consumable override either way", () => {
    expect(
      isConsumable({
        name: "Single-use relic",
        description: "",
        category: "sealed-artifact",
        consumable: true,
      }),
    ).toBe(true);
    expect(
      isConsumable({
        name: "Reusable charm",
        description: "",
        category: "mundane",
        consumable: false,
      }),
    ).toBe(false);
  });
});

describe("removeItemsByName", () => {
  it("removes one match per entry and ignores unmatched names", () => {
    expect(removeItemsByName([formula, key], [key])).toEqual([formula]);
    expect(removeItemsByName([formula], [key])).toEqual([formula]);
  });
});
