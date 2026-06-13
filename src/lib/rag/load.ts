import { createHash } from "node:crypto";

import type { Database } from "@/lib/types/database";

import type { ChunkRecord } from "./types";

// ---------------------------------------------------------------------------
// Load stage (closes the #57 stage contract)
// ---------------------------------------------------------------------------
//
//   parse -> normalize -> chunk -> embed -> [load]
//
// Pure row-mapping for the upsert into `source_chunks` / `chunk_embeddings`.
// The pipeline's deterministic chunk id ("novel-ch0042-0001") is hashed into a
// stable RFC-4122 v5-style UUID so re-running the load stage UPDATES rows
// instead of duplicating them — no schema change, fully idempotent — and the
// pipeline id itself is preserved in `ref.chunk_key` for provenance. The
// Supabase write loop lives in the thin `scripts/rag/load.ts` driver.

type SourceChunkInsert = Database["public"]["Tables"]["source_chunks"]["Insert"];
type ChunkEmbeddingInsert = Database["public"]["Tables"]["chunk_embeddings"]["Insert"];

// Fixed namespace for this corpus (a UUIDv4 minted once for the project).
const CHUNK_UUID_NAMESPACE = "8b6f9a3e-5f1c-4d6a-9b2e-7c4a1d0e8f53";

/**
 * Deterministic UUID (v5 semantics: SHA-1 of namespace + name) for a pipeline
 * chunk id. Stable across re-chunks and re-loads, so the embed/load stages can
 * upsert without re-parsing the sources.
 */
export function chunkUuid(pipelineId: string): string {
  const hash = createHash("sha1")
    .update(uuidBytes(CHUNK_UUID_NAMESPACE))
    .update(pipelineId, "utf8")
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Map a pipeline record onto a `source_chunks` upsert row. */
export function toSourceChunkRow(record: ChunkRecord): SourceChunkInsert {
  return {
    id: chunkUuid(record.id),
    source: record.source,
    title: record.title,
    // Keep the pipeline id alongside the source locator for provenance.
    ref: { ...record.ref, chunk_key: record.id },
    content: record.content,
    tags: record.tags,
    token_count: record.tokenCount,
    canon_order: record.canon_order,
    arc_bucket: record.arc_bucket,
    concealment_tier: record.concealment_tier,
    in_world_date: record.in_world_date,
  };
}

/**
 * Map an embedded pipeline record onto a `chunk_embeddings` upsert row for one
 * model's map. Throws when the record has not been through the embed stage —
 * loading a null vector would poison the map.
 */
export function toEmbeddingRow(
  record: ChunkRecord,
  modelId: string,
  dims: number = 1024,
): ChunkEmbeddingInsert {
  if (record.embedding === null) {
    throw new Error(
      `Chunk "${record.id}" has no embedding — run the embed stage (pnpm rag:embed --model ${modelId}) first.`,
    );
  }
  if (record.embedding.length !== dims) {
    throw new Error(
      `Chunk "${record.id}" has a ${record.embedding.length}-dim embedding; expected ${dims}.`,
    );
  }
  return {
    chunk_id: chunkUuid(record.id),
    model_id: modelId,
    embedding: `[${record.embedding.join(",")}]`,
  };
}

// --- internals ---------------------------------------------------------------

function uuidBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}
