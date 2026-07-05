// Canonical faction identifiers used by the encounter registry (issue #213).
// These are the stable, lower-kebab-case strings that may appear in
// `encounterConfig.factionGates` and in `GameState.factions`. The list is
// intentionally conservative: add new factions only after they have a
// gameplay channel (society membership, archetype seed, or engine-granted
// affiliation). Using a closed set keeps the AI from minting arbitrary
// faction names in encounter gates.

export const LORE_FACTIONS = [
  // Orthodox and state powers
  "nighthawks",
  "church-of-the-evernight-goddess",
  "church-of-the-lord-of-storms",
  "church-of-the-god-of-knowledge-and-wisdom",
  "church-of-the-earth-mother",
  "loen-kingdom",
  "intis-republic",
  "feysac-empire",
  // Secret societies / underground organizations
  "tarot-club",
  "secret-order",
  "aurora-order",
  "moses-ascetic-order",
  "psychology-alchemists",
  "abraham-family",
  "tamara-family",
  "sauron-family",
  "castiya-family",
  // Forsaken Land communities
  "city-of-silver",
  "moon-city",
  // Other notable factions
  "life-school-of-thought",
  "rose-redemption",
] as const;

/** Union type of all canonical lore factions. */
export type LoreFaction = (typeof LORE_FACTIONS)[number];

/** The set of canonical factions, for O(1) membership tests. */
export const LORE_FACTION_SET: ReadonlySet<LoreFaction> = new Set(LORE_FACTIONS);

/** Type guard: is `value` a canonical lore faction id? */
export function isLoreFaction(value: unknown): value is LoreFaction {
  return typeof value === "string" && LORE_FACTION_SET.has(value as LoreFaction);
}
