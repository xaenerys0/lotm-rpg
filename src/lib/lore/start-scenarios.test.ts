import { describe, it, expect } from "vitest";
import { EPOCHS } from "./epochs";
import {
  START_SCENARIOS,
  startScenariosForEpoch,
  forsakenLandStartsForEpoch,
  startLocationsForEpoch,
  selectStartScenario,
  selectStartScenarioForLocation,
  getStartScenario,
  type StartScenario,
} from "./start-scenarios";

describe("START_SCENARIOS data integrity", () => {
  it("has unique ids", () => {
    const ids = START_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every scenario carries non-empty location, blurb, and opening beat", () => {
    for (const s of START_SCENARIOS) {
      expect(s.location.trim().length).toBeGreaterThan(0);
      expect(s.blurb.trim().length).toBeGreaterThan(0);
      expect(s.openingBeat.trim().length).toBeGreaterThan(0);
    }
  });

  it("opening beats end with the narrator's scene+choices cue", () => {
    for (const s of START_SCENARIOS) {
      expect(s.openingBeat).toContain("Describe the opening scene and give me choices.");
    }
  });

  it("every epoch (1-5) has at least one start scenario", () => {
    for (const e of EPOCHS) {
      const pool = START_SCENARIOS.filter((s) => s.epoch === e.id);
      expect(pool.length).toBeGreaterThan(0);
    }
  });

  it("the Fifth Epoch is the richest pool and spans several locations", () => {
    const fifth = START_SCENARIOS.filter((s) => s.epoch === 5);
    expect(fifth.length).toBeGreaterThan(1);
    const locations = new Set(fifth.map((s) => s.location));
    // Variety along the WHERE axis: more than one distinct starting place.
    expect(locations.size).toBeGreaterThan(1);
    // It no longer always starts in Tingen.
    expect([...locations].some((l) => !l.includes("Tingen"))).toBe(true);
  });

  it("includes farther canon regions beyond the four modeled cities", () => {
    const fifthLocations = START_SCENARIOS.filter((s) => s.epoch === 5).map(
      (s) => s.location,
    );
    expect(fifthLocations).toContain("Pritz Harbor");
    expect(fifthLocations).toContain("Enmat Harbor");
    expect(fifthLocations).toContain("Feysac");
  });

  it("includes the city of Constant as a Fifth-Epoch start (issue #134)", () => {
    const constant = getStartScenario("constant-furnaces");
    expect(constant).toBeDefined();
    expect(constant!.epoch).toBe(5);
    expect(constant!.location).toBe("Constant City");
    expect(constant!.origin).toBeUndefined();
    // It joins the default picker as a distinct starting place.
    expect(startLocationsForEpoch(5).map((o) => o.location)).toContain("Constant City");
  });

  it("earlier epochs derive their start from the epoch definition (no drift)", () => {
    for (const e of EPOCHS) {
      if (e.id === 5) continue;
      const derived = getStartScenario(`epoch-${e.id}-default`);
      expect(derived).toBeDefined();
      expect(derived!.location).toBe(e.startingLocation);
      expect(derived!.openingBeat).toBe(e.openingBeat);
      expect(derived!.blurb).toBe(e.summary);
    }
  });
});

describe("startScenariosForEpoch", () => {
  it("returns only scenarios for the resolved epoch", () => {
    const fifth = startScenariosForEpoch(5);
    expect(fifth.length).toBeGreaterThan(0);
    expect(fifth.every((s) => s.epoch === 5)).toBe(true);

    const first = startScenariosForEpoch(1);
    expect(first.every((s) => s.epoch === 1)).toBe(true);
  });

  it("defaults an absent or unknown epoch to the Fifth", () => {
    expect(startScenariosForEpoch(undefined)).toEqual(startScenariosForEpoch(5));
    expect(startScenariosForEpoch(999)).toEqual(startScenariosForEpoch(5));
  });
});

describe("selectStartScenario", () => {
  it("is deterministic under an injected random source", () => {
    const pool = startScenariosForEpoch(5);
    // random() = 0 → first; a mid value → the matching index.
    expect(selectStartScenario(5, () => 0)).toBe(pool[0]);
    const midIdx = Math.floor(0.5 * pool.length);
    expect(selectStartScenario(5, () => 0.5)).toBe(pool[midIdx]);
  });

  it("clamps the rare random() === 1 case to the last scenario", () => {
    const pool = startScenariosForEpoch(5);
    expect(selectStartScenario(5, () => 1)).toBe(pool[pool.length - 1]);
  });

  it("can reach every scenario in the pool as random spans [0,1)", () => {
    const pool = startScenariosForEpoch(5);
    const reached = new Set<StartScenario>();
    for (let i = 0; i < pool.length; i++) {
      reached.add(selectStartScenario(5, () => i / pool.length));
    }
    expect(reached.size).toBe(pool.length);
  });

  it("always returns a scenario of the requested epoch (default Math.random)", () => {
    for (const e of EPOCHS) {
      const picked = selectStartScenario(e.id);
      expect(picked.epoch).toBe(e.id);
    }
  });

  it("resolves an unknown epoch to a Fifth-Epoch start", () => {
    expect(selectStartScenario(999, () => 0).epoch).toBe(5);
  });
});

