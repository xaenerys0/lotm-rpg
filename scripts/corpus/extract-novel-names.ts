// Novel name-frequency extractor for issue #213.
//
// Reads `corpus/novel/LordofMysteriesCuttlefishTha1.EPUB`, extracts chapters,
// and counts capitalized two-word phrases that look like character names.
// Outputs a JSON report of candidates with total frequency and the chapter
// range of their first/last occurrence.
//
// Usage:
//   pnpm tsx scripts/corpus/extract-novel-names.ts
//   pnpm tsx scripts/corpus/extract-novel-names.ts --output scripts/.cache/novel-names.json
//   pnpm tsx scripts/corpus/extract-novel-names.ts --min-frequency 20

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { stdout } from "node:process";

import { parseEpub, stripHtml } from "../../src/lib/rag";

interface Args {
  outputPath?: string;
  minFrequency?: number;
}

interface NameCandidate {
  name: string;
  normalizedName: string;
  frequency: number;
  firstChapter: number;
  lastChapter: number;
  // Chapter numbers where the name occurs most often.
  peakChapters: number[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--output") args.outputPath = argv[++i];
    else if (argv[i] === "--min-frequency") args.minFrequency = Number(argv[++i]);
  }
  return args;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isCandidateName(phrase: string): boolean {
  // Two capitalized words, each at least 2 chars, common title prefixes allowed.
  return /^([A-Z][a-zA-Z]+\.?\s+){1,3}[A-Z][a-zA-Z]+$/.test(phrase) && phrase.length >= 5;
}

function extractNameCandidates(text: string): string[] {
  const plain = stripHtml(text)
    .replace(/[^a-zA-Z0-9\s'.-]/g, " ")
    .replace(/\s+/g, " ");
  const candidates: string[] = [];
  // Look for 2- to 4-word capitalized runs.
  const words = plain.split(" ");
  for (let i = 0; i < words.length - 1; i++) {
    for (let len = 2; len <= 4 && i + len <= words.length; len++) {
      const phrase = words.slice(i, i + len).join(" ");
      if (isCandidateName(phrase)) {
        candidates.push(phrase);
      }
    }
  }
  return candidates;
}

function addToCounter(
  counter: Map<string, { total: number; byChapter: Map<number, number> }>,
  name: string,
  chapterIdx: number,
): void {
  const entry = counter.get(name);
  if (!entry) {
    counter.set(name, {
      total: 1,
      byChapter: new Map([[chapterIdx, 1]]),
    });
    return;
  }
  entry.total++;
  entry.byChapter.set(chapterIdx, (entry.byChapter.get(chapterIdx) ?? 0) + 1);
}

function writeJson(path: string, json: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = "corpus/novel/LordofMysteriesCuttlefishTha1.EPUB";
  const minFrequency = args.minFrequency ?? 10;

  const chapters = parseEpub(new Uint8Array(readFileSync(inputPath)));
  const counter = new Map<string, { total: number; byChapter: Map<number, number> }>();

  for (let i = 0; i < chapters.length; i++) {
    const names = extractNameCandidates(chapters[i].content);
    for (const name of names) {
      addToCounter(counter, name, i + 1);
    }
  }

  const candidates: NameCandidate[] = [];
  for (const [name, stats] of counter.entries()) {
    if (stats.total < minFrequency) continue;
    const chapterEntries = Array.from(stats.byChapter.entries()).sort(
      (a, b) => a[0] - b[0],
    );
    const firstChapter = chapterEntries[0][0];
    const lastChapter = chapterEntries[chapterEntries.length - 1][0];
    const maxCount = Math.max(...chapterEntries.map(([, count]) => count));
    const peakChapters = chapterEntries
      .filter(([, count]) => count === maxCount)
      .map(([n]) => n);
    candidates.push({
      name,
      normalizedName: normalizeName(name),
      frequency: stats.total,
      firstChapter,
      lastChapter,
      peakChapters,
    });
  }

  candidates.sort((a, b) => b.frequency - a.frequency);

  const report = {
    source: inputPath,
    chapterCount: chapters.length,
    minFrequency,
    candidateCount: candidates.length,
    candidates,
  };

  const json = JSON.stringify(report, null, 2);
  if (args.outputPath) {
    writeJson(args.outputPath, json);
    process.stderr.write(
      `Parsed ${chapters.length} chapters, found ${candidates.length} name candidates (>=${minFrequency}). Wrote ${args.outputPath}\n`,
    );
  } else {
    stdout.write(json);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
