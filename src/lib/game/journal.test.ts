import { describe, expect, it, vi } from "vitest";

import type { AIResponse, GameState } from "@/lib/ai";

import {
  addAnnotation,
  addJournalEntries,
  annotationsFor,
  buildJournalEntry,
  createJournal,
  deleteAnnotation,
  deriveJournalEntries,
  deserializeJournal,
  editAnnotation,
  filterJournal,
  journalEventLabel,
  journalToMarkdown,
  serializeJournal,
  validateJournalFlag,
  type Journal,
  type JournalEntry,
} from "./journal";
import {
  deleteAnnotationRemote,
  syncAnnotation,
  syncEntries,
  syncJournal,
  toAnnotationRow,
  toEntryRow,
} from "./journal-sync";
import { createDefaultGameState } from "./session";

const state = (overrides: Partial<GameState> = {}): GameState => ({
  ...createDefaultGameState(1, "char-1", "Klein"),
  npcsPresent: ["Dunn Smith"],
  ...overrides,
});

const response = (overrides: Partial<AIResponse> = {}): AIResponse => ({
  narrative: "The fog parted and the chapel bells rang.",
  ...overrides,
});

let nextId = 0;
const makeId = (): string => `id-${nextId++}`;

const derive = (prev: GameState, next: GameState, res: AIResponse): JournalEntry[] =>
  deriveJournalEntries({
    prevState: prev,
    nextState: next,
    response: res,
    turnNumber: 3,
    arc: "Sequence 9 — Seer",
    now: 1000,
    makeId,
  });

const entry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: "e1",
  turnNumber: 1,
  createdAt: 1000,
  location: "Tingen City",
  eventType: "discovery",
  summary: "Found the red chapel.",
  narrative: "A long account of the chapel.",
  involvedNpcs: ["Dunn Smith"],
  arc: "Sequence 9 — Seer",
  characterId: "char-1",
  characterName: "Klein",
  ...overrides,
});

describe("validateJournalFlag", () => {
  it("accepts a well-formed flag and trims the summary", () => {
    expect(
      validateJournalFlag({ summary: "  A key event. ", eventType: "major-event" }),
    ).toEqual({ summary: "A key event.", eventType: "major-event" });
  });

  it("drops malformed flags rather than throwing", () => {
    expect(validateJournalFlag(undefined)).toBeNull();
    expect(validateJournalFlag("text")).toBeNull();
    expect(validateJournalFlag({ summary: "", eventType: "death" })).toBeNull();
    expect(validateJournalFlag({ summary: "x", eventType: "weather" })).toBeNull();
  });
});

describe("deriveJournalEntries", () => {
  it("records the AI's validated flag with full context", () => {
    const entries = derive(
      state(),
      state(),
      response({
        journalEntry: { summary: "Met the Tarot Club.", eventType: "major-event" },
      }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      eventType: "major-event",
      summary: "Met the Tarot Club.",
      turnNumber: 3,
      location: "Tingen City",
      arc: "Sequence 9 — Seer",
      characterName: "Klein",
      narrative: "The fog parted and the chapel bells rang.",
    });
  });

  it("detects advancement, travel, and new NPC encounters deterministically", () => {
    const entries = derive(
      state(),
      state({
        sequenceLevel: 8,
        location: "Backlund",
        npcsPresent: ["Dunn Smith", "Azik Eggers"],
      }),
      response(),
    );
    expect(entries.map((e) => e.eventType)).toEqual([
      "advancement",
      "discovery",
      "npc-encounter",
    ]);
    expect(entries[0].summary).toBe("Advanced from Sequence 9 to Sequence 8.");
    expect(entries[1].summary).toBe("Travelled from Tingen City to Backlund.");
    expect(entries[2].summary).toBe("Encountered Azik Eggers in Backlund.");
  });

  it("returns nothing for a routine, unflagged turn", () => {
    expect(derive(state(), state(), response())).toEqual([]);
  });

  it("dedupes by event type with the AI flag winning", () => {
    const entries = derive(
      state(),
      state({ npcsPresent: ["Dunn Smith", "Old Neil"] }),
      response({
        journalEntry: {
          summary: "A fateful meeting with Old Neil.",
          eventType: "npc-encounter",
        },
      }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].summary).toBe("A fateful meeting with Old Neil.");
  });
});

