export type { LoreCategory, LoreEntry } from "./types";

export { selectCuratedLore } from "./selection";
export {
  epochNarrationDirective,
  epochOpeningBeat,
  getEpoch,
  DEFAULT_EPOCH_ID,
  EPOCHS,
  type Epoch,
} from "./epochs";
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
export { cityNarrationDirective } from "./narration";

export { TINGEN_LORE } from "./tingen";
export { BACKLUND_LORE } from "./backlund";
export { TRIER_LORE } from "./trier";
export { BAYAM_LORE } from "./bayam";
export { FIFTH_EPOCH_LORE } from "./fifth-epoch";
export { ORGANIZATION_LORE } from "./organizations";
export { NPC_LORE } from "./npcs";
export { FOOL_PATHWAY_LORE } from "./pathway-fool";
export { VISIONARY_PATHWAY_LORE } from "./pathway-visionary";
export { SUN_PATHWAY_LORE } from "./pathway-sun";
export { DEATH_PATHWAY_LORE } from "./pathway-death";
export { DARKNESS_PATHWAY_LORE } from "./pathway-darkness";
export { TYRANT_PATHWAY_LORE } from "./pathway-tyrant";
export { DOOR_PATHWAY_LORE } from "./pathway-door";
export { ERROR_PATHWAY_LORE } from "./pathway-error";
export { HANGED_MAN_PATHWAY_LORE } from "./pathway-hanged-man";
export { WHITE_TOWER_PATHWAY_LORE } from "./pathway-white-tower";
export { TWILIGHT_GIANT_PATHWAY_LORE } from "./pathway-twilight-giant";
export { JUSTICIAR_PATHWAY_LORE } from "./pathway-justiciar";
export { BLACK_EMPEROR_PATHWAY_LORE } from "./pathway-black-emperor";
export { RED_PRIEST_PATHWAY_LORE } from "./pathway-red-priest";
export { DEMONESS_PATHWAY_LORE } from "./pathway-demoness";
export { MOTHER_PATHWAY_LORE } from "./pathway-mother";
export { MOON_PATHWAY_LORE } from "./pathway-moon";
export { HERMIT_PATHWAY_LORE } from "./pathway-hermit";
export { PARAGON_PATHWAY_LORE } from "./pathway-paragon";
export { WHEEL_OF_FORTUNE_PATHWAY_LORE } from "./pathway-wheel-of-fortune";
export { ABYSS_PATHWAY_LORE } from "./pathway-abyss";
export { CHAINED_PATHWAY_LORE } from "./pathway-chained";

import type { LoreEntry } from "./types";
import { TINGEN_LORE } from "./tingen";
import { BACKLUND_LORE } from "./backlund";
import { TRIER_LORE } from "./trier";
import { BAYAM_LORE } from "./bayam";
import { FIFTH_EPOCH_LORE } from "./fifth-epoch";
import { ORGANIZATION_LORE } from "./organizations";
import { NPC_LORE } from "./npcs";
import { FOOL_PATHWAY_LORE } from "./pathway-fool";
import { VISIONARY_PATHWAY_LORE } from "./pathway-visionary";
import { SUN_PATHWAY_LORE } from "./pathway-sun";
import { DEATH_PATHWAY_LORE } from "./pathway-death";
import { DARKNESS_PATHWAY_LORE } from "./pathway-darkness";
import { TYRANT_PATHWAY_LORE } from "./pathway-tyrant";
import { DOOR_PATHWAY_LORE } from "./pathway-door";
import { ERROR_PATHWAY_LORE } from "./pathway-error";
import { HANGED_MAN_PATHWAY_LORE } from "./pathway-hanged-man";
import { WHITE_TOWER_PATHWAY_LORE } from "./pathway-white-tower";
import { TWILIGHT_GIANT_PATHWAY_LORE } from "./pathway-twilight-giant";
import { JUSTICIAR_PATHWAY_LORE } from "./pathway-justiciar";
import { BLACK_EMPEROR_PATHWAY_LORE } from "./pathway-black-emperor";
import { RED_PRIEST_PATHWAY_LORE } from "./pathway-red-priest";
import { DEMONESS_PATHWAY_LORE } from "./pathway-demoness";
import { MOTHER_PATHWAY_LORE } from "./pathway-mother";
import { MOON_PATHWAY_LORE } from "./pathway-moon";
import { HERMIT_PATHWAY_LORE } from "./pathway-hermit";
import { PARAGON_PATHWAY_LORE } from "./pathway-paragon";
import { WHEEL_OF_FORTUNE_PATHWAY_LORE } from "./pathway-wheel-of-fortune";
import { ABYSS_PATHWAY_LORE } from "./pathway-abyss";
import { CHAINED_PATHWAY_LORE } from "./pathway-chained";

export const ALL_LORE_ENTRIES: LoreEntry[] = [
  ...TINGEN_LORE,
  ...BACKLUND_LORE,
  ...TRIER_LORE,
  ...BAYAM_LORE,
  ...FIFTH_EPOCH_LORE,
  ...ORGANIZATION_LORE,
  ...NPC_LORE,
  ...FOOL_PATHWAY_LORE,
  ...VISIONARY_PATHWAY_LORE,
  ...SUN_PATHWAY_LORE,
  ...DEATH_PATHWAY_LORE,
  ...DARKNESS_PATHWAY_LORE,
  ...TYRANT_PATHWAY_LORE,
  ...DOOR_PATHWAY_LORE,
  ...ERROR_PATHWAY_LORE,
  ...HANGED_MAN_PATHWAY_LORE,
  ...WHITE_TOWER_PATHWAY_LORE,
  ...TWILIGHT_GIANT_PATHWAY_LORE,
  ...JUSTICIAR_PATHWAY_LORE,
  ...BLACK_EMPEROR_PATHWAY_LORE,
  ...RED_PRIEST_PATHWAY_LORE,
  ...DEMONESS_PATHWAY_LORE,
  ...MOTHER_PATHWAY_LORE,
  ...MOON_PATHWAY_LORE,
  ...HERMIT_PATHWAY_LORE,
  ...PARAGON_PATHWAY_LORE,
  ...WHEEL_OF_FORTUNE_PATHWAY_LORE,
  ...ABYSS_PATHWAY_LORE,
  ...CHAINED_PATHWAY_LORE,
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
