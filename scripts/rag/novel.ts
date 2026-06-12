// Novel parse + normalize stages (issue #62) — the front of the pipeline:
//
//   [parse -> normalize] -> chunk -> embed -> load
//
// Reads a chapter-delimited novel source and writes normalized SourceDocument
// JSONL for the chunk stage. All parsing logic lives in the tested
// `src/lib/rag` core; this driver is only file-system + JSONL plumbing.
//
// Inputs (auto-detected):
//   pnpm rag:novel book.epub > docs.jsonl          # EPUB (spine-ordered)
//   pnpm rag:novel chapters/ > docs.jsonl          # directory, one file/chapter
//   pnpm rag:novel novel.txt docs.jsonl            # single file with headings
//
// Flags:
//   --arc-map <file.json>   override the default LOTM arc map (a JSON array of
//                           NovelArcEntry) — use it to correct chapter ranges
//                           against the real file without a code change.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  normalizeNovelChapters,
  parseEpub,
  parseNovelFiles,
  parseNovelText,
  stripHtml,
  toJsonl,
  type NovelArcEntry,
  type NovelChapter,
} from "../../src/lib/rag";

interface Args {
  inputPath?: string;
  outputPath?: string;
  arcMapPath?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--arc-map") args.arcMapPath = argv[++i];
    else positionals.push(argv[i]);
  }
  [args.inputPath, args.outputPath] = positionals;
  return args;
}

function parseInput(inputPath: string): NovelChapter[] {
  if (statSync(inputPath).isDirectory()) {
    const files = readdirSync(inputPath)
      .filter((name) => /\.(?:md|txt|x?html?)$/i.test(name))
      .map((name) => ({ name, content: readFileSync(join(inputPath, name), "utf8") }));
    return parseNovelFiles(files);
  }
  if (/\.epub$/i.test(inputPath)) {
    return parseEpub(new Uint8Array(readFileSync(inputPath)));
  }
  const text = readFileSync(inputPath, "utf8");
  return parseNovelText(/\.x?html?$/i.test(inputPath) ? stripHtml(text) : text);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.inputPath === undefined) {
    throw new Error(
      "Usage: pnpm rag:novel <epub|dir|file> [output.jsonl] [--arc-map map.json]",
    );
  }

  const arcMap =
    args.arcMapPath !== undefined
      ? (JSON.parse(readFileSync(args.arcMapPath, "utf8")) as NovelArcEntry[])
      : undefined;

  const chapters = parseInput(args.inputPath);
  const out = toJsonl(normalizeNovelChapters(chapters, { arcMap }));
  if (args.outputPath) {
    writeFileSync(args.outputPath, out);
  } else {
    process.stdout.write(out);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
