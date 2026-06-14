import type { LoreContext } from "@/lib/ai";

import { passesEpochGate } from "./epochs";
import { getLoreByCity, getLoreByEpochSetting, getLoreByPathway } from "./index";
import type { LoreEntry } from "./types";

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
 */
export function selectCuratedLore(
  pathwayName: string,
  location: string,
  budgetTokens: number,
  epoch?: number,
  sequenceLevel?: number,
): LoreContext {
  const pathwayLore = getLoreByPathway(pathwayName.toLowerCase());
  const epochLore = getLoreByEpochSetting(epoch);
  const cityLore = getLoreByCity(location.toLowerCase().split(" ")[0]);

  const seen = new Set<string>();
  const combined: LoreEntry[] = [];
  for (const entry of [...pathwayLore, ...epochLore, ...cityLore]) {
    if (!seen.has(entry.slug)) {
      seen.add(entry.slug);
      combined.push(entry);
    }
  }

  let totalTokens = 0;
  const selected: LoreEntry[] = [];
  for (const entry of combined) {
    if (!passesEpochGate(entry.epoch, epoch)) continue;
    if (!passesSequenceGate(entry.sequences, sequenceLevel)) continue;
    if (totalTokens + entry.tokenCount > budgetTokens) break;
    selected.push(entry);
    totalTokens += entry.tokenCount;
  }
  return { entries: selected, totalTokens };
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
