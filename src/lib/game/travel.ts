import type { AccessFlag, Continent, GameState, SessionFact } from "@/lib/ai";
import { isAccessFlag } from "@/lib/ai";
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
    name: "Tingen City",
    kingdom: "Loen Kingdom",
    blurb:
      "A mid-sized industrial city in the Awwa region, overcast and coal-smoked, where the story begins.",
  },
  {
    id: "backlund",
    name: "Backlund",
    kingdom: "Loen Kingdom",
    blurb:
      "The capital of the Loen Kingdom — the smog-bound City of Dust, vast and divided by the Tussock River.",
  },
  {
    id: "trier",
    name: "Trier",
    kingdom: "Intis Republic",
    blurb:
      "The sunlit capital of the Intis Republic, a walled city of arts, fashion, and revolutionary politics.",
  },
  {
    id: "bayam",
    name: "Bayam",
    kingdom: "Rorsted Archipelago",
    blurb:
      "The colonial port-capital of the Rorsted Archipelago, the salt-and-spice City of Generosity.",
  },
  {
    id: "pritz",
    name: "Pritz Harbor",
    kingdom: "Loen Kingdom",
    blurb:
      "The Loen navy's chief port below the Hornacis range — fog, dry-docks, and warships.",
  },
  {
    id: "enmat",
    name: "Enmat Harbor",
    kingdom: "Loen Kingdom",
    blurb: "A small, fog-drowned Loen coastal town of fishing boats and old sea-charms.",
  },
  {
    id: "feysac",
    name: "Feysac",
    kingdom: "Feysac Empire",
    blurb:
      "The cold militarist empire of the God of Combat, north beyond the Hornacis range.",
  },
  // ── Forsaken Land of the Gods — the sealed Eastern Continent (issue #130). ──
  // Access-gated and content-less for now: no lore, no start scenario, no
  // narration directive. The `dream-world-passage` gate means no central
  // character can see or reach them until the capability is granted (issue #3).
  {
    id: "silver-city",
    name: "Silver City",
    kingdom: "Forsaken Land of the Gods",
    blurb:
      "The lightless silver capital of the abandoned faithful, beneath the Forsaken Land's eternal lightning.",
    continent: "forsaken-land",
    accessGate: { requiresFlag: "dream-world-passage" },
  },
  {
    id: "giant-kings-court",
    name: "Giant King's Court",
    kingdom: "Forsaken Land of the Gods",
    blurb:
      "The seat of the Giant King in the Forsaken Land, whose Dream-World shadow is the only passage to the sealed continent.",
    continent: "forsaken-land",
    accessGate: { requiresFlag: "dream-world-passage" },
  },
];

/** A city's continent, defaulting an absent value to `central` (issue #130). */
export function continentOf(city: City): Continent {
  return city.continent ?? "central";
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
  // Forsaken Land — the intra-continent route between its two cities.
  { a: "silver-city", b: "giant-kings-court", days: 3 },
];

/**
 * Fixed cost of crossing between continents (issue #130). The Dream-World
 * passage into the Forsaken Land is not an ordinary voyage, so a single flat
 * duration stands in for it regardless of the endpoint cities — consumed by
 * `travelTo`, never stored in the same-continent `TRAVEL_DAYS` matrix.
 */
export const CONTINENT_CROSSING_DAYS = 7;

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
  const fromId = cityIdFromLocation(state.location);
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
  // Cross-continent journeys take the fixed Dream-World passage time rather than
  // a distance from the matrix (which has no cross-continent entries, issue #130).
  const days = fromId
    ? crossesContinent(fromId, cityId)
      ? CONTINENT_CROSSING_DAYS
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
