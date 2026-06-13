// Evaluation + leakage harness driver (issue #64) — ADVISORY metrics over a
// labeled query -> expected-chunk set:
//
//   pnpm rag:eval chunks.jsonl cases.jsonl
//   pnpm rag:eval chunks.jsonl cases.jsonl --k 5
//   pnpm rag:eval chunks.jsonl cases.jsonl --strict   # exit 1 on leakage
//
// Uses the deterministic offline lexical retriever (no DB, no embedder), so it
// can run anywhere — including CI — as a visibility metric without blocking
// velocity. The leakage check is the timeline gate's safety net: violations
// are printed loudly and, with --strict, fail the run.

import { readFileSync } from "node:fs";

import {
  createLexicalRetriever,
  DEFAULT_EVAL_K,
  evalLeakage,
  evalRecallAtK,
  formatEvalReport,
  parseJsonl,
  type ChunkRecord,
  type EvalCase,
} from "../../src/lib/rag";

interface Args {
  chunksPath?: string;
  casesPath?: string;
  k: number;
  strict: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { k: DEFAULT_EVAL_K, strict: false };
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--k") args.k = Number(argv[++i]);
    else if (argv[i] === "--strict") args.strict = true;
    else positionals.push(argv[i]);
  }
  [args.chunksPath, args.casesPath] = positionals;
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.chunksPath === undefined || args.casesPath === undefined) {
    throw new Error(
      "Usage: pnpm rag:eval <chunks.jsonl> <cases.jsonl> [--k n] [--strict]",
    );
  }

  const chunks = parseJsonl<ChunkRecord>(readFileSync(args.chunksPath, "utf8"));
  const cases = parseJsonl<EvalCase>(readFileSync(args.casesPath, "utf8"));
  const retriever = createLexicalRetriever(chunks);

  const recall = await evalRecallAtK(cases, retriever, args.k);
  const leakage = await evalLeakage(cases, retriever, args.k);
  process.stdout.write(`${formatEvalReport(recall, leakage)}\n`);

  if (args.strict && !leakage.clean) {
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
