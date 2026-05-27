"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { ProviderConfig } from "@/lib/ai";
import type { GameSessionSummary } from "@/lib/game";
import {
  createSession,
  createDefaultGameState,
  sessionToSummary,
  serializeSession,
  deserializeSession,
  SESSION_KEY_PREFIX,
  SESSION_INDEX_KEY,
  PROVIDER_CONFIG_KEY,
} from "@/lib/game";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";
import { GameLoop } from "./game-loop";

type DashboardView = "home" | "pathway-select" | "playing";

const PATHWAY_DESCRIPTIONS: Record<string, string> = {
  Fool: "The path of deception and adaptation. Seer, Clown, Magician — a winding road through the mysteries of fate.",
  Visionary:
    "The path of dreams and prophecy. Peer into twisted dreamscapes and reshape the visions of others.",
  Sun: "The path of radiance and healing. Channel holy light to purify corruption and mend the broken.",
  Death:
    "The path of spirits and the beyond. Command the dead, traverse the spirit world, wield cold shadow.",
};

const PATHWAY_SEFIRA: Record<string, string> = {
  Fool: "Sefirah Castle",
  Visionary: "Chaos Sea",
  Sun: "Chaos Sea",
  Death: "River of Eternal Darkness",
};

function loadConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProviderConfig;
  } catch {
    return null;
  }
}

