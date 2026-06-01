@../../../docs/rules/testing.md

# RAG Ingestion Core

The source-agnostic core of the RAG ingestion pipeline (issue #59, sub-issue of
#57). Defines the canonical JSONL chunk artifact, the stage contract, and the
**shared chunker** that the novel (#5) and wiki (#4) pipelines both use, so the
two sources never diverge.

This module is **dev/ingestion-only** — nothing under `src/app` or the runtime
retrieval path imports it. Runtime retrieval goes through the
`match_source_chunks` RPC (RAG #1, migration `20260601120000`), not this code.

## Structure

- `types.ts` — Canonical artifact (`ChunkRecord`), chunker input (`SourceDocument`),
  the `ChunkRef` locator, the stage contract (`RAG_STAGES`), and tuning constants
  (`RAG_CHUNK_MIN_TOKENS` 300, `RAG_CHUNK_MAX_TOKENS` 800, `RAG_CHUNK_OVERLAP_RATIO`
  0.125, `DEFAULT_CONCEALMENT_TIER`).
- `tokenizer.ts` — `countTokens`, a thin wrapper over `gpt-tokenizer` (a **dev-only**
  dependency, kept out of the app bundle). A deterministic sizing heuristic — it
  need not match the embedding model's BPE.
- `chunk.ts` — The shared chunker: `splitSentences`, `chunkDocument`, `chunkDocuments`.
- `embed.ts` — The offline embed stage (issue #60): `embedChunks(records, embedder, {batchSize?})`
  fills each `ChunkRecord.embedding`. Run once **per model** (qwen3-embedding-0.6b, then
  bge-m3) to build each map; order-preserving and deterministic given a pinned embedder. It
  takes a minimal local `ChunkEmbedder` contract (`embed(texts)`) — declared here so the core
  stays decoupled from the runtime AI module; `@/lib/ai`'s `EmbeddingProvider` satisfies it
  structurally and is wired in the `scripts/rag/embed.ts` driver. Operator-offline batch work,
  never an always-on service.
- `jsonl.ts` — `parseJsonl` / `iterateJsonl` / `toJsonl` — the JSONL read/write seam
  shared by every pipeline stage.
- `index.ts` — Public exports.
- `chunk.test.ts` / `tokenizer.test.ts` / `jsonl.test.ts` — colocated tests.
- `__fixtures__/` — Golden fixtures: `normalized-docs.jsonl` (input) →
  `chunks.expected.jsonl` (expected chunker output). Regenerate the expected file
  via the chunk stage if the chunker changes intentionally.

## The canonical artifact (JSONL)

One `ChunkRecord` per line — diffable in git, streamable, and re-embeddable without
re-parsing. Field casing mirrors the issue spec: `tokenCount` is camelCase; the four
chronology/concealment signals (`canon_order`, `arc_bucket`, `concealment_tier`,
`in_world_date`) are snake_case so they map 1:1 onto the `source_chunks` columns at
load time. `embedding` is `null` until the embed stage (#3) fills it.

## The stage contract

```
parse → normalize → chunk → embed → load
```

Each stage reads and writes JSONL, so any stage re-runs in isolation (e.g. re-embed
with a new model without re-parsing or re-chunking). The **chunk** stage
(`scripts/rag/chunk.ts`, `pnpm rag:chunk`) and the **embed** stage
(`scripts/rag/embed.ts`, `pnpm rag:embed`, issue #60) live here. The remaining stages
land in later RAG issues (#4 wiki parse/normalize, #5 novel parse/normalize, load).

## Chunker guarantees

- Target window **300–800 tokens**, packed greedily up to the ceiling.
- **~10–15% overlap** carried as whole trailing sentences (never a torn fact).
- **Sentences are atomic** — a fact is never split across a boundary. The lone
  exception is a single sentence larger than the window, which is word-windowed.
- The **four chronology/concealment signals are carried onto every chunk** —
  correctness here is a hard requirement (the retrieval timeline + concealment
  gates depend on it).
- **Deterministic, position-derived ids** (`<source>-<refKey>-<index>`) so output
  is diffable and the embed/load stages can match rows without re-parsing.

## Conventions

- The chunker is pure: it takes an injectable `TokenCounter` (default = the real
  tokenizer) so the algorithm is testable without the BPE dependency.
- Parsers/chunkers are the risky code (issue #57 §8): keep them under **golden
  fixture tests** (JSONL in → expected JSONL out) in addition to the 95% mandate.
