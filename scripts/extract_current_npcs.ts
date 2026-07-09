#!/usr/bin/env tsx
/**
 * Extract all NPC names currently referenced in the lore system.
 * Outputs tmp/current_lore_npcs.json with:
 *   npcName -> { sources: [slug...], pathway?, sequences? }
 */
import fs from "fs";
import path from "path";
import { NPC_LORE } from "../src/lib/lore/npcs";
import {
  FOOL_PATHWAY_LORE,
  ERROR_PATHWAY_LORE,
  DOOR_PATHWAY_LORE,
  VISIONARY_PATHWAY_LORE,
  SUN_PATHWAY_LORE,
  TYRANT_PATHWAY_LORE,
  HANGED_MAN_PATHWAY_LORE,
  DEATH_PATHWAY_LORE,
  DARKNESS_PATHWAY_LORE,
  TWILIGHT_GIANT_PATHWAY_LORE,
  WHITE_TOWER_PATHWAY_LORE,
  JUSTICIAR_PATHWAY_LORE,
  BLACK_EMPEROR_PATHWAY_LORE,
  RED_PRIEST_PATHWAY_LORE,
  DEMONESS_PATHWAY_LORE,
  MOTHER_PATHWAY_LORE,
  MOON_PATHWAY_LORE,
  HERMIT_PATHWAY_LORE,
  PARAGON_PATHWAY_LORE,
  WHEEL_OF_FORTUNE_PATHWAY_LORE,
  ABYSS_PATHWAY_LORE,
  CHAINED_PATHWAY_LORE,
} from "../src/lib/lore";
import type { LoreEntry } from "../src/lib/lore/types";

const pathwayArrays: Record<string, LoreEntry[]> = {
  fool: FOOL_PATHWAY_LORE,
  error: ERROR_PATHWAY_LORE,
  door: DOOR_PATHWAY_LORE,
  visionary: VISIONARY_PATHWAY_LORE,
  sun: SUN_PATHWAY_LORE,
  tyrant: TYRANT_PATHWAY_LORE,
  "hanged-man": HANGED_MAN_PATHWAY_LORE,
  death: DEATH_PATHWAY_LORE,
  darkness: DARKNESS_PATHWAY_LORE,
  "twilight-giant": TWILIGHT_GIANT_PATHWAY_LORE,
  "white-tower": WHITE_TOWER_PATHWAY_LORE,
  justiciar: JUSTICIAR_PATHWAY_LORE,
  "black-emperor": BLACK_EMPEROR_PATHWAY_LORE,
  "red-priest": RED_PRIEST_PATHWAY_LORE,
  demoness: DEMONESS_PATHWAY_LORE,
  mother: MOTHER_PATHWAY_LORE,
  moon: MOON_PATHWAY_LORE,
  hermit: HERMIT_PATHWAY_LORE,
  paragon: PARAGON_PATHWAY_LORE,
  "wheel-of-fortune": WHEEL_OF_FORTUNE_PATHWAY_LORE,
  abyss: ABYSS_PATHWAY_LORE,
  chained: CHAINED_PATHWAY_LORE,
};

const npcIndex: Record<
  string,
  { sources: string[]; pathways: string[]; sequences: number[] }
> = {};

function add(entry: LoreEntry) {
  for (const name of entry.npcs) {
    if (!npcIndex[name]) {
      npcIndex[name] = { sources: [], pathways: [], sequences: [] };
    }
    npcIndex[name].sources.push(entry.slug);
    if (entry.pathway) {
      npcIndex[name].pathways.push(entry.pathway);
    }
    if (entry.sequences?.length) {
      npcIndex[name].sequences.push(...entry.sequences);
    }
  }
}

for (const npc of NPC_LORE) {
  add(npc);
}

for (const [pathway, entries] of Object.entries(pathwayArrays)) {
  for (const entry of entries) {
    if (entry.npcs.length) {
      // Ensure pathway is set if missing
      if (!entry.pathway) entry.pathway = pathway;
      add(entry);
    }
  }
}

// Deduplicate and sort
for (const [name, data] of Object.entries(npcIndex)) {
  data.pathways = [...new Set(data.pathways)];
  data.sequences = [...new Set(data.sequences)].sort((a, b) => a - b);
}

const outPath = path.resolve("tmp/current_lore_npcs.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(npcIndex, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Total unique NPC names in lore: ${Object.keys(npcIndex).length}`);
