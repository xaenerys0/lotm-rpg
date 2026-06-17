import type { GameState, SessionFact } from "@/lib/ai";
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
  /** Stable id; the lowercase first word matches the lore `city` field and
   * `cityNarrationDirective` keying. */
  id: string;
  /** Display name and the value written to `GameState.location` on arrival. */
  name: string;
  /** Kingdom / realm the city belongs to. */
  kingdom: string;
  /** One-line public flavour blurb (street-level knowledge only). */
  blurb: string;
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
];

/**
 * Travel time in days between two city ids. Symmetric. A city to itself is 0.
 * Loen interior (Tingen↔Backlund) is a short rail trip; the overland crossing
 * to Intis (Trier) is longer; Bayam sits across the Sonia Sea, so any voyage to
 * or from it is the longest.
 */
const TRAVEL_DAYS: Record<string, Record<string, number>> = {
  tingen: { backlund: 2, trier: 6, bayam: 14, pritz: 3, enmat: 4, feysac: 12 },
  backlund: { tingen: 2, trier: 5, bayam: 12, pritz: 2, enmat: 3, feysac: 11 },
  trier: { tingen: 6, backlund: 5, bayam: 16, pritz: 7, enmat: 8, feysac: 14 },
  bayam: { tingen: 14, backlund: 12, trier: 16, pritz: 10, enmat: 11, feysac: 18 },
  pritz: { tingen: 3, backlund: 2, trier: 7, bayam: 10, enmat: 2, feysac: 13 },
  enmat: { tingen: 4, backlund: 3, trier: 8, bayam: 11, pritz: 2, feysac: 14 },
  feysac: { tingen: 12, backlund: 11, trier: 14, bayam: 18, pritz: 13, enmat: 14 },
};

/** Look up a city by id. Returns `undefined` for an unknown id. */
export function getCity(cityId: string): City | undefined {
  return CITIES.find((c) => c.id === cityId);
}

/**
 * Travel days between two known cities, or `null` if either id is unknown.
 * Same-city is 0.
 */
export function travelDays(fromId: string, toId: string): number | null {
  if (!getCity(fromId) || !getCity(toId)) return null;
  if (fromId === toId) return 0;
  return TRAVEL_DAYS[fromId]?.[toId] ?? null;
}

/**
 * Resolve a free-form `GameState.location` string to a known city id by its
 * leading word (the same convention the lore selection and narration use).
 * Returns `undefined` when the location names no known city.
 */
export function cityIdFromLocation(location: string): string | undefined {
  const key = location.trim().toLowerCase().split(/\s+/)[0];
  if (!key) return undefined;
  return getCity(key)?.id;
}

/**
 * Whether the character can deliberately travel from their current location to
 * `toId`: the destination must be a known city, and it must not be the city
 * they are already in.
 */
export function canTravelTo(state: GameState, toId: string): boolean {
  const fromId = cityIdFromLocation(state.location);
  const dest = getCity(toId);
  if (!dest) return false;
  // If the current location is an unknown city, travel to any known city is
  // allowed (the character is "somewhere else" and sets out for a city).
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
  const days = fromId ? travelDays(fromId, cityId) : null;

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
      npcsPresent: reassertFollowersAt([], trackedNpcState),
    },
    fact: { type: "event", description: journey, turnNumber },
  };
}
