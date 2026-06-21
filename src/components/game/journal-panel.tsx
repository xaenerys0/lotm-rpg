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
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-serif text-lg italic text-foreground">
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
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <label
              htmlFor="journal-session"
              className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              Chronicle
            </label>
            <select
              id="journal-session"
              value={activeSessionId ?? ""}
              onChange={(e) => saveActiveSessionId(e.target.value)}
              className="w-full max-w-full truncate rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 sm:w-auto"
            >
              {sessionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="journal-search"
              className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              Search
            </label>
            <input
              id="journal-search"
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search events…"
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 sm:w-auto"
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="journal-type"
              className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
            >
              Event type
            </label>
            <select
              id="journal-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as JournalEventType | "")}
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 sm:w-auto"
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
          className="self-start rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
        >
          Export Markdown
        </button>
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          {journal.entries.length === 0
            ? "No events recorded yet — key moments are captured automatically as you play."
            : "No entries match the current filters."}
        </p>
      ) : (
        <ol className="space-y-6">
          {groupByArc(entries).map(([arc, arcEntries]) => (
            <li key={arc}>
              <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
                {arc}
              </h2>
              <ol className="space-y-3 border-l border-border pl-4">
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
    <article className="rounded-xl border border-border bg-surface p-5">
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
        className="mt-2 min-h-[24px] rounded px-1 py-1 text-xs font-semibold text-amber transition-colors hover:text-gold"
      >
        {expanded ? "Hide details" : "Show details"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {/* Cached illustration only (issue #20) — the journal never spends. */}
          <SceneArt
            artKey={sceneArtKey(sessionId, entry.turnNumber)}
            context={{ summary: entry.summary, location: entry.location }}
            imageConfig={null}
            enabled={false}
          />
          <p className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-foreground">
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
                    className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(annotation.id)}
                      className="min-h-[24px] rounded-lg bg-amber px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-gold"
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={annotation.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border border-l-2 border-l-amber bg-surface-raised px-3.5 py-2.5"
                >
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {annotation.text}
                  </p>
                  <span className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(annotation.id);
                        setEditDraft(annotation.text);
                      }}
                      className="min-h-[24px] rounded px-1 py-1 text-xs font-semibold text-amber transition-colors hover:text-gold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(annotation.id)}
                      className="min-h-[24px] rounded px-1 py-1 text-xs font-semibold text-crimson transition-colors hover:text-foreground"
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
                  className="mb-1.5 block text-xs text-muted"
                >
                  Add a personal note (never shared with the narrator)
                </label>
                <textarea
                  id={`note-${entry.id}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground placeholder-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNote}
                disabled={draft.trim() === ""}
                className="rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-amber transition-colors hover:border-amber/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
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
