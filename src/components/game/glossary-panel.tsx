"use client";

import { useMemo, useState } from "react";

import { useActiveSession } from "@/lib/react/session-store";
import {
  glossaryForSequence,
  sealedTermCount,
  GLOSSARY_CATEGORIES,
  type GlossaryTerm,
} from "@/lib/lore";

// Glossary panel (issue #14): the in-game reference with progressive
// disclosure — entries unlock as the active character advances, so deep-game
// concepts stay sealed until approached. Written as world-building.

export function GlossaryPanel() {
  // The active character's sequence (progressive disclosure) and epoch (content
  // isolation) decide which entries exist; reactive to the active-character
  // switch. Defaults (Seq 9, Fifth) cover the no-save / hydration case.
  const session = useActiveSession();
  const sequenceLevel = session?.gameState.sequenceLevel ?? 9;
  const epoch = session?.gameState.epoch;
  // Capability gate (issue #132): the access-gated Forsaken Land's terms show
  // only to a character holding the dream-world passage. A stable key keeps the
  // memo honest without depending on array identity.
  const accessFlags = session?.gameState.accessFlags;
  const accessFlagsKey = (accessFlags ?? []).join(",");

  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => glossaryForSequence(sequenceLevel, epoch, accessFlags),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accessFlagsKey stands in for the accessFlags array identity
    [sequenceLevel, epoch, accessFlagsKey],
  );
  const sealed = useMemo(
    () => sealedTermCount(sequenceLevel, epoch, accessFlags),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accessFlagsKey stands in for the accessFlags array identity
    [sequenceLevel, epoch, accessFlagsKey],
  );

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
