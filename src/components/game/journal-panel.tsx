"use client";

import { useCallback, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { sceneArtKey } from "@/lib/ai";
import { SceneArt } from "./scene-art";
import {
  saveActiveSessionId,
  useActiveSessionId,
  useHydrated,
  useSessionSummaries,
} from "@/lib/react/session-store";
import {
  addAnnotation,
  annotationsFor,
  createJournal,
  deleteAnnotation,
  deleteAnnotationRemote,
  deserializeJournal,
  editAnnotation,
  filterJournal,
  journalEventLabel,
  journalToMarkdown,
  serializeJournal,
  syncAnnotation,
  JOURNAL_EVENT_TYPES,
  JOURNAL_KEY_PREFIX,
  type Journal,
  type JournalEntry,
  type JournalEventType,
  type JournalSyncClient,
} from "@/lib/game";

// Story journal viewer (issue #11): chronological timeline grouped by arc,
// player annotations (player-ONLY — never fed to the AI), filtering, and
// Markdown export. localStorage is the source of truth (mirrors sessions);
// annotation edits additionally sync to Supabase best-effort and immediately.

function loadJournal(sessionId: string): Journal {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY_PREFIX + sessionId);
    return (raw ? deserializeJournal(raw) : null) ?? createJournal();
  } catch {
    return createJournal();
  }
}

function saveJournal(sessionId: string, journal: Journal): void {
  try {
    localStorage.setItem(JOURNAL_KEY_PREFIX + sessionId, serializeJournal(journal));
  } catch {
    // Storage full or unavailable — the in-memory journal still renders.
  }
}

