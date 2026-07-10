// Wiki character extractor for issue #213.
//
// Streams `corpus/wiki/lordofthemystery_pages_current.xml` and pulls out pages
// tagged with a Character category. For each character page it records the
// title, categories, cleaned word-count (proxy for wiki page size / detail),
// and any infobox-looking key/value pairs that mention pathway, sequence,
// affiliation, status, or relatives.
//
// Usage:
//   pnpm tsx scripts/corpus/extract-wiki-characters.ts
//   pnpm tsx scripts/corpus/extract-wiki-characters.ts --output scripts/.cache/wiki-characters.json

import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { stdout } from "node:process";

import {
  createWikiXmlParser,
  extractCategories,
  normalizeWikiPage,
  type WikiPage,
} from "../../src/lib/rag";

interface WikiCharacterRecord {
  title: string;
  normalizedTitle: string;
  categories: string[];
  wordCount: number;
  pathway?: string;
  sequence?: string;
  affiliation?: string;
  status?: string;
  relatives?: string;
  firstAppearance?: string;
  // Raw infobox-like key/value pairs that looked relevant.
  infoboxFields: Record<string, string>;
}

function parseArgs(argv: string[]): { outputPath?: string } {
  const args: { outputPath?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--output") args.outputPath = argv[++i];
  }
  return args;
}

const PATHWAY_KEYS = /\b(pathway|class)\b/i;
const SEQUENCE_KEYS = /\bsequence\b/i;
const AFFILIATION_KEYS =
  /\b(affiliation|organization|organization\(s\)|occupation|formerly)\b/i;
const STATUS_KEYS = /\b(status|alive|dead|gender|species|hair|eye)\b/i;
const RELATIVE_KEYS =
  /\b(relatives|family|spouse|love|father|mother|brother|sister|daughter|son)\b/i;
const FIRST_APPEARANCE_KEYS =
  /\b(debut|first appearance|first_appearance|chapter debut)\b/i;

function looksLikeInfoboxLine(line: string): boolean {
  return /^\s*\|?\s*[A-Za-z0-9 _\-]+\s*=\s*.+/.test(line);
}

function extractInfoboxFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of text.split(/\n/)) {
    if (!looksLikeInfoboxLine(line)) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line
      .slice(0, eq)
      .replace(/^\s*\|?\s*/, "")
      .trim()
      .toLowerCase();
    const value = line
      .slice(eq + 1)
      .replace(/\[\[|\]\]|\{|\}|\|/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (key && value && value.length < 400) {
      fields[key] = value;
    }
  }
  return fields;
}

function pickCanonical(
  fields: Record<string, string>,
  regex: RegExp,
): string | undefined {
  for (const [key, value] of Object.entries(fields)) {
    if (regex.test(key)) return value;
  }
  return undefined;
}

function isCharacterPage(categories: string[]): boolean {
  return categories.some(
    (c) =>
      c.toLowerCase().includes("character") ||
      c.toLowerCase().includes("characters") ||
      c.toLowerCase().includes("beyonders") ||
      c.toLowerCase().includes("transmigrator"),
  );
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function writeJson(path: string, json: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = "corpus/wiki/lordofthemystery_pages_current.xml";

  const characters: WikiCharacterRecord[] = [];
  let seen = 0;

  const parser = createWikiXmlParser((page: WikiPage) => {
    seen++;
    const categories = extractCategories(page.text ?? "");
    if (!isCharacterPage(categories)) return;

    const doc = normalizeWikiPage(page);
    const fields = extractInfoboxFields(page.text ?? "");

    const record: WikiCharacterRecord = {
      title: page.title,
      normalizedTitle: normalizeTitle(page.title),
      categories,
      wordCount: doc ? doc.content.split(/\s+/).filter(Boolean).length : 0,
      pathway: pickCanonical(fields, PATHWAY_KEYS),
      sequence: pickCanonical(fields, SEQUENCE_KEYS),
      affiliation: pickCanonical(fields, AFFILIATION_KEYS),
      status: pickCanonical(fields, STATUS_KEYS),
      relatives: pickCanonical(fields, RELATIVE_KEYS),
      firstAppearance: pickCanonical(fields, FIRST_APPEARANCE_KEYS),
      infoboxFields: Object.fromEntries(
        Object.entries(fields).filter(
          ([k]) =>
            PATHWAY_KEYS.test(k) ||
            SEQUENCE_KEYS.test(k) ||
            AFFILIATION_KEYS.test(k) ||
            STATUS_KEYS.test(k) ||
            RELATIVE_KEYS.test(k) ||
            FIRST_APPEARANCE_KEYS.test(k),
        ),
      ),
    };
    characters.push(record);
  });

  for await (const chunk of createReadStream(inputPath, { encoding: "utf8" })) {
    parser.write(chunk as string);
  }
  parser.close();

  characters.sort((a, b) => b.wordCount - a.wordCount);

  const report = {
    source: inputPath,
    totalPages: seen,
    characterPages: characters.length,
    characters,
  };

  const json = JSON.stringify(report, null, 2);
  if (args.outputPath) {
    writeJson(args.outputPath, json);
    process.stderr.write(
      `Parsed ${seen} pages, found ${characters.length} character pages. Wrote ${args.outputPath}\n`,
    );
  } else {
    stdout.write(json);
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
