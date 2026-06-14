// Advancement-canon generator (corpus-grounded).
//
// Parses the committed Fandom wiki dump's `Module:Sequence/standard` Lua data
// and emits `src/lib/rules/advancement-canon.ts` — the per-pathway, per-sequence
// Advancement Ritual text and material list, keyed by the rules-engine pathway
// id. Canon: the `ritual` field exists only for Sequence 5 and below, which is
// exactly when an Advancement Ritual becomes mandatory.
//
// Usage:
//   pnpm rag:advancement-canon                 # reads the committed corpus
//   pnpm rag:advancement-canon <pages.xml>     # explicit dump path
//   pnpm format                                # tidy the emitted file afterwards
//
// The dump is committed under corpus/wiki/ (extract the .7z first); see
// docs/rag-ingestion.md.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_DUMP = "corpus/wiki/lordofthemystery_pages_current.xml";
const OUTPUT = "src/lib/rules/advancement-canon.ts";

/** Lowest sequence whose advancement is mandatory-ritual (canon). */
const RITUAL_FROM_SEQUENCE = 5;

// Wiki pathway name (without the " Pathway" suffix) → rules-engine pathway id.
const PATHWAY_IDS: Record<string, number> = {
  Fool: 1,
  Visionary: 2,
  Sun: 3,
  Death: 4,
  Darkness: 5,
  Tyrant: 6,
  Door: 7,
  Error: 8,
  "Hanged Man": 9,
  "White Tower": 10,
  "Twilight Giant": 11,
  Justiciar: 12,
  "Black Emperor": 13,
  "Red Priest": 14,
  Demoness: 15,
  Mother: 16,
  Moon: 17,
  Hermit: 18,
  Paragon: 19,
  "Wheel of Fortune": 20,
  Abyss: 21,
  Chained: 22,
};

function getModuleText(xml: string, title: string): string | null {
  const pages = xml.match(/<page>[\s\S]*?<\/page>/g) ?? [];
  for (const page of pages) {
    const t = /<title>([^<]*)<\/title>/.exec(page);
    if (t && t[1] === title) {
      const text = /<text[^>]*>([\s\S]*?)<\/text>/.exec(page);
      return text ? decodeEntities(text[1]) : "";
    }
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");
}

function cleanText(raw: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/\{\{Cite[^}]*\}\}/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractIngredients(block: string | null): string[] {
  if (!block) return [];
  const out: string[] = [];
  const re = /\{\{ingr\|([^}|]+)(?:\|([^}]+))?\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    out.push((m[2] ?? m[1]).trim());
  }
  return out;
}

function field(body: string, key: string): string | null {
  const patterns = [
    new RegExp(`\\['${key}'\\]\\s*=\\s*\\[=\\[([\\s\\S]*?)\\]=\\]`),
    new RegExp(`\\['${key}'\\]\\s*=\\s*\\[\\[([\\s\\S]*?)\\]\\]`),
    new RegExp(`\\['${key}'\\]\\s*=\\s*"([\\s\\S]*?)"`),
  ];
  for (const p of patterns) {
    const m = p.exec(body);
    if (m) return m[1];
  }
  return null;
}

interface RitualEntry {
  description: string;
  requirements: string[];
}

function main(): void {
  const dumpPath = resolve(process.cwd(), process.argv[2] ?? DEFAULT_DUMP);
  const xml = readFileSync(dumpPath, "utf-8");
  const mod = getModuleText(xml, "Module:Sequence/standard");
  if (!mod) throw new Error("Module:Sequence/standard not found in dump");

  const entries = mod.match(/\['[^']+'\]\s*=\s*\{[\s\S]*?\n\s*\}(?=,?\s*\n)/g) ?? [];

  // id -> level -> ritual
  const byPathway = new Map<number, Map<number, RitualEntry>>();

  for (const entry of entries) {
    const body = entry;
    const pathwayName = field(body, "pathway");
    const seqRank = field(body, "seq_rank");
    const ritual = field(body, "ritual");
    if (!pathwayName || seqRank === null || !ritual) continue;

    const shortName = pathwayName.replace(/ Pathway$/, "").trim();
    const pathwayId = PATHWAY_IDS[shortName];
    const level = Number(seqRank);
    if (pathwayId === undefined || !Number.isInteger(level)) continue;
    // Sequence 0 is the apotheosis endgame, not a normal advancement rung.
    if (level < 1 || level > RITUAL_FROM_SEQUENCE) continue;

    const description = cleanText(ritual);
    if (!description) continue;
    const requirements = [
      ...extractIngredients(field(body, "main_ingr")),
      ...extractIngredients(field(body, "supp_ingr")),
    ];

    if (!byPathway.has(pathwayId)) byPathway.set(pathwayId, new Map());
    byPathway.get(pathwayId)!.set(level, { description, requirements });
  }

  const lines: string[] = [];
  lines.push("// AUTO-GENERATED — do not edit by hand.");
  lines.push("//");
  lines.push(
    "// Source: corpus/wiki Module:Sequence/standard (the committed Fandom dump).",
  );
  lines.push("// Regenerate with: pnpm rag:advancement-canon");
  lines.push("//");
  lines.push(
    "// Canon: an Advancement Ritual is required from Sequence 5 onward, so only",
  );
  lines.push("// levels 5-1 carry an entry. Each holds the in-world ritual text and the");
  lines.push("// material list drawn from the same source sequence.");
  lines.push("");
  lines.push('import type { Ritual } from "@/lib/types/rules";');
  lines.push("");
  lines.push("/** Lowest sequence whose advancement is mandatory-ritual (canon). */");
  lines.push(`export const RITUAL_FROM_SEQUENCE = ${RITUAL_FROM_SEQUENCE};`);
  lines.push("");
  lines.push("/** pathwayId -> sequence level (5-1) -> the canon Advancement Ritual. */");
  lines.push(
    "export const ADVANCEMENT_RITUALS: Record<number, Record<number, Ritual>> = {",
  );
  for (const pathwayId of [...byPathway.keys()].sort((a, b) => a - b)) {
    const levels = byPathway.get(pathwayId)!;
    lines.push(`  ${pathwayId}: {`);
    for (const level of [...levels.keys()].sort((a, b) => b - a)) {
      const r = levels.get(level)!;
      lines.push(`    ${level}: {`);
      lines.push(`      description: ${JSON.stringify(r.description)},`);
      lines.push(`      requirements: ${JSON.stringify(r.requirements)},`);
      lines.push("    },");
    }
    lines.push("  },");
  }
  lines.push("};");
  lines.push("");

  writeFileSync(resolve(process.cwd(), OUTPUT), lines.join("\n"), "utf-8");
  const total = [...byPathway.values()].reduce((n, m) => n + m.size, 0);
  process.stderr.write(
    `Wrote ${OUTPUT}: ${byPathway.size} pathways, ${total} ritual entries.\n`,
  );
}

main();