describe("buildJournalEntry", () => {
  it("assembles an entry from state with injected id/time and a default arc", () => {
    const entry = buildJournalEntry(
      state({ location: "Backlund", sequenceLevel: 6 }),
      4,
      { eventType: "major-event", summary: "A pact was struck.", narrative: "..." },
      { id: "e-1", now: 1000 },
    );
    expect(entry).toEqual({
      id: "e-1",
      turnNumber: 4,
      createdAt: 1000,
      location: "Backlund",
      eventType: "major-event",
      summary: "A pact was struck.",
      narrative: "...",
      involvedNpcs: ["Dunn Smith"],
      arc: "Sequence 6",
      characterId: "char-1",
      characterName: "Klein",
    });
  });

  it("honors an explicit arc and omits an absent character name", () => {
    const entry = buildJournalEntry(
      state({ characterName: undefined }),
      0,
      { eventType: "death", summary: "x", narrative: "y", arc: "Sequence 0" },
      { id: "e-2", now: 1 },
    );
    expect(entry.arc).toBe("Sequence 0");
    expect("characterName" in entry).toBe(false);
  });
});

describe("annotations", () => {
  const journal = addJournalEntries(createJournal(), [entry()]);

  it("adds, edits, lists, and deletes annotations (pure)", () => {
    let j = addAnnotation(journal, "e1", "Remember this place.", 2000, "a1");
    j = addAnnotation(j, "e1", "Second note.", 3000, "a2");
    expect(annotationsFor(j, "e1").map((a) => a.text)).toEqual([
      "Remember this place.",
      "Second note.",
    ]);

    j = editAnnotation(j, "a1", "Edited note.", 4000);
    expect(annotationsFor(j, "e1")[0]).toMatchObject({
      text: "Edited note.",
      updatedAt: 4000,
      createdAt: 2000,
    });

    j = deleteAnnotation(j, "a1");
    expect(annotationsFor(j, "e1").map((a) => a.id)).toEqual(["a2"]);
    // Original untouched.
    expect(journal.annotations).toEqual([]);
  });

  it("rejects annotating an unknown entry", () => {
    expect(() => addAnnotation(journal, "nope", "x")).toThrow(/unknown journal entry/);
  });
});

describe("filterJournal", () => {
  const journal: Journal = addJournalEntries(createJournal(), [
    entry(),
    entry({
      id: "e2",
      eventType: "advancement",
      summary: "Became a Clown.",
      narrative: "The second potion settled.",
      location: "Backlund",
      involvedNpcs: [],
      characterId: "char-2",
    }),
  ]);

  it("filters by event type, npc, location, character, and text", () => {
    expect(filterJournal(journal, { eventType: "advancement" }).map((e) => e.id)).toEqual(
      ["e2"],
    );
    expect(filterJournal(journal, { npc: "dunn smith" }).map((e) => e.id)).toEqual([
      "e1",
    ]);
    expect(filterJournal(journal, { location: "backlund" }).map((e) => e.id)).toEqual([
      "e2",
    ]);
    expect(filterJournal(journal, { characterId: "char-2" }).map((e) => e.id)).toEqual([
      "e2",
    ]);
    expect(filterJournal(journal, { text: "CHAPEL" }).map((e) => e.id)).toEqual(["e1"]);
    expect(filterJournal(journal, {})).toHaveLength(2);
  });
});

describe("journalToMarkdown", () => {
  it("groups by arc and renders annotations as blockquotes", () => {
    let journal = addJournalEntries(createJournal(), [
      entry(),
      entry({
        id: "e2",
        arc: "Sequence 8 — Clown",
        summary: "Advanced.",
        eventType: "advancement",
      }),
    ]);
    journal = addAnnotation(journal, "e1", "My own note.", 2000, "a1");

    const md = journalToMarkdown(journal);
    expect(md).toContain("# Klein");
    expect(md.indexOf("## Sequence 9 — Seer")).toBeLessThan(
      md.indexOf("## Sequence 8 — Clown"),
    );
    expect(md).toContain("### Turn 1 — Found the red chapel.");
    expect(md).toContain("*Discovery · Tingen City*");
    expect(md).toContain("Present: Dunn Smith");
    expect(md).toContain("> **Note:** My own note.");
  });

  it("uses the explicit title and a fallback for empty journals", () => {
    expect(journalToMarkdown(createJournal(), { title: "Custom" })).toBe("# Custom\n");
    expect(journalToMarkdown(createJournal())).toBe("# Story Journal\n");
  });
});

