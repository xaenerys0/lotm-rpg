// Single source of truth for the shared scalar IDENTITY of each Fifth-Epoch
// place (issue #85). The display `name` and the bare `kingdom`/realm of a place
// were authored independently — keyed by the same id — in BOTH the travel layer
// (`@/lib/game/travel.ts` `CITIES`) and the lore gazetteer (`gazetteer.ts`
// `FIFTH_CITIES`). Adding or renaming a place meant editing both in lockstep,
// and the near-duplicate values could (and did) drift. This registry holds the
// two genuinely-shared scalars once; both surfaces derive them from here.
//
// Only the SCALAR identity is shared. The intentionally surface-specific PROSE
// stays with each surface: the travel one-line blurb, the gazetteer realm
// descriptor + blurb, the narrator tone (`narration.ts`), the glossary
// definition, and the curated region lore (`regions.ts`). The gazetteer composes
// its richer `realm` line as `${kingdom} — ${descriptor}` from the shared
// `kingdom` plus its own descriptor, so the realm prefix can never disagree with
// the travel layer's `kingdom` while the descriptive clause stays gazetteer-local.

export interface RegionIdentity {
  /**
   * Display name — written to `GameState.location`, shown on the map, and (by the
   * leading-word convention) the value `cityIdFromLocation` slugs back to the id.
   */
  name: string;
  /** The realm / nation the place belongs to (the gazetteer realm line's prefix). */
  kingdom: string;
}

/**
 * The canonical name + realm for every Fifth-Epoch travel city, keyed by id (the
 * lowercase leading word of the name). Mainland + the sealed Forsaken Land + the
 * Southern Continent. Surface-specific prose lives elsewhere (see the module note).
 */
export const REGION_IDENTITIES: Record<string, RegionIdentity> = {
  // ── Central continent — the mainland. ──
  tingen: { name: "Tingen City", kingdom: "Loen Kingdom" },
  backlund: { name: "Backlund", kingdom: "Loen Kingdom" },
  trier: { name: "Trier", kingdom: "Intis Republic" },
  bayam: { name: "Bayam", kingdom: "Rorsted Archipelago" },
  pritz: { name: "Pritz Harbor", kingdom: "Loen Kingdom" },
  enmat: { name: "Enmat Harbor", kingdom: "Loen Kingdom" },
  feysac: { name: "Feysac", kingdom: "Feysac Empire" },
  constant: { name: "Constant City", kingdom: "Loen Kingdom" },
  // ── Forsaken Land of the Gods — the sealed Eastern Continent (issues #130/#133). ──
  "silver-city": { name: "Silver City", kingdom: "Forsaken Land of the Gods" },
  "giant-kings-court": {
    name: "Giant King's Court",
    kingdom: "Forsaken Land of the Gods",
  },
  "moon-city": { name: "Moon City", kingdom: "Forsaken Land of the Gods" },
  // ── Southern Continent — the colonized Balam lands (issue #138). ──
  balam: { name: "Balam", kingdom: "Southern Continent" },
};

/**
 * The canonical identity for a place id. THROWS on an unknown id so a new travel
 * or gazetteer city that forgot its registry entry fails loudly at construction
 * — the drift guard a single source of truth exists to provide — rather than
 * silently rendering an empty name/realm.
 */
export function regionIdentity(id: string): RegionIdentity {
  const identity = REGION_IDENTITIES[id];
  if (!identity) {
    throw new Error(`Unknown region id: "${id}" (add it to REGION_IDENTITIES)`);
  }
  return identity;
}
