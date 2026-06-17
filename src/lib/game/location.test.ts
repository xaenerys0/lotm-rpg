import { describe, expect, it } from "vitest";

import type { CustomLocation, GameState } from "@/lib/ai";

import {
  customLocationSlug,
  customToDistrict,
  isValidCustomLocationsShape,
  locationLabel,
  mapAtlasFor,
  matchDistrictSlug,
  registerCustomLocation,
  resolveCityId,
  resolveLocation,
  stripCityPrefix,
} from "./location";
import { gazetteerForEpoch } from "@/lib/lore";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    characterId: "char-1",
    pathwayId: 1,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    location: "Tingen City",
    activeQuests: [],
    npcsPresent: [],
    ...overrides,
  };
}

const TINGEN = gazetteerForEpoch(5, "tingen").districts;
const BACKLUND = gazetteerForEpoch(5, "backlund").districts;

describe("matchDistrictSlug", () => {
  it("matches a distinctive keyword", () => {
    expect(matchDistrictSlug("Cathedral of Serenity", TINGEN)).toBe(
      "cathedral-of-serenity",
    );
  });

  it("does NOT pin on a generic keyword alone (the Backlund-chapel bug)", () => {
    // "Old Saint-Sulpice Chapel" only hits the generic "chapel" keyword on the
    // Cathedral of Serenity — it must NOT false-match it.
    expect(matchDistrictSlug("Old Saint-Sulpice Chapel", TINGEN)).toBeNull();
  });

  it("matches a multi-word keyword", () => {
    expect(matchDistrictSlug("the Iron Cross District", TINGEN)).toBe(
      "iron-cross-district",
    );
  });

  it("prefers the most specific (longest) keyword on overlap", () => {
    // "backlund bridge" (15) beats "tussock" (7) and "the bridge" (10).
    expect(matchDistrictSlug("the Backlund Bridge over the Tussock", BACKLUND)).toBe(
      "backlund-bridge",
    );
  });

  it("requires whole-word boundaries (no substring false match)", () => {
    expect(matchDistrictSlug("hillstonshire lane", BACKLUND)).toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(matchDistrictSlug("a quiet nowhere", TINGEN)).toBeNull();
  });
});

describe("customLocationSlug", () => {
  it("slugifies a name with a custom- prefix", () => {
    expect(customLocationSlug("Old Saint-Sulpice Chapel")).toBe(
      "custom-old-saint-sulpice-chapel",
    );
  });

  it("falls back to custom-venue for an unsluggable name", () => {
    expect(customLocationSlug("!!!")).toBe("custom-venue");
  });
});

describe("customToDistrict", () => {
  it("builds a renderable district keyed on the name", () => {
    const district = customToDistrict({
      cityId: "backlund",
      slug: "custom-x",
      name: "The X",
    });
    expect(district.slug).toBe("custom-x");
    expect(district.name).toBe("The X");
    expect(district.keywords).toEqual(["the x"]);
    expect(district.blurb.length).toBeGreaterThan(0);
  });
});

describe("stripCityPrefix", () => {
  it("strips a leading city display name and separator", () => {
    expect(stripCityPrefix("Backlund — Old Saint-Sulpice Chapel", "backlund")).toBe(
      "Old Saint-Sulpice Chapel",
    );
  });

  it("strips a multi-word city name", () => {
    expect(stripCityPrefix("Pritz Harbor — The Dry-Docks", "pritz")).toBe(
      "The Dry-Docks",
    );
  });

  it("returns the input unchanged when it does not start with the city", () => {
    expect(stripCityPrefix("Old Saint-Sulpice Chapel", "backlund")).toBe(
      "Old Saint-Sulpice Chapel",
    );
  });

  it("falls back to the full string when stripping leaves nothing", () => {
    expect(stripCityPrefix("Backlund", "backlund")).toBe("Backlund");
  });

  it("returns the trimmed string for an unknown city id", () => {
    expect(stripCityPrefix("  somewhere  ", "not-a-city")).toBe("somewhere");
  });
});

