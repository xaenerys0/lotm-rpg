import { describe, expect, it } from "vitest";

import { gazetteerForEpoch } from "./gazetteer";
import { DEFAULT_EPOCH_ID, getEpoch } from "./epochs";

describe("gazetteerForEpoch", () => {
  it("gives the Fifth Epoch the Tingen gazetteer with inter-city travel", () => {
    const fifth = gazetteerForEpoch(5);
    expect(fifth.travelEnabled).toBe(true);
    expect(fifth.intro).toContain("Tingen");
    expect(fifth.districts.some((d) => d.slug === "iron-cross-district")).toBe(true);
    expect(fifth.fartherCities.map((c) => c.id)).toEqual([
      "backlund",
      "trier",
      "bayam",
      "pritz",
      "enmat",
      "feysac",
    ]);
  });

  it("defaults an absent epoch to the Fifth", () => {
    expect(gazetteerForEpoch(undefined)).toEqual(gazetteerForEpoch(DEFAULT_EPOCH_ID));
  });

  it("gives each earlier epoch its own region list and no Fifth-Epoch travel", () => {
    for (const epoch of [1, 2, 3, 4]) {
      const g = gazetteerForEpoch(epoch);
      expect(g.travelEnabled).toBe(false);
      expect(g.fartherCities).toEqual([]);
      expect(g.districts.length).toBeGreaterThan(0);
      // The header names the era, not Tingen.
      expect(g.intro).toContain(getEpoch(epoch).name);
      expect(g.intro).not.toContain("Tingen");
      // No Tingen district leaks into an earlier epoch's atlas.
      expect(g.districts.some((d) => d.slug === "iron-cross-district")).toBe(false);
    }
  });

  it("places the new character's starting region in the atlas", () => {
    // Each earlier epoch's first district carries keywords matching the epoch's
    // prose startingLocation, so the map can pin "You are here".
    for (const epoch of [1, 2, 3, 4]) {
      const g = gazetteerForEpoch(epoch);
      const location = getEpoch(epoch).startingLocation.toLowerCase();
      const matched = g.districts.some((d) =>
        d.keywords.some((k) => location.includes(k)),
      );
      expect(matched).toBe(true);
    }
  });
});
