import type { SourceChunkSourceEnum } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Canonical intermediate artifact (issue #59)
// ---------------------------------------------------------------------------
//
// The whole ingestion pipeline communicates in one line-delimited JSON (JSONL)
// shape so the novel and wiki pipelines never diverge, every stage is
// independently re-runnable, and the artifact is diffable in git and
// re-embeddable without re-parsing the sources.
//
// Field casing intentionally mirrors the issue spec: `tokenCount` is camelCase
// (a pipeline-computed value) while the four chronology/concealment signals
// (`canon_order`, `arc_bucket`, `concealment_tier`, `in_world_date`) are
// snake_case so they map 1:1 onto the `source_chunks` columns at load time
// (RAG #1 / migration `20260601120000_create_source_chunks_rag.sql`).

/** Source-shaped locator carried verbatim from the source document. */
export type ChunkRef = Record<string, string | number>;

/**
 * One record per chunk — the canonical artifact emitted by the chunk stage and
 * consumed by the embed and load stages. `embedding` is `null` until the embed
 * stage fills it, so chunking and embedding are independently re-runnable.
 */
export interface ChunkRecord {
  /** Deterministic, position-derived id — stable across re-chunks so the embed
   * and load stages can diff/upsert without re-parsing the source. */
  id: string;
  source: SourceChunkSourceEnum;
  title: string;
  ref: ChunkRef;
  content: string;
  tags: string[];
  tokenCount: number;
  // Four chronology/concealment signals — carried per chunk from the source
  // document. Correctness here is a hard requirement: the retrieval RPC's
  // timeline gate (`canon_order <= player_position`) and concealment gate
  // depend on it.
  canon_order: number | null;
  arc_bucket: string | null;
  concealment_tier: number;
  in_world_date: string | null;
  /** Filled by the embed stage; `null` straight out of the chunker. */
  embedding: number[] | null;
}

/**
 * A normalized, cleaned source document — the output of the normalize stage and
 * the input to the shared chunker. The chunker derives one or more
 * {@link ChunkRecord}s from it, carrying the chronology metadata onto each.
 */
export interface SourceDocument {
  source: SourceChunkSourceEnum;
  title: string;
  ref: ChunkRef;
  /** Normalized UTF-8 text with sentence boundaries intact. */
  content: string;
  tags?: string[];
  canon_order?: number | null;
  arc_bucket?: string | null;
  concealment_tier?: number;
  in_world_date?: string | null;
}

// ---------------------------------------------------------------------------
// Stage contract (issue #59)
// ---------------------------------------------------------------------------
//
//   parse -> normalize -> chunk -> embed -> load
//
// Each stage reads and writes JSONL so any stage can be re-run in isolation
// without redoing the ones before it (e.g. re-embed with a new model without
// re-parsing or re-chunking). Per-source guts land in later issues:
//   - parse/normalize: wiki (#4) and novel (#5)
//   - embed:           model-keyed embedding pass (#3)
//   - load:            upsert into source_chunks / chunk_embeddings
// The chunk stage — the shared, source-agnostic core — lives here (#59).
export const RAG_STAGES = ["parse", "normalize", "chunk", "embed", "load"] as const;

export type RagStage = (typeof RAG_STAGES)[number];

// ---------------------------------------------------------------------------
// Chunker tuning (resolved in #57's thread)
// ---------------------------------------------------------------------------

/** Lower bound of the target chunk window (tokens). */
export const RAG_CHUNK_MIN_TOKENS = 300;
/** Upper bound of the target chunk window (tokens). */
export const RAG_CHUNK_MAX_TOKENS = 800;
/** Inter-chunk overlap, as a fraction of the max window (~12.5%, mid 10–15%). */
export const RAG_CHUNK_OVERLAP_RATIO = 0.125;
/** Default spoiler tier when a source document does not specify one. */
export const DEFAULT_CONCEALMENT_TIER = 0;
/**
 * Highest valid spoiler tier. The novel arc map runs 0 (public) → 4 (the final
 * Fool arc); the load stage rejects anything outside [0, this] so a mistyped
 * tier can never silently leak deep-spoiler corpus past the concealment gate.
 */
export const MAX_CONCEALMENT_TIER = 4;

/** Counts tokens in a string. Injectable so the chunker stays pure/testable. */
export type TokenCounter = (text: string) => number;

/** Optional overrides for {@link import("./chunk").chunkDocument}. */
export interface ChunkOptions {
  minTokens?: number;
  maxTokens?: number;
  overlapRatio?: number;
  countTokens?: TokenCounter;
}
