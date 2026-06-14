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

- `novel.ts` (`pnpm rag:novel`) — the novel **parse + normalize** stages (issue #62).
  Reads an EPUB, a one-file-per-chapter directory (md/txt/html), or a single
  chapter-headed file, and writes normalized `SourceDocument` JSONL for the chunk
  stage. The full real-novel ingest is gated on receiving the actual file; the
  pipeline is validated against the synthetic fixture in
  `src/lib/rag/__fixtures__/novel-chapters.txt`.
  - `pnpm rag:novel book.epub > docs.jsonl`
  - `pnpm rag:novel chapters/ docs.jsonl`
  - `pnpm rag:novel novel.txt | pnpm rag:chunk | pnpm rag:embed --model qwen3-embedding-0.6b`
  - Flags: `--arc-map <file.json>` — override the default `LOTM_NOVEL_ARC_MAP`
    (approximate chapter boundaries) with a corrected JSON array of `NovelArcEntry`.

- `wiki.ts` (`pnpm rag:wiki`) — the wiki **parse + normalize** stages (issue #61).
  Streams the Fandom MediaWiki XML export (`pages_current.xml`; extract the .7z
  first) page-by-page — the dump is never held in memory whole — and writes
  normalized `SourceDocument` JSONL.
  - `pnpm rag:wiki pages_current.xml > wiki-docs.jsonl`
  - `pnpm rag:wiki pages_current.xml wiki-docs.jsonl --concealment-tier 1`
  - Flags: `--concealment-tier <n>` (default 0), `--base-url <url>` (default the
    LOTM Fandom wiki), `--min-chars <n>` (stub threshold, default 40).

- `advancement-canon.ts` (`pnpm rag:advancement-canon`) — extracts the canon
  **Advancement Ritual** text + material lists from the committed wiki dump's
  `Module:Sequence/standard` and writes `src/lib/rules/advancement-canon.ts`
  (`ADVANCEMENT_RITUALS`, keyed by pathway id → sequence level 5-1). Canon: a
  ritual is mandatory only from Sequence 5, so only levels 5-1 are emitted. Run a
  `pnpm format` pass afterwards (the emitted file is committed).
  - `pnpm rag:advancement-canon` (reads `corpus/wiki/…xml`)
  - `pnpm rag:advancement-canon <pages.xml>` (explicit dump path)

- `eval.ts` (`pnpm rag:eval`) — the **evaluation + leakage harness** (issue #64).
  Runs the labeled `EvalCase` set against the offline lexical retriever over a
  chunk corpus and prints recall@k + a leakage report. **Advisory**: always exits
  0 unless `--strict` (then leakage violations fail the run).
  - `pnpm rag:eval chunks.jsonl cases.jsonl`
  - `pnpm rag:eval chunks.jsonl cases.jsonl --k 5 --strict`

- `load.ts` (`pnpm rag:load`) — the **load** stage. Upserts `ChunkRecord` JSONL
  into `source_chunks` and (with `--model <id>`) `chunk_embeddings`. Idempotent
  (deterministic uuid from the pipeline id). Requires `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` (RLS denies everyone else by design) — run it
  **operator-side only**, never in the app or CI.
  - `pnpm rag:load embedded.qwen3.jsonl --model qwen3-embedding-0.6b`
  - `pnpm rag:load chunks.jsonl --chunks-only`
  - Flags: `--model <id>`, `--chunks-only`, `--batch <n>` (default 200).

## Conventions

- Keep drivers thin — algorithmic logic belongs in `src/lib/rag` where it is unit-
  and golden-fixture-tested at the 95% mandate. Stage drivers stay outside the
  coverage glob but their core is fully covered through the library.
- Import the core via the relative path (`../../src/lib/rag`); the `@/*` alias is a
  Next/Vitest convention and is not wired for standalone `tsx` runs.
