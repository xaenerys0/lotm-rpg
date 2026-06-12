// Wiki parse + normalize stages (issue #61) — the front of the pipeline for
// the Fandom MediaWiki XML export:
//
//   [parse -> normalize] -> chunk -> embed -> load
//
// Streams `pages_current.xml` (extract the .7z first: `7z x <dump>.7z`) and
// writes normalized SourceDocument JSONL for the chunk stage. The dump is
// large, so pages are parsed, cleaned, and written one at a time — the whole
// file is never held in memory. All parsing/cleaning logic lives in the tested
// `src/lib/rag` core; this driver is only stream + JSONL plumbing.
//
// Usage:
//   pnpm rag:wiki pages_current.xml > wiki-docs.jsonl
//   pnpm rag:wiki pages_current.xml wiki-docs.jsonl
//   pnpm rag:wiki dump.xml --concealment-tier 1 --base-url https://example.test/wiki/
//
// Flags:
//   --concealment-tier <n>  tier stamped on every wiki chunk (default 0)
//   --base-url <url>        provenance link base (default the LOTM Fandom wiki)
//   --min-chars <n>         stub threshold on cleaned prose (default 40)

import { createReadStream, createWriteStream } from "node:fs";
import { stdout } from "node:process";

import { createWikiXmlParser, normalizeWikiPage, toJsonl } from "../../src/lib/rag";

interface Args {
  inputPath?: string;
  outputPath?: string;
  concealmentTier?: number;
  baseUrl?: string;
  minChars?: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--concealment-tier") args.concealmentTier = Number(argv[++i]);
    else if (flag === "--base-url") args.baseUrl = argv[++i];
    else if (flag === "--min-chars") args.minChars = Number(argv[++i]);
    else positionals.push(flag);
  }
  [args.inputPath, args.outputPath] = positionals;
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.inputPath === undefined) {
    throw new Error(
      "Usage: pnpm rag:wiki <pages_current.xml> [output.jsonl] [--concealment-tier n] [--base-url url] [--min-chars n]",
    );
  }

  const out = args.outputPath ? createWriteStream(args.outputPath) : stdout;
  let kept = 0;
  let seen = 0;

  const parser = createWikiXmlParser((page) => {
    seen++;
    const doc = normalizeWikiPage(page, {
      baseUrl: args.baseUrl,
      concealmentTier: args.concealmentTier,
      minChars: args.minChars,
    });
    if (doc !== null) {
      kept++;
      out.write(toJsonl([doc]));
    }
  });

  for await (const chunk of createReadStream(args.inputPath, { encoding: "utf8" })) {
    parser.write(chunk as string);
  }
  parser.close();
  if (out !== stdout) out.end();
  process.stderr.write(`Parsed ${seen} pages, kept ${kept} article documents.\n`);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
