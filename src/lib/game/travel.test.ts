import { describe, expect, it } from "vitest";
import type { AccessFlag, GameState } from "@/lib/ai";
import {
  CITIES,
  CONTINENT_CROSSING_DAYS,
  canTravelTo,
  cityIdFromLocation,
  continentOf,
  crossesContinent,
  getCity,
  grantAccessFlag,
  hasAccessFlag,
  isValidAccessFlagsShape,
  meetsAccessGate,
  reachedDreamWorldGate,
  travelDays,
  travelTo,
} from "./travel";

function stateAt(location: string, overrides: Partial<GameState> = {}): GameState {
  return {
    characterId: "char-1",
    pathwayId: 1,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    location,
    activeQuests: [],
    npcsPresent: ["Old Neil"],
    ...overrides,
  };
}

const PASSAGE: AccessFlag = "dream-world-passage";

describe("CITIES table", () => {
  it("includes Tingen and the three new cities with unique ids", () => {
    const ids = CITIES.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["tingen", "backlund", "trier", "bayam"]));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each city has a name, kingdom, and non-empty blurb", () => {
    for (const city of CITIES) {
      expect(city.name).toBeTruthy();
      expect(city.kingdom).toBeTruthy();
      expect(city.blurb.length).toBeGreaterThan(0);
    }
  });

  it("each city's display name slugs back to its id (cityIdFromLocation round-trip)", () => {
    // The leading-word(s) convention: a city name resolves to its own id —
    // single-word for central cities, hyphenated for the Forsaken-Land ones.
    for (const city of CITIES) {
      expect(cityIdFromLocation(city.name)).toBe(city.id);
    }
  });

  it("adds the access-gated Forsaken-Land cities (issues #130/#133)", () => {
    const forsaken = CITIES.filter((c) => c.continent === "forsaken-land");
    expect(forsaken.map((c) => c.id).sort()).toEqual([
      "giant-kings-court",
      "moon-city",
      "silver-city",
    ]);
    // Each native city is gated behind its OWN awareness flag (per-city, #133);
    // the Court behind the shared dream-world passage.
    expect(getCity("silver-city")!.accessGate?.requiresFlag).toBe("silver-city-passage");
    expect(getCity("moon-city")!.accessGate?.requiresFlag).toBe("moon-city-passage");
    expect(getCity("giant-kings-court")!.accessGate?.requiresFlag).toBe(PASSAGE);
    // The seven existing cities are untouched: central (continent absent).
    const central = CITIES.filter((c) => c.continent === undefined);
    expect(central).toHaveLength(7);
    expect(central.every((c) => c.accessGate === undefined)).toBe(true);
  });
});

describe("continentOf", () => {
  it("defaults an absent continent to central, reads forsaken-land otherwise", () => {
    expect(continentOf(getCity("tingen")!)).toBe("central");
    expect(continentOf(getCity("silver-city")!)).toBe("forsaken-land");
  });
});

describe("getCity", () => {
  it("looks up by id", () => {
    expect(getCity("backlund")?.name).toBe("Backlund");
  });

  it("returns undefined for unknown ids", () => {
    expect(getCity("atlantis")).toBeUndefined();
  });
});

describe("travelDays", () => {
  it("is zero for a city to itself", () => {
    expect(travelDays("trier", "trier")).toBe(0);
  });

  it("is symmetric between two cities", () => {
    expect(travelDays("tingen", "backlund")).toBe(travelDays("backlund", "tingen"));
    expect(travelDays("bayam", "trier")).toBe(travelDays("trier", "bayam"));
  });

  it("returns a positive number for distinct known cities", () => {
    expect(travelDays("tingen", "bayam")).toBeGreaterThan(0);
  });

  it("returns null when either city is unknown", () => {
    expect(travelDays("tingen", "nowhere")).toBeNull();
    expect(travelDays("nowhere", "tingen")).toBeNull();
  });

  it("returns null for a cross-continent pair (issue #130)", () => {
    expect(travelDays("tingen", "silver-city")).toBeNull();
    expect(travelDays("silver-city", "tingen")).toBeNull();
  });

  it("keeps an intra-continent route inside the Forsaken Land", () => {
    expect(travelDays("silver-city", "giant-kings-court")).toBeGreaterThan(0);
    expect(travelDays("silver-city", "giant-kings-court")).toBe(
      travelDays("giant-kings-court", "silver-city"),
    );
  });

  it("is symmetric across every same-continent pair (TRAVEL_DAYS matrix)", () => {
    for (const a of CITIES) {
      for (const b of CITIES) {
        expect(travelDays(a.id, b.id)).toBe(travelDays(b.id, a.id));
      }
    }
  });
});

