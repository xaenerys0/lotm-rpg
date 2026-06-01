// Chunk stage (issue #59) — the source-agnostic middle of the pipeline:
//
//   parse -> normalize -> [chunk] -> embed -> load
//
// Reads normalized SourceDocument JSONL and writes ChunkRecord JSONL, so it is
// independently re-runnable: re-chunk without re-parsing, then re-embed without
// re-chunking. All the logic lives in the tested `src/lib/rag` core; this driver
// is only JSONL plumbing.
//
// Usage:
//   pnpm rag:chunk < normalized-docs.jsonl > chunks.jsonl
//   pnpm rag:chunk input.jsonl > chunks.jsonl
//   pnpm rag:chunk input.jsonl output.jsonl

import { readFileSync, writeFileSync } from "node:fs";

import {
  chunkDocuments,
  parseJsonl,
  toJsonl,
  type SourceDocument,
} from "../../src/lib/rag";

function readInput(path: string | undefined): string {
  // Default to stdin (fd 0) so the stage composes in a shell pipeline.
  return readFileSync(path ?? 0, "utf8");
}

function main(): void {
  const [inputPath, outputPath] = process.argv.slice(2);
  const docs = parseJsonl<SourceDocument>(readInput(inputPath));
  const out = toJsonl(chunkDocuments(docs));
  if (outputPath) {
    writeFileSync(outputPath, out);
  } else {
    process.stdout.write(out);
  }
}

main();