/** Best-effort owner id for Supabase sync; null when signed out/unreachable. */
async function currentUserId(
  client: ReturnType<typeof createClient>,
): Promise<string | null> {
  try {
    const { data } = await client.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export function JournalPanel() {
  // The journal follows the shared active character (active-character sync); the
  // Chronicle picker writes the same pointer the rest of the app reads.
  const hydrated = useHydrated();
  const summaries = useSessionSummaries();
  const activeSessionId = useActiveSessionId();
  const sessionOptions = useMemo(
    () =>
      summaries.map((s) => ({
        id: s.id,
        label: `${s.characterName ?? "Unnamed Beyonder"} — Turn ${s.turnCount} (${s.location})`,
      })),
    [summaries],
  );

  const [journals, setJournals] = useState<Record<string, Journal>>({});
  const journal = activeSessionId
    ? (journals[activeSessionId] ?? loadJournal(activeSessionId))
    : createJournal();

  const updateJournal = useCallback(
    (next: Journal) => {
      if (!activeSessionId) return;
      setJournals((prev) => ({ ...prev, [activeSessionId]: next }));
      saveJournal(activeSessionId, next);
    },
    [activeSessionId],
  );

  // Annotations sync to Supabase immediately and best-effort (issue #11) —
  // the local journal never waits on the network.
  const syncAnnotationRemote = useCallback((annotationId: string, next: Journal) => {
    void (async () => {
      try {
        const client = createClient();
        const userId = await currentUserId(client);
        if (!userId) return;
        const annotation = next.annotations.find((a) => a.id === annotationId);
        const sync = client as unknown as JournalSyncClient;
        if (annotation) await syncAnnotation(sync, userId, annotation);
        else await deleteAnnotationRemote(sync, annotationId);
      } catch {
        // Offline or unreachable — localStorage already has the edit.
      }
    })();
  }, []);

  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState<JournalEventType | "">("");

  const entries = useMemo(
    () =>
      filterJournal(journal, {
        ...(filterText ? { text: filterText } : {}),
        ...(filterType ? { eventType: filterType } : {}),
      }),
    [journal, filterText, filterType],
  );

  const handleExport = useCallback(() => {
    const markdown = journalToMarkdown(journal);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "story-journal.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [journal]);

  // Pre-hydration the summaries snapshot is empty (SSR fallback); show a neutral
  // loading line rather than flashing the "no chronicles" empty state to a player
  // who actually has saves (the issue-#84/#86 frozen-snapshot class).
  if (!hydrated) {
    return <p className="text-sm text-muted">Loading journal…</p>;
  }

  if (sessionOptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-12 text-center">
        <p className="font-serif text-lg italic text-foreground/70">
          &ldquo;The pages are blank&rdquo;
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Your story journal will record every advancement, encounter, and discovery as
          your narrative unfolds. Begin a game to open its first page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <label htmlFor="journal-session" className="mb-1.5 block text-xs text-muted">
              Chronicle
            </label>
            <select
              id="journal-session"
              value={activeSessionId ?? ""}
              onChange={(e) => saveActiveSessionId(e.target.value)}
              className="w-full max-w-full truncate rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20 sm:w-auto"
            >
              {sessionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="journal-search" className="mb-1.5 block text-xs text-muted">
              Search
            </label>
            <input
              id="journal-search"
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search events…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20 sm:w-auto"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="journal-type" className="mb-1.5 block text-xs text-muted">
              Event type
            </label>
            <select
              id="journal-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as JournalEventType | "")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20 sm:w-auto"
            >
              <option value="">All events</option>
              {JOURNAL_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {journalEventLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={journal.entries.length === 0}
          className="self-start rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-2 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/50 hover:bg-amber/[0.1] disabled:cursor-not-allowed disabled:opacity-30 sm:self-auto"
        >
          Export Markdown
        </button>
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted">
          {journal.entries.length === 0
            ? "No events recorded yet — key moments are captured automatically as you play."
            : "No entries match the current filters."}
        </p>
      ) : (
        <ol className="space-y-4">
          {groupByArc(entries).map(([arc, arcEntries]) => (
            <li key={arc}>
              <h2 className="mb-3 font-serif text-lg font-semibold text-amber/90">
                {arc}
              </h2>
              <ol className="space-y-3 border-l border-border/60 pl-4">
                {arcEntries.map((e) => (
                  <li key={e.id}>
                    <EntryCard
                      entry={e}
                      sessionId={activeSessionId ?? ""}
                      journal={journal}
                      onChange={updateJournal}
                      onAnnotationSync={syncAnnotationRemote}
                    />
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function groupByArc(entries: readonly JournalEntry[]): [string, JournalEntry[]][] {
  const groups: [string, JournalEntry[]][] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last[0] === entry.arc) last[1].push(entry);
    else groups.push([entry.arc, [entry]]);
  }
  return groups;
}

function EntryCard({
  entry,
  sessionId,
  journal,
  onChange,
  onAnnotationSync,
}: {
  entry: JournalEntry;
  sessionId: string;
  journal: Journal;
  onChange: (next: Journal) => void;
  onAnnotationSync: (annotationId: string, next: Journal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const annotations = annotationsFor(journal, entry.id);

  const handleAddNote = () => {
    const text = draft.trim();
    if (!text) return;
    const id = crypto.randomUUID();
    const next = addAnnotation(journal, entry.id, text, Date.now(), id);
    onChange(next);
    onAnnotationSync(id, next);
    setDraft("");
  };

  const handleSaveEdit = (annotationId: string) => {
    const next = editAnnotation(journal, annotationId, editDraft.trim());
    onChange(next);
    onAnnotationSync(annotationId, next);
    setEditingId(null);
  };

  const handleDelete = (annotationId: string) => {
    const next = deleteAnnotation(journal, annotationId);
    onChange(next);
    onAnnotationSync(annotationId, next);
  };

  return (
    <article className="rounded-lg border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-base font-semibold text-foreground">
          {entry.summary}
        </h3>
        <span className="text-xs text-muted">
          {journalEventLabel(entry.eventType)} · {entry.location} · Turn{" "}
          {entry.turnNumber}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-2 rounded px-1 py-1 text-xs font-medium text-amber hover:underline"
      >
        {expanded ? "Hide details" : "Show details"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {/* Cached illustration only (issue #20) — the journal never spends. */}
          <SceneArt
            artKey={sceneArtKey(sessionId, entry.turnNumber)}
            context={{ summary: entry.summary, location: entry.location }}
            config={null}
            enabled={false}
          />
          <p className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {entry.narrative}
          </p>
          {entry.involvedNpcs.length > 0 && (
            <p className="text-xs text-muted">Present: {entry.involvedNpcs.join(", ")}</p>
          )}

          {/* Player annotations — player-only; the narrator never sees these. */}
          <section aria-label={`Notes on: ${entry.summary}`} className="space-y-2">
            {annotations.map((annotation) =>
              editingId === annotation.id ? (
                <div key={annotation.id} className="space-y-2">
                  <textarea
                    aria-label="Edit note"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(annotation.id)}
                      className="rounded-md bg-amber/90 px-3 py-1.5 text-xs font-medium text-background hover:bg-amber"
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={annotation.id}
                  className="flex items-start justify-between gap-3 rounded-md border-l-2 border-amber/40 bg-amber/[0.04] px-3 py-2"
                >
                  <p className="text-sm whitespace-pre-wrap text-foreground/85">
                    {annotation.text}
                  </p>
                  <span className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(annotation.id);
                        setEditDraft(annotation.text);
                      }}
                      className="rounded px-1 py-1 text-xs text-amber hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(annotation.id)}
                      className="rounded px-1 py-1 text-xs text-sanity-low hover:underline"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ),
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor={`note-${entry.id}`}
                  className="mb-1 block text-xs text-muted"
                >
                  Add a personal note (never shared with the narrator)
                </label>
                <textarea
                  id={`note-${entry.id}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber/50 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNote}
                disabled={draft.trim() === ""}
                className="rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-2 text-xs font-medium text-amber hover:border-amber/50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Add note
              </button>
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