describe("crossesContinent", () => {
  it("is true only between different continents", () => {
    expect(crossesContinent("tingen", "backlund")).toBe(false);
    expect(crossesContinent("silver-city", "giant-kings-court")).toBe(false);
    expect(crossesContinent("tingen", "silver-city")).toBe(true);
    expect(crossesContinent("silver-city", "tingen")).toBe(true);
  });

  it("is false when either city is unknown", () => {
    expect(crossesContinent("tingen", "nowhere")).toBe(false);
  });
});

describe("cityIdFromLocation", () => {
  it("resolves a city by its leading word, case-insensitively", () => {
    expect(cityIdFromLocation("Backlund")).toBe("backlund");
    expect(cityIdFromLocation("BAYAM Harbour")).toBe("bayam");
    expect(cityIdFromLocation("Trier — Island District")).toBe("trier");
  });

  it("returns undefined for non-city or empty locations", () => {
    expect(cityIdFromLocation("Some Village")).toBeUndefined();
    expect(cityIdFromLocation("")).toBeUndefined();
    expect(cityIdFromLocation("   ")).toBeUndefined();
  });

  it("resolves the multi-word Forsaken-Land ids (issue #130)", () => {
    expect(cityIdFromLocation("Silver City")).toBe("silver-city");
    expect(cityIdFromLocation("Silver City — the lower wards")).toBe("silver-city");
    expect(cityIdFromLocation("Giant King's Court")).toBe("giant-kings-court");
    // A single "Silver …" that is not the city does not false-match.
    expect(cityIdFromLocation("Silver Street")).toBeUndefined();
  });
});

describe("hasAccessFlag / meetsAccessGate (issue #130)", () => {
  it("hasAccessFlag reads the character's flags, defaulting to none", () => {
    expect(hasAccessFlag(stateAt("Tingen City"), PASSAGE)).toBe(false);
    expect(
      hasAccessFlag(stateAt("Tingen City", { accessFlags: [PASSAGE] }), PASSAGE),
    ).toBe(true);
  });

  it("an ungated (central) city is always reachable", () => {
    expect(meetsAccessGate(stateAt("Tingen City"), getCity("backlund")!)).toBe(true);
  });

  it("a flag-gated city is refused without the flag and allowed with it", () => {
    const silver = getCity("silver-city")!;
    // The City of Silver needs its OWN flag (issue #133) — the dream-world
    // passage alone (the Court gate) is not enough.
    expect(meetsAccessGate(stateAt("Tingen City"), silver)).toBe(false);
    expect(
      meetsAccessGate(stateAt("Tingen City", { accessFlags: [PASSAGE] }), silver),
    ).toBe(false);
    expect(
      meetsAccessGate(
        stateAt("Tingen City", { accessFlags: ["silver-city-passage"] }),
        silver,
      ),
    ).toBe(true);
  });

  it("honours a minSequence gate (sequences count down)", () => {
    const gated = {
      id: "x",
      name: "X",
      kingdom: "K",
      blurb: "b",
      accessGate: { minSequence: 5 },
    };
    // Seq 9 is not "high enough" (9 > 5); Seq 4 is (4 <= 5).
    expect(meetsAccessGate(stateAt("X", { sequenceLevel: 9 }), gated)).toBe(false);
    expect(meetsAccessGate(stateAt("X", { sequenceLevel: 5 }), gated)).toBe(true);
    expect(meetsAccessGate(stateAt("X", { sequenceLevel: 4 }), gated)).toBe(true);
  });

  it("requires BOTH a sequence and a flag when the gate has both", () => {
    const gated = {
      id: "x",
      name: "X",
      kingdom: "K",
      blurb: "b",
      accessGate: { minSequence: 5, requiresFlag: PASSAGE },
    };
    expect(meetsAccessGate(stateAt("X", { sequenceLevel: 4 }), gated)).toBe(false);
    expect(
      meetsAccessGate(stateAt("X", { sequenceLevel: 9, accessFlags: [PASSAGE] }), gated),
    ).toBe(false);
    expect(
      meetsAccessGate(stateAt("X", { sequenceLevel: 4, accessFlags: [PASSAGE] }), gated),
    ).toBe(true);
  });
});

