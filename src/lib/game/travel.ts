import type { AccessFlag, Continent, GameState, SessionFact } from "@/lib/ai";
import { isAccessFlag } from "@/lib/ai";
import { regionIdentity } from "@/lib/lore/region-registry";
import {
  emptyTrackedNpcState,
  reassertFollowersAt,
  type TrackedNpcState,
} from "./tracked-npcs";

// Travel mechanics (issue #23). A small pure module describing the cities a
// player can deliberately journey between and the act of doing so. Location is
// on the AI-mutable allowlist (world-state.ts) because the narrator may move
// the character within a scene; travel here is the *deliberate* player path
// between cities — distinct from the narrator nudging the location string.
//
// All functions are pure: `travelTo` returns a NEW GameState plus a memory-fact
// payload for the caller to fold into the session memory. No localStorage, no
// mutation, no clock — the React layer owns persistence and turn numbers.

export interface City {
  /** Stable id; the leading word(s) of the display name slug to it (the lore
   * `city` field and `cityNarrationDirective` keying — single-word for the
   * central cities, hyphenated for the multi-word Forsaken-Land cities). */
  id: string;
  /** Display name and the value written to `GameState.location` on arrival. */
  name: string;
  /** Kingdom / realm the city belongs to. */
  kingdom: string;
  /** One-line public flavour blurb (street-level knowledge only). */
  blurb: string;
  /**
   * The continent the city sits on (world build-out, issue #130). Absent means
   * `central` — the seven existing cities are untouched. A `forsaken-land` city
   * is on the sealed Eastern Continent, reachable only across the continent
   * crossing AND only by a character that meets its `accessGate`.
   */
  continent?: Continent;
  /**
   * An optional access gate (world build-out, issue #130). Absent means freely
   * reachable. `minSequence` is a "high enough Sequence" gate — sequences count
   * DOWN, so the check is `state.sequenceLevel <= minSequence`. `requiresFlag`
   * demands a capability flag be held. Both, when present, must pass.
   */
  accessGate?: { minSequence?: number; requiresFlag?: AccessFlag };
}

export const CITIES: City[] = [
  {
    id: "tingen",
    ...regionIdentity("tingen"),
    blurb:
      "A mid-sized industrial city in the Awwa region, overcast and coal-smoked, where the story begins.",
  },
  {
    id: "backlund",
    ...regionIdentity("backlund"),
    blurb:
      "The capital of the Loen Kingdom — the smog-bound City of Dust, vast and divided by the Tussock River.",
  },
  {
    id: "trier",
    ...regionIdentity("trier"),
    blurb:
      "The sunlit capital of the Intis Republic, a walled city of arts, fashion, and revolutionary politics.",
  },
  {
    id: "bayam",
    ...regionIdentity("bayam"),
    blurb:
      "The colonial port-capital of the Rorsted Archipelago, the salt-and-spice City of Generosity.",
  },
  {
    id: "pritz",
    ...regionIdentity("pritz"),
    blurb:
      "The Loen navy's chief port below the Amantha range — fog, dry-docks, and warships.",
  },
  {
    id: "enmat",
    ...regionIdentity("enmat"),
    blurb: "A small, fog-drowned Loen coastal town of fishing boats and old sea-charms.",
  },
  {
    id: "feysac",
    ...regionIdentity("feysac"),
    blurb:
      "The cold militarist empire of the God of Combat, north beyond the Amantha range.",
  },
  {
    id: "constant",
    ...regionIdentity("constant"),
    blurb:
      "The Wind City — Loen's second city, a coal-and-steel industrial port on the Midseashire coast.",
  },
  // ── Forsaken Land of the Gods — the sealed Eastern Continent (issues #130/#133). ──
  // Hub-and-spoke through Giant King's Court (the Dream-World gate). Each native
  // city sits behind its OWN awareness flag — City of Silver and Moon City were
  // isolated, independent settlements unaware of one another until late in canon —
  // so a native of one is gated from the other (per-city flags, issue #133). The
  // shared `dream-world-passage` only opens the Court gate (the way in/out).
  {
    id: "silver-city",
    ...regionIdentity("silver-city"),
    blurb:
      "The lightless silver capital of the giant-descended, beneath the Forsaken Land's eternal lightning.",
    continent: "forsaken-land",
    accessGate: { requiresFlag: "silver-city-passage" },
  },
  {
    id: "giant-kings-court",
    ...regionIdentity("giant-kings-court"),
    blurb:
      "The seat of the Giant King in the Forsaken Land, whose Dream-World shadow is the only passage to the sealed continent.",
    continent: "forsaken-land",
    accessGate: { requiresFlag: "dream-world-passage" },
  },
  {
    id: "moon-city",
    ...regionIdentity("moon-city"),
    blurb:
      "An isolated city of the Forsaken Land's eastern reaches, keeping its ancient watch on the gray fog.",
    continent: "forsaken-land",
    accessGate: { requiresFlag: "moon-city-passage" },
  },
  // ── Southern Continent — the colonized lands of the old Balam Empire (world
  // build-out 9, issue #138). UNLIKE the sealed Forsaken Land, the Southern
  // Continent is FREELY reachable: an ordinary — but long and perilous — sea
  // voyage across the Berserk Sea, with NO access gate. It is therefore NOT
  // routed through the dream chokepoint; a character may set sail for it (or back)
  // from any coast. A single present-day travel city stands in for the colonized
  // continent (East/West Balam + the Star Highlands are distinguished in the
  // lore prose). The id's leading word "balam" is the lore `city` key.
  {
    id: "balam",
    ...regionIdentity("balam"),
    blurb:
      "The colonized Southern Continent across the Berserk Sea — jungles, deserts, Balam Empire ruins, and the death-haunted tribes beneath Loen and Intis rule.",
    continent: "southern-continent",
  },
];

