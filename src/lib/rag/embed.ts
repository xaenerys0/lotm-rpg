import type { ChunkRecord } from "./types";

// ---------------------------------------------------------------------------
// Offline embed stage (issue #60)
// ---------------------------------------------------------------------------
//
//   parse -> normalize -> chunk -> [embed] -> load
//
// Fills each ChunkRecord.embedding by running its content through one approved
// model. Run the pass once PER model (qwen3-embedding-0.6b, then bge-m3); each
// pass emits a model-specific JSONL that the load stage upserts into
// `chunk_embeddings` keyed by `model_id` — that is how the separate maps coexist.
//
// This is operator-offline batch work (~120 MB + a few CPU-hours per model,
// one-time), never an always-on ingest service. It is deterministic given a
// deterministic, pinned provider, and order-preserving so ids line up with the
// chunk artifact.

/**
 * The slice of an embedding provider the embed stage needs — declared locally so
 * the RAG core stays decoupled from the runtime AI module. `@/lib/ai`'s
 * `EmbeddingProvider` satisfies this structurally; the concrete provider is wired
 * in the `scripts/rag/embed.ts` driver.
 */
export interface ChunkEmbedder {
  /** Embed a batch of texts → one vector each, order-preserving. */
  embed(texts: string[]): Promise<number[][]>;
}

/** Texts per `embed()` request — keeps each batch within the model's context. */
export const DEFAULT_EMBED_BATCH_SIZE = 32;

export interface EmbedChunksOptions {
  /** Override the per-request batch size (default {@link DEFAULT_EMBED_BATCH_SIZE}). */
  batchSize?: number;
}

/**
 * Embed every chunk's content with `provider`, returning new records with
 * `embedding` filled (inputs are left untouched). One model per call.
 */
export async function embedChunks(
  records: readonly ChunkRecord[],
  provider: ChunkEmbedder,
  options: EmbedChunksOptions = {},
): Promise<ChunkRecord[]> {
  const batchSize = options.batchSize ?? DEFAULT_EMBED_BATCH_SIZE;
  if (batchSize < 1) {
    throw new Error(`embedChunks batchSize must be >= 1 (got ${batchSize}).`);
  }

  const out: ChunkRecord[] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const vectors = await provider.embed(batch.map((record) => record.content));
    if (vectors.length !== batch.length) {
      throw new Error(
        `Embedder returned ${vectors.length} vectors for ${batch.length} chunks.`,
      );
    }
    batch.forEach((record, j) => out.push({ ...record, embedding: vectors[j] }));
  }
  return out;
}
