"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import { noopSubscribe } from "@/lib/react";
import { getPathway, getSequence } from "@/lib/rules";
import { classifySanityTier } from "@/lib/ai";
import {
  deserializeSession,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  type GameSession,
} from "@/lib/game";
import type { Item } from "@/lib/types/rules";

// Character sheet panel (issue #13): identity, abilities & acting
// requirements, condition, and the inventory. Sanity is shown as an in-world
// descriptor — never a number — preserving the hidden-meter design.

function loadSessions(): GameSession[] {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return [];
    return ids
      .filter((id): id is string => typeof id === "string")
      .map((id) => {
        const sessionRaw = localStorage.getItem(SESSION_KEY_PREFIX + id);
        return sessionRaw ? deserializeSession(sessionRaw) : null;
      })
      .filter((session): session is GameSession => session !== null);
  } catch {
    return [];
  }
}

const SANITY_DESCRIPTORS: Record<ReturnType<typeof classifySanityTier>, string> = {
  high: "Steady — the world holds its shape.",
  medium: "Frayed — small wrongnesses at the edge of sight.",
  low: "Slipping — the fog has started whispering.",
  critical: "Unraveling — very little of the world can be trusted.",
};

const ITEM_CATEGORY_LABELS: Record<Item["category"], string> = {
  "main-ingredient": "Main Ingredients",
  "supplementary-ingredient": "Supplementary Ingredients",
  "potion-formula": "Potion Formulas",
};

const ITEM_CATEGORY_GLYPHS: Record<Item["category"], string> = {
  "main-ingredient": "◉",
  "supplementary-ingredient": "❖",
  "potion-formula": "✦",
};

export function CharacterSheet() {
  const sessionsCacheRef = useRef<GameSession[] | undefined>(undefined);
  const sessions = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (sessionsCacheRef.current === undefined) {
        sessionsCacheRef.current = loadSessions();
      }
      return sessionsCacheRef.current;
    },
    () => null,
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (sessions === null) {
    return <p className="text-sm text-muted">Consulting the records…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-12 text-center">
        <p className="font-serif text-lg italic text-foreground/70">
          &ldquo;The pathways await your choice&rdquo;
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          No Beyonder has been recorded yet. Begin a game to inscribe your first character
          into the chronicle.
        </p>
      </div>
    );
  }

  const session = sessions.find((s) => s.id === selectedId) ?? sessions[0];
  const state = session.gameState;
  const pathway = getPathway(state.pathwayId);
  const sequence = getSequence(state.pathwayId, state.sequenceLevel);
  const tier = classifySanityTier(state.sanity, state.maxSanity);

  const inventoryByCategory = (
    Object.keys(ITEM_CATEGORY_LABELS) as Item["category"][]
  ).map((category) => ({
    category,
    items: state.inventory.filter((item) => item.category === category),
  }));

  return (
    <div className="space-y-8">
      {sessions.length > 1 && (
        <div>
          <label htmlFor="sheet-session" className="mb-1.5 block text-xs text-muted">
            Beyonder
          </label>
          <select
            id="sheet-session"
            value={session.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.gameState.characterName ?? "Unnamed Beyonder"} — Turn {s.turnCount}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Identity */}
      <section
        aria-labelledby="sheet-identity"
        className="parchment rounded-lg p-6 md:p-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2
              id="sheet-identity"
              className="font-serif text-2xl font-bold text-foreground"
            >
              {state.characterName ?? "Unnamed Beyonder"}
              {session.ended && (
                <span className="ml-3 align-middle text-xs font-normal tracking-[0.2em] text-sanity-low uppercase">
                  {session.ended.fate === "dead" ? "Deceased" : "Transformed"}
                </span>
              )}
            </h2>
            <p className="mt-1 font-serif text-sm italic text-muted">
              Sequence {state.sequenceLevel} {sequence?.name ?? "Beyonder"} ·{" "}
              {pathway?.name ?? "Unknown"} Pathway
            </p>
          </div>
          <p className="text-xs text-muted">
            {state.location} · Turn {session.turnCount}
          </p>
        </div>
        {state.characterBackground && (
          <p className="mt-4 max-w-2xl font-serif text-sm leading-relaxed text-foreground/80">
            {state.characterBackground}
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Abilities & acting */}
        <section
          aria-labelledby="sheet-abilities"
          className="rounded-lg border border-border/70 bg-surface/60 p-6"
        >
          <h2
            id="sheet-abilities"
            className="gaslit font-serif text-lg font-semibold text-amber/90"
          >
            Abilities
          </h2>
          <ul className="mt-4 space-y-3">
            {(sequence?.abilities ?? []).map((ability) => (
              <li key={ability.name} className="text-sm">
                <span className="font-medium text-foreground">{ability.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {ability.description}
                </span>
              </li>
            ))}
            {(sequence?.abilities ?? []).length === 0 && (
              <li className="text-sm text-muted">None recorded.</li>
            )}
          </ul>
          <h3 className="mt-6 font-serif text-sm font-semibold tracking-wide text-foreground/80 uppercase">
            Acting Method
          </h3>
          <ul className="mt-2 list-inside space-y-1.5">
            {(sequence?.actingRequirements ?? []).map((req) => (
              <li key={req} className="text-sm leading-relaxed text-foreground/80">
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* Condition */}
        <section
          aria-labelledby="sheet-condition"
          className="rounded-lg border border-border/70 bg-surface/60 p-6"
        >
          <h2
            id="sheet-condition"
            className="gaslit font-serif text-lg font-semibold text-amber/90"
          >
            Condition
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Mind</dt>
              <dd className="mt-0.5 font-serif italic text-foreground/85">
                {SANITY_DESCRIPTORS[tier]}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                Potion digestion
              </dt>
              <dd className="mt-0.5 text-foreground/85">
                {state.digestion
                  ? state.digestion.complete
                    ? "Fully digested — ready to advance."
                    : `${state.digestion.progress}% assimilated through acting.`
                  : "No potion taken."}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Injuries</dt>
              <dd className="mt-0.5 text-foreground/85">
                {state.injuries && state.injuries.length > 0 ? (
                  <ul className="space-y-1">
                    {state.injuries.map((injury) => (
                      <li key={injury.id}>
                        {injury.description}{" "}
                        <span className="text-xs text-muted">({injury.severity})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Unhurt."
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                Active quests
              </dt>
              <dd className="mt-0.5 text-foreground/85">
                {state.activeQuests.length > 0 ? state.activeQuests.join("; ") : "None."}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Inventory */}
      <section aria-labelledby="sheet-inventory">
        <h2
          id="sheet-inventory"
          className="gaslit font-serif text-lg font-semibold text-amber/90"
        >
          Inventory
        </h2>
        {state.inventory.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Empty pockets — the city has not yielded its secrets yet.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {inventoryByCategory
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.category}>
                  <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                    {ITEM_CATEGORY_LABELS[group.category]}
                  </h3>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item, index) => (
                      <li
                        key={`${item.name}-${index}`}
                        className="parchment rounded-md p-4"
                      >
                        <p className="text-sm font-medium text-foreground">
                          <span aria-hidden="true" className="mr-2 text-amber/80">
                            {ITEM_CATEGORY_GLYPHS[group.category]}
                          </span>
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {item.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