describe("isValidAccessFlagsShape (issue #130)", () => {
  it("accepts an array of known flags (incl. empty)", () => {
    expect(isValidAccessFlagsShape([])).toBe(true);
    expect(isValidAccessFlagsShape([PASSAGE])).toBe(true);
  });

  it("rejects a non-array or an unknown flag", () => {
    expect(isValidAccessFlagsShape("dream-world-passage")).toBe(false);
    expect(isValidAccessFlagsShape([PASSAGE, "teleport"])).toBe(false);
    expect(isValidAccessFlagsShape([42])).toBe(false);
    expect(isValidAccessFlagsShape(null)).toBe(false);
  });
});

describe("canTravelTo", () => {
  it("permits travel to a different known city", () => {
    expect(canTravelTo(stateAt("Tingen City"), "backlund")).toBe(true);
  });

  it("rejects travel to the city the character is already in", () => {
    expect(canTravelTo(stateAt("Backlund"), "backlund")).toBe(false);
  });

  it("rejects travel to an unknown destination", () => {
    expect(canTravelTo(stateAt("Tingen City"), "narnia")).toBe(false);
  });

  it("permits travel from an unknown current location to any known city", () => {
    expect(canTravelTo(stateAt("A Lonely Moor"), "trier")).toBe(true);
  });

  it("refuses an access-gated Forsaken city without the flag (issue #130)", () => {
    // No character can reach silver-city / giant-kings-court without the passage.
    expect(canTravelTo(stateAt("Tingen City"), "silver-city")).toBe(false);
    expect(canTravelTo(stateAt("Tingen City"), "giant-kings-court")).toBe(false);
    // Even from an unknown current location the gate still bites.
    expect(canTravelTo(stateAt("A Lonely Moor"), "silver-city")).toBe(false);
  });

  it("routes the continent crossing through the Giant King's Court chokepoint (issue #132)", () => {
    // Holding the passage opens the crossing, but ONLY through the dream
    // threshold at Giant King's Court — never straight to the City of Silver.
    const passenger = stateAt("Tingen City", { accessFlags: [PASSAGE] });
    expect(canTravelTo(passenger, "giant-kings-court")).toBe(true);
    expect(canTravelTo(passenger, "silver-city")).toBe(false);
  });

  it("lets a character at the crossing city reach a known city and the mainland (issues #132/#133)", () => {
    // A Silver native at the Court holds the dream passage AND the Silver flag.
    const atCourt = stateAt("Giant King's Court", {
      accessFlags: [PASSAGE, "silver-city-passage"],
    });
    // Inward to Silver City (their flag) and back out to the mainland (via Court).
    expect(canTravelTo(atCourt, "silver-city")).toBe(true);
    expect(canTravelTo(atCourt, "tingen")).toBe(true);
    // But NOT to Moon City — they hold no Moon flag (mutual unawareness, #133).
    expect(canTravelTo(atCourt, "moon-city")).toBe(false);
  });

  it("routes even a dual-flag holder between Silver and Moon through the Court (issue #133)", () => {
    // A character holding BOTH native flags is on the same continent for both
    // cities, so the cross-continent chokepoint never fires — the intra-Forsaken
    // hub-and-spoke must be enforced separately, or they could jump straight
    // between the two mutually-isolated cities. They cannot: every leg routes
    // through the Giant King's Court.
    const dual = stateAt("Silver City", {
      accessFlags: [PASSAGE, "silver-city-passage", "moon-city-passage"],
    });
    expect(canTravelTo(dual, "moon-city")).toBe(false);
    expect(canTravelTo(dual, "giant-kings-court")).toBe(true);

    const atMoon = stateAt("Moon City", {
      accessFlags: [PASSAGE, "silver-city-passage", "moon-city-passage"],
    });
    expect(canTravelTo(atMoon, "silver-city")).toBe(false);
    expect(canTravelTo(atMoon, "giant-kings-court")).toBe(true);

    // From the Court, both native cities are reachable (it is the hub).
    const atCourt = stateAt("Giant King's Court", {
      accessFlags: [PASSAGE, "silver-city-passage", "moon-city-passage"],
    });
    expect(canTravelTo(atCourt, "silver-city")).toBe(true);
    expect(canTravelTo(atCourt, "moon-city")).toBe(true);
  });

  it("blocks a Silver City character from going straight to the mainland (issue #132)", () => {
    // The reported bug: a Silver City origin character (who HOLDS the passage)
    // could travel direct to the mainland. They must reach the Court first.
    const atSilver = stateAt("Silver City", { accessFlags: [PASSAGE] });
    expect(canTravelTo(atSilver, "tingen")).toBe(false);
    expect(canTravelTo(atSilver, "giant-kings-court")).toBe(true);
  });

  it("blocks a cross-continent jump to Silver City from an unknown origin even with the flag (issue #132)", () => {
    const passenger = stateAt("A Lonely Moor", { accessFlags: [PASSAGE] });
    expect(canTravelTo(passenger, "silver-city")).toBe(false);
    // The crossing city itself remains reachable as the way in.
    expect(canTravelTo(passenger, "giant-kings-court")).toBe(true);
  });

  it("anchors the origin to currentCity when parked at a bare Forsaken district (issue #132)", () => {
    // A character physically in the City of Silver but standing at a district
    // whose name resolves to no city must still be treated as being in Silver
    // City — not as an unknown (central) origin. Otherwise the chokepoint both
    // leaks a straight mainland jump and falsely blocks same-continent travel.
    const inSilver = stateAt("The High Quarter", {
      accessFlags: [PASSAGE, "silver-city-passage"],
      currentCity: "silver-city",
    });
    // Same-continent travel to the Court is allowed; a straight jump out to the
    // mainland is refused (must route through the Court).
    expect(canTravelTo(inSilver, "giant-kings-court")).toBe(true);
    expect(canTravelTo(inSilver, "tingen")).toBe(false);

    // At the crossing city itself (parked at one of its districts) the inward
    // leg to Silver City is reachable — it was wrongly blocked before the
    // currentCity fallback, because the display showed it but travel refused it.
    const atCourt = stateAt("The Broken Colonnades", {
      accessFlags: [PASSAGE, "silver-city-passage"],
      currentCity: "giant-kings-court",
    });
    expect(canTravelTo(atCourt, "silver-city")).toBe(true);
    expect(canTravelTo(atCourt, "tingen")).toBe(true);
  });
});

