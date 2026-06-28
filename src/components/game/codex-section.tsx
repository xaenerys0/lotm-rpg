"use client";

import { useMemo, useState } from "react";
import {
  CODEX_KINDS,
  codexCounts,
  filterCodexEntities,
  resolveCodexState,
  type CodexEntity,
  type CodexKind,
  type GameSession,
} from "@/lib/game";

// ---------------------------------------------------------------------------
// CodexSection — the player-facing Codex tab (history-context Codex)
// ---------------------------------------------------------------------------
//
// A browsable index of the people, places, objects, groups, and open plot
// threads the chronicle has established — the same registry that grounds the
// narrator each turn (`## Established Facts`), surfaced for the player. Reads
// `session.codexState`; read-only (the AI + engine own the data). Pure filter
// logic lives in `@/lib/game` (`filterCodexEntities`, tested); this is the thin
// presentational shell, verified via the axe suite.

const KIND_LABEL: Record<CodexKind, string> = {
  person: "People",
  location: "Places",
  object: "Objects",
  group: "Groups",
  thread: "Threads",
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

export function CodexSection({ session }: { session: GameSession }) {
  const codex = resolveCodexState(session.codexState);
  const [kind, setKind] = useState<KindFilter>("all");
  const [text, setText] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const counts = useMemo(() => codexCounts(codex), [codex]);
  const total = useMemo(
    () => CODEX_KINDS.reduce((sum, k) => sum + counts[k], 0),
    [counts],
  );

  const results = useMemo(
    () => filterCodexEntities(codex, { kind, text, includeResolved: showResolved }),
    [codex, kind, text, showResolved],
  );

  // Group the filtered results by kind for legible section headers.
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

  return (
    <section
      aria-labelledby="sheet-codex"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2 id="sheet-codex" className="font-serif text-lg font-semibold text-foreground">
        Codex
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The figures, places, relics, factions, and unfinished business your chronicle has
        gathered — the same record that keeps the narrator consistent across a long story.
      </p>

      {total === 0 && !showResolved ? (
        <p className="mt-6 font-serif text-sm italic text-muted">
          Nothing inscribed yet. As your story names people, places, and promises, they
          will be remembered here.
        </p>
      ) : (
        <>
          {/* Controls */}
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
                    <span aria-hidden="true" className="text-[10px] opacity-80">
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

          {/* Results */}
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
                      <CodexCard key={entity.id} entity={entity} />
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

function CodexCard({ entity }: { entity: CodexEntity }) {
  const settled = entity.kind === "thread" && entity.resolved;
  return (
    <li className="rounded-lg border border-border bg-surface-raised p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-serif text-sm font-medium text-foreground">
          {entity.name}
          {entity.importance === "pivotal" && (
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
        <p className="text-[11px] whitespace-nowrap text-muted">
          last seen · turn {entity.lastSeenTurn}
        </p>
      </div>
      {entity.status && (
        <p className="mt-1 text-xs leading-relaxed text-muted">{entity.status}</p>
      )}
      {entity.aliases && entity.aliases.length > 0 && (
        <p className="mt-1 text-[11px] text-muted">
          <span className="text-foreground/70">Also known as:</span>{" "}
          {entity.aliases.join(", ")}
        </p>
      )}
      {entity.note && (
        <p className="mt-1.5 font-serif text-xs leading-relaxed text-foreground/90 italic">
          {entity.note}
        </p>
      )}
    </li>
  );
}
