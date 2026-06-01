// Embed stage (issue #60) — fills ChunkRecord.embedding with one approved model:
//
//   parse -> normalize -> chunk -> [embed] -> load
//
// Reads ChunkRecord JSONL (embedding: null) and writes ChunkRecord JSONL with
// the embedding filled, so it composes with the other JSONL stages and re-runs
// in isolation (re-embed without re-chunking). All algorithmic logic lives in
// the tested `src/lib/rag` core; this driver is only JSONL + provider plumbing.
//
// Run ONCE PER approved model to build each map, e.g.:
//   pnpm rag:embed --model qwen3-embedding-0.6b < chunks.jsonl > embedded.qwen3.jsonl
//   pnpm rag:embed --model bge-m3 chunks.jsonl embedded.bge.jsonl
//
// Provider defaults to the operator's local Ollama box; override with:
//   --provider ollama|operator   --base-url <url>   --batch <n>

import { readFileSync, writeFileSync } from "node:fs";

import {
  createEmbeddingProvider,
  type EmbeddingProviderId,
} from "../../src/lib/ai/embeddings";
import { embedChunks, parseJsonl, toJsonl, type ChunkRecord } from "../../src/lib/rag";

interface Args {
  modelId?: string;
  provider: EmbeddingProviderId;
  baseUrl?: string;
  batchSize?: number;
  inputPath?: string;
  outputPath?: string;
}

function parseProviderId(value: string | undefined): EmbeddingProviderId {
  if (value !== "ollama" && value !== "operator") {
    throw new Error(`Invalid --provider "${value}". Use "ollama" or "operator".`);
  }
  return value;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { provider: "ollama" };
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--model") args.modelId = argv[++i];
    else if (flag === "--provider") args.provider = parseProviderId(argv[++i]);
    else if (flag === "--base-url") args.baseUrl = argv[++i];
    else if (flag === "--batch") args.batchSize = Number(argv[++i]);
    else positionals.push(flag);
  }
  [args.inputPath, args.outputPath] = positionals;
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  // Default to stdin (fd 0) so the stage composes in a shell pipeline.
  const text = readFileSync(args.inputPath ?? 0, "utf8");
  const records = parseJsonl<ChunkRecord>(text);

  const provider = createEmbeddingProvider({
    id: args.provider,
    modelId: args.modelId,
    baseUrl: args.baseUrl,
  });
  const embedded = await embedChunks(records, provider, {
    batchSize: args.batchSize,
  });

  const out = toJsonl(embedded);
  if (args.outputPath) {
    writeFileSync(args.outputPath, out);
  } else {
    process.stdout.write(out);
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
