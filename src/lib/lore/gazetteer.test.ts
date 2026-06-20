import { describe, expect, it } from "vitest";

import {
  CONTINENT_CROSSING_FLAG,
  GAZETTEER_CROSSING_CITY,
  gazetteerForEpoch,
  uncertainFifthGazetteer,
} from "./gazetteer";
import { DEFAULT_EPOCH_ID, getEpoch } from "./epochs";
import { ACCESS_FLAGS } from "@/lib/ai";
import { CROSSING_CITY, getCity } from "@/lib/game";

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

  it("shows the CURRENT Fifth city's districts and excludes it from travel (issue #101)", () => {
    const bayam = gazetteerForEpoch(5, "bayam");
    expect(bayam.intro).toContain("Bayam");
    expect(bayam.intro).not.toContain("Tingen");
    expect(bayam.districts.every((d) => d.slug.startsWith("bayam-"))).toBe(true);
    expect(bayam.districts.length).toBeGreaterThan(0);
    // You can travel to the other cities, including Tingen, but not to Bayam.
    const ids = bayam.fartherCities.map((c) => c.id);
    expect(ids).toContain("tingen");
    expect(ids).not.toContain("bayam");
  });

  it("gives every known Fifth city its own non-empty district list", () => {
    for (const id of [
      "tingen",
      "backlund",
      "trier",
      "bayam",
      "pritz",
      "enmat",
      "feysac",
    ]) {
      const g = gazetteerForEpoch(5, id);
      expect(g.districts.length).toBeGreaterThan(0);
      expect(g.fartherCities.map((c) => c.id)).not.toContain(id);
    }
  });

  it("falls back to Tingen for an unknown current city", () => {
    expect(gazetteerForEpoch(5, "atlantis")).toEqual(gazetteerForEpoch(5, "tingen"));
  });

  it("ignores the city id in an earlier epoch", () => {
    expect(gazetteerForEpoch(4, "bayam")).toEqual(gazetteerForEpoch(4));
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

  it("offers an uncertain atlas with no districts but full travel", () => {
    const uncertain = uncertainFifthGazetteer();
    expect(uncertain.districts).toEqual([]);
    expect(uncertain.travelEnabled).toBe(true);
    expect(uncertain.intro.toLowerCase()).toContain("uncertain");
    // Every Fifth city is reachable, so setting out re-anchors the player.
    expect(uncertain.fartherCities.map((c) => c.id)).toEqual([
      "tingen",
      "backlund",
      "trier",
      "bayam",
      "pritz",
      "enmat",
      "feysac",
    ]);
  });

  it("hides the Forsaken cities from a central character's travel list (issue #130)", () => {
    // No access flags: silver-city / giant-kings-court never appear from anywhere
    // central, including the default Tingen atlas and every other central city.
    for (const id of [
      "tingen",
      "backlund",
      "trier",
      "bayam",
      "pritz",
      "enmat",
      "feysac",
    ]) {
      const ids = gazetteerForEpoch(5, id).fartherCities.map((c) => c.id);
      expect(ids).not.toContain("silver-city");
      expect(ids).not.toContain("giant-kings-court");
    }
  });

  it("a mainland walker with the flag sees the crossing city as the way in, never Silver City direct (issue #132)", () => {
    const flagged = gazetteerForEpoch(5, "tingen", [CONTINENT_CROSSING_FLAG]);
    const ids = flagged.fartherCities.map((c) => c.id);
    // Giant King's Court (the dream threshold) is the only Forsaken city shown —
    // the crossing is chokepointed there, so the City of Silver is NOT direct.
    expect(ids).toContain("giant-kings-court");
    expect(ids).not.toContain("silver-city");
    // The central cities are still listed too — the flag opens the crossing.
    expect(ids).toContain("backlund");
  });

  it("from the crossing city, a Silver native sees Silver + the mainland, never Moon (issues #132/#133)", () => {
    const ids = gazetteerForEpoch(5, "giant-kings-court", [
      CONTINENT_CROSSING_FLAG,
      "silver-city-passage",
    ]).fartherCities.map((c) => c.id);
    // At the Court the crossing is open both ways for what they're aware of...
    expect(ids).toContain("silver-city");
    expect(ids).toContain("tingen");
    expect(ids).toContain("backlund");
    // ...but never Moon City — they hold no Moon flag (mutual unawareness, #133).
    expect(ids).not.toContain("moon-city");
  });

  it("a new character in the City of Silver sees only Giant King's Court, never the mainland (issue #132)", () => {
    // The reported bug: a Silver City origin character (who HOLDS the passage)
    // saw the whole mainland as travelable. They must reach the Court first.
    const ids = gazetteerForEpoch(5, "silver-city", [
      CONTINENT_CROSSING_FLAG,
    ]).fartherCities.map((c) => c.id);
    expect(ids).toEqual(["giant-kings-court"]);
  });

  it("a Silver native sees only the Court — never Moon City or the mainland (issue #133)", () => {
    const ids = gazetteerForEpoch(5, "silver-city", [
      "silver-city-passage",
      CONTINENT_CROSSING_FLAG,
    ]).fartherCities.map((c) => c.id);
    // The Court (dream passage) shows as the way out; Moon City (no Moon flag)
    // and the mainland (not at the Court) do not.
    expect(ids).toEqual(["giant-kings-court"]);
  });

  it("a Moon native sees only the Court — never the City of Silver (issue #133)", () => {
    const ids = gazetteerForEpoch(5, "moon-city", [
      "moon-city-passage",
      CONTINENT_CROSSING_FLAG,
    ]).fartherCities.map((c) => c.id);
    expect(ids).toEqual(["giant-kings-court"]);
  });

  it("the uncertain atlas never surfaces the Forsaken cities", () => {
    const ids = uncertainFifthGazetteer().fartherCities.map((c) => c.id);
    expect(ids).not.toContain("silver-city");
    expect(ids).not.toContain("giant-kings-court");
  });

  it("the per-city flags reconcile with the canonical ACCESS_FLAGS and city gates (issues #132/#133)", () => {
    // The lore-local literals must match the AI/game source of truth so they can
    // never drift (mirrors the PROLOGUE_AFFINITY_REGIONS reconciliation pattern).
    expect(ACCESS_FLAGS).toContain(CONTINENT_CROSSING_FLAG);
    // Every Forsaken gazetteer city's requiresFlag matches the game-layer
    // City.accessGate.requiresFlag for the same id (silver/moon/court each its own).
    // Hold all three flags so every Forsaken city surfaces in the roster.
    const forsakenGaz = gazetteerForEpoch(5, "tingen", [
      "dream-world-passage",
      "silver-city-passage",
      "moon-city-passage",
    ]).fartherCities.filter((c) => c.continent === "forsaken-land");
    expect(forsakenGaz.length).toBe(3);
    for (const gaz of forsakenGaz) {
      const game = getCity(gaz.id);
      expect(game).toBeDefined();
      expect(gaz.requiresFlag).toBe(game!.accessGate?.requiresFlag);
      expect(ACCESS_FLAGS).toContain(gaz.requiresFlag);
    }
    // The lore-local crossing-city literal must match the game-layer source.
    expect(GAZETTEER_CROSSING_CITY).toBe(CROSSING_CITY);
    expect(getCity(GAZETTEER_CROSSING_CITY)).toBeDefined();
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
