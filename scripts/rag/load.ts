// Load stage driver — the tail of the pipeline (issue #57's stage contract):
//
//   parse -> normalize -> chunk -> embed -> [load]
//
// Upserts ChunkRecord JSONL into `source_chunks`, and (when the records carry
// embeddings) into `chunk_embeddings` under --model's map. Idempotent: the
// deterministic pipeline id is hashed into a stable UUID, so re-running
// updates rows in place. Requires the SERVICE-ROLE key (RLS denies every
// other principal by design); run it operator-side only, never in the app.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     pnpm rag:load embedded.qwen3.jsonl --model qwen3-embedding-0.6b
//   pnpm rag:load chunks.jsonl --chunks-only      # corpus text/FTS only
//   Flags: --model <id>, --chunks-only, --batch <n> (default 200)

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../src/lib/types/database";
import {
  parseJsonl,
  toEmbeddingRow,
  toSourceChunkRow,
  type ChunkRecord,
} from "../../src/lib/rag";

interface Args {
  inputPath?: string;
  modelId?: string;
  chunksOnly: boolean;
  batchSize: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { chunksOnly: false, batchSize: 200 };
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--model") args.modelId = argv[++i];
    else if (argv[i] === "--chunks-only") args.chunksOnly = true;
    else if (argv[i] === "--batch") args.batchSize = Number(argv[++i]);
    else positionals.push(argv[i]);
  }
  [args.inputPath] = positionals;
  return args;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (service-role, operator-side).`);
  return value;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Server-side `statement timeout` on the vector upsert is transient — it spikes
// when concurrent HNSW index maintenance contends with the batch. Retry with
// backoff before giving up; the upsert is idempotent so re-sending is safe.
const isTransient = (message: string): boolean =>
  /statement timeout|timeout|fetch failed|ECONNRESET/i.test(message);

async function upsertWithRetry(
  label: string,
  run: () => PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  const maxAttempts = 6;
  for (let attempt = 1; ; attempt++) {
    // A returned `error` is a Postgres/PostgREST failure (e.g. statement
    // timeout); a thrown/rejected promise is a transport failure (fetch
    // failed, ECONNRESET) — both can be transient, so handle them alike.
    let message: string | null = null;
    try {
      const { error } = await run();
      if (!error) return;
      message = error.message;
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    if (!isTransient(message) || attempt >= maxAttempts) {
      throw new Error(`${label} upsert failed: ${message}`);
    }
    const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
    process.stderr.write(
      `${label} upsert transient error (attempt ${attempt}/${maxAttempts}): ` +
        `${message} — retrying in ${delay}ms\n`,
    );
    await sleep(delay);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.inputPath === undefined) {
    throw new Error(
      "Usage: pnpm rag:load <chunks.jsonl> [--model id] [--chunks-only] [--batch n]",
    );
  }
  if (!args.chunksOnly && args.modelId === undefined) {
    throw new Error("Pass --model <id> to load embeddings, or --chunks-only.");
  }

  const records = parseJsonl<ChunkRecord>(readFileSync(args.inputPath, "utf8"));
  const supabase = createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  for (let i = 0; i < records.length; i += args.batchSize) {
    const batch = records.slice(i, i + args.batchSize);

    await upsertWithRetry("source_chunks", () =>
      supabase.from("source_chunks").upsert(batch.map(toSourceChunkRow), {
        onConflict: "id",
      }),
    );

    if (!args.chunksOnly) {
      const rows = batch.map((record) => toEmbeddingRow(record, args.modelId as string));
      await upsertWithRetry("chunk_embeddings", () =>
        supabase.from("chunk_embeddings").upsert(rows, {
          onConflict: "chunk_id,model_id",
        }),
      );
    }

    process.stderr.write(
      `Upserted ${Math.min(i + args.batchSize, records.length)}/${records.length}\n`,
    );
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
