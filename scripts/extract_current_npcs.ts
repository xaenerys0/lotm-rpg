#!/usr/bin/env tsx
/**
 * Extract all NPC identities currently represented in the lore system.
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

/**
 * Map a dossier slug to its `// CORPUS: wiki "..."` page title.
 *
 * The comment and the `slug:` line may appear in EITHER order within an entry:
 * Batch 1-4 entries put the comment immediately before `slug:`, but several
 * older dossiers put it after `content:` (i.e. after their own slug). A single
 * forward-scanning "pending page" therefore mis-binds the after-slug comments
 * to the NEXT entry's slug. Instead, accumulate the slug and page seen within
 * each top-level array entry and pair them at the entry boundary (`  },`),
 * which is order-independent.
 */
function corpusPagesBySlug(): Record<string, string> {
  const source = fs.readFileSync(path.resolve("src/lib/lore/npcs.ts"), "utf8");
  const pages: Record<string, string> = {};
  let slug: string | undefined;
  let page: string | undefined;

  const flush = () => {
    if (slug && page) pages[slug] = page;
    slug = undefined;
    page = undefined;
  };

  for (const line of source.split("\n")) {
    const corpusMatch = line.match(/^\s*\/\/\s*CORPUS:\s*wiki\s+"([^"]+)"/);
    if (corpusMatch) page = corpusMatch[1];

    const slugMatch = line.match(/^\s*slug:\s*"([^"]+)"/);
    if (slugMatch) slug = slugMatch[1];

    // Top-level entries close with a 2-space-indented `},` on its own line.
    if (/^ {2}\},?\s*$/.test(line)) flush();
  }
  flush();

  return pages;
}

function slugName(slug: string): string | undefined {
  if (!slug.startsWith("npc-")) return undefined;
  return slug
    .slice("npc-".length)
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function titlePrimaryName(title: string): string {
  return title.split(/\s+(?:—|–|-)\s+/, 1)[0].trim();
}

function add(
  entry: LoreEntry,
  pathway?: string,
  corpusPages: Record<string, string> = {},
) {
  // `npcs` names are supplementary references. NPC dossiers also identify
  // themselves through their slug, title, and (when available) wiki citation.
  const names = new Set(entry.npcs);
  if (entry.category === "npc") {
    const derivedSlugName = slugName(entry.slug);
    if (derivedSlugName) names.add(derivedSlugName);
    const primaryTitle = titlePrimaryName(entry.title);
    if (primaryTitle) names.add(primaryTitle);
    const corpusPage = corpusPages[entry.slug];
    if (corpusPage) names.add(corpusPage);
  }

  for (const name of names) {
    if (!npcIndex[name]) {
      npcIndex[name] = { sources: [], pathways: [], sequences: [] };
    }
    npcIndex[name].sources.push(entry.slug);
    if (pathway ?? entry.pathway) {
      npcIndex[name].pathways.push(pathway ?? entry.pathway!);
    }
    if (entry.sequences?.length) {
      npcIndex[name].sequences.push(...entry.sequences);
    }
  }
}

const corpusPages = corpusPagesBySlug();

for (const npc of NPC_LORE) {
  add(npc, undefined, corpusPages);
}

for (const [pathway, entries] of Object.entries(pathwayArrays)) {
  for (const entry of entries) {
    if (entry.npcs.length) {
      // Do not mutate imported lore entries just to supply audit metadata.
      add(entry, entry.pathway ?? pathway);
    }
  }
}

// Deduplicate and sort
for (const data of Object.values(npcIndex)) {
  data.sources = [...new Set(data.sources)];
  data.pathways = [...new Set(data.pathways)];
  data.sequences = [...new Set(data.sequences)].sort((a, b) => a - b);
}

// Regression guard: Tirié has no self-reference in `npcs`, so this verifies
// dossier identity extraction from its title and inline CORPUS page reference
// (comment-BEFORE-slug convention). npc-roselle-gustav exercises the
// comment-AFTER-slug convention, which a naive forward scan mis-binds to the
// next entry — so it must resolve to its own page, not a neighbour's.
if (
  corpusPages["npc-tirie"] !== "Tirié" ||
  !npcIndex["Tirié"]?.sources.includes("npc-tirie") ||
  corpusPages["npc-roselle-gustav"] !== "Roselle Gustav"
) {
  throw new Error("NPC identity extraction failed to resolve Tirié from npc-tirie");
}

const outPath = path.resolve("tmp/current_lore_npcs.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(npcIndex, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Total unique NPC names in lore: ${Object.keys(npcIndex).length}`);
