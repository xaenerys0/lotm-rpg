// ---------------------------------------------------------------------------
// Reachability graph (issue #101) — what counts as "reachable" from where.
// ---------------------------------------------------------------------------
//
// `GameState.location` is a free-form string on the AI-mutable allowlist, so the
// narrator can propose ANY location each turn. Within a city that freedom is
// wanted (the narrator moves you between districts and landmarks). Across cities
// it is not: a cross-city move is the player's deliberate choice on the travel
// map, never a narrator teleport.
//
// The gate keys on the ONE signal that distinguishes a city unambiguously: a
// location whose leading word names a known city (`cityIdFromLocation`, the same
// convention the lore selection, travel, and narration use). A move is blocked
// only when BOTH endpoints explicitly name a KNOWN, DIFFERENT city — e.g.
// "Tingen City" → "Bayam". Anything else (a district/landmark string, an
// unrecognised place, or a same-city move) is reachable.
//
// This deliberately does NOT try to attribute a bare district string ("the
// docks", "Hillston Borough") to a city: the per-city gazetteers share keywords
// and a sub-location of one city would be mis-attributed to another, producing
// FALSE cross-city blocks that break legitimate play. Fail-open (treat an
// unresolved endpoint as reachable) is the safe choice — the cost is only that a
// teleport phrased without a second city name slips through, never that a real
// within-city move is refused.
//
// Epoch scope: the CITIES / travel model is Fifth-Epoch-only (like `travel.ts`,
// `gazetteer.travelEnabled`, and `regions.ts`). Earlier epochs have no city
// graph, so movement is never gated there (Risk 5).

import { DEFAULT_EPOCH_ID } from "@/lib/lore/epochs";
import { cityIdFromLocation } from "./travel";

/**
 * The known city a location names by its leading word, or `null` when it names
 * no known city (a district, a landmark, an unrecognised place) — or when the
 * character is not in the Fifth Epoch (no city graph exists there).
 */
export function cityForLocation(location: string, epoch?: number): string | null {
  if ((epoch ?? DEFAULT_EPOCH_ID) !== DEFAULT_EPOCH_ID) return null;
  return cityIdFromLocation(location) ?? null;
}

export type ReachableResult =
  | { reachable: true; reason: "same-city" | "provisional" }
  | { reachable: false; reason: "cross-city" };

/**
 * Whether `to` is reachable from `from` for a same-turn move. Reachable unless
 * BOTH endpoints name a known city and the cities differ. Either side
 * unresolvable (a district/landmark string, an unknown place, or a non-Fifth
 * epoch) → reachable (`provisional`). Same named city → reachable. Two different
 * named cities → blocked (`cross-city`).
 */
export function isReachable(from: string, to: string, epoch?: number): ReachableResult {
  const a = cityForLocation(from, epoch);
  const b = cityForLocation(to, epoch);
  if (a === null || b === null) return { reachable: true, reason: "provisional" };
  if (a === b) return { reachable: true, reason: "same-city" };
  return { reachable: false, reason: "cross-city" };
}