describe("startLocationsForEpoch", () => {
  it("collapses scenarios that share a location into one picker option", () => {
    const options = startLocationsForEpoch(5);
    const tingen = options.find((o) => o.location === "Tingen City");
    expect(tingen).toBeDefined();
    // Tingen has several distinct opening scenes.
    expect(tingen!.sceneCount).toBeGreaterThan(1);
    // One option per distinct location (no duplicates).
    expect(new Set(options.map((o) => o.location)).size).toBe(options.length);
  });

  it("unions and sorts the pathway affinities across a location's scenes", () => {
    const options = startLocationsForEpoch(5);
    const trier = options.find((o) => o.location === "Trier");
    expect(trier!.pathwayAffinity).toEqual([2, 3]);
    // A neutral place suits no pathway in particular.
    const tingen = options.find((o) => o.location === "Tingen City");
    expect(tingen!.pathwayAffinity).toEqual([]);
  });

  it("includes the farther canon regions as their own options", () => {
    const locations = startLocationsForEpoch(5).map((o) => o.location);
    expect(locations).toEqual(
      expect.arrayContaining(["Pritz Harbor", "Enmat Harbor", "Feysac"]),
    );
  });
});

describe("selectStartScenarioForLocation", () => {
  it("returns a scenario at the chosen location", () => {
    const picked = selectStartScenarioForLocation(5, "Bayam", () => 0);
    expect(picked.location).toBe("Bayam");
  });

  it("still varies the scene among a location's several openings", () => {
    const reached = new Set<string>();
    // Tingen has multiple scenes; spanning [0,1) should reach more than one.
    for (let i = 0; i < 6; i++) {
      reached.add(selectStartScenarioForLocation(5, "Tingen City", () => i / 6).id);
    }
    expect(reached.size).toBeGreaterThan(1);
  });

  it("falls back to a random epoch start when the location is unknown", () => {
    const picked = selectStartScenarioForLocation(5, "Atlantis", () => 0);
    expect(picked.epoch).toBe(5);
    expect(startScenariosForEpoch(5)).toContain(picked);
  });
});

describe("getStartScenario", () => {
  it("finds a scenario by id", () => {
    expect(getStartScenario("tingen-fog")?.location).toBe("Tingen City");
  });

  it("returns undefined for an unknown id", () => {
    expect(getStartScenario("no-such-start")).toBeUndefined();
  });
});

describe("origin starts (issue #132)", () => {
  it("excludes origin starts from the default pool and picker", () => {
    // No origin scenario leaks into the default epoch pool...
    expect(startScenariosForEpoch(5).every((s) => s.origin === undefined)).toBe(true);
    // ...nor the location picker (so "Silver City" is never an ordinary place).
    expect(startLocationsForEpoch(5).some((o) => o.location === "Silver City")).toBe(
      false,
    );
  });

  it("never lands an origin start via the random draw or location pick", () => {
    // Random draw over the (origin-free) pool can never return an origin start.
    for (let i = 0; i < 50; i++) {
      expect(selectStartScenario(5, () => i / 50).origin).toBeUndefined();
    }
    // Asking for the origin location by name falls back to a central start
    // (the origin pool is excluded from selectStartScenarioForLocation).
    expect(
      selectStartScenarioForLocation(5, "Silver City", () => 0).origin,
    ).toBeUndefined();
  });

  it("surfaces the Forsaken origin start only behind the explicit affordance", () => {
    const origins = forsakenLandStartsForEpoch(5);
    expect(origins.length).toBeGreaterThan(0);
    expect(origins.every((s) => s.origin === "forsaken-land")).toBe(true);
    const silver = origins.find((s) => s.id === "forsaken-city-of-silver");
    expect(silver?.location).toBe("Silver City");
    // Resolvable by id (the picker passes the id through to play-dashboard).
    expect(getStartScenario("forsaken-city-of-silver")?.origin).toBe("forsaken-land");
  });

  it("has no origin starts for epochs without them", () => {
    expect(forsakenLandStartsForEpoch(1)).toEqual([]);
  });
});
