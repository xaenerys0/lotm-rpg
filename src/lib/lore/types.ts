import type { LoreCategoryEnum } from "@/lib/types/database";

export type LoreCategory = LoreCategoryEnum;

export interface LoreEntry {
  slug: string;
  title: string;
  category: LoreCategory;
  content: string;
  pathway?: string;
  epoch?: number;
  city?: string;
  npcs: string[];
  sequences: number[];
  tags: string[];
  tokenCount: number;
  // When undefined or true: the AI uses this for narrator accuracy but should not
  // treat it as information the player character already possesses. Set to false
  // only for entries describing genuinely public knowledge (geography, era context).
  narratorOnly?: boolean;
}