/** A city's continent, defaulting an absent value to `central` (issue #130). */
export function continentOf(city: City): Continent {
  return city.continent ?? "central";
}

/**
 * Whether a continent is reached only through a dream chokepoint city (issue
 * #138). The Forsaken Land is sealed — every crossing to/from it must pass through
 * the Giant King's Court Dream-World threshold ({@link CROSSING_CITY}). A
 * non-chokepoint continent (`central`, or the `southern-continent` across the
 * Berserk Sea) is reached by ordinary sea travel and is never chokepointed. Pure.
 */
export function isChokepointContinent(continent: Continent): boolean {
  return continent === "forsaken-land";
}

/**
 * Travel days for a single same-continent route. The square, symmetric matrix is
 * built from these once (both halves derived), so the symmetry can never be
 * hand-broken (the `{a,b,days}`-pairs idea from #85). Cross-continent pairs are
 * deliberately absent — they are not a matter of distance but of the
 * `CONTINENT_CROSSING_DAYS` passage, applied by `travelTo`.
 */
interface TravelLeg {
  a: string;
  b: string;
  days: number;
}

const TRAVEL_LEGS: TravelLeg[] = [
  // Central continent — the complete graph over the seven mainland cities.
  { a: "tingen", b: "backlund", days: 2 },
  { a: "tingen", b: "trier", days: 6 },
  { a: "tingen", b: "bayam", days: 14 },
  { a: "tingen", b: "pritz", days: 3 },
  { a: "tingen", b: "enmat", days: 4 },
  { a: "tingen", b: "feysac", days: 12 },
  { a: "backlund", b: "trier", days: 5 },
  { a: "backlund", b: "bayam", days: 12 },
  { a: "backlund", b: "pritz", days: 2 },
  { a: "backlund", b: "enmat", days: 3 },
  { a: "backlund", b: "feysac", days: 11 },
  { a: "trier", b: "bayam", days: 16 },
  { a: "trier", b: "pritz", days: 7 },
  { a: "trier", b: "enmat", days: 8 },
  { a: "trier", b: "feysac", days: 14 },
  { a: "bayam", b: "pritz", days: 10 },
  { a: "bayam", b: "enmat", days: 11 },
  { a: "bayam", b: "feysac", days: 18 },
  { a: "pritz", b: "enmat", days: 2 },
  { a: "pritz", b: "feysac", days: 13 },
  { a: "enmat", b: "feysac", days: 14 },
  // Constant City (Loen's second city, Midseashire NE coast) — wired to every
  // other central city (world build-out 5, issue #134).
  { a: "constant", b: "tingen", days: 5 },
  { a: "constant", b: "backlund", days: 4 },
  { a: "constant", b: "trier", days: 9 },
  { a: "constant", b: "bayam", days: 13 },
  { a: "constant", b: "pritz", days: 4 },
  { a: "constant", b: "enmat", days: 5 },
  { a: "constant", b: "feysac", days: 6 },
  // Forsaken Land — hub-and-spoke through Giant King's Court. Silver City and
  // Moon City each connect ONLY to the Court, never directly to each other
  // (they were mutually unaware until late canon, issue #133).
  { a: "silver-city", b: "giant-kings-court", days: 3 },
  { a: "giant-kings-court", b: "moon-city", days: 3 },
];

