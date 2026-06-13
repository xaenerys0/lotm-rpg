"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import { noopSubscribe } from "@/lib/react";
import {
  glossaryForSequence,
  sealedTermCount,
  GLOSSARY_CATEGORIES,
  type GlossaryTerm,
} from "@/lib/lore";
import { deserializeSession, SESSION_INDEX_KEY, SESSION_KEY_PREFIX } from "@/lib/game";

// Glossary panel (issue #14): the in-game reference with progressive
// disclosure — entries unlock as the active character advances, so deep-game
// concepts stay sealed until approached. Written as world-building.

// The active character's sequence (progressive disclosure) and epoch (content
// isolation) together decide which lexicon entries exist. Epoch is left
// undefined for legacy/absent saves so the glossary defaults to the Fifth.
interface GlossaryScope {
  sequenceLevel: number;
  epoch?: number;
}

const DEFAULT_SCOPE: GlossaryScope = { sequenceLevel: 9 };

function loadActiveScope(): GlossaryScope {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids) || typeof ids[0] !== "string") return DEFAULT_SCOPE;
    const sessionRaw = localStorage.getItem(SESSION_KEY_PREFIX + ids[0]);
    const session = sessionRaw ? deserializeSession(sessionRaw) : null;
    if (!session) return DEFAULT_SCOPE;
    return {
      sequenceLevel: session.gameState.sequenceLevel ?? 9,
      epoch: session.gameState.epoch,
    };
  } catch {
    return DEFAULT_SCOPE;
  }
}

export function GlossaryPanel() {
  const scopeCacheRef = useRef<GlossaryScope | undefined>(undefined);
  const scope = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (scopeCacheRef.current === undefined) {
        scopeCacheRef.current = loadActiveScope();
      }
      return scopeCacheRef.current;
    },
    () => DEFAULT_SCOPE,
  );
  const { sequenceLevel, epoch } = scope;

  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => glossaryForSequence(sequenceLevel, epoch),
    [sequenceLevel, epoch],
  );
  const sealed = sealedTermCount(sequenceLevel, epoch);

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return visible;
    return visible.filter(
      (term) =>
        term.term.toLowerCase().includes(lowered) ||
        term.definition.toLowerCase().includes(lowered),
    );
  }, [visible, query]);

  const byCategory = GLOSSARY_CATEGORIES.map((category) => ({
    category,
    terms: filtered.filter((term) => term.category === category),
  })).filter((group) => group.terms.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="glossary-search" className="mb-1.5 block text-xs text-muted">
            Search the lexicon
          </label>
          <input
            id="glossary-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Beyonder, potion, ritual…"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
          />
        </div>
        {sealed > 0 && (
          <p className="font-serif text-xs italic text-muted">
            {sealed} {sealed === 1 ? "entry remains" : "entries remain"} sealed — some
            knowledge must be earned.
          </p>
        )}
      </div>

      {byCategory.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted">
          Nothing in the lexicon matches — or it has not been unsealed yet.
        </p>
      ) : (
        byCategory.map(({ category, terms }) => (
          <section key={category} aria-labelledby={`glossary-${category}`}>
            <h2
              id={`glossary-${category}`}
              className="gaslit font-serif text-lg font-semibold text-amber/90"
            >
              {category}
            </h2>
            <dl className="mt-3 space-y-3">
              {terms.map((term: GlossaryTerm) => (
                <div key={term.slug} className="parchment rounded-md p-4">
                  <dt className="text-sm font-semibold text-foreground">{term.term}</dt>
                  <dd className="mt-1 font-serif text-sm leading-relaxed text-foreground/80">
                    {term.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}
    </div>
  );
}
