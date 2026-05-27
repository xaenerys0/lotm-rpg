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
}
