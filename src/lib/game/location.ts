import type { CustomLocation, GameState } from "@/lib/ai";
import {
  DEFAULT_EPOCH_ID,
  gazetteerForEpoch,
  uncertainFifthGazetteer,
  type EpochGazetteer,
  type GazetteerDistrict,
} from "@/lib/lore";

import { cityIdFromLocation, getCity } from "./travel";

// Location resolution (Backlund location sync). ONE pure place that turns a
// character's free-text `location` string + engine-tracked `currentCity` into a
// single answer — which city, which district, is the city even known — so the
// character sheet, the map atlas, and the "you are here" marker can never
// disagree (they each derived this differently before, which is how a Backlund
// chapel showed up on Tingen's map pinned to the Cathedral of Serenity).
//
// Two deliberate hardening choices live here:
//  1. GENERIC keywords (chapel/church/cathedral) never pin a district on their
//     own — they collide across buildings and cities, and that substring match
//     is exactly what pinned "Old Saint-Sulpice Chapel" to the Cathedral of
//     Serenity. A district pins only on a distinctive (or multi-word) keyword,
//     matched at WORD boundaries (no more "...includes('chapel')").
//  2. A narrator-named venue that matches no known district is filed as a
//     `customLocation` under the resolved city, so the map renders and pins it
//     instead of guessing — the dynamic registry the design called for.

/** Single common nouns too generic to pin a district by themselves. */
const GENERIC_KEYWORDS = new Set(["chapel", "church", "cathedral"]);

/** Fifth Epoch is the only era with the per-city atlas / `currentCity` model. */
function isFifthEpoch(epoch: number | undefined): boolean {
  return (epoch ?? DEFAULT_EPOCH_ID) === DEFAULT_EPOCH_ID;
}

/**
 * Whole-word containment: `needle` appears in `haystack` bounded by non-
 * alphanumeric characters (or string edges). Both must be lowercased. Multi-word
 * and hyphenated needles work because only the alphanumeric neighbours of the
 * match's edges are checked.
 */
function containsWord(haystack: string, needle: string): boolean {
  if (needle.length === 0) return false;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    const before = idx === 0 ? "" : haystack[idx - 1];
    const after =
      idx + needle.length >= haystack.length ? "" : haystack[idx + needle.length];
    const boundedBefore = before === "" || !/[a-z0-9]/.test(before);
    const boundedAfter = after === "" || !/[a-z0-9]/.test(after);
    if (boundedBefore && boundedAfter) return true;
    idx = haystack.indexOf(needle, idx + 1);
  }
  return false;
}

/** A keyword counts toward a pin if it is multi-word or not a generic noun. */
function keywordCounts(keyword: string): boolean {
  return keyword.includes(" ") || !GENERIC_KEYWORDS.has(keyword);
}

/**
 * The district a venue string names, by the LONGEST matching distinctive
 * keyword (most specific wins), or `null` when nothing distinctive matches.
 * Pure.
 */
export function matchDistrictSlug(
  venue: string,
  districts: GazetteerDistrict[],
): string | null {
  const lowered = venue.toLowerCase();
  let best: { slug: string; score: number } | null = null;
  for (const district of districts) {
    for (const keyword of district.keywords) {
      const kw = keyword.toLowerCase();
      if (!keywordCounts(kw)) continue;
      if (!containsWord(lowered, kw)) continue;
      if (!best || kw.length > best.score) {
        best = { slug: district.slug, score: kw.length };
      }
    }
  }
  return best ? best.slug : null;
}

/** Slugify a venue name into a stable, unique `custom-…` district slug. */
export function customLocationSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `custom-${base || "venue"}`;
}

/** Turn a stored custom location into a renderable/matchable district. */
export function customToDistrict(custom: CustomLocation): GazetteerDistrict {
  return {
    slug: custom.slug,
    name: custom.name,
    blurb: "Somewhere your chronicle has led you — not marked on any public map.",
    keywords: [custom.name.toLowerCase()],
  };
}

/**
 * Strip a leading city name/id (and its separator) from a location string so a
 * city-prefixed "Backlund — Old Saint-Sulpice Chapel" yields the bare venue
 * "Old Saint-Sulpice Chapel". Returns the trimmed input unchanged when it does
 * not begin with the city. Pure.
 */
export function stripCityPrefix(location: string, cityId: string): string {
  const trimmed = location.trim();
  const city = getCity(cityId);
  const lowered = trimmed.toLowerCase();
  // Try the full display name first ("Tingen City", "Pritz Harbor"), then the
  // bare id word ("tingen"), so the longest legitimate prefix is removed.
  const candidates = [city?.name.toLowerCase(), cityId].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  for (const candidate of candidates.sort((a, b) => b.length - a.length)) {
    if (lowered.startsWith(candidate)) {
      const rest = trimmed.slice(candidate.length).replace(/^[\s,:—–-]+/, "");
      return rest.length > 0 ? rest : trimmed;
    }
  }
  return trimmed;
}

/** Resolve the Fifth-Epoch city id for a state, or `null` when unknown. */
export function resolveCityId(state: GameState): string | null {
  const tracked = state.currentCity;
  if (typeof tracked === "string" && getCity(tracked)) return tracked;
  const fromLocation = cityIdFromLocation(state.location);
  return fromLocation && getCity(fromLocation) ? fromLocation : null;
}

