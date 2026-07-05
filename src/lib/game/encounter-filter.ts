// ---------------------------------------------------------------------------
// Encounter filter builder (issue #213)
// ---------------------------------------------------------------------------
//
// Builds the optional `EncounterFilter` passed to `selectCuratedLore` from
// durable session state. This is the runtime bridge between the encounter
// registry's gates and the game's actual subsystems.
//
// - `currentChapter` is inferred from `session.canonPosition` only when the
//   player is a canon-character takeover; non-canon chronicles do not have a
//   meaningful novel-chapter position, so the gate is skipped.
// - `playerFactions` merges `GameState.factions` with the canonical faction id
//   mapped from `societyState.kind`, when present, plus durable origin/location
//   affiliation for isolated communities such as the City of Silver.
// - `metNpcSlugs` derives from the tracked-NPC roster: roster names are matched
//   back to lore entries via `getLoreByNpc` and their slugs are collected.
// - `includeRare` is enabled only for special engine occasions such as active
//   advancement rituals, ascension rites, or advancement-scripted turns.
//
// Pure; lives next to the other session subsystems. No DB migration — it reads
// only fields that serialize inside the session blob.

import type { GameSession } from "./types";
import type { EncounterFilter } from "@/lib/lore/selection";
import { getLoreByNpc } from "@/lib/lore";
import { isLoreFaction, type LoreFaction } from "@/lib/lore/factions";
import type { SocietyKind } from "./society";
import { resolveTrackedNpcState } from "./tracked-npcs";

/** Maps a `SocietyKind` to its canonical `LoreFaction` id, if one exists. */
const SOCIETY_TO_FACTION: Record<SocietyKind, LoreFaction | undefined> = {
  "tarot-club": "tarot-club",
  "nighthawk-squad": "nighthawks",
  "church-division": "church-of-the-evernight-goddess",
  "pirate-crew": undefined,
  "scholars-circle": undefined,
};

// Archetype org slugs → canonical lore factions. Grows as more start archetypes
// are canonized. Unknown slugs return undefined (no faction seeded).
const ORG_SLUG_TO_FACTION: Record<string, LoreFaction | undefined> = {
  "nighthawks-tingen-team": "nighthawks",
  "combat-church-overview": "church-of-the-lord-of-storms",
  "knowledge-church-overview": "church-of-the-god-of-knowledge-and-wisdom",
  "sea-god-faith-overview": "church-of-the-lord-of-storms",
  "numinous-episcopate-overview": "church-of-the-earth-mother",
  "life-school-of-thought-overview": "life-school-of-thought",
  "psychology-alchemists-overview": "psychology-alchemists",
  "rose-school-of-thought-overview": "rose-redemption",
  "mandated-punishers-bayam": "intis-republic",
  "steam-church-overview": undefined,
  "blazing-sun-church-members": undefined,
  "loen-relic-foundation-overview": undefined,
};

export function loreFactionFromOrgSlug(orgSlug: string): LoreFaction | undefined {
  return ORG_SLUG_TO_FACTION[orgSlug];
}

function addCommunityFaction(session: GameSession, factions: Set<string>): void {
  const currentCity = session.gameState.currentCity;
  const accessFlags = new Set(session.gameState.accessFlags ?? []);

  // Forsaken-Land origin starts are not modeled as `societyState`, but their
  // current-city/access flags are durable proof of community membership. Feed
  // those communities into the same canonical faction gate used by encounters.
  if (currentCity === "silver-city" || accessFlags.has("silver-city-passage")) {
    factions.add("city-of-silver");
  }
  if (currentCity === "moon-city" || accessFlags.has("moon-city-passage")) {
    factions.add("moon-city");
  }
}

/**
 * Build an `EncounterFilter` from the current session state. Returns
 * `undefined` when no useful gating state is present, preserving backward
 * compatibility with the pre-#213 call site.
 */
export function buildEncounterFilter(session: GameSession): EncounterFilter | undefined {
  const filter: EncounterFilter = {};

  // Canon-character takeovers carry a shared-timeline position; use it as the
  // novel chapter gate. For non-canon characters the gate is intentionally
  // skipped because their chronicle does not track a canonical chapter.
  if (session.gameState.canonCharacterId) {
    filter.currentChapter = session.canonPosition;
  }

  // Factions: engine-maintained list on GameState plus society membership and
  // durable community-origin state for isolated regions.
  const factions = new Set<string>(session.gameState.factions ?? []);
  if (session.societyState) {
    const mapped = SOCIETY_TO_FACTION[session.societyState.kind];
    if (mapped) factions.add(mapped);
  }
  addCommunityFaction(session, factions);
  if (factions.size > 0) {
    const canonicalFactions = [...factions].filter(isLoreFaction);
    if (canonicalFactions.length > 0) {
      filter.playerFactions = canonicalFactions;
    }
  }

  // Rare encounter unlocks: by default rare entries are suppressed; active
  // rites and advancement-scripted turns are the explicit special occasions
  // where the registry may surface high-risk or quasi-divine figures.
  if (session.ritualState || session.ascensionRite || session.pendingTurnKind === "advancement") {
    filter.includeRare = true;
  }

  // Met NPCs: map tracked-roster names back to lore slugs. A name may match
  // multiple entries (e.g. an entry for a family plus the character's own
  // dossier); collect every matching slug. Unknown names are ignored.
  const state = resolveTrackedNpcState(session.trackedNpcState);
  const metSlugs = new Set<string>();
  for (const npc of state.roster) {
    for (const entry of getLoreByNpc(npc.name)) {
      metSlugs.add(entry.slug);
    }
  }
  if (metSlugs.size > 0) {
    filter.metNpcSlugs = [...metSlugs];
  }

  if (
    filter.currentChapter === undefined &&
    filter.playerFactions === undefined &&
    filter.metNpcSlugs === undefined &&
    filter.includeRare === undefined
  ) {
    return undefined;
  }
  return filter;
}
