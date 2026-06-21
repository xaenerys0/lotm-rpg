import { describe, it, expect } from "vitest";
import { CITIES } from "@/lib/game";
import { REGION_IDENTITIES, regionIdentity } from "./region-registry";

describe("region identity registry", () => {
  it("returns the canonical name + kingdom for a known id", () => {
    expect(regionIdentity("tingen")).toEqual({
      name: "Tingen City",
      kingdom: "Loen Kingdom",
    });
    expect(regionIdentity("feysac").kingdom).toBe("Feysac Empire");
    expect(regionIdentity("silver-city").kingdom).toBe("Forsaken Land of the Gods");
  });

  it("throws on an unknown id (the drift guard a single source of truth provides)", () => {
    expect(() => regionIdentity("atlantis")).toThrow(/Unknown region id/);
  });

  it("has a non-empty name and kingdom for every entry", () => {
    for (const [id, identity] of Object.entries(REGION_IDENTITIES)) {
      expect(identity.name, id).toBeTruthy();
      expect(identity.kingdom, id).toBeTruthy();
    }
  });

  it("is the single source of truth the travel layer's CITIES derive name + kingdom from (issue #85)", () => {
    // Every travel city must resolve in the registry, and its display name +
    // kingdom must MATCH it — so the two surfaces can never drift (the bug that
    // left travel.ts naming the wrong mountain range while the lore was correct).
    for (const city of CITIES) {
      const identity = regionIdentity(city.id);
      expect(city.name, city.id).toBe(identity.name);
      expect(city.kingdom, city.id).toBe(identity.kingdom);
    }
  });
});
