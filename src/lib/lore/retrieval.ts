import type { EmbeddingProvider } from "@/lib/ai/embeddings";
import { AIError } from "@/lib/ai/errors";
import type { Database, SourceChunkSourceEnum } from "@/lib/types/database";

import { passesEpochGate } from "./epochs";

// ---------------------------------------------------------------------------
// Runtime retrieval (issue #63, sub-issue of #57)
// ---------------------------------------------------------------------------
//
// The query-time path: embed the player's query with the save's LOCKED
// embedding model, call the gated `match_source_chunks` RPC, and return the
// top-k chunks. This EXTENDS the curated `lore_entries` injection — curated
// guardrails are still selected and injected first (issue #64); retrieved
// chunks fill the remaining budget.
//
// Safety properties, in order of importance:
//   - Timeline gate: the player's current shared-timeline position rides into
//     the RPC (`canon_order <= position`), so the narrator sees past + present
//     world-state but never the player's future. Enforced server-side; this
//     module re-checks client-side as defense in depth.
//   - Epoch gate: the character's epoch rides into the RPC (`sc.epoch is null OR
//     sc.epoch = epoch`), so a non-Fifth character never retrieves Fifth-Epoch
//     canon chunks — only universal (untagged) chunks and its own epoch's. Same
//     server-enforced + client-rechecked shape as the timeline gate.
//   - Concealment gate: `concealment_tier <= maxConcealmentTier`, same shape.
//   - Per-character model lock: the embedding model is chosen at character
//     creation and locked for that save (a query vector only compares to
//     corpus vectors from the same model's map). `retrieveChunks` refuses an
//     embedder whose model does not match the lock.
//   - Determinism: pinned model + the RPC's deterministic RRF tie-breaks; the
//     caller records the returned chunk ids on the turn record so "why did the
//     narrator say X" stays answerable without vector-search forensics.

type MatchSourceChunksFn = Database["public"]["Functions"]["match_source_chunks"];

/** One retrieved chunk — the `match_source_chunks` row shape. */
export type RetrievedChunk = MatchSourceChunksFn["Returns"][number];

/** The RPC seam, injectable so the module stays pure and testable. */
export type MatchSourceChunksRpc = (
  args: MatchSourceChunksFn["Args"],
) => Promise<RetrievedChunk[]>;

/** Minimal structural slice of a Supabase client's `rpc` method. */
export interface SupabaseRpcClient {
  rpc(
    fn: "match_source_chunks",
    args: MatchSourceChunksFn["Args"],
  ): PromiseLike<{ data: RetrievedChunk[] | null; error: { message: string } | null }>;
}

/** Default top-k, mirroring the RPC's own `p_match_count` default. */
export const DEFAULT_RETRIEVAL_COUNT = 10;

/** Serialize a vector into pgvector's text literal form (`[x,y,z]`). */
export function toPgVector(vector: readonly number[]): string {
  return `[${vector.join(",")}]`;
}

export interface RetrieveChunksOptions {
  /** Embedding provider for the query vector — its model MUST match the lock. */
  embedder: EmbeddingProvider;
  /** The gated RPC (wrap a Supabase client via {@link createSupabaseChunkMatcher}). */
  rpc: MatchSourceChunksRpc;
  /** The save's locked embedding model id (chosen at character creation). */
  lockedModelId: string;
  /**
   * The player's current shared-timeline position for the timeline gate
   * (`canon_order <= position`). `null` means no limit — operator/eval use
   * only, never a player-visible path.
   */
  canonPosition: number | null;
  /**
   * The character's epoch for the epoch gate (untagged chunks always pass; a
   * tagged chunk passes only on exact match). `null` means no limit —
   * operator/eval use only, never a player-visible path.
   */
  epoch?: number | null;
  /** Concealment gate ceiling (default 0 — only unconcealed lore). */
  maxConcealmentTier?: number;
  /** Optional source filter (e.g. `["novel"]`). */
  sources?: SourceChunkSourceEnum[] | null;
  /** Optional tag overlap filter. */
  tags?: string[] | null;
  /** Top-k (default {@link DEFAULT_RETRIEVAL_COUNT}). */
  count?: number;
}

/**
 * Embed `query` with the locked model and retrieve the top-k gated chunks.
 * Results come back in the RPC's deterministic fused order.
 */
export async function retrieveChunks(
  query: string,
  options: RetrieveChunksOptions,
): Promise<RetrievedChunk[]> {
  const { embedder, rpc, lockedModelId, canonPosition } = options;
  const maxConcealmentTier = options.maxConcealmentTier ?? 0;
  // `null` (and absent) means "no epoch limit" — mirrors the SQL `p_epoch is null`
  // branch, used by the eval/operator path. A real character always passes a
  // concrete epoch.
  const epoch = options.epoch ?? null;

  // Per-character model lock: a query vector from any other model would be
  // searched against the wrong map and return garbage similarities.
  if (embedder.model_id !== lockedModelId) {
    throw new AIError(
      "VALIDATION_FAILED",
      `Embedding model "${embedder.model_id}" does not match this save's locked model "${lockedModelId}". The embedding model is fixed at character creation.`,
    );
  }

  const [vector] = await embedder.embed([query]);
  const rows = await rpc({
    p_query_embedding: toPgVector(vector),
    p_query_text: query,
    p_model_id: lockedModelId,
    p_player_position: canonPosition,
    p_epoch: epoch,
    p_max_concealment_tier: maxConcealmentTier,
    p_sources: options.sources ?? null,
    p_tags: options.tags ?? null,
    p_match_count: options.count ?? DEFAULT_RETRIEVAL_COUNT,
  });

  // Defense in depth: the gates are enforced inside the RPC, but a chunk that
  // somehow arrives past its gate is dropped here too rather than narrated. The
  // epoch check matches the SQL exactly: a null limit lets every row through.
  return rows.filter(
    (row) =>
      passesTimelineGate(row.canon_order, canonPosition) &&
      (epoch === null || passesEpochGate(row.epoch, epoch)) &&
      row.concealment_tier <= maxConcealmentTier,
  );
}

/** The ids to record on the turn record (determinism/debuggability). */
export function retrievalChunkIds(chunks: readonly RetrievedChunk[]): string[] {
  return chunks.map((chunk) => chunk.id);
}

/** Wrap a Supabase client into the injectable RPC seam. */
export function createSupabaseChunkMatcher(
  client: SupabaseRpcClient,
): MatchSourceChunksRpc {
  return async (args) => {
    const { data, error } = await client.rpc("match_source_chunks", args);
    if (error) {
      throw new AIError("PROVIDER_ERROR", `Chunk retrieval failed: ${error.message}`);
    }
    return data ?? [];
  };
}

// --- internals ---------------------------------------------------------------

/** Timeless chunks (no canon order) always pass; a null position means no
 * limit (operator/eval use). Mirrors the SQL gate exactly. */
function passesTimelineGate(canonOrder: number | null, position: number | null): boolean {
  return position === null || canonOrder === null || canonOrder <= position;
}
