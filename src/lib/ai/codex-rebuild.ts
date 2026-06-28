import type { ChatMessage, CodexUpdateInput } from "./types";

// ---------------------------------------------------------------------------
// Codex rebuild from history (history-context Codex) — pure prompt + parse
// ---------------------------------------------------------------------------
//
// A pre-feature save's Codex can only be backfilled from its structured
// sub-states (roster/anchors/society/present cast/custom locations) — the heavy
// entity record lives in the chronicle's PROSE (the running summary, the journal,
// the session facts), which a heuristic can't reliably categorize. This is the
// opt-in, ONE-SHOT LLM pass that reads that prose and returns a clean,
// categorized, de-duplicated Codex. Pure here (prompt builder + forgiving
// parser, mirroring `validation.ts`); the network call is the thin shell
// `generateCodexRebuild` in `client.ts`.

/** A journal beat, distilled for the rebuild digest. */
export interface CodexRebuildJournalEntry {
  turnNumber: number;
  eventType: string;
  summary: string;
  npcs?: string[];
}

export interface CodexRebuildInput {
  characterName?: string;
  runningSummary?: string;
  journal: CodexRebuildJournalEntry[];
  facts: string[];
  currentTurn: number;
}

/** Upper bound on entities the model is asked for / we accept (bounds output). */
export const MAX_REBUILD_ENTITIES = 80;

const REBUILD_SYSTEM = `You are a story archivist for a Lord of the Mysteries text RPG. From the chronicle records provided, extract a CODEX: the durable registry of the important entities the story has established.

Return ONLY valid JSON of this exact shape (no prose, no markdown fences):
{"entities": [{"kind": "person|location|object|group|thread", "name": "string", "status": "string", "importance": "pivotal|standard", "aliases": ["string"], "resolved": false}]}

Rules:
- "kind": person (a named individual), location (a significant place), object (a significant artifact/possession — NOT routine loot), group (an organization, congregation, faction, or sect), or thread (an open promise, debt, vow, secret, or unresolved goal the story still owes a payoff).
- "name": the entity's canonical name. CONSOLIDATE duplicates and variants into ONE entry — "The Stagnation Entity" and "Stagnation Entity" are the same; merge near-identical place names (different rooms of one site collapse to the site) — and list the merged variants in "aliases".
- "status": a concise present-tense note of its current state (e.g. "alive; tense ally aboard the Golden Dream"). Under ~20 words.
- "importance": "pivotal" for the figures, places, objects, and threads central to the chronicle (recurring allies/enemies, the protagonist's base, a driving vow); "standard" for everything else.
- "resolved": true ONLY for a thread whose obligation is already settled. Omit otherwise.
- Record ONLY what the provided records establish — never invent canon. Prefer fewer, well-chosen entities. Return at most ${MAX_REBUILD_ENTITIES} entities, most important first.`;

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max);
}

/** Build the rebuild chat messages from a chronicle digest. */
export function buildCodexRebuildPrompt(input: CodexRebuildInput): ChatMessage[] {
  const parts: string[] = [];
  if (input.characterName) parts.push(`# Character\n${input.characterName}`);
  if (input.runningSummary && input.runningSummary.trim() !== "") {
    parts.push(`# Story So Far (running summary)\n${input.runningSummary.trim()}`);
  }
  if (input.journal.length > 0) {
    const lines = input.journal.map((j) => {
      const who = j.npcs && j.npcs.length > 0 ? ` [present: ${j.npcs.join(", ")}]` : "";
      return `- Turn ${j.turnNumber} (${j.eventType}): ${clip(j.summary, 200)}${who}`;
    });
    parts.push(`# Journal (key events)\n${lines.join("\n")}`);
  }
  if (input.facts.length > 0) {
    parts.push(
      `# Recorded facts\n${input.facts.map((f) => `- ${clip(f, 200)}`).join("\n")}`,
    );
  }
  return [
    { role: "system", content: REBUILD_SYSTEM },
    {
      role: "user",
      content: `Extract the Codex from these records.\n\n${parts.join("\n\n")}`,
    },
  ];
}

const VALID_KINDS = ["person", "location", "object", "group", "thread"];

/**
 * Forgiving parse of the rebuild output into validated `CodexUpdateInput`s —
 * accepts a bare array or `{entities: [...]}`, extracts a fenced/embedded JSON
 * object, drops malformed items, caps the count. Never throws (returns `[]` on
 * unparseable output), exactly like the boundary parsing in `validation.ts`.
 * `applyCodexUpdates` is still the single real validation point downstream.
 */
export function parseCodexRebuild(raw: string): CodexUpdateInput[] {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last <= first) return [];
    try {
      parsed = JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      return [];
    }
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>).entities
      : undefined;
  if (!Array.isArray(arr)) return [];

  const out: CodexUpdateInput[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const kind = String(o.kind ?? "");
    const name = String(o.name ?? "").trim();
    if (!VALID_KINDS.includes(kind) || name === "") continue;
    const u: CodexUpdateInput = { kind, name };
    if (typeof o.status === "string" && o.status.trim() !== "")
      u.status = o.status.trim();
    if (o.importance === "pivotal" || o.importance === "standard") {
      u.importance = o.importance;
    }
    if (o.resolved === true) u.resolved = true;
    if (Array.isArray(o.aliases)) {
      const aliases = o.aliases
        .map((a: unknown) => String(a).trim())
        .filter((a: string) => a !== "");
      if (aliases.length > 0) u.aliases = aliases;
    }
    out.push(u);
    if (out.length >= MAX_REBUILD_ENTITIES) break;
  }
  return out;
}