/**
 * Fixed cost of crossing between continents (issue #130). The Dream-World
 * passage into the Forsaken Land is not an ordinary voyage, so a single flat
 * duration stands in for it regardless of the endpoint cities — consumed by
 * `travelTo`, never stored in the same-continent `TRAVEL_DAYS` matrix.
 */
export const CONTINENT_CROSSING_DAYS = 7;

/**
 * Fixed cost of crossing the Berserk Sea to/from the Southern Continent (issue
 * #138). Canon: the Berserk Sea — created by the death of the god Death — is a
 * thunder-, lightning-, and storm-wracked water with a chaotic magnetic field
 * where "only a few sea routes" are passable, so the voyage to the colonies is
 * far longer and more perilous than the Forsaken Land's dream passage. Applied by
 * `travelTo` (via {@link continentCrossingDays}) for a Southern-continent crossing.
 */
export const BERSERK_SEA_CROSSING_DAYS = 30;

/**
 * Days for a continent crossing between two known cities (issue #138): the long
 * Berserk Sea voyage when either endpoint is on the Southern Continent, else the
 * Forsaken Land's flat dream passage. Both ids must be known cities (the caller
 * reaches this only after `crossesContinent` is true). Pure.
 */
export function continentCrossingDays(fromId: string, toId: string): number {
  const from = getCity(fromId);
  const to = getCity(toId);
  const involvesSouthern =
    (from && continentOf(from) === "southern-continent") ||
    (to && continentOf(to) === "southern-continent");
  return involvesSouthern ? BERSERK_SEA_CROSSING_DAYS : CONTINENT_CROSSING_DAYS;
}

/**
 * The single city through which every continent crossing is routed (issue #132):
 * the Dream-World threshold of Giant King's Court, the only entrance to (and exit
 * from) the sealed Forsaken Land. Cross-continent travel is permitted ONLY when
 * one endpoint is this chokepoint — you can never journey straight between the
 * mainland and the City of Silver, even holding the passage. "Finding the correct
 * path" is canon: you reach the Forsaken Land at the Court and travel inward from
 * there, and you leave the same way. Mirrored in the lore gazetteer's display
 * filter (a reconciliation test holds the two literals together).
 */
export const CROSSING_CITY = "giant-kings-court";

/**
 * Whether a continent crossing between `fromId` (the current city, or `undefined`
 * when the current location names no known city) and `dest` is permitted by the
 * chokepoint rule (issue #132). A same-continent move is never blocked here. A
 * crossing is allowed only when one endpoint is the {@link CROSSING_CITY}; from an
 * unknown origin only the crossing city itself is reachable on a non-central
 * continent (never straight to the City of Silver). The capability-flag gate is
 * checked separately by {@link meetsAccessGate}. Pure.
 */
/**
 * The character's origin city id for travel decisions: the `location` string's
 * leading word when it names a known city, else the engine-tracked
 * `GameState.currentCity` (validated), else `undefined`. Mirrors the origin
 * resolution used by `place-graph` / the movement gate / `resolveCityId` so a
 * character sitting at a bare district stays anchored to the city they are in.
 * Pure.
 */
function originCityId(
  state: Pick<GameState, "location" | "currentCity">,
): string | undefined {
  const fromLocation = cityIdFromLocation(state.location);
  if (fromLocation) return fromLocation;
  return state.currentCity && getCity(state.currentCity) ? state.currentCity : undefined;
}

function crossingPermitted(fromId: string | undefined, dest: City): boolean {
  const destContinent = continentOf(dest);
  if (fromId === undefined) {
    // Unknown current city: a central or freely-reachable (Southern, across the
    // Berserk Sea) destination is always fine; a chokepoint continent (the sealed
    // Forsaken Land) is reachable only AT the crossing city, never direct.
    return !isChokepointContinent(destContinent) || dest.id === CROSSING_CITY;
  }
  if (!crossesContinent(fromId, dest.id)) {
    // Same-continent moves are free EXCEPT within the Forsaken Land, whose
    // cities connect ONLY through the Giant King's Court (issues #132/#133):
    // the hub-and-spoke is enforced here too, so even a dual-flag holder can
    // never journey straight between the City of Silver and Moon City — they
    // route through the Court like everyone else.
    if (
      destContinent === "forsaken-land" &&
      fromId !== CROSSING_CITY &&
      dest.id !== CROSSING_CITY
    ) {
      return false;
    }
    return true;
  }
  // Cross-continent. A dream-gated continent (the Forsaken Land) on EITHER side
  // forces the crossing through the Court chokepoint (issue #132); an ordinary
  // sea crossing between the mainland and the Southern Continent (issue #138) is
  // freely permitted — it is a long voyage, not a sealed threshold.
  const from = getCity(fromId);
  const fromContinent = from ? continentOf(from) : "central";
  if (isChokepointContinent(fromContinent) || isChokepointContinent(destContinent)) {
    return fromId === CROSSING_CITY || dest.id === CROSSING_CITY;
  }
  return true;
}

