"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { ProviderConfig, MemoryState } from "@/lib/ai";
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
  PROLOGUE_DRAFT_KEY,
  isActivePrologueDraft,
  deserializeLegacies,
  legaciesToFacts,
  LEGACIES_KEY,
} from "@/lib/game";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";
import { noopSubscribe } from "@/lib/react";
import { GameLoop } from "./game-loop";
import { CharacterCreation } from "./character-creation";

type DashboardView = "home" | "character-creation" | "playing";

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
  hasPrologueDraft: boolean;
}

const emptyInitialData: InitialData = {
  hasConfig: false,
  sessions: [],
  hasPrologueDraft: false,
};

function withLegacyFacts(memory: MemoryState): MemoryState {
  try {
    const raw = localStorage.getItem(LEGACIES_KEY);
    const legacies = (raw ? deserializeLegacies(raw) : null) ?? [];
    if (legacies.length === 0) return memory;
    return {
      ...memory,
      sessionFacts: [...memory.sessionFacts, ...legaciesToFacts(legacies)],
    };
  } catch {
    return memory;
  }
}

export function PlayDashboard() {
  const cacheRef = useRef<InitialData | null>(null);
  const initialData = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === null) {
        const hasDraft = (() => {
          try {
            const raw = localStorage.getItem(PROLOGUE_DRAFT_KEY);
            if (!raw) return false;
            return isActivePrologueDraft(JSON.parse(raw));
          } catch {
            return false;
          }
        })();
        cacheRef.current = {
          hasConfig: loadConfig() !== null,
          sessions: loadExistingSessions(),
          hasPrologueDraft: hasDraft,
        };
      }
      return cacheRef.current;
    },
    () => emptyInitialData,
  );

  const [view, setView] = useState<DashboardView>(
    initialData.hasPrologueDraft ? "character-creation" : "home",
  );
  const [hasConfig] = useState(initialData.hasConfig);
  const [sessions, setSessions] = useState(initialData.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleStartNewGame = useCallback(
    (
      pathwayId: number,
      characterName: string,
      characterBackground: string,
      initialMemory: MemoryState,
    ) => {
      const gameState = createDefaultGameState(
        pathwayId,
        undefined,
        characterName,
        characterBackground,
      );
      // Permadeath legacies (issue #12): a new character in the same timeline
      // inherits the world's memory of the fallen — the narrator can surface
      // tangible evidence of previous characters.
      const session = createSession(
        gameState,
        undefined,
        undefined,
        withLegacyFacts(initialMemory),
      );

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
    },
    [],
  );

  const handleContinue = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setView("playing");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView("home");
    setActiveSessionId(null);
    setSessions(loadExistingSessions());
  }, []);

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

  if (view === "character-creation") {
    return (
      <CharacterCreation onComplete={handleStartNewGame} onBack={() => setView("home")} />
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
              onClick={() => setView("character-creation")}
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
              <p className="mt-5 text-sm text-muted">No saved games found.</p>
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
                      <span className="text-xs text-muted">Turn {s.turnCount}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{s.location}</p>
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
                    <span className="text-muted">(Seq. {s.sequenceLevel})</span>
                  </p>
                  <p className="text-xs text-muted">{pathway?.name ?? "?"} pathway</p>
                  <p className="mt-2 text-xs text-muted">{s.location}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border/60 p-8 text-center">
            <p className="font-serif text-sm italic text-muted">
              No character created yet. Start a new game to forge your Beyonder identity.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
