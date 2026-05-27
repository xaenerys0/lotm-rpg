export type LoreCategory =
  | "pathway"
  | "npc"
  | "location"
  | "event"
  | "organization"
  | "metaphysics";

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
