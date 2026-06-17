import { describe, expect, it } from "vitest";
import type { GameState } from "@/lib/ai";
import {
  CITIES,
  canTravelTo,
  cityIdFromLocation,
  getCity,
  travelDays,
  travelTo,
} from "./travel";

function stateAt(location: string): GameState {
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
  };
}

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

  it("ids match the lowercase first word of the display name", () => {
    for (const city of CITIES) {
      expect(city.name.toLowerCase().split(/\s+/)[0]).toBe(city.id);
    }
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
});