describe("travelTo", () => {
  it("returns a new state with the destination name and cleared NPCs", () => {
    const before = stateAt("Tingen City");
    const result = travelTo(before, "backlund", 5);
    expect(result).not.toBeNull();
    expect(result!.state.location).toBe("Backlund");
    expect(result!.state.npcsPresent).toEqual([]);
    // Purity: the input is untouched.
    expect(before.location).toBe("Tingen City");
    expect(before.npcsPresent).toEqual(["Old Neil"]);
  });

  it("produces a memory fact naming both endpoints and the duration", () => {
    const result = travelTo(stateAt("Tingen City"), "backlund", 7);
    expect(result!.fact.type).toBe("event");
    expect(result!.fact.turnNumber).toBe(7);
    expect(result!.fact.description).toContain("Tingen City");
    expect(result!.fact.description).toContain("Backlund");
    expect(result!.fact.description).toMatch(/\d+ days?/);
  });

  it("defaults the turn number to zero", () => {
    const result = travelTo(stateAt("Tingen City"), "trier");
    expect(result!.fact.turnNumber).toBe(0);
  });

  it("omits the origin when the current location is not a known city", () => {
    const result = travelTo(stateAt("A Lonely Moor"), "bayam");
    expect(result).not.toBeNull();
    expect(result!.state.location).toBe("Bayam");
    expect(result!.fact.description).toBe("Travelled to Bayam.");
  });

  it("returns null when travel is not permitted", () => {
    expect(travelTo(stateAt("Backlund"), "backlund")).toBeNull();
    expect(travelTo(stateAt("Tingen City"), "narnia")).toBeNull();
  });

  it("tracks the arrival city for the map (issue #101)", () => {
    const result = travelTo(stateAt("Tingen City"), "bayam", 1);
    expect(result!.state.currentCity).toBe("bayam");
  });

  it("carries the roster's followers to the destination (issue #101)", () => {
    const roster = {
      roster: [
        { name: "Old Neil", disposition: "ally" as const, follows: true },
        { name: "A Stranger", disposition: "neutral" as const, follows: false },
      ],
    };
    const result = travelTo(stateAt("Tingen City"), "backlund", 1, roster);
    expect(result!.state.npcsPresent).toEqual(["Old Neil"]);
  });

  it("clears NPCs with the default empty roster (legacy behaviour)", () => {
    const result = travelTo(stateAt("Tingen City"), "backlund", 1);
    expect(result!.state.npcsPresent).toEqual([]);
  });

  it("uses the fixed crossing duration for a cross-continent journey to the chokepoint (issues #130, #132)", () => {
    // The crossing is routed through Giant King's Court; from the mainland that is
    // the only valid cross-continent destination.
    const passenger = stateAt("Tingen City", { accessFlags: [PASSAGE] });
    const result = travelTo(passenger, "giant-kings-court", 2);
    expect(result).not.toBeNull();
    expect(result!.state.location).toBe("Giant King's Court");
    expect(result!.state.currentCity).toBe("giant-kings-court");
    expect(result!.fact.description).toContain(`${CONTINENT_CROSSING_DAYS} day`);
  });

  it("reaches the City of Silver only by way of the Court, with the Silver flag (issues #132/#133)", () => {
    // Direct from the mainland is refused; the within-continent leg from the Court
    // succeeds for a Silver native (who holds the Silver flag).
    const passenger = stateAt("Tingen City", {
      accessFlags: [PASSAGE, "silver-city-passage"],
    });
    expect(travelTo(passenger, "silver-city", 2)).toBeNull();
    const atCourt = stateAt("Giant King's Court", {
      accessFlags: [PASSAGE, "silver-city-passage"],
    });
    const inward = travelTo(atCourt, "silver-city", 3);
    expect(inward).not.toBeNull();
    expect(inward!.state.location).toBe("Silver City");
  });

  it("returns null for a Forsaken destination without the passage flag", () => {
    expect(travelTo(stateAt("Tingen City"), "silver-city", 1)).toBeNull();
  });
});