/**
 * Travel time in days between two same-continent city ids. Symmetric by
 * construction — built once from `TRAVEL_LEGS` (both halves filled), so the
 * matrix can never be hand-broken. A city to itself is 0; cross-continent pairs
 * are absent (handled by `CONTINENT_CROSSING_DAYS` in `travelTo`). Loen interior
 * (Tingen↔Backlund) is a short rail trip; the overland crossing to Intis (Trier)
 * is longer; Bayam sits across the Sonia Sea, so any voyage to it is the longest.
 */
const TRAVEL_DAYS: Record<string, Record<string, number>> = (() => {
  const table: Record<string, Record<string, number>> = {};
  for (const { a, b, days } of TRAVEL_LEGS) {
    (table[a] ??= {})[b] = days;
    (table[b] ??= {})[a] = days;
  }
  return table;
})();

/** Look up a city by id. Returns `undefined` for an unknown id. */
export function getCity(cityId: string): City | undefined {
  return CITIES.find((c) => c.id === cityId);
}

/** Whether travelling between two known cities crosses continents (issue #130). */
export function crossesContinent(fromId: string, toId: string): boolean {
  const from = getCity(fromId);
  const to = getCity(toId);
  if (!from || !to) return false;
  return continentOf(from) !== continentOf(to);
}

/**
 * Travel days between two known cities, or `null` if either id is unknown OR the
 * route crosses continents (issue #130 — a continent crossing is not a matter of
 * distance; `travelTo` applies `CONTINENT_CROSSING_DAYS` for those). Same-city is 0.
 */
export function travelDays(fromId: string, toId: string): number | null {
  if (!getCity(fromId) || !getCity(toId)) return null;
  if (fromId === toId) return 0;
  if (crossesContinent(fromId, toId)) return null;
  return TRAVEL_DAYS[fromId]?.[toId] ?? null;
}

/**
 * Resolve a free-form `GameState.location` string to a known city id by its
 * leading word(s) (the same convention the lore selection and narration use).
 * Tries the longest leading-word slug first so a multi-word Forsaken-Land id
 * ("Silver City" → `silver-city`, "Giant King's Court" → `giant-kings-court`)
 * resolves, while a single-word central id ("Tingen City" → `tingen`) still wins
 * over a non-existent longer slug. Returns `undefined` when no known city matches.
 */
export function cityIdFromLocation(location: string): string | undefined {
  const words = location
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return undefined;
  // Longest leading slug first: "silver-city" beats "silver" when both could be
  // built, and a known id is required so partial central names don't false-match.
  for (let take = words.length; take >= 1; take--) {
    const candidate = words.slice(0, take).join("-");
    if (getCity(candidate)) return candidate;
  }
  return undefined;
}

/** Whether the character holds a given capability flag (issue #130). */
export function hasAccessFlag(
  state: Pick<GameState, "accessFlags">,
  flag: AccessFlag,
): boolean {
  return state.accessFlags?.includes(flag) ?? false;
}

/**
 * Grant a capability flag to the character (world build-out, issue #132).
 * Idempotent — returns the same state when the flag is already held, else a NEW
 * state with the flag appended. Pure. The engine grants flags; the AI never can.
 */
export function grantAccessFlag(state: GameState, flag: AccessFlag): GameState {
  if (hasAccessFlag(state, flag)) return state;
  return { ...state, accessFlags: [...(state.accessFlags ?? []), flag] };
}

/**
 * Whether a location is the Dream-World shadow of Giant King's Court — the
 * entrance that grants the dream-world passage (issue #132). Requires BOTH
 * "dream" and "giant king" in the string, so the PHYSICAL Giant King's Court (a
 * forsaken city, itself access-gated) never triggers the grant — only the
 * dream-world threshold a non-origin character can reach through the story does.
 * Case-insensitive; pure.
 */
export function reachedDreamWorldGate(location: string): boolean {
  const l = location.toLowerCase();
  return l.includes("dream") && l.includes("giant king");
}

/**
 * Whether the character meets a destination city's access gate (issue #130).
 * Freely reachable when the city has no gate. The Sequence gate counts DOWN, so
 * "high enough" means `sequenceLevel <= minSequence`; the flag gate demands the
 * capability be held. Both, when present, must pass. Reused by the deliberate
 * travel path (`canTravelTo`) and the AI-move gate (`gateLocationChange`).
 */
