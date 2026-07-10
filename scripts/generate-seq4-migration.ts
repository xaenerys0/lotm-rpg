#!/usr/bin/env tsx
import {
  FOOL_PATHWAY_LORE,
  VISIONARY_PATHWAY_LORE,
  SUN_PATHWAY_LORE,
  DEATH_PATHWAY_LORE,
  DARKNESS_PATHWAY_LORE,
  TYRANT_PATHWAY_LORE,
  DOOR_PATHWAY_LORE,
  HANGED_MAN_PATHWAY_LORE,
  WHITE_TOWER_PATHWAY_LORE,
  TWILIGHT_GIANT_PATHWAY_LORE,
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
  ERROR_PATHWAY_LORE,
} from "../src/lib/lore/index";
import type { LoreEntry } from "../src/lib/lore/types";

const arrays: LoreEntry[][] = [
  FOOL_PATHWAY_LORE,
  VISIONARY_PATHWAY_LORE,
  SUN_PATHWAY_LORE,
  DEATH_PATHWAY_LORE,
  DARKNESS_PATHWAY_LORE,
  TYRANT_PATHWAY_LORE,
  DOOR_PATHWAY_LORE,
  HANGED_MAN_PATHWAY_LORE,
  WHITE_TOWER_PATHWAY_LORE,
  TWILIGHT_GIANT_PATHWAY_LORE,
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
  ERROR_PATHWAY_LORE,
];

const groupBSlugs = new Set([
  "white-tower-pathway-overview",
  "twilight-giant-pathway-overview",
  "justiciar-pathway-overview",
  "black-emperor-pathway-overview",
  "red-priest-pathway-overview",
  "demoness-pathway-overview",
  "mother-pathway-overview",
  "moon-pathway-overview",
  "hermit-pathway-overview",
  "paragon-pathway-overview",
  "wheel-of-fortune-pathway-overview",
  "abyss-pathway-overview",
  "chained-pathway-overview",
]);

const seq4 = arrays
  .flat()
  .filter((e) => e.sequences?.length === 1 && e.sequences[0] === 4);
const updatedOverviews = arrays.flat().filter((e) => groupBSlugs.has(e.slug));
const entriesToEmit = [...updatedOverviews, ...seq4];

function sqlQuote(value: string | null): string {
  if (value == null) return "null";
  return "'" + value.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
}

function sqlArray(values: string[] | null): string {
  if (!values || values.length === 0) return "null";
  return "'{" + values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(",") + "}'";
}

function sqlIntArray(values: number[] | null): string {
  if (!values || values.length === 0) return "null";
  return "'{" + values.join(",") + "}'";
}

const lines = entriesToEmit.map((e) => {
  const title = e.title ?? e.slug;
  return `  insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
  values (
    ${sqlQuote(e.slug)},
    ${sqlQuote(title)},
    ${sqlQuote(e.category)},
    ${sqlQuote(e.content)},
    ${sqlQuote(e.pathway ?? null)},
    ${e.epoch ?? "null"},
    null,
    ${sqlArray(e.npcs ?? null)},
    ${sqlIntArray(e.sequences ?? null)},
    ${sqlArray(e.tags ?? null)},
    ${e.tokenCount ?? 0}
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    pathway = excluded.pathway,
    epoch = excluded.epoch,
    city = excluded.city,
    npcs = excluded.npcs,
    sequences = excluded.sequences,
    tags = excluded.tags,
    token_count = excluded.token_count;`;
});

const migration = `-- Sequence 4 Saint-threshold bridge for all 22 pathways (issue #99 follow-up)
-- Generated from canonical TS source via scripts/generate-seq4-migration.ts
-- narratorOnly is a TS-only prompt flag and is intentionally not persisted.

${lines.join("\n\n")}
`;

console.log(migration);
