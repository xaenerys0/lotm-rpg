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
          epoch: number | null;
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
          epoch?: number | null;
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
          epoch?: number | null;
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
      journal_entries: {
        // Auto-recorded story journal events (issue #11). Owner-only RLS.
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          character_id: string;
          character_name: string | null;
          turn_number: number;
          event_type: string;
          summary: string;
          narrative: string;
          location: string;
          involved_npcs: string[];
          arc: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          session_id: string;
          character_id: string;
          character_name?: string | null;
          turn_number: number;
          event_type: string;
          summary: string;
          narrative?: string;
          location?: string;
          involved_npcs?: string[];
          arc?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          character_id?: string;
          character_name?: string | null;
          turn_number?: number;
          event_type?: string;
          summary?: string;
          narrative?: string;
          location?: string;
          involved_npcs?: string[];
          arc?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      journal_annotations: {
        // Player-only notes (issue #11). NEVER included in AI context.
        Row: {
          id: string;
          user_id: string;
          entry_id: string;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          entry_id: string;
          text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_id?: string;
          text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      world_messages: {
        // Template-composed shared messages (issue #17). Shared read.
        Row: {
          id: string;
          user_id: string;
          location: string;
          template_id: string;
          fills: Json;
          text: string;
          helpful: number;
          unhelpful: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location: string;
          template_id: string;
          fills?: Json;
          text: string;
          helpful?: number;
          unhelpful?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location?: string;
          template_id?: string;
          fills?: Json;
          text?: string;
          helpful?: number;
          unhelpful?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      world_message_votes: {
        // One vote per player per message; written via rate_world_message.
        Row: {
          message_id: string;
          user_id: string;
          helpful: boolean;
          created_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          helpful: boolean;
          created_at?: string;
        };
        Update: {
          message_id?: string;
          user_id?: string;
          helpful?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      market_listings: {
        // Player trading post (issue #16). Purchases only via purchase_listing.
        Row: {
          id: string;
          seller_id: string;
          item: Json;
          price: number;
          status: string;
          created_at: string;
          expires_at: string;
          sold_to: string | null;
          sold_at: string | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          item: Json;
          price: number;
          status?: string;
          created_at?: string;
          expires_at?: string;
          sold_to?: string | null;
          sold_at?: string | null;
        };
        Update: {
          id?: string;
          seller_id?: string;
          item?: Json;
          price?: number;
          status?: string;
          created_at?: string;
          expires_at?: string;
          sold_to?: string | null;
          sold_at?: string | null;
        };
        Relationships: [];
      };
      game_sessions: {
        // Cloud-synced character saves (cross-device sync). The full
        // serialized GameSession as jsonb; owner-scoped by RLS. is_active is
        // the active-character pointer, flipped via set_active_session.
        Row: {
          id: string;
          user_id: string;
          data: Json;
          is_active: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          data: Json;
          is_active?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: Json;
          is_active?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      world_memory: {
        // Cloud-synced cross-timeline world memory (legacies + echoes). One
        // row per user; both arrays read/written wholesale by the engine.
        Row: {
          user_id: string;
          legacies: Json;
          echoes: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          legacies?: Json;
          echoes?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          legacies?: Json;
          echoes?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        // Cloud-synced display preferences + hint dismissals (cross-device).
        Row: {
          user_id: string;
          preferences: Json;
          dismissed_hints: string[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferences?: Json;
          dismissed_hints?: string[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferences?: Json;
          dismissed_hints?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      player_showcases: {
        // Published player profiles (issue #18). Public rows world-readable.
        Row: {
          user_id: string;
          display_name: string;
          public: boolean;
          pathway_id: number;
          sequence_level: number;
          achievement_ids: string[];
          divergence_score: number;
          stats: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string;
          public?: boolean;
          pathway_id: number;
          sequence_level: number;
          achievement_ids?: string[];
          divergence_score?: number;
          stats?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string;
          public?: boolean;
          pathway_id?: number;
          sequence_level?: number;
          achievement_ids?: string[];
          divergence_score?: number;
          stats?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_active_session: {
        Args: { p_id: string };
        Returns: undefined;
      };
      purchase_listing: {
        Args: { p_listing_id: string };
        Returns: Json;
      };
      rate_world_message: {
        Args: { p_message_id: string; p_helpful: boolean };
        Returns: undefined;
      };
      check_rate_limit: {
        Args: {
          p_bucket: string;
          p_max_requests: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
      match_source_chunks: {
        Args: {
          p_query_embedding: string;
          p_query_text: string;
          p_model_id: string;
          p_player_position?: number | null;
          p_epoch?: number | null;
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
          epoch: number | null;
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