describe("resolveCityId", () => {
  it("prefers a valid tracked currentCity", () => {
    expect(
      resolveCityId(makeState({ currentCity: "backlund", location: "the docks" })),
    ).toBe("backlund");
  });

  it("falls back to the location leading word when currentCity is invalid", () => {
    expect(
      resolveCityId(makeState({ currentCity: "atlantis", location: "Bayam harbour" })),
    ).toBe("bayam");
  });

  it("returns null when neither resolves", () => {
    expect(
      resolveCityId(makeState({ currentCity: undefined, location: "a nameless alley" })),
    ).toBeNull();
  });
});

describe("resolveLocation", () => {
  it("resolves a known Fifth city with a district match", () => {
    const r = resolveLocation(
      makeState({ currentCity: "backlund", location: "Backlund — Hillston Borough" }),
      5,
    );
    expect(r.cityId).toBe("backlund");
    expect(r.cityName).toBe("Backlund");
    expect(r.place).toBe("Hillston Borough");
    expect(r.cityUnknown).toBe(false);
    expect(r.districtSlug).toBe("backlund-hillston-borough");
  });

  it("matches a registered custom venue within the city", () => {
    const custom: CustomLocation = {
      cityId: "backlund",
      slug: "custom-old-saint-sulpice-chapel",
      name: "Old Saint-Sulpice Chapel",
    };
    const r = resolveLocation(
      makeState({
        currentCity: "backlund",
        location: "Backlund — Old Saint-Sulpice Chapel",
        customLocations: [custom],
      }),
      5,
    );
    expect(r.districtSlug).toBe("custom-old-saint-sulpice-chapel");
  });

  it("flags the city as unknown when it cannot be resolved", () => {
    const r = resolveLocation(
      makeState({ currentCity: undefined, location: "a nameless alley" }),
      5,
    );
    expect(r.cityUnknown).toBe(true);
    expect(r.cityId).toBeNull();
    expect(r.districtSlug).toBeNull();
  });

  it("matches an earlier-epoch region directly (no city model)", () => {
    const r = resolveLocation(makeState({ location: "The Firelit Camp" }), 1);
    expect(r.cityId).toBeNull();
    expect(r.cityUnknown).toBe(false);
    expect(r.districtSlug).toBe("first-firelit-camp");
  });
});

describe("mapAtlasFor", () => {
  it("returns the era atlas for an earlier epoch", () => {
    const { atlas } = mapAtlasFor(makeState({ location: "The Firelit Camp" }), 1);
    expect(atlas.travelEnabled).toBe(false);
    expect(atlas.districts.length).toBeGreaterThan(0);
  });

  it("returns the uncertain atlas when the Fifth city is unknown", () => {
    const { atlas, resolved } = mapAtlasFor(
      makeState({ currentCity: undefined, location: "a nameless alley" }),
      5,
    );
    expect(resolved.cityUnknown).toBe(true);
    expect(atlas.districts).toEqual([]);
    expect(atlas.travelEnabled).toBe(true);
    expect(atlas.fartherCities.length).toBeGreaterThan(0);
  });

  it("merges custom venues into the resolved city's districts", () => {
    const custom: CustomLocation = {
      cityId: "backlund",
      slug: "custom-old-saint-sulpice-chapel",
      name: "Old Saint-Sulpice Chapel",
    };
    const { atlas } = mapAtlasFor(
      makeState({
        currentCity: "backlund",
        location: "Backlund — Old Saint-Sulpice Chapel",
        customLocations: [custom],
      }),
      5,
    );
    expect(atlas.districts.some((d) => d.slug === custom.slug)).toBe(true);
    // The Backlund custom venue must NOT leak into another city's atlas.
    const other = mapAtlasFor(
      makeState({
        currentCity: "tingen",
        location: "Tingen City",
        customLocations: [custom],
      }),
      5,
    );
    expect(other.atlas.districts.some((d) => d.slug === custom.slug)).toBe(false);
  });
});