export function meetsAccessGate(
  state: Pick<GameState, "sequenceLevel" | "accessFlags">,
  dest: City,
): boolean {
  const gate = dest.accessGate;
  if (!gate) return true;
  if (gate.minSequence !== undefined && state.sequenceLevel > gate.minSequence) {
    return false;
  }
  if (gate.requiresFlag !== undefined && !hasAccessFlag(state, gate.requiresFlag)) {
    return false;
  }
  return true;
}

/**
 * Strict shape guard for `GameState.accessFlags` (issue #130) — an array of
 * recognised capability flags. Mirrors `isValidCustomLocationsShape`; the
 * persistence boundary (`session.ts`) rejects a malformed value and preserves a
 * valid one on the `...gs` spread.
 */
export function isValidAccessFlagsShape(obj: unknown): boolean {
  return Array.isArray(obj) && obj.every(isAccessFlag);
}

/**
 * Whether the character can deliberately travel from their current location to
 * `toId`: the destination must be a known city, the character must meet its
 * access gate (issue #130 — sequence AND required flag), and it must not be the
 * city they are already in.
 */
export function canTravelTo(state: GameState, toId: string): boolean {
  const dest = getCity(toId);
  if (!dest) return false;
  // An access-gated continent is unreachable without the capability (issue #130)
  // — even from an "unknown" current location.
  if (!meetsAccessGate(state, dest)) return false;
  // Resolve the origin city the way the rest of the engine does (place-graph,
  // the movement gate, resolveCityId): the location string's leading word, then
  // the engine-tracked `currentCity` when the string is a bare district that
  // names no city. Without this fallback a character parked at a Forsaken
  // district (e.g. in the City of Silver) reads as an unknown — central — origin,
  // which both leaks a straight mainland jump and falsely blocks same-continent
  // travel (issue #132 chokepoint).
  const fromId = originCityId(state);
  // A continent crossing is chokepointed at the Giant King's Court dream
  // threshold (issue #132): even holding the passage, you cannot travel straight
  // between the mainland and the City of Silver — you must route through the
  // crossing city. Checked for both known and unknown current locations.
  if (!crossingPermitted(fromId, dest)) return false;
  // If the current location is an unknown city, travel to any reachable known
  // city is allowed (the character is "somewhere else" and sets out for a city).
  if (fromId === undefined) return true;
  return fromId !== toId;
}

export interface TravelResult {
  /** New GameState with `location` set to the destination city name. */
  state: GameState;
  /** Memory-fact payload describing the journey, for the caller to record. */
  fact: SessionFact;
}

/**
 * Deliberately travel to `cityId`. Returns a NEW GameState whose `location` is
 * the destination city's name, plus a memory-fact describing the journey, or
 * `null` if the travel is not permitted (`canTravelTo` is false). On arrival the
 * scene cast is cleared and replaced with the roster's followers (issue #101):
 * companions and pursuers travel WITH the player, while incidental NPCs of the
 * previous scene are left behind. The default empty roster reproduces the legacy
 * "clear `npcsPresent`" behaviour, so every existing caller/test is unaffected.
 * The caller supplies `turnNumber` for the fact's bookkeeping.
 */
export function travelTo(
  state: GameState,
  cityId: string,
  turnNumber = 0,
  trackedNpcState: TrackedNpcState = emptyTrackedNpcState(),
): TravelResult | null {
  if (!canTravelTo(state, cityId)) return null;
  const dest = getCity(cityId);
  if (!dest) return null;

  const fromId = cityIdFromLocation(state.location);
  const from = fromId ? getCity(fromId) : undefined;
  // Cross-continent journeys take a fixed crossing time rather than a distance
  // from the matrix (which has no cross-continent entries, issue #130): the long
  // Berserk Sea voyage to the Southern Continent or the Forsaken Land's dream
  // passage, per `continentCrossingDays` (issue #138).
  const days = fromId
    ? crossesContinent(fromId, cityId)
      ? continentCrossingDays(fromId, cityId)
      : travelDays(fromId, cityId)
    : null;

  const journey =
    from && days !== null
      ? `Travelled from ${from.name} to ${dest.name} (${days} day${
          days === 1 ? "" : "s"
        }).`
      : `Travelled to ${dest.name}.`;

  return {
    state: {
      ...state,
      location: dest.name,
      // Track the city we arrived in so the map stays oriented even after the
      // narrator later moves us to a bare district string (issue #101).
      currentCity: cityId,
      npcsPresent: reassertFollowersAt([], trackedNpcState),
    },
    fact: { type: "event", description: journey, turnNumber },
  };
}