function loadSessionIndex(): string[] {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveSessionIndex(ids: string[]): void {
  try {
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable
  }
}

function loadExistingSessions(): GameSessionSummary[] {
  const ids = loadSessionIndex();
  const summaries: GameSessionSummary[] = [];
  for (const id of ids) {
    try {
      const raw = localStorage.getItem(SESSION_KEY_PREFIX + id);
      if (!raw) continue;
      const session = deserializeSession(raw);
      if (session) {
        summaries.push(sessionToSummary(session));
      }
    } catch {
      continue;
    }
  }
  return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

interface InitialData {
  hasConfig: boolean;
  sessions: GameSessionSummary[];
}

function loadInitialData(): InitialData {
  if (typeof window === "undefined") {
    return { hasConfig: false, sessions: [] };
  }
  return {
    hasConfig: loadConfig() !== null,
    sessions: loadExistingSessions(),
  };
}

const subscribe = () => () => {};

export function PlayDashboard() {
  const initialData = useSyncExternalStore(subscribe, loadInitialData, () =>
    loadInitialData(),
  );

  const [view, setView] = useState<DashboardView>("home");
  const [hasConfig] = useState(initialData.hasConfig);
  const [sessions, setSessions] = useState(initialData.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const loaded = true;

  const handleStartNewGame = useCallback((pathwayId: number) => {
    const gameState = createDefaultGameState(pathwayId);
    const session = createSession(gameState);

    try {
      localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
      const index = loadSessionIndex();
      index.unshift(session.id);
      saveSessionIndex(index);
    } catch {
      // Storage full
    }

    setActiveSessionId(session.id);
    setView("playing");
  }, []);

  const handleContinue = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setView("playing");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView("home");
    setActiveSessionId(null);
    setSessions(loadExistingSessions());
  }, []);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-[var(--container-game)] px-6 py-10">
        <div className="h-10 w-48 rounded bg-border/20 animate-pulse" />
        <div className="mt-4 h-5 w-72 rounded bg-border/20 animate-pulse" />
      </div>
    );
  }

  if (view === "playing" && activeSessionId) {
    return (
      <div className="mx-auto max-w-[var(--container-game)] px-6 py-6 animate-fade-in">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="mb-4 text-xs text-muted transition-colors hover:text-amber"
        >
          &larr; Back to Dashboard
        </button>
        <GameLoop sessionId={activeSessionId} />
      </div>
    );
  }

  if (view === "pathway-select") {
    return (
      <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
        <header className="mb-10">
          <button
            type="button"
            onClick={() => setView("home")}
            className="mb-4 text-xs text-muted transition-colors hover:text-amber"
          >
            &larr; Back
          </button>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
            Choose Your Pathway
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Each Beyonder pathway grants unique abilities and demands specific acting
            requirements. Choose wisely — your path shapes your destiny.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {ALL_PATHWAYS.map((pathway) => {
            const seq9 = getSequence(pathway.id, 9);
            return (
              <button
                key={pathway.id}
                type="button"
                onClick={() => handleStartNewGame(pathway.id)}
                className="group rounded-lg border border-border bg-surface/50 p-6 text-left transition-all duration-300 hover:border-amber/30 hover:bg-surface hover:shadow-[0_0_24px_rgba(217,119,6,0.05)]"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-serif text-xl font-semibold text-foreground transition-colors group-hover:text-amber">
                    {pathway.name}
                  </h2>
                  <span className="rounded bg-amber/[0.08] px-2 py-0.5 text-[10px] tracking-wider text-amber/60 uppercase">
                    {pathway.group}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted/50">
                  {PATHWAY_SEFIRA[pathway.name] ?? pathway.sefirah}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {PATHWAY_DESCRIPTIONS[pathway.name] ?? "A mysterious path."}
                </p>
                {seq9 && (
                  <div className="mt-4 border-t border-border/40 pt-3">
                    <p className="text-xs text-muted/60">
                      Starting as:{" "}
                      <span className="text-foreground/70">
                        Sequence 9 &mdash; {seq9.name}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted/40">
                      Abilities: {seq9.abilities.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Home Dashboard ─────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Welcome, Beyonder
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          The Fifth Epoch stirs. Your journey through the world of mysteries awaits.
        </p>
      </header>

      {/* No Provider Configured */}
      {!hasConfig && (
        <div className="rounded-lg border border-amber/20 bg-amber/[0.03] p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Configure Your AI Provider
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Before you begin, configure an AI provider in Settings. The game uses your own
            API key to generate narrative and gameplay.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-block rounded-md border border-amber/40 bg-amber/[0.08] px-4 py-2 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/60 hover:bg-amber/[0.14]"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Provider Configured */}
      {hasConfig && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="group rounded-lg border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/20">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Start New Game
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Choose your Beyonder pathway and begin your chronicle in Tingen City.
            </p>
            <button
              type="button"
              onClick={() => setView("pathway-select")}
              className="mt-5 rounded bg-amber/90 px-4 py-2 text-sm font-medium text-background transition-all duration-200 hover:bg-amber"
            >
              Begin Journey
            </button>
          </div>

          <div className="group rounded-lg border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/20">
            <h2 className="font-serif text-xl font-semibold text-foreground">Continue</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Resume your journey where you left off.
            </p>
            {sessions.length === 0 ? (
              <p className="mt-5 text-sm text-muted/50">No saved games found.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {sessions.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleContinue(s.id)}
                    className="w-full rounded border border-border/60 bg-background/50 px-3 py-2 text-left text-sm transition-all duration-200 hover:border-amber/20 hover:bg-surface/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground/80">
                        {ALL_PATHWAYS.find((p) => p.id === s.pathwayId)?.name ??
                          "Unknown"}{" "}
                        &mdash; Seq. {s.sequenceLevel}
                      </span>
                      <span className="text-xs text-muted/40">Turn {s.turnCount}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted/50">{s.location}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="my-10 flex items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-[10px] text-muted/25">&#9670;</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <section>
        <h2 className="font-serif text-lg font-semibold text-foreground/70">
          Character Summary
        </h2>
        {sessions.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 3).map((s) => {
              const pathway = ALL_PATHWAYS.find((p) => p.id === s.pathwayId);
              const seq = pathway ? getSequence(pathway.id, s.sequenceLevel) : null;
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-border/60 bg-surface/30 p-4"
                >
                  <p className="font-serif text-sm font-medium text-foreground/80">
                    {seq?.name ?? "Unknown"}{" "}
                    <span className="text-muted/40">(Seq. {s.sequenceLevel})</span>
                  </p>
                  <p className="text-xs text-muted/60">{pathway?.name ?? "?"} pathway</p>
                  <p className="mt-2 text-xs text-muted/40">{s.location}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border/60 p-8 text-center">
            <p className="font-serif text-sm italic text-muted/60">
              No character created yet. Start a new game to forge your Beyonder identity.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
