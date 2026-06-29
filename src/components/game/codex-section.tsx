"use client";

import { useMemo, useState } from "react";
import {
  applyCodexUpdate,
  applyCodexUpdates,
  codexCounts,
  codexRebuildDigest,
  createJournal,
  deserializeJournal,
  emptyCodexState,
  filterCodexEntities,
  mergeCodexEntities,
  removeCodexEntity,
  resolveCodexState,
  setCodexImportance,
  updateCodexEntity,
  CODEX_KINDS,
  JOURNAL_KEY_PREFIX,
  PROVIDER_CONFIG_KEY,
  type CodexEntity,
  type CodexKind,
  type GameSession,
  type Journal,
} from "@/lib/game";
import { generateCodexRebuild, type ProviderConfig } from "@/lib/ai";

// ---------------------------------------------------------------------------
// CodexSection — the player-facing Codex tab (history-context Codex)
// ---------------------------------------------------------------------------
//
// A browsable, curatable index of the people, places, objects, groups, and open
// plot threads the chronicle has established — the same registry that grounds
// the narrator each turn (`## Established Facts`). Three capabilities:
//   1. Browse/filter (search + kind chips + settled-threads toggle).
//   2. Curate by hand — pin/unpin, edit, merge duplicates, forget.
//   3. Rebuild from history — a one-shot BYOK LLM pass that re-extracts a clean,
//      categorized, de-duplicated Codex from the synopsis + journal + facts (the
//      deep population a pre-feature long save needs; the heuristic backfill only
//      reaches the structured sub-states).
// Pure logic lives in `@/lib/game`/`@/lib/ai` (tested); this is the shell,
// verified via the axe suite + an authenticated e2e spec.

const KIND_LABEL: Record<CodexKind, string> = {
  person: "People",
  location: "Places",
  object: "Objects",
  group: "Groups",
  thread: "Threads",
};

const KIND_SINGULAR: Record<CodexKind, string> = {
  person: "Person",
  location: "Place",
  object: "Object",
  group: "Group",
  thread: "Thread",
};

// Decorative glyphs only — the kind is always also named in adjacent text, so
// meaning is never carried by the glyph alone (WCAG 1.1.1 / 1.4.1).
const KIND_GLYPH: Record<CodexKind, string> = {
  person: "◉",
  location: "⌖",
  object: "❖",
  group: "⚜",
  thread: "⛓",
};

type KindFilter = CodexKind | "all";

function loadProviderConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as ProviderConfig) : null;
  } catch {
    return null;
  }
}

function loadJournal(sessionId: string): Journal {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY_PREFIX + sessionId);
    return (raw ? deserializeJournal(raw) : null) ?? createJournal();
  } catch {
    return createJournal();
  }
}

