import type { AIResponse, GameState } from "@/lib/ai";

// ---------------------------------------------------------------------------
// Story journal engine (issue #11)
// ---------------------------------------------------------------------------
//
// Pure functions only — localStorage and Supabase access live in the React
// layer and `journal-sync.ts`. Two capture channels feed the journal:
//   1. The AI flags a turn as journal-worthy (`AIResponse.journalEntry`) —
//      validated here, never trusted blindly.
//   2. Deterministic detection from the state delta (advancement, travel,
//      new NPC encounters) — key events are captured even when the AI
//      forgets to flag them.
// Annotations are PLAYER-ONLY: nothing in this module is ever fed back into
// prompt assembly, and the AI has no context for player notes by design.

export const JOURNAL_EVENT_TYPES = [
  "advancement",
  "major-event",
  "npc-encounter",
  "discovery",
  "timeline-divergence",
  "death",
  "combat",
] as const;

export type JournalEventType = (typeof JOURNAL_EVENT_TYPES)[number];

export interface JournalEntry {
  id: string;
  turnNumber: number;
  createdAt: number;
  location: string;
  eventType: JournalEventType;
  summary: string;
  /** The full narrative around the event (detail view). */
  narrative: string;
  involvedNpcs: string[];
  /** Chapter/arc division — derived from the character's sequence. */
  arc: string;
  characterId: string;
  characterName?: string;
}

