import { describe, expect, it } from "vitest";
import { cityForLocation, isReachable } from "./place-graph";

describe("cityForLocation", () => {
  it("resolves a known city by its leading word", () => {
    expect(cityForLocation("Tingen City", 5)).toBe("tingen");
    expect(cityForLocation("Bayam", 5)).toBe("bayam");
    expect(cityForLocation("Backlund Bridge", 5)).toBe("backlund");
  });

  it("defaults an absent epoch to the Fifth", () => {
    expect(cityForLocation("Tingen City", undefined)).toBe("tingen");
  });

  it("returns null for a district/landmark string that names no city", () => {
    expect(cityForLocation("The Tussock River docks", 5)).toBeNull();
    expect(cityForLocation("Hillston Borough", 5)).toBeNull();
    expect(cityForLocation("", 5)).toBeNull();
  });

  it("returns null for any non-Fifth epoch (no city graph there)", () => {
    expect(cityForLocation("Tingen City", 4)).toBeNull();
    expect(cityForLocation("Imperial Trier", 4)).toBeNull();
  });
});

describe("isReachable", () => {
  it("is provisional (reachable) when either endpoint names no city", () => {
    expect(isReachable("The docks", "Bayam", 5)).toEqual({
      reachable: true,
      reason: "provisional",
    });
    expect(isReachable("Bayam", "a back alley", 5)).toEqual({
      reachable: true,
      reason: "provisional",
    });
  });

  it("is same-city for two strings naming the same city", () => {
    expect(isReachable("Tingen City", "Tingen", 5)).toEqual({
      reachable: true,
      reason: "same-city",
    });
  });

  it("allows a within-city move to a district (district names no city)", () => {
    // The within-Bayam move to a Bayam landmark is reachable — the destination
    // names no known city, so it is never mistaken for a cross-city teleport.
    expect(isReachable("Bayam", "the Cathedral of Waves", 5).reachable).toBe(true);
    // The same is true for a Backlund borough that shares a keyword with Tingen.
    expect(isReachable("Backlund", "Hillston Borough", 5).reachable).toBe(true);
  });

  it("blocks a move between two different named cities", () => {
    expect(isReachable("Tingen City", "Bayam", 5)).toEqual({
      reachable: false,
      reason: "cross-city",
    });
    expect(isReachable("Backlund", "Bayam harbor", 5).reachable).toBe(false);
  });

  it("never blocks in an earlier epoch (no gating)", () => {
    expect(isReachable("Imperial Trier", "Bayam", 4).reachable).toBe(true);
  });
});
