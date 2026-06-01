# RAG Pipeline Stage Drivers

Thin CLI drivers for the RAG ingestion pipeline (issue #57). All real logic lives
in the tested `src/lib/rag` core; these scripts are only JSONL plumbing. They run
with `tsx` (a dev dependency) and are **never** part of the app bundle.

## Stage contract

```
parse → normalize → chunk → embed → load
```

Each stage reads and writes JSONL (the canonical `ChunkRecord` / `SourceDocument`
artifact), so any stage is independently re-runnable — e.g. re-embed with a new
model without re-parsing or re-chunking.

## Drivers

- `chunk.ts` (`pnpm rag:chunk`) — the **chunk** stage (issue #59). Reads normalized
  `SourceDocument` JSONL and writes `ChunkRecord` JSONL via `chunkDocuments`.
  - `pnpm rag:chunk < normalized-docs.jsonl > chunks.jsonl`
  - `pnpm rag:chunk input.jsonl > chunks.jsonl`
  - `pnpm rag:chunk input.jsonl output.jsonl`
- `embed.ts` (`pnpm rag:embed`) — the **embed** stage (issue #60). Reads `ChunkRecord`
  JSONL and writes `ChunkRecord` JSONL with `embedding` filled via `embedChunks` + an
  `EmbeddingProvider`. Run once **per** approved model to build each map.
  - `pnpm rag:embed --model qwen3-embedding-0.6b < chunks.jsonl > embedded.qwen3.jsonl`
  - `pnpm rag:embed --model bge-m3 chunks.jsonl embedded.bge.jsonl`
  - Flags: `--provider ollama|operator` (default `ollama`), `--base-url <url>`, `--batch <n>`.
  - Offline/occasional operator batch — needs a running embedder (local Ollama or the
    operator box); it is never part of CI or the app bundle.

Later stages (parse/normalize for wiki #4 and novel #5, load) land in their own issues
and follow the same JSONL-in/JSONL-out shape.

## Conventions

- Keep drivers thin — algorithmic logic belongs in `src/lib/rag` where it is unit-
  and golden-fixture-tested at the 95% mandate. Stage drivers stay outside the
  coverage glob but their core is fully covered through the library.
- Import the core via the relative path (`../../src/lib/rag`); the `@/*` alias is a
  Next/Vitest convention and is not wired for standalone `tsx` runs.
