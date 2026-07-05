import type { LoreContext } from "@/lib/ai";

import { normalizeCanonName } from "./canon-characters";
import { passesEpochGate } from "./epochs";
import { getLoreByCity, getLoreByEpochSetting, getLoreByPathway } from "./index";
import type { LoreEntry } from "./types";

export interface EncounterFilter {
  /** Current novel chapter position of the player, for spoiler gating. */
  currentChapter?: number;
  /** Faction ids the player is affiliated with, for faction-gated encounters. */
  playerFactions?: readonly string[];
  /** Normalized slugs of NPCs the player has already encountered. */
  metNpcSlugs?: readonly string[];
  /**
   * Whether to allow `encounterType: "rare"` entries into the optional pool.
   * Rare entries are intentionally suppressed by default so they surface only
   * on special occasions (engine events, rituals, scripted turns). Story-critical
   * entries ignore this flag.
   */
  includeRare?: boolean;
}

// Curated lore selection (moved out of the game-loop client component per
// issue #63's note so it lives under the coverage mandate). Deterministic
// greedy first-fit: pathway lore, then the character's epoch setting lore, then
// city lore, deduped by slug, packed by tokenCount until the budget. These are
// the guardrail entries that issue #64 injects FIRST — retrieved chunks only
// fill what this selection leaves.

/**
 * Select the curated guardrail entries for a pathway + location within
 * `budgetTokens`. Order of precedence: pathway mechanics (universal), then the
 * character's epoch setting overview, then city lore. Every entry passes through
 * the epoch gate (issue: character epoch isolation): a non-Fifth character never
 * receives Fifth-Epoch city/faction lore — only universal pathway mechanics plus
 * lore tagged for its own epoch. The epoch setting entries carry the era's world
 * context (politics, society, powers) to the narrator regardless of the awkward
 * prose `startingLocation` strings the city-key heuristic can't match. An absent
 * `epoch` defaults to the Fifth, matching the game's default-Fifth behaviour.
 *
 * `excludeNpc` (issue #92, canon-character takeover): when the player IS a canon
 * figure, their own NPC dossier and any pathway/city entry that names them must
 * not be fed to the narrator as a SEPARATE character (with its forward-arc
 * spoilers). Any entry whose `npcs` includes the excluded name (normalized) is
 * dropped. Pathway MECHANICS still reach the narrator via the rules engine, so
 * suppressing the prose lore costs no gameplay grounding.
 *
 * `encounterFilter` (issue #213, encounter registry): optional gating that makes
 * NPC entries encounterable based on chapter progress, faction membership, prior
 * encounters, and encounter weight/type. The selection is now three-tier:
 * (1) baseline entries without explicit encounter rules keep their original
 * pathway → epoch → city precedence; (2) story-critical entries are packed
 * next when conditions are met; (3) optional entries compete by weight, and
 * rare entries are included only when `includeRare` is true.
 */
export function selectCuratedLore(
  pathwayName: string,
  location: string,
  budgetTokens: number,
  epoch?: number,
  sequenceLevel?: number,
  excludeNpc?: string,
  encounterFilter?: EncounterFilter,
): LoreContext {
  const pathwayLore = getLoreByPathway(pathwayName.toLowerCase());
  const epochLore = getLoreByEpochSetting(epoch);
  const cityLore = getLoreByCity(location.toLowerCase().split(" ")[0]);
  const excluded = excludeNpc ? normalizeCanonName(excludeNpc) : undefined;

  const seen = new Set<string>();
  const baseline: LoreEntry[] = [];
  const storyCritical: LoreEntry[] = [];
  const optional: LoreEntry[] = [];
  for (const entry of [...pathwayLore, ...epochLore, ...cityLore]) {
    if (seen.has(entry.slug)) continue;
    seen.add(entry.slug);

    if (!passesEpochGate(entry.epoch, epoch)) continue;
    if (!passesActiveEpochGate(entry, epoch)) continue;
    if (!passesSequenceGate(entry.sequences, sequenceLevel)) continue;
    if (!passesEncounterGate(entry, sequenceLevel, encounterFilter)) continue;
    if (excluded && entry.npcs.some((n) => normalizeCanonName(n) === excluded)) {
      continue;
    }

    const cfg = entry.encounterConfig;
    if (!cfg || cfg.encounterType === undefined) {
      baseline.push(entry);
      continue;
    }
    if (cfg.encounterType === "story-critical") {
      storyCritical.push(entry);
    } else if (cfg.encounterType === "optional") {
      optional.push(entry);
    } else if (cfg.encounterType === "rare" && encounterFilter?.includeRare) {
      optional.push(entry);
    }
  }

  // Optional/rare pool competes by encounterWeight (default 1.0) so heavier
  // entries float to the front without starving the baseline or story-critical
  // guardrails packed before them.
  optional.sort((a, b) => {
    const weightA = a.encounterConfig?.encounterWeight ?? 1;
    const weightB = b.encounterConfig?.encounterWeight ?? 1;
    return weightB - weightA;
  });

  const combined = [...baseline, ...storyCritical, ...optional];

  let totalTokens = 0;
  const selected: LoreEntry[] = [];
  for (const entry of combined) {
    if (totalTokens + entry.tokenCount > budgetTokens) break;
    selected.push(entry);
    totalTokens += entry.tokenCount;
  }
  return { entries: selected, totalTokens };
}

