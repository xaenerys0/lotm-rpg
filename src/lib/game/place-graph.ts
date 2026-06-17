// ---------------------------------------------------------------------------
// Reachability graph (issue #101) — what counts as "reachable" from where.
// ---------------------------------------------------------------------------
//
// `GameState.location` is a free-form string on the AI-mutable allowlist, so the
// narrator can propose ANY location each turn. Within a city that freedom is
// wanted (the narrator moves you from a district to a landmark). Across cities it
// is not: a cross-city move is the player's deliberate choice on the travel map,
// never a narrator teleport. This module resolves a free-form location to a node
// in a small place graph and answers whether one place is reachable from another.
//
// Pure data + resolution, derived on call (like `cityIdFromLocation`): it reuses
// the Fifth-Epoch `CITIES` table (`travel.ts`) as the city layer and the
// epoch-keyed gazetteer districts (`gazetteerForEpoch(epoch).districts`,
// `@/lib/lore`) as the intra-city SITE layer. No new persisted state.
//
// Epoch scope: the CITIES / reachability model is Fifth-Epoch-only — exactly like
// `travel.ts`, `gazetteer.travelEnabled`, and `regions.ts`. Earlier epochs have
// no city graph, so `resolvePlace` returns `null` there and movement is never
// gated (Risk 5: an earlier-epoch character sees no gating and no regressions).

import { gazetteerForEpoch, DEFAULT_EPOCH_ID } from "@/lib/lore";
import { cityIdFromLocation, getCity } from "./travel";

/** A resolved point in the place graph: a whole city, or a site within one. */
export interface PlaceNode {
  /** Stable id — the city id for a city, the district slug for a site. */
  id: string;
  kind: "city" | "site";
  /** The id of the city this node belongs to (a city belongs to itself). */
  cityId: string;
  /** Display name. */
  name: string;
}

// Risk 1: most Fifth-Epoch districts' keywords lack a city token, so a resolved
// SITE infers its home city from "Fifth gazetteer ⇒ Tingen". Tingen is the only
// district-bearing Fifth city today; add a gazetteer→cityId map here when
// Backlund / Trier / Bayam grow their own district lists.
const FIFTH_HOME_CITY = "tingen";

/**
 * Resolve a free-form `location` string to a place-graph node, or `null` when it
 * names nothing the graph recognises (a **provisional** place — never gated).
 *
 * Tries `cityIdFromLocation` first (a known city by leading word), then a
 * district-keyword match against the epoch's gazetteer — the same test
 * `map-panel.tsx` uses for its "You are here" badge. Fifth-Epoch only; every
 * other epoch resolves to `null` (no city graph there → never gated).
 */
export function resolvePlace(location: string, epoch?: number): PlaceNode | null {
  if ((epoch ?? DEFAULT_EPOCH_ID) !== DEFAULT_EPOCH_ID) return null;

  const cityId = cityIdFromLocation(location);
  const city = cityId ? getCity(cityId) : undefined;
  if (city) {
    return { id: city.id, kind: "city", cityId: city.id, name: city.name };
  }

  const lowered = location.toLowerCase();
  const district = gazetteerForEpoch(epoch).districts.find((d) =>
    d.keywords.some((keyword) => lowered.includes(keyword)),
  );
  if (district) {
    return {
      id: district.slug,
      kind: "site",
      cityId: FIFTH_HOME_CITY,
      name: district.name,
    };
  }

  return null;
}

/** Whether two resolved nodes sit in the same city (covers city↔site). */
export function sameCity(a: PlaceNode, b: PlaceNode): boolean {
  return a.cityId === b.cityId;
}

export type ReachableResult =
  | { reachable: true; reason: "same-place" | "same-city" | "provisional" }
  | { reachable: false; reason: "cross-city" };

/**
 * Whether `to` is reachable from `from` for a same-turn move. Either side
 * unresolvable → reachable (provisional, nothing to gate). The same node →
 * reachable. The same city (district ↔ landmark ↔ the city itself) → reachable.
 * A different city → blocked (`cross-city`).
 *
 * There is deliberately NO `non-adjacent` arm: cross-city moves are simply
 * blocked, never narrated as a long journey, so adjacency never enters here (and
 * a dead branch would fail the 95% coverage gate).
 */
export function isReachable(from: string, to: string, epoch?: number): ReachableResult {
  const a = resolvePlace(from, epoch);
  const b = resolvePlace(to, epoch);
  if (!a || !b) return { reachable: true, reason: "provisional" };
  if (a.id === b.id) return { reachable: true, reason: "same-place" };
  if (sameCity(a, b)) return { reachable: true, reason: "same-city" };
  return { reachable: false, reason: "cross-city" };
}
