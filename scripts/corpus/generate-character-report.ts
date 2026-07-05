// Tier 2 character priority report generator for issue #213.
//
// Combines:
//   1. Existing NPC lore from `src/lib/lore/npcs.ts`
//   2. Canon playable characters from `src/lib/lore/canon-characters.ts`
//   3. Wiki character extraction (`scripts/.cache/wiki-characters.json`)
//   4. Novel name frequency report (`scripts/.cache/novel-names.json`)
//
// Produces a ranked list of candidate characters to add to `npcs.ts`, scored by
// the formula in docs/phase5-character-encounter-planning.md §F.4.
//
// Usage:
//   pnpm tsx scripts/corpus/generate-character-report.ts
//   pnpm tsx scripts/corpus/generate-character-report.ts --output scripts/.cache/tier2-report.json

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { stdout } from "node:process";

import { CANON_PLAYABLE_CHARACTERS } from "../../src/lib/lore/canon-characters";
import { NPC_LORE } from "../../src/lib/lore/npcs";

interface Args {
  outputPath?: string;
}

interface WikiRecord {
  title: string;
  normalizedTitle: string;
  categories: string[];
  wordCount: number;
  pathway?: string;
  sequence?: string;
  affiliation?: string;
  firstAppearance?: string;
}

interface WikiReport {
  characterPages: number;
  characters: WikiRecord[];
}

interface NameCandidate {
  name: string;
  normalizedName: string;
  frequency: number;
  firstChapter: number;
  lastChapter: number;
}

interface NovelReport {
  chapterCount: number;
  minFrequency: number;
  candidates: NameCandidate[];
}

interface CharacterCandidate {
  slug: string;
  displayName: string;
  normalizedName: string;
  hasNpcEntry: boolean;
  isCanonPlayable: boolean;
  novelFrequency: number;
  firstChapter: number | null;
  wikiWordCount: number;
  pathway: string | null;
  sequence: string | null;
  affiliation: string | null;
  plotImportance: number;
  score: number;
  reason: string;
}

const WIKI_CACHE = "scripts/.cache/wiki-characters.json";
const NOVEL_CACHE = "scripts/.cache/novel-names.json";
const DEFAULT_OUTPUT = "scripts/.cache/tier2-report.json";

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--output") args.outputPath = argv[++i];
  }
  return args;
}

function normalizedCanonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimatePlotImportance(
  wiki: WikiRecord | undefined,
  novelFrequency: number,
): number {
  // Rubric tiers (subjective but reproducible).
  if (wiki?.categories.some((c) => /antagonist|protagonist|deity/gi.test(c))) return 3;
  if (wiki?.categories.some((c) => /tarot|angel|king|queen|founder|leader/gi.test(c)))
    return 3;
  if (novelFrequency >= 300) return 3;
  if (wiki?.categories.some((c) => /organization|church|family|noble|military/gi.test(c)))
    return 2;
  if (novelFrequency >= 50) return 2;
  if (wiki && wiki.wordCount > 200) return 2;
  return 1;
}

function loadJson<T>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function writeJson(path: string, json: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.outputPath ?? DEFAULT_OUTPUT;
  const wiki = loadJson<WikiReport>(WIKI_CACHE);
  const novel = loadJson<NovelReport>(NOVEL_CACHE);

  if (!wiki || !novel) {
    throw new Error(
      `Missing cache files. Run first:\n` +
        `  pnpm tsx scripts/corpus/extract-wiki-characters.ts --output ${WIKI_CACHE}\n` +
        `  pnpm tsx scripts/corpus/extract-novel-names.ts --output ${NOVEL_CACHE}`,
    );
  }

  const existingSlugs = new Set(NPC_LORE.map((e) => e.slug));
  const existingNames = new Set(NPC_LORE.flatMap((e) => e.npcs.map(normalizedCanonName)));
  const canonIds = new Set(CANON_PLAYABLE_CHARACTERS.map((p) => `npc-${p.id}`));
  const canonNames = new Set(
    CANON_PLAYABLE_CHARACTERS.map((p) => normalizedCanonName(p.displayName)),
  );

  const wikiByName = new Map(wiki.characters.map((c) => [c.normalizedTitle, c]));
  const novelByName = new Map(novel.candidates.map((c) => [c.normalizedName, c]));

  const allNames = new Set<string>([
    ...wikiByName.keys(),
    ...novelByName.keys(),
    ...canonNames,
  ]);

  const maxFrequency = Math.max(...novel.candidates.map((c) => c.frequency), 1);
  const maxWikiSize = Math.max(...wiki.characters.map((c) => c.wordCount), 1);

  const results: CharacterCandidate[] = [];

  for (const name of allNames) {
    // Skip characters that already have dedicated NPC entries.
    if (existingNames.has(name)) continue;

    const wikiRecord = wikiByName.get(name);
    const novelRecord = novelByName.get(name);

    // Threshold: >=20 novel mentions AND a wiki character page, OR a missing canon playable.
    const isCanonPlayable = canonNames.has(name);
    if (!isCanonPlayable && (!novelRecord || (novelRecord?.frequency ?? 0) < 20))
      continue;
    if (!isCanonPlayable && !wikiRecord) continue;

    const slug = isCanonPlayable
      ? (Array.from(canonIds).find((id) => id.replace("npc-", "") === name) ??
        `npc-${name}`)
      : `npc-${name}`;
    const displayName = wikiRecord?.title ?? novelRecord?.name ?? name.replace(/-/g, " ");
    const novelFrequency = novelRecord?.frequency ?? 0;
    const firstChapter = novelRecord?.firstChapter ?? null;
    const wikiSize = wikiRecord?.wordCount ?? 0;
    const plotImportance = estimatePlotImportance(wikiRecord, novelFrequency);

    const normalizedFreq = novelFrequency / maxFrequency;
    const normalizedWiki = wikiSize / maxWikiSize;
    const score = normalizedFreq * 0.5 + plotImportance * 0.35 + normalizedWiki * 0.15;

    const reasons: string[] = [];
    if (isCanonPlayable) reasons.push("canon playable without dossier");
    if (novelFrequency >= 20) reasons.push(`novel frequency ${novelFrequency}`);
    if (wikiRecord) reasons.push(`wiki page ${wikiSize} words`);
    if (plotImportance === 3) reasons.push("plot driver / leader / deity");

    results.push({
      slug,
      displayName,
      normalizedName: name,
      hasNpcEntry: existingSlugs.has(slug),
      isCanonPlayable,
      novelFrequency,
      firstChapter,
      wikiWordCount: wikiSize,
      pathway: wikiRecord?.pathway ?? null,
      sequence: wikiRecord?.sequence ?? null,
      affiliation: wikiRecord?.affiliation ?? null,
      plotImportance,
      score,
      reason: reasons.join("; "),
    });
  }

  results.sort((a, b) => b.score - a.score);

  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: { minNovelFrequency: 20, requireWikiPage: true },
    existingNpcCount: existingSlugs.size,
    candidateCount: results.length,
    candidates: results,
  };

  const json = JSON.stringify(report, null, 2);
  writeJson(outputPath, json);
  stdout.write(`${json}\n`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