describe("grantAccessFlag (issue #132)", () => {
  it("adds a capability flag the character lacks", () => {
    const granted = grantAccessFlag(stateAt("Tingen City"), PASSAGE);
    expect(granted.accessFlags).toEqual([PASSAGE]);
  });

  it("is idempotent — returns the same state when already held", () => {
    const held = stateAt("Tingen City", { accessFlags: [PASSAGE] });
    expect(grantAccessFlag(held, PASSAGE)).toBe(held);
  });

  it("preserves existing flags when appending", () => {
    const state = stateAt("Tingen City", { accessFlags: [] });
    expect(grantAccessFlag(state, PASSAGE).accessFlags).toEqual([PASSAGE]);
  });
});

describe("reachedDreamWorldGate (issue #132)", () => {
  it("detects the Dream-World shadow of Giant King's Court", () => {
    expect(
      reachedDreamWorldGate("The Dream World — the shadow of Giant King's Court"),
    ).toBe(true);
    expect(reachedDreamWorldGate("giant king's court, seen in a dream")).toBe(true);
  });

  it("does NOT trigger on the physical Giant King's Court (a gated city)", () => {
    expect(reachedDreamWorldGate("Giant King's Court")).toBe(false);
  });

  it("does not trigger on unrelated locations", () => {
    expect(reachedDreamWorldGate("Tingen City")).toBe(false);
    expect(reachedDreamWorldGate("a dream of home")).toBe(false);
  });
});
