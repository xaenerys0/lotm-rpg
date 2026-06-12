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

export type SourceChunkSourceEnum = "novel" | "wiki" | "curated";

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
        Relationships: [];
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
        Relationships: [];
      };
      source_chunks: {
        // Private RAG corpus. No direct client query path (RLS denies
        // anon/authenticated); reads go only through match_source_chunks.
        Row: {
          id: string;
          source: SourceChunkSourceEnum;
          title: string;
          ref: Json;
          content: string;
          tags: string[];
          token_count: number;
          canon_order: number | null;
          arc_bucket: string | null;
          concealment_tier: number;
          in_world_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source: SourceChunkSourceEnum;
          title: string;
          ref?: Json;
          content: string;
          tags?: string[];
          token_count: number;
          canon_order?: number | null;
          arc_bucket?: string | null;
          concealment_tier?: number;
          in_world_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: SourceChunkSourceEnum;
          title?: string;
          ref?: Json;
          content?: string;
          tags?: string[];
          token_count?: number;
          canon_order?: number | null;
          arc_bucket?: string | null;
          concealment_tier?: number;
          in_world_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chunk_embeddings: {
        // Model-keyed vector store: one row per (chunk, model).
        // pgvector serializes as a string, matching the lore_entries convention.
        Row: {
          chunk_id: string;
          model_id: string;
          embedding: string;
          created_at: string;
        };
        Insert: {
          chunk_id: string;
          model_id: string;
          embedding: string;
          created_at?: string;
        };
        Update: {
          chunk_id?: string;
          model_id?: string;
          embedding?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_source_chunks: {
        Args: {
          p_query_embedding: string;
          p_query_text: string;
          p_model_id: string;
          p_player_position?: number | null;
          p_max_concealment_tier?: number;
          p_sources?: SourceChunkSourceEnum[] | null;
          p_tags?: string[] | null;
          p_match_count?: number;
          p_rrf_k?: number;
        };
        Returns: {
          id: string;
          source: SourceChunkSourceEnum;
          title: string;
          ref: Json;
          content: string;
          tags: string[];
          token_count: number;
          canon_order: number | null;
          arc_bucket: string | null;
          concealment_tier: number;
          in_world_date: string | null;
          fts_rank: number | null;
          vec_rank: number | null;
          rrf_score: number;
        }[];
      };
    };
    Enums: {
      lore_category: LoreCategoryEnum;
      source_chunk_source: SourceChunkSourceEnum;
    };
    CompositeTypes: Record<string, never>;
  };
}