export interface JournalAnnotation {
  id: string;
  entryId: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface Journal {
  entries: JournalEntry[];
  annotations: JournalAnnotation[];
}

export function createJournal(): Journal {
  return { entries: [], annotations: [] };
}

/** The AI's journal flag, after validation. */
export interface JournalFlag {
  summary: string;
  eventType: JournalEventType;
}

/**
 * Validate the AI's `journalEntry` flag: non-empty summary, known event type.
 * Returns `null` (drop the flag) rather than throwing — a malformed flag must
 * never break a turn.
 */
export function validateJournalFlag(flag: unknown): JournalFlag | null {
  if (typeof flag !== "object" || flag === null) return null;
  const f = flag as Record<string, unknown>;
  if (typeof f.summary !== "string" || f.summary.trim() === "") return null;
  if (!JOURNAL_EVENT_TYPES.includes(f.eventType as JournalEventType)) return null;
  return { summary: f.summary.trim(), eventType: f.eventType as JournalEventType };
}

export interface DeriveJournalArgs {
  prevState: GameState;
  nextState: GameState;
  response: AIResponse;
  turnNumber: number;
  /** Arc label for the entries, e.g. "Sequence 9 — Seer". */
  arc: string;
  now?: number;
  /** Injectable id factory (deterministic in tests). */
  makeId?: () => string;
}

/**
 * Derive this turn's journal entries: the AI's validated flag plus
 * deterministic detections from the state delta, deduplicated by event type
 * (the AI flag wins — it carries the better summary).
 */
export function deriveJournalEntries(args: DeriveJournalArgs): JournalEntry[] {
  const now = args.now ?? Date.now();
  const makeId = args.makeId ?? (() => crypto.randomUUID());
  const { prevState, nextState, response } = args;

  const base = {
    turnNumber: args.turnNumber,
    createdAt: now,
    location: nextState.location,
    narrative: response.narrative,
    involvedNpcs: nextState.npcsPresent,
    arc: args.arc,
    characterId: nextState.characterId,
    ...(nextState.characterName ? { characterName: nextState.characterName } : {}),
  };

  const entries: JournalEntry[] = [];

  const flag = validateJournalFlag((response as { journalEntry?: unknown }).journalEntry);
  if (flag) {
    entries.push({ ...base, id: makeId(), ...flag });
  }

  if (prevState.sequenceLevel !== nextState.sequenceLevel) {
    entries.push({
      ...base,
      id: makeId(),
      eventType: "advancement",
      summary: `Advanced from Sequence ${prevState.sequenceLevel} to Sequence ${nextState.sequenceLevel}.`,
    });
  }

  if (prevState.location !== nextState.location) {
    entries.push({
      ...base,
      id: makeId(),
      eventType: "discovery",
      summary: `Travelled from ${prevState.location} to ${nextState.location}.`,
    });
  }

  const newNpcs = nextState.npcsPresent.filter(
    (npc) => !prevState.npcsPresent.includes(npc),
  );
  if (newNpcs.length > 0) {
    entries.push({
      ...base,
      id: makeId(),
      eventType: "npc-encounter",
      summary: `Encountered ${newNpcs.join(", ")} in ${nextState.location}.`,
    });
  }

  // Dedupe by event type — the AI flag's summary wins over the mechanical one.
  const seen = new Set<JournalEventType>();
  return entries.filter((entry) => {
    if (seen.has(entry.eventType)) return false;
    seen.add(entry.eventType);
    return true;
  });
}

/** Append entries (pure). Entries keep chronological (turn) order. */
export function addJournalEntries(
  journal: Journal,
  entries: readonly JournalEntry[],
): Journal {
  if (entries.length === 0) return journal;
  return { ...journal, entries: [...journal.entries, ...entries] };
}

/** Add a player annotation to an entry. Throws on an unknown entry id. */
export function addAnnotation(
  journal: Journal,
  entryId: string,
  text: string,
  now: number = Date.now(),
  id: string = crypto.randomUUID(),
): Journal {
  if (!journal.entries.some((e) => e.id === entryId)) {
    throw new Error(`Cannot annotate unknown journal entry "${entryId}".`);
  }
  const annotation: JournalAnnotation = {
    id,
    entryId,
    text,
    createdAt: now,
    updatedAt: now,
  };
  return { ...journal, annotations: [...journal.annotations, annotation] };
}

/** Edit an annotation's text (pure; unknown ids are a no-op). */
export function editAnnotation(
  journal: Journal,
  annotationId: string,
  text: string,
  now: number = Date.now(),
): Journal {
  return {
    ...journal,
    annotations: journal.annotations.map((a) =>
      a.id === annotationId ? { ...a, text, updatedAt: now } : a,
    ),
  };
}

/** Delete an annotation (pure; unknown ids are a no-op). */
export function deleteAnnotation(journal: Journal, annotationId: string): Journal {
  return {
    ...journal,
    annotations: journal.annotations.filter((a) => a.id !== annotationId),
  };
}

export interface JournalFilter {
  /** Case-insensitive text match over summary, narrative, and location. */
  text?: string;
  eventType?: JournalEventType;
  npc?: string;
  location?: string;
  characterId?: string;
}

/** Filter entries (chronological order preserved). */
export function filterJournal(journal: Journal, filter: JournalFilter): JournalEntry[] {
  const text = filter.text?.toLowerCase();
  return journal.entries.filter((entry) => {
    if (filter.eventType && entry.eventType !== filter.eventType) return false;
    if (filter.characterId && entry.characterId !== filter.characterId) return false;
    if (
      filter.npc &&
      !entry.involvedNpcs.some((n) => n.toLowerCase() === filter.npc?.toLowerCase())
    ) {
      return false;
    }
    if (
      filter.location &&
      entry.location.toLowerCase() !== filter.location.toLowerCase()
    ) {
      return false;
    }
    if (
      text &&
      !`${entry.summary}\n${entry.narrative}\n${entry.location}`
        .toLowerCase()
        .includes(text)
    ) {
      return false;
    }
    return true;
  });
}

/** Annotations for one entry, oldest first. */
export function annotationsFor(journal: Journal, entryId: string): JournalAnnotation[] {
  return journal.annotations
    .filter((a) => a.entryId === entryId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

const EVENT_LABELS: Record<JournalEventType, string> = {
  advancement: "Advancement",
  "major-event": "Major Event",
  "npc-encounter": "Encounter",
  discovery: "Discovery",
  "timeline-divergence": "Timeline Divergence",
  death: "Death",
  combat: "Combat",
};

export function journalEventLabel(eventType: JournalEventType): string {
  return EVENT_LABELS[eventType];
}

/**
 * Export the journal as a readable Markdown document — grouped by arc, one
 * section per entry, with player annotations as blockquotes. Reads like a
 * personalized chapter log, not a database dump.
 */
export function journalToMarkdown(
  journal: Journal,
  options: { title?: string } = {},
): string {
  const title = options.title ?? journal.entries[0]?.characterName ?? "Story Journal";
  const lines: string[] = [`# ${title}`, ""];

  let currentArc: string | null = null;
  for (const entry of journal.entries) {
    if (entry.arc !== currentArc) {
      currentArc = entry.arc;
      lines.push(`## ${entry.arc}`, "");
    }
    lines.push(
      `### Turn ${entry.turnNumber} — ${entry.summary}`,
      "",
      `*${journalEventLabel(entry.eventType)} · ${entry.location}*`,
      "",
      entry.narrative,
      "",
    );
    if (entry.involvedNpcs.length > 0) {
      lines.push(`Present: ${entry.involvedNpcs.join(", ")}`, "");
    }
    for (const annotation of annotationsFor(journal, entry.id)) {
      lines.push(`> **Note:** ${annotation.text}`, "");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function serializeJournal(journal: Journal): string {
  return JSON.stringify(journal);
}

/** Strict-shape parse; null for anything malformed (mirrors session parsing). */
export function deserializeJournal(json: string): Journal | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const j = parsed as Record<string, unknown>;
  if (!Array.isArray(j.entries) || !Array.isArray(j.annotations)) return null;
  const validEntries = j.entries.every(
    (e: unknown) =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as JournalEntry).id === "string" &&
      Number.isFinite((e as JournalEntry).turnNumber) &&
      typeof (e as JournalEntry).summary === "string" &&
      JOURNAL_EVENT_TYPES.includes((e as JournalEntry).eventType),
  );
  const validAnnotations = j.annotations.every(
    (a: unknown) =>
      typeof a === "object" &&
      a !== null &&
      typeof (a as JournalAnnotation).id === "string" &&
      typeof (a as JournalAnnotation).entryId === "string" &&
      typeof (a as JournalAnnotation).text === "string",
  );
  if (!validEntries || !validAnnotations) return null;
  return { entries: j.entries, annotations: j.annotations } as Journal;
}