describe("locationLabel", () => {
  it("joins city and place", () => {
    const r = resolveLocation(
      makeState({ currentCity: "backlund", location: "Backlund — Hillston Borough" }),
      5,
    );
    expect(locationLabel(r)).toBe("Backlund — Hillston Borough");
  });

  it("returns the bare venue when the city is unknown", () => {
    const r = resolveLocation(
      makeState({ currentCity: undefined, location: "a nameless alley" }),
      5,
    );
    expect(locationLabel(r)).toBe("a nameless alley");
  });

  it("does not duplicate the city when the place already names it", () => {
    // place "Backlund" already contains the city name → fall back to the venue.
    const r = resolveLocation(makeState({ location: "Backlund" }), 5);
    expect(locationLabel(r)).toBe("Backlund");
  });
});

describe("registerCustomLocation", () => {
  it("files an unknown venue under the resolved city", () => {
    const next = registerCustomLocation(
      makeState({
        currentCity: "backlund",
        location: "Backlund — Old Saint-Sulpice Chapel",
      }),
      5,
    );
    expect(next.customLocations).toEqual([
      {
        cityId: "backlund",
        slug: "custom-old-saint-sulpice-chapel",
        name: "Old Saint-Sulpice Chapel",
      },
    ]);
  });

  it("is a no-op outside the Fifth Epoch", () => {
    const state = makeState({ currentCity: "backlund", location: "Somewhere new" });
    expect(registerCustomLocation(state, 1)).toBe(state);
  });

  it("is a no-op when the city cannot be resolved", () => {
    const state = makeState({ currentCity: undefined, location: "a nameless alley" });
    expect(registerCustomLocation(state, 5)).toBe(state);
  });

  it("is a no-op for a known district", () => {
    const state = makeState({
      currentCity: "backlund",
      location: "Backlund — Hillston Borough",
    });
    expect(registerCustomLocation(state, 5)).toBe(state);
  });

  it("is a no-op for a bare city name (not a venue)", () => {
    const state = makeState({ currentCity: "backlund", location: "Backlund" });
    expect(registerCustomLocation(state, 5)).toBe(state);
    const display = makeState({ currentCity: "pritz", location: "Pritz Harbor" });
    expect(registerCustomLocation(display, 5)).toBe(display);
  });

  it("does not double-register the same venue", () => {
    const first = registerCustomLocation(
      makeState({
        currentCity: "backlund",
        location: "Backlund — Old Saint-Sulpice Chapel",
      }),
      5,
    );
    const second = registerCustomLocation(first, 5);
    expect(second).toBe(first);
    expect(second.customLocations).toHaveLength(1);
  });

  it("does not re-register when the place matches an existing custom venue's name", () => {
    const seeded = makeState({
      currentCity: "backlund",
      location: "Backlund — Old Saint-Sulpice Chapel, side door",
      customLocations: [
        {
          cityId: "backlund",
          slug: "custom-old-saint-sulpice-chapel",
          name: "Old Saint-Sulpice Chapel",
        },
      ],
    });
    expect(registerCustomLocation(seeded, 5)).toBe(seeded);
  });
});

describe("isValidCustomLocationsShape", () => {
  it("accepts a well-formed array", () => {
    expect(
      isValidCustomLocationsShape([{ cityId: "backlund", slug: "custom-x", name: "X" }]),
    ).toBe(true);
    expect(isValidCustomLocationsShape([])).toBe(true);
  });

  it("rejects non-arrays and malformed entries", () => {
    expect(isValidCustomLocationsShape({})).toBe(false);
    expect(isValidCustomLocationsShape([null])).toBe(false);
    expect(isValidCustomLocationsShape([{ cityId: "", slug: "s", name: "n" }])).toBe(
      false,
    );
    expect(isValidCustomLocationsShape([{ cityId: "c", slug: "s" }])).toBe(false);
    expect(isValidCustomLocationsShape([{ cityId: "c", slug: "s", name: 7 }])).toBe(
      false,
    );
  });
});
