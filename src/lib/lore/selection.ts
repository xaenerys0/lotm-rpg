import type { LoreContext } from "@/lib/ai";

import { getLoreByCity, getLoreByPathway } from "./index";
import type { LoreEntry } from "./types";

// Curated lore selection (moved out of the game-loop client component per
// issue #63's note so it lives under the coverage mandate). Deterministic
// greedy first-fit: pathway lore then city lore, deduped by slug, packed by
// tokenCount until the budget. These are the guardrail entries that issue #64
// injects FIRST — retrieved chunks only fill what this selection leaves.

/**
 * Select the curated guardrail entries for a pathway + location within
 * `budgetTokens`. Pathway lore takes precedence over city lore.
 */
export function selectCuratedLore(
  pathwayName: string,
  location: string,
  budgetTokens: number,
): LoreContext {
  const pathwayLore = getLoreByPathway(pathwayName.toLowerCase());
  const cityLore = getLoreByCity(location.toLowerCase().split(" ")[0]);
  const combined = [...pathwayLore];
  for (const entry of cityLore) {
    if (!combined.some((e) => e.slug === entry.slug)) {
      combined.push(entry);
    }
  }

  let totalTokens = 0;
  const selected: LoreEntry[] = [];
  for (const entry of combined) {
    if (totalTokens + entry.tokenCount > budgetTokens) break;
    selected.push(entry);
    totalTokens += entry.tokenCount;
  }
  return { entries: selected, totalTokens };
}
