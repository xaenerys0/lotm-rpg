export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LoreCategoryEnum =
  | "pathway"
  | "npc"
  | "location"
  | "event"
  | "organization"
  | "metaphysics";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lore_entries: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: LoreCategoryEnum;
          content: string;
          pathway: string | null;
          epoch: number | null;
          city: string | null;
          npcs: string[];
          sequences: number[];
          tags: string[];
          token_count: number;
          embedding: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category: LoreCategoryEnum;
          content: string;
          pathway?: string | null;
          epoch?: number | null;
          city?: string | null;
          npcs?: string[];
          sequences?: number[];
          tags?: string[];
          token_count: number;
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category?: LoreCategoryEnum;
          content?: string;
          pathway?: string | null;
          epoch?: number | null;
          city?: string | null;
          npcs?: string[];
          sequences?: number[];
          tags?: string[];
          token_count?: number;
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lore_category: LoreCategoryEnum;
    };
  };
}