/**
 * Issue #213: an entry's encounter rules may restrict the epochs in which it can
 * be encountered. If `encounterConfig.activeEpochs` is present, the character's
 * current epoch must be listed there; otherwise the gate falls back to the
 * entry's own `epoch` field (which is already handled by `passesEpochGate`).
 */
export function passesActiveEpochGate(
  entry: LoreEntry,
  epoch: number | undefined,
): boolean {
  if (epoch === undefined) return true;
  const activeEpochs = entry.encounterConfig?.activeEpochs;
  if (!activeEpochs || activeEpochs.length === 0) return true;
  return activeEpochs.includes(epoch);
}

/**
 * Issue #213: encounter registry filtering. Returns true when the entry has no
 * encounter configuration (so default city/pathway injection continues to work)
 * or when every populated gate on the config is satisfied.
 */
export function passesEncounterGate(
  entry: LoreEntry,
  sequenceLevel: number | undefined,
  filter: EncounterFilter | undefined,
): boolean {
  const cfg = entry.encounterConfig;
  if (!cfg) return true;

  // Chapter spoiler gates: earliestChapter blocks pre-introduction encounters,
  // latestChapter blocks post-departure/spoiler encounters.
  if (filter?.currentChapter !== undefined) {
    if (
      cfg.earliestChapter !== undefined &&
      filter.currentChapter < cfg.earliestChapter
    ) {
      return false;
    }
    if (cfg.latestChapter !== undefined && filter.currentChapter > cfg.latestChapter) {
      return false;
    }
  }

  // Sequence floor: high-sequence figures do not appear to low-sequence players.
  if (sequenceLevel !== undefined && cfg.minPlayerSequence !== undefined) {
    if (sequenceLevel < cfg.minPlayerSequence) return false;
  }

  // Faction gate: NPCs tied to organizations only appear naturally for members.
  if (cfg.factionGates && cfg.factionGates.length > 0) {
    const playerFactions = filter?.playerFactions ?? [];
    if (!cfg.factionGates.some((faction) => playerFactions.includes(faction))) {
      return false;
    }
  }

  // Relationship gate: NPCs that require prior meetings with other characters.
  if (cfg.requiresPriorEncounter && cfg.requiresPriorEncounter.length > 0) {
    const met = filter?.metNpcSlugs ?? [];
    if (!cfg.requiresPriorEncounter.every((slug) => met.includes(slug))) {
      return false;
    }
  }

  return true;
}

/**
 * Progressive disclosure for curated lore (mirrors the glossary's
 * `revealAtSequence`). Sequence-tagged entries describe a specific rung of a
 * pathway; an entry is revealed only once the character has actually reached
 * its EARLIEST (highest-numbered, lowest-power) sequence — so a fresh Seq 9
 * Seer gets the pathway overview and the Seq 9 entry, but not the Seq 8/7/6/5
 * write-ups of abilities they have not yet earned. An entry with no `sequences`
 * (geography, era context, organizations) carries no rung restriction and
 * always passes; an absent `sequenceLevel` (callers/tests that don't track it)
 * also passes everything, preserving prior behaviour.
 */
export function passesSequenceGate(
  entrySequences: readonly number[],
  sequenceLevel: number | undefined,
): boolean {
  if (sequenceLevel === undefined) return true;
  if (entrySequences.length === 0) return true;
  return sequenceLevel <= Math.max(...entrySequences);
}