export interface ResolvedLocation {
  /** The raw `location` string, verbatim. */
  venue: string;
  /** The venue with any leading city prefix stripped (for display). */
  place: string;
  /** Resolved city id (Fifth Epoch), or `null` when unknown / earlier epoch. */
  cityId: string | null;
  /** Resolved city display name, or `null`. */
  cityName: string | null;
  /** True only in the Fifth Epoch when the city cannot be resolved. */
  cityUnknown: boolean;
  /** The matched district/region slug to mark "you are here", or `null`. */
  districtSlug: string | null;
}

/**
 * The single source of truth for "where is the character" — used by the
 * character sheet, the map atlas, and the "you are here" marker so they agree.
 * Earlier epochs have no city model (region list matched directly); the Fifth
 * Epoch resolves the city (tracked first, then the location's leading word) and
 * matches the bare venue against that city's districts PLUS its custom venues.
 * Pure.
 */
export function resolveLocation(
  state: GameState,
  epoch: number | undefined,
): ResolvedLocation {
  const venue = state.location;

  if (!isFifthEpoch(epoch)) {
    const era = gazetteerForEpoch(epoch);
    return {
      venue,
      place: venue,
      cityId: null,
      cityName: null,
      cityUnknown: false,
      districtSlug: matchDistrictSlug(venue, era.districts),
    };
  }

  const cityId = resolveCityId(state);
  if (!cityId) {
    return {
      venue,
      place: venue,
      cityId: null,
      cityName: null,
      cityUnknown: true,
      districtSlug: null,
    };
  }

  const place = stripCityPrefix(venue, cityId);
  const districts = districtsForCity(state, epoch, cityId);
  return {
    venue,
    place,
    cityId,
    cityName: getCity(cityId)?.name ?? null,
    cityUnknown: false,
    districtSlug: matchDistrictSlug(place, districts),
  };
}

/** The known districts of a city PLUS the character's custom venues there. */
function districtsForCity(
  state: GameState,
  epoch: number | undefined,
  cityId: string,
): GazetteerDistrict[] {
  const base = gazetteerForEpoch(epoch, cityId).districts;
  const custom = (state.customLocations ?? [])
    .filter((c) => c.cityId === cityId)
    .map(customToDistrict);
  return [...base, ...custom];
}

export interface MapAtlas {
  atlas: EpochGazetteer;
  resolved: ResolvedLocation;
}

/**
 * The atlas the map should render for a character, plus the resolved location.
 * Custom venues are merged into the current city's district list; an unresolved
 * Fifth-Epoch city yields the neutral "whereabouts uncertain" atlas instead of
 * silently defaulting to Tingen. Pure.
 */
export function mapAtlasFor(state: GameState, epoch: number | undefined): MapAtlas {
  const resolved = resolveLocation(state, epoch);

  if (!isFifthEpoch(epoch)) {
    return { atlas: gazetteerForEpoch(epoch), resolved };
  }
  if (resolved.cityUnknown || !resolved.cityId) {
    return { atlas: uncertainFifthGazetteer(), resolved };
  }
  const base = gazetteerForEpoch(epoch, resolved.cityId);
  return {
    atlas: { ...base, districts: districtsForCity(state, epoch, resolved.cityId) },
    resolved,
  };
}

/** A human-readable label uniting city + venue for the sheet/whereabouts line. */
export function locationLabel(resolved: ResolvedLocation): string {
  if (
    resolved.cityName &&
    resolved.place &&
    !resolved.place.includes(resolved.cityName)
  ) {
    return `${resolved.cityName} — ${resolved.place}`;
  }
  return resolved.venue;
}

/**
 * File a narrator-named venue under the resolved city when it matches no known
 * district and is not already recorded (Backlund location sync). Returns the
 * same state when there is nothing to add (earlier epoch, unknown city, a known
 * district, an already-registered venue, or an empty place). Pure.
 */
export function registerCustomLocation(
  state: GameState,
  epoch: number | undefined,
): GameState {
  if (!isFifthEpoch(epoch)) return state;
  const cityId = resolveCityId(state);
  if (!cityId) return state;

  const place = stripCityPrefix(state.location, cityId);
  const placeLower = place.trim().toLowerCase();
  if (placeLower.length === 0) return state;
  // A bare city name ("Backlund", "Tingen City") is not a venue — don't file it.
  if (placeLower === cityId || placeLower === getCity(cityId)?.name.toLowerCase()) {
    return state;
  }

  // Already a known district (or city-bare string that matches one)? Leave it.
  const base = gazetteerForEpoch(epoch, cityId).districts;
  if (matchDistrictSlug(place, base) !== null) return state;

  const existing = state.customLocations ?? [];
  const slug = customLocationSlug(place);
  if (existing.some((c) => c.cityId === cityId && c.slug === slug)) return state;
  // Also skip when the place already matches a registered custom venue's name.
  const customDistricts = existing
    .filter((c) => c.cityId === cityId)
    .map(customToDistrict);
  if (matchDistrictSlug(place, customDistricts) !== null) return state;

  return {
    ...state,
    customLocations: [...existing, { cityId, slug, name: place }],
  };
}

/** Strict shape guard for the persisted `customLocations` array. */
export function isValidCustomLocationsShape(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    const c = entry as Record<string, unknown>;
    return (
      typeof c.cityId === "string" &&
      c.cityId.length > 0 &&
      typeof c.slug === "string" &&
      c.slug.length > 0 &&
      typeof c.name === "string" &&
      c.name.length > 0
    );
  });
}
