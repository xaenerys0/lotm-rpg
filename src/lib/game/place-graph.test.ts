import { describe, expect, it } from "vitest";
import { isReachable, resolvePlace, sameCity } from "./place-graph";

describe("resolvePlace", () => {
  it("resolves a known city by its leading word", () => {
    const node = resolvePlace("Tingen City", 5);
    expect(node).toEqual({
      id: "tingen",
      kind: "city",
      cityId: "tingen",
      name: "Tingen City",
    });
  });

  it("resolves a farther city", () => {
    const node = resolvePlace("Bayam", 5);
    expect(node?.kind).toBe("city");
    expect(node?.cityId).toBe("bayam");
  });

  it("resolves a Tingen district to a site under the Tingen home city", () => {
    const node = resolvePlace("The Tussock River docks", 5);
    expect(node?.kind).toBe("site");
    expect(node?.cityId).toBe("tingen");
    expect(node?.id).toBe("tussock-river");
  });

  it("defaults an absent epoch to the Fifth and still resolves", () => {
    expect(resolvePlace("Tingen City", undefined)?.cityId).toBe("tingen");
  });

  it("returns null for an unrecognised location", () => {
    expect(resolvePlace("A nameless moor", 5)).toBeNull();
  });

  it("returns null for an empty location", () => {
    expect(resolvePlace("", 5)).toBeNull();
  });

  it("returns null for any non-Fifth epoch (no city graph there)", () => {
    // Even a location that names a Fifth city is provisional in another epoch.
    expect(resolvePlace("Tingen City", 4)).toBeNull();
    expect(resolvePlace("Imperial Trier", 4)).toBeNull();
  });
});

describe("sameCity", () => {
  it("treats a city and a site within it as the same city", () => {
    const city = resolvePlace("Tingen City", 5)!;
    const site = resolvePlace("Iron Cross District", 5)!;
    expect(sameCity(city, site)).toBe(true);
  });

  it("distinguishes two different cities", () => {
    const a = resolvePlace("Tingen City", 5)!;
    const b = resolvePlace("Backlund", 5)!;
    expect(sameCity(a, b)).toBe(false);
  });
});

describe("isReachable", () => {
  it("is provisional (reachable) when either endpoint is unresolved", () => {
    expect(isReachable("A nameless moor", "Bayam", 5)).toEqual({
      reachable: true,
      reason: "provisional",
    });
    expect(isReachable("Bayam", "A nameless moor", 5)).toEqual({
      reachable: true,
      reason: "provisional",
    });
  });

  it("is same-place for an identical resolved node", () => {
    expect(isReachable("Tingen City", "Tingen", 5)).toEqual({
      reachable: true,
      reason: "same-place",
    });
  });

  it("is same-city for a district move within one city", () => {
    expect(isReachable("Iron Cross District", "Khoy University", 5)).toEqual({
      reachable: true,
      reason: "same-city",
    });
  });

  it("is same-city for a city → site move", () => {
    expect(isReachable("Tingen City", "Iron Cross District", 5).reachable).toBe(true);
  });

  it("blocks a cross-city move", () => {
    expect(isReachable("Tingen City", "Bayam", 5)).toEqual({
      reachable: false,
      reason: "cross-city",
    });
  });

  it("never blocks in an earlier epoch (no gating)", () => {
    expect(isReachable("Imperial Trier", "Bayam", 4).reachable).toBe(true);
  });
});
