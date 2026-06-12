export type { LoreCategory, LoreEntry } from "./types";

export { selectCuratedLore } from "./selection";
export {
  getGlossaryTerm,
  glossaryForSequence,
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  sealedTermCount,
  type GlossaryCategory,
  type GlossaryTerm,
} from "./glossary";

export {
  createSupabaseChunkMatcher,
  DEFAULT_RETRIEVAL_COUNT,
  retrievalChunkIds,
  retrieveChunks,
  toPgVector,
  type MatchSourceChunksRpc,
  type RetrieveChunksOptions,
  type RetrievedChunk,
  type SupabaseRpcClient,
} from "./retrieval";

export { TINGEN_LORE } from "./tingen";
export { FIFTH_EPOCH_LORE } from "./fifth-epoch";
export { ORGANIZATION_LORE } from "./organizations";
export { NPC_LORE } from "./npcs";
export { FOOL_PATHWAY_LORE } from "./pathway-fool";
export { VISIONARY_PATHWAY_LORE } from "./pathway-visionary";
export { SUN_PATHWAY_LORE } from "./pathway-sun";
export { DEATH_PATHWAY_LORE } from "./pathway-death";

import type { LoreEntry } from "./types";
import { TINGEN_LORE } from "./tingen";
import { FIFTH_EPOCH_LORE } from "./fifth-epoch";
import { ORGANIZATION_LORE } from "./organizations";
import { NPC_LORE } from "./npcs";
import { FOOL_PATHWAY_LORE } from "./pathway-fool";
import { VISIONARY_PATHWAY_LORE } from "./pathway-visionary";
import { SUN_PATHWAY_LORE } from "./pathway-sun";
import { DEATH_PATHWAY_LORE } from "./pathway-death";

export const ALL_LORE_ENTRIES: LoreEntry[] = [
  ...TINGEN_LORE,
  ...FIFTH_EPOCH_LORE,
  ...ORGANIZATION_LORE,
  ...NPC_LORE,
  ...FOOL_PATHWAY_LORE,
  ...VISIONARY_PATHWAY_LORE,
  ...SUN_PATHWAY_LORE,
  ...DEATH_PATHWAY_LORE,
];

export function getLoreByCategory(category: LoreEntry["category"]): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.category === category);
}

export function getLoreByPathway(pathway: string): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.pathway === pathway);
}

export function getLoreByCity(city: string): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.city === city);
}

export function getLoreByEpoch(epoch: number): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.epoch === epoch);
}

export function getLoreBySlug(slug: string): LoreEntry | undefined {
  return ALL_LORE_ENTRIES.find((e) => e.slug === slug);
}

export function getLoreByTag(tag: string): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.tags.includes(tag));
}

export function getLoreByNpc(npcName: string): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.npcs.includes(npcName));
}

export function getLoreBySequence(level: number): LoreEntry[] {
  return ALL_LORE_ENTRIES.filter((e) => e.sequences.includes(level));
}
