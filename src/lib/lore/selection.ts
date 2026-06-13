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
): LoreContext {
  const pathwayLore = getLoreByPathway(pathwayName.toLowerCase());
  const epochLore = getLoreByEpochSetting(epoch);
  const cityLore = getLoreByCity(location.toLowerCase().split(" ")[0]);

  const combined: LoreEntry[] = [];
  for (const entry of [...pathwayLore, ...epochLore, ...cityLore]) {
    if (!combined.some((e) => e.slug === entry.slug)) {
      combined.push(entry);
    }
  }

  let totalTokens = 0;
  const selected: LoreEntry[] = [];
  for (const entry of combined) {
    if (!passesEpochGate(entry.epoch, epoch)) continue;
    if (totalTokens + entry.tokenCount > budgetTokens) break;
    selected.push(entry);
    totalTokens += entry.tokenCount;
  }
  return { entries: selected, totalTokens };
}