describe("journalEventLabel", () => {
  it("labels every event type", () => {
    expect(journalEventLabel("npc-encounter")).toBe("Encounter");
    expect(journalEventLabel("timeline-divergence")).toBe("Timeline Divergence");
  });
});

describe("serializeJournal / deserializeJournal", () => {
  it("round-trips a journal with annotations", () => {
    const journal = addAnnotation(
      addJournalEntries(createJournal(), [entry()]),
      "e1",
      "note",
      2000,
      "a1",
    );
    expect(deserializeJournal(serializeJournal(journal))).toEqual(journal);
  });

  it("rejects malformed payloads", () => {
    expect(deserializeJournal("not json")).toBeNull();
    expect(deserializeJournal("[]")).toBeNull();
    expect(deserializeJournal('{"entries":[{"id":1}],"annotations":[]}')).toBeNull();
    expect(deserializeJournal('{"entries":[],"annotations":[{"id":"a"}]}')).toBeNull();
  });
});

describe("journal-sync", () => {
  const annotation = {
    id: "a1",
    entryId: "e1",
    text: "note",
    createdAt: 0,
    updatedAt: 0,
  };

  function makeClient(error: { message: string } | null = null) {
    const upsert = vi.fn().mockResolvedValue({ error });
    const eq = vi.fn().mockResolvedValue({ error });
    const client = { from: vi.fn().mockReturnValue({ upsert, delete: () => ({ eq }) }) };
    return { client, upsert, eq };
  }

  it("maps rows with ISO timestamps and owner ids", () => {
    expect(toEntryRow(entry(), "user-1", "session-1")).toMatchObject({
      id: "e1",
      user_id: "user-1",
      session_id: "session-1",
      character_name: "Klein",
      event_type: "discovery",
      involved_npcs: ["Dunn Smith"],
      created_at: new Date(1000).toISOString(),
    });
    expect(
      toEntryRow(entry({ characterName: undefined }), "u", "s").character_name,
    ).toBeNull();
    expect(toAnnotationRow(annotation, "user-1")).toMatchObject({
      id: "a1",
      user_id: "user-1",
      entry_id: "e1",
    });
  });

  it("batch-upserts entries and skips the call for an empty batch", async () => {
    const { client, upsert } = makeClient();
    await syncEntries(client, "u", "s", [entry()]);
    expect(upsert).toHaveBeenCalledWith([toEntryRow(entry(), "u", "s")], {
      onConflict: "id",
    });
    upsert.mockClear();
    await syncEntries(client, "u", "s", []);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("syncs and deletes annotations immediately, surfacing failures", async () => {
    const { client, upsert, eq } = makeClient();
    await syncAnnotation(client, "u", annotation);
    expect(upsert).toHaveBeenCalledWith([toAnnotationRow(annotation, "u")], {
      onConflict: "id",
    });
    await deleteAnnotationRemote(client, "a1");
    expect(eq).toHaveBeenCalledWith("id", "a1");

    const failing = makeClient({ message: "down" });
    await expect(syncEntries(failing.client, "u", "s", [entry()])).rejects.toThrow(
      /Journal entry sync failed: down/,
    );
    await expect(syncAnnotation(failing.client, "u", annotation)).rejects.toThrow(
      /Annotation sync failed: down/,
    );
    await expect(deleteAnnotationRemote(failing.client, "a1")).rejects.toThrow(
      /Annotation delete failed: down/,
    );
  });

  it("syncJournal pushes entries then every annotation", async () => {
    const { client, upsert } = makeClient();
    const journal = addAnnotation(
      addJournalEntries(createJournal(), [entry()]),
      "e1",
      "note",
      0,
      "a1",
    );
    await syncJournal(client, "u", "s", journal);
    expect(upsert).toHaveBeenCalledTimes(2);
  });
});