export function CodexSection({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const codex = useMemo(
    () => resolveCodexState(session.codexState),
    [session.codexState],
  );
  const [kind, setKind] = useState<KindFilter>("all");
  const [text, setText] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  // Rebuild flow. The button is always offered (the handler reports a clear
  // error if no provider is configured) — reading the config once here would go
  // stale if the player configured a provider after opening the sheet.
  const [confirmingRebuild, setConfirmingRebuild] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  const [rebuildNotice, setRebuildNotice] = useState<string | null>(null);

  // Manual add — the deterministic fallback for anything the AI rebuild missed.
  const [addingEntry, setAddingEntry] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<CodexKind>("person");
  const [newStatus, setNewStatus] = useState("");
  const [newPivotal, setNewPivotal] = useState(false);

  const counts = useMemo(() => codexCounts(codex), [codex]);
  const total = useMemo(() => CODEX_KINDS.reduce((s, k) => s + counts[k], 0), [counts]);

  const results = useMemo(
    () => filterCodexEntities(codex, { kind, text, includeResolved: showResolved }),
    [codex, kind, text, showResolved],
  );

  const grouped = useMemo(
    () =>
      CODEX_KINDS.map((k) => ({
        kind: k,
        entities: results.filter((e) => e.kind === k),
      })).filter((g) => g.entities.length > 0),
    [results],
  );

  const chips: { id: KindFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    ...CODEX_KINDS.map((k) => ({ id: k, label: KIND_LABEL[k], count: counts[k] })),
  ];

  // Same-kind entities grouped once (a merge target must match kind), so each
  // card looks its list up instead of re-filtering the whole Codex per render.
  const sameKindByKind = useMemo(() => {
    const map: Record<CodexKind, CodexEntity[]> = {
      person: [],
      location: [],
      object: [],
      group: [],
      thread: [],
    };
    for (const e of codex.entities) map[e.kind].push(e);
    return map;
  }, [codex]);

  function commit(next: GameSession["codexState"]) {
    onUpdate({ ...session, codexState: next });
  }

  function handleAdd() {
    if (newName.trim() === "") return;
    commit(
      applyCodexUpdate(
        codex,
        {
          kind: newKind,
          name: newName,
          status: newStatus,
          importance: newPivotal ? "pivotal" : "standard",
        },
        session.turnCount,
      ),
    );
    setAddingEntry(false);
    setNewName("");
    setNewStatus("");
    setNewPivotal(false);
    setNewKind("person");
  }

  async function handleRebuild() {
    const config = loadProviderConfig();
    if (!config) {
      setRebuildError("Configure an AI provider in Settings before rebuilding.");
      return;
    }
    setRebuilding(true);
    setRebuildError(null);
    setRebuildNotice(null);
    try {
      const digest = codexRebuildDigest(session, loadJournal(session.id));
      const updates = await generateCodexRebuild(config, digest);
      if (updates.length === 0) {
        setRebuildError("The archivist returned nothing legible. Try again.");
        return;
      }
      const rebuilt = applyCodexUpdates(emptyCodexState(), updates, session.turnCount);
      commit(rebuilt);
      setConfirmingRebuild(false);
      setRebuildNotice(`Codex rebuilt — ${rebuilt.entities.length} entries inscribed.`);
    } catch {
      setRebuildError("The rebuild failed. Check your provider settings and try again.");
    } finally {
      setRebuilding(false);
    }
  }

  return (
    <section
      aria-labelledby="sheet-codex"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="sheet-codex" className="font-serif text-lg font-semibold text-foreground">
          Codex
        </h2>
        {!confirmingRebuild && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-expanded={addingEntry}
              onClick={() => setAddingEntry((v) => !v)}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              {addingEntry ? "Close" : "Add entry…"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingRebuild(true);
                setRebuildError(null);
                setRebuildNotice(null);
              }}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Rebuild from history…
            </button>
          </div>
        )}
      </div>

      {addingEntry && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="mt-4 space-y-3 rounded-lg border border-border bg-surface-raised p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="codex-add-name"
                className="mb-1 block text-[11px] font-medium text-muted"
              >
                Name
              </label>
              <input
                id="codex-add-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="codex-add-kind"
                className="mb-1 block text-[11px] font-medium text-muted"
              >
                Kind
              </label>
              <select
                id="codex-add-kind"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as CodexKind)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
              >
                {CODEX_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_SINGULAR[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="codex-add-status"
              className="mb-1 block text-[11px] font-medium text-muted"
            >
              Status
            </label>
            <input
              id="codex-add-status"
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="e.g. a guarded ally rescued in Backlund"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={newPivotal}
              onChange={(e) => setNewPivotal(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface text-amber focus:ring-2 focus:ring-amber/30"
            />
            Pivotal (always kept in the narrator&rsquo;s view)
          </label>
          <div>
            <button
              type="submit"
              disabled={newName.trim() === ""}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/50 bg-amber/10 px-3 py-1 text-xs font-medium text-amber transition-colors hover:bg-amber/20 disabled:opacity-60"
            >
              Add to Codex
            </button>
          </div>
        </form>
      )}
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The figures, places, relics, factions, and unfinished business your chronicle has
        gathered — the same record that keeps the narrator consistent across a long story.
      </p>

      {confirmingRebuild && (
        <div className="mt-4 rounded-lg border border-amber/30 bg-amber/5 p-4">
          <p className="text-sm text-foreground">
            Rebuild reads your story summary, journal, and recorded facts through your AI
            provider and <strong>replaces</strong> the current Codex with a freshly
            extracted, de-duplicated one. This uses your configured key.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRebuild}
              disabled={rebuilding}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/50 bg-amber/10 px-3 py-1 text-xs font-medium text-amber transition-colors hover:bg-amber/20 disabled:opacity-60"
            >
              {rebuilding ? "Rebuilding…" : "Rebuild the Codex"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRebuild(false)}
              disabled={rebuilding}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
          {rebuilding && (
            <p role="status" className="mt-2 text-xs text-muted">
              Rebuilding the Codex from your chronicle…
            </p>
          )}
        </div>
      )}
      {rebuildError && (
        <p role="alert" className="mt-3 text-xs text-crimson">
          {rebuildError}
        </p>
      )}
      {rebuildNotice && (
        <p role="status" className="mt-3 text-xs text-amber">
          {rebuildNotice}
        </p>
      )}

      {total === 0 && !showResolved ? (
        <p className="mt-6 font-serif text-sm italic text-muted">
          Nothing inscribed yet. As your story names people, places, and promises, they
          will be remembered here — or rebuild from your history above.
        </p>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            <label htmlFor="codex-search" className="sr-only">
              Search the Codex
            </label>
            <input
              id="codex-search"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search by name, status, or alias…"
              className="w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
            />
            <div
              role="group"
              aria-label="Filter the Codex by kind"
              className="flex flex-wrap gap-2"
            >
              {chips.map((chip) => {
                const active = kind === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setKind(chip.id)}
                    className={`inline-flex min-h-[24px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-amber/50 bg-amber/10 text-amber"
                        : "border-border bg-surface-raised text-muted hover:text-foreground"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span aria-hidden="true" className="text-[10px]">
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface-raised text-amber focus:ring-2 focus:ring-amber/30"
              />
              Show settled threads
            </label>
          </div>

          {grouped.length === 0 ? (
            <p role="status" className="mt-6 font-serif text-sm italic text-muted">
              No entries match your search.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {grouped.map((group) => (
                <div key={group.kind}>
                  <h3 className="flex items-baseline gap-2 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
                    <span aria-hidden="true" className="text-sm">
                      {KIND_GLYPH[group.kind]}
                    </span>
                    <span>{KIND_LABEL[group.kind]}</span>
                    <span className="font-normal text-muted normal-case">
                      ({group.entities.length})
                    </span>
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {group.entities.map((entity) => (
                      <CodexCard
                        key={entity.id}
                        entity={entity}
                        mergeTargets={sameKindByKind[entity.kind].filter(
                          (e) => e.id !== entity.id,
                        )}
                        onPin={(imp) => commit(setCodexImportance(codex, entity.id, imp))}
                        onEdit={(edit) =>
                          commit(updateCodexEntity(codex, entity.id, edit))
                        }
                        onMerge={(intoId) =>
                          commit(mergeCodexEntities(codex, intoId, entity.id))
                        }
                        onForget={() => commit(removeCodexEntity(codex, entity.id))}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CodexCard({
  entity,
  mergeTargets,
  onPin,
  onEdit,
  onMerge,
  onForget,
}: {
  entity: CodexEntity;
  mergeTargets: CodexEntity[];
  onPin: (importance: "pivotal" | "standard") => void;
  onEdit: (edit: { name?: string; status?: string }) => void;
  onMerge: (intoId: string) => void;
  onForget: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entity.name);
  const [status, setStatus] = useState(entity.status);
  const settled = entity.kind === "thread" && entity.resolved;
  const pivotal = entity.importance === "pivotal";

  return (
    <li className="rounded-lg border border-border bg-surface-raised p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-serif text-sm font-medium text-foreground">
          {entity.name}
          {pivotal && (
            <span className="ml-2 inline-flex items-center rounded-md border border-occult/40 bg-occult/10 px-1.5 py-0.5 align-middle text-[10px] font-medium tracking-[0.1em] text-occult-bright uppercase">
              Pivotal
            </span>
          )}
          {settled && (
            <span className="ml-2 inline-flex items-center rounded-md border border-border bg-surface px-1.5 py-0.5 align-middle text-[10px] font-medium tracking-[0.1em] text-muted uppercase">
              Settled
            </span>
          )}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-pressed={pivotal}
            aria-label={
              pivotal ? `Unpin ${entity.name}` : `Pin ${entity.name} as pivotal`
            }
            onClick={() => onPin(pivotal ? "standard" : "pivotal")}
            className={`inline-flex min-h-[24px] items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
              pivotal
                ? "border-occult/40 bg-occult/10 text-occult-bright"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {pivotal ? "Pinned" : "Pin"}
          </button>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => {
              setName(entity.name);
              setStatus(entity.status);
              setEditing((v) => !v);
            }}
            className="inline-flex min-h-[24px] items-center rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:text-foreground"
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>
      </div>
      {entity.status && (
        <p className="mt-1 text-xs leading-relaxed text-muted">{entity.status}</p>
      )}
      {entity.aliases && entity.aliases.length > 0 && (
        <p className="mt-1 text-[11px] text-muted">
          <span className="text-foreground">Also known as:</span>{" "}
          {entity.aliases.join(", ")}
        </p>
      )}
      <p className="mt-1 text-[11px] text-muted">
        {KIND_SINGULAR[entity.kind]} · last seen turn {entity.lastSeenTurn}
      </p>

      {editing && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor={`codex-name-${entity.id}`}
              className="mb-1 block text-[11px] font-medium text-muted"
            >
              Name
            </label>
            <input
              id={`codex-name-${entity.id}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`codex-status-${entity.id}`}
              className="mb-1 block text-[11px] font-medium text-muted"
            >
              Status
            </label>
            <input
              id={`codex-status-${entity.id}`}
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
            />
          </div>
          {mergeTargets.length > 0 && (
            <div>
              <label
                htmlFor={`codex-merge-${entity.id}`}
                className="mb-1 block text-[11px] font-medium text-muted"
              >
                Merge into another {KIND_SINGULAR[entity.kind].toLowerCase()}
              </label>
              <select
                id={`codex-merge-${entity.id}`}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) onMerge(e.target.value);
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-amber focus:ring-2 focus:ring-amber/30 focus:outline-none"
              >
                <option value="">Keep separate…</option>
                {mergeTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onEdit({ name, status });
                setEditing(false);
              }}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-amber/50 bg-amber/10 px-3 py-1 text-xs font-medium text-amber transition-colors hover:bg-amber/20"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onForget}
              className="inline-flex min-h-[24px] items-center rounded-lg border border-crimson/40 px-3 py-1 text-xs font-medium text-sanity-low transition-colors hover:bg-crimson/10"
            >
              Forget
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
