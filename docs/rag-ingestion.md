# RAG Corpus Ingestion Runbook

How to load the Lord of the Mysteries **novel** and **wiki** into the private
`source_chunks` / `chunk_embeddings` tables so the runtime retrieval path
(`match_source_chunks`, wired into the game loop) returns real canon.

The corpus is **never committed to git** by design (copyright + size); it lives
only in the private, RLS-denied Supabase tables. This runbook reproduces it from
the sources.

## Sources

- **Novel**: the EPUB (`Lord of Mysteries`, Cuttlefish That Loves Diving).
  Supplied out-of-band; not in the repo.
- **Wiki**: the Fandom dump
  `https://s3.amazonaws.com/wikia_xml_dumps/l/lo/lordofthemystery_pages_current.xml.7z`
  (a `.7z` — extract with `7z`/`py7zr`/`bsdtar`).

## Prerequisites

- **An embedding endpoint** serving the approved 1024-dim models via Ollama's
  `/api/embed`: `qwen3-embedding:0.6b` (the default/locked model) and, ideally,
  `bge-m3:567m` (the alternate map). Either the player-Ollama transport
  (`--provider ollama --base-url http://host:11434`) or the operator box
  (`--provider operator`, `NEXT_PUBLIC_OPERATOR_EMBEDDING_URL`).
- **The Supabase service-role key** — the load stage writes past RLS, so it must
  run operator-side only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Verified stage 1-2 output (parse → chunk)

Run on the real sources, these counts are the expected, correct result:

| Source | Parsed | Chunks |
| ------ | ------ | ------ |
| Novel  | 1430 chapters | 5,684 |
| Wiki   | 1,509 articles (of 13,379 pages) | 2,203 |
| Total  | | **7,887** |

## Commands

```bash
# 1. Novel: parse+normalize (EPUB → SourceDocument JSONL), then chunk.
pnpm rag:novel "/path/to/LordofMysteries.EPUB" /tmp/novel-docs.jsonl
pnpm rag:chunk /tmp/novel-docs.jsonl /tmp/novel-chunks.jsonl

# 2. Wiki: fetch + extract the .7z, parse+normalize, then chunk.
curl -sL -o /tmp/wiki.xml.7z \
  "https://s3.amazonaws.com/wikia_xml_dumps/l/lo/lordofthemystery_pages_current.xml.7z"
python3 -c "import py7zr; py7zr.SevenZipFile('/tmp/wiki.xml.7z').extractall('/tmp/wiki')"
pnpm rag:wiki /tmp/wiki/*.xml /tmp/wiki-docs.jsonl
pnpm rag:chunk /tmp/wiki-docs.jsonl /tmp/wiki-chunks.jsonl

# 3. Embed each chunk set, ONCE PER approved model (builds each vector "map").
pnpm rag:embed --model qwen3-embedding-0.6b /tmp/novel-chunks.jsonl /tmp/novel.qwen3.jsonl
pnpm rag:embed --model qwen3-embedding-0.6b /tmp/wiki-chunks.jsonl  /tmp/wiki.qwen3.jsonl
# (optional alternate map)
pnpm rag:embed --model bge-m3 /tmp/novel-chunks.jsonl /tmp/novel.bge.jsonl
pnpm rag:embed --model bge-m3 /tmp/wiki-chunks.jsonl  /tmp/wiki.bge.jsonl

# 4. Load into Supabase (service-role; idempotent upsert by deterministic UUID).
export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
pnpm rag:load /tmp/novel.qwen3.jsonl --model qwen3-embedding-0.6b
pnpm rag:load /tmp/wiki.qwen3.jsonl  --model qwen3-embedding-0.6b
pnpm rag:load /tmp/novel.bge.jsonl   --model bge-m3
pnpm rag:load /tmp/wiki.bge.jsonl    --model bge-m3
```

### Text-only fast path (no embeddings yet)

`source_chunks` alone already powers the **FTS half** of `match_source_chunks`
(the RPC full-outer-joins the vector and full-text halves), so lexical retrieval
works before any vectors exist:

```bash
pnpm rag:load /tmp/novel-chunks.jsonl --chunks-only
pnpm rag:load /tmp/wiki-chunks.jsonl  --chunks-only
```

Add the `chunk_embeddings` later (step 3-4) to light up the vector half.

## Notes

- **Idempotent**: re-running any stage upserts in place (deterministic chunk
  UUIDs), so a re-embed or re-load never duplicates rows.
- **Epoch tagging**: the load mapper inserts `source_chunks.epoch = null`
  (universal — passes the epoch gate for every character). The novel/wiki are
  Fifth-Epoch-era canon; to isolate them to the Fifth, run after load:
  `update public.source_chunks set epoch = 5 where epoch is null;`
- **Gates**: `validateChunkMetadata` (load stage) rejects out-of-range
  `concealment_tier` / bad `canon_order` before write; the novel arc map sets
  per-volume `concealment_tier` (0 → 4), so deep-spoiler chapters only surface
  once a character's sequence raises its `concealmentTierForSequence` ceiling.
