"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { ProviderConfig, MemoryState } from "@/lib/ai";
import type { GameSessionSummary } from "@/lib/game";
import {
  createSession,
  createDefaultGameState,
  sessionToSummary,
  PROVIDER_CONFIG_KEY,
  PROLOGUE_DRAFT_KEY,
  isActivePrologueDraft,
  deserializeLegacies,
  legaciesToFacts,
  LEGACIES_KEY,
  artifactToItem,
  deserializeArtifacts,
  discoverableArtifacts,
  echoFacts,
  pickStartingEcho,
  ECHOES_KEY,
} from "@/lib/game";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";
import { selectStartScenario, selectStartScenarioForLocation } from "@/lib/lore";
import {
  loadAllSessions,
  loadSessionIndex,
  saveActiveSessionId,
  saveSessionIndex,
  persistSession,
  useSessionSummaries,
  useStoredValue,
} from "@/lib/react/session-store";
import { GameLoop } from "./game-loop";
import { CharacterCreation } from "./character-creation";
import { purgeCharacter } from "./character-actions";
import { useCloudSyncStatus } from "./cloud-sync";

type DashboardView = "home" | "character-creation" | "playing" | "manage";

function loadConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProviderConfig;
  } catch {
    return null;
  }
}

function loadExistingSessions(): GameSessionSummary[] {
  return loadAllSessions()
    .map(sessionToSummary)
    .sort((a, b) => b.updatedAt - a.updatedAt);
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

// Timeline echoes (issue #31): artifacts minted when past characters fell.
// Only echoes from this epoch or earlier may surface (the paradox guard);
// roughly half of new chronicles begin carrying one.
function loadTimelineEchoes(epoch: number) {
  try {
    const raw = localStorage.getItem(ECHOES_KEY);
    const artifacts = (raw ? deserializeArtifacts(raw) : null) ?? [];
    const discoverable = discoverableArtifacts(artifacts, epoch);
    const carried = pickStartingEcho(artifacts, epoch);
    return { facts: echoFacts(discoverable, carried), carried };
  } catch {
    return { facts: [], carried: null };
  }
}

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
  const initialData = useStoredValue<InitialData>(() => {
    const hasDraft = (() => {
      try {
        const raw = localStorage.getItem(PROLOGUE_DRAFT_KEY);
        if (!raw) return false;
        return isActivePrologueDraft(JSON.parse(raw));
      } catch {
        return false;
      }
    })();
    return {
      hasConfig: loadConfig() !== null,
      sessions: loadExistingSessions(),
      hasPrologueDraft: hasDraft,
    };
  }, emptyInitialData);

  const [view, setView] = useState<DashboardView>(
    initialData.hasPrologueDraft ? "character-creation" : "home",
  );
  // Read the provider-config flag reactively from `useStoredValue` rather than
  // freezing it in `useState`. During SSR and the first hydration render
  // `useStoredValue` returns the server fallback (`hasConfig: false`); freezing
  // that value left the "configure your provider" banner stuck after a full
  // page reload even when a provider was configured. Consuming the reactive
  // snapshot lets it correct to the real localStorage value after hydration.
  const hasConfig = initialData.hasConfig;
  // Derive from the reactive store snapshot until a mutation overrides it.
  // `useState(initialData.sessions)` would freeze on the server fallback (empty)
  // captured at the hydration render, leaving the character list blank on a full
  // page load; the override pattern corrects after hydration.
  const [sessionsOverride, setSessionsOverride] = useState<
    InitialData["sessions"] | null
  >(null);
  // Read the saved characters from the reactive session store rather than the
  // one-shot `initialData` snapshot, so saves pulled in by the cross-device
  // cloud hydrate (which writes localStorage and broadcasts a change) appear
  // live without a manual refresh. Newest first, matching the old ordering.
  const liveSummaries = useSessionSummaries();
  const sessions =
    sessionsOverride ?? [...liveSummaries].sort((a, b) => b.updatedAt - a.updatedAt);
  // Cross-device sync status — gate "Continue" until the first hydrate settles
  // so a stale local save can't be resumed (and re-saved) over a newer cloud one.
  const cloudStatus = useCloudSyncStatus();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // Two-step confirm so a destructive delete is never a single misclick.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleStartNewGame = useCallback(
    (
      pathwayId: number,
      characterName: string,
      characterBackground: string,
      initialMemory: MemoryState,
      epoch: number,
      prologueRecap: string,
      startLocation: string | null,
    ) => {
      // Varied story openings: a chosen preferred location sets the start (the
      // scene still varies among that place's openings); "Surprise me" (null)
      // draws a fully random start for the epoch. Pathway never biases the draw.
      const startScenario =
        startLocation === null
          ? selectStartScenario(epoch)
          : selectStartScenarioForLocation(epoch, startLocation);
      const gameState = createDefaultGameState(
        pathwayId,
        undefined,
        characterName,
        characterBackground,
        epoch,
        prologueRecap,
        startScenario,
      );
      // Cross-epoch echoes (issue #31): a fallen predecessor's artifact may
      // begin the chronicle in this character's possession, and the narrator
      // learns which traces are out there to foreshadow.
      const echoes = loadTimelineEchoes(epoch);
      const seededState = echoes.carried
        ? {
            ...gameState,
            inventory: [...gameState.inventory, artifactToItem(echoes.carried)],
          }
        : gameState;
      // Permadeath legacies (issue #12): a new character in the same timeline
      // inherits the world's memory of the fallen — the narrator can surface
      // tangible evidence of previous characters.
      const memory = withLegacyFacts(initialMemory);
      const session = createSession(seededState, undefined, undefined, {
        ...memory,
        sessionFacts: [...memory.sessionFacts, ...echoes.facts],
      });

      persistSession(session);
      saveSessionIndex([session.id, ...loadSessionIndex()]);

      // Make the new character the active one everywhere (active-character sync).
      saveActiveSessionId(session.id);
      setActiveSessionId(session.id);
      setView("playing");
    },
    [],
  );

  const handleContinue = useCallback((sessionId: string) => {
    // Continuing a character makes it the active one everywhere (the Map,
    // Journal, Glossary, etc. all follow the one you are actually playing).
    saveActiveSessionId(sessionId);
    setActiveSessionId(sessionId);
    setView("playing");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView("home");
    setActiveSessionId(null);
    setPendingDeleteId(null);
    setSessionsOverride(loadExistingSessions());
  }, []);

  // Remove a character and every scrap of its data (shared cleanup in
  // `purgeCharacter`), then drop it from the displayed list. Cross-timeline
  // legacies/echoes are world memory and are intentionally left untouched (the
  // "restart timeline" path wipes those).
  const handleDeleteCharacter = useCallback(
    (sessionId: string) => {
      purgeCharacter(sessionId);
      setPendingDeleteId(null);
      // localStorage is already consistent; drop the deleted character from the
      // displayed list without re-reading every save. Functional updater against
      // the post-hydration snapshot so the first delete (before any override) is
      // based on the real roster, not a stale capture.
      setSessionsOverride((prev) => (prev ?? sessions).filter((s) => s.id !== sessionId));
    },
    [sessions],
  );

  if (view === "playing" && activeSessionId) {
    return (
      <div className="mx-auto max-w-[var(--container-game)] px-4 py-6 animate-fade-in sm:px-6">
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

  if (view === "manage") {
    return (
      <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 animate-fade-in sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="mb-4 text-xs text-muted transition-colors hover:text-amber"
        >
          &larr; Back to Dashboard
        </button>
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
            Manage Characters
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Remove a character to permanently delete its save, journal, and all associated
            data. This cannot be undone.
          </p>
        </header>

        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <p className="font-serif text-sm italic text-muted">
              No characters to manage. Start a new game to forge a Beyonder identity.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const pathway = ALL_PATHWAYS.find((p) => p.id === s.pathwayId);
              const seq = pathway ? getSequence(pathway.id, s.sequenceLevel) : null;
              const confirming = pendingDeleteId === s.id;
              const title = `${seq?.name ?? "Unknown"} — ${pathway?.name ?? "?"} pathway, Sequence ${s.sequenceLevel}`;
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-border/60 bg-surface/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-serif text-sm font-medium text-foreground/90">
                        {seq?.name ?? "Unknown"}{" "}
                        <span className="text-muted">(Seq. {s.sequenceLevel})</span>
                      </p>
                      <p className="text-xs text-muted">
                        {pathway?.name ?? "?"} pathway &middot; {s.location} &middot; Turn{" "}
                        {s.turnCount}
                      </p>
                    </div>
                    {confirming ? (
                      <div
                        className="flex items-center gap-2"
                        role="group"
                        aria-label={`Confirm deletion of ${title}`}
                      >
                        <span className="text-xs text-crimson" role="status">
                          Delete permanently?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCharacter(s.id)}
                          className="min-h-[32px] rounded border border-crimson/50 bg-crimson/10 px-3 py-1 text-xs font-medium text-crimson transition-colors hover:bg-crimson/20"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="min-h-[32px] rounded border border-border px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(s.id)}
                        className="min-h-[32px] rounded border border-crimson/40 px-3 py-1 text-xs font-medium text-crimson transition-colors hover:border-crimson/60 hover:bg-crimson/10"
                        aria-label={`Delete ${title}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // ─── Home Dashboard ─────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 animate-fade-in-up sm:px-6 sm:py-10">
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
            {cloudStatus === "hydrating" ? (
              <p role="status" className="mt-5 text-sm text-muted">
                Syncing your chronicles from the cloud&hellip;
              </p>
            ) : sessions.length === 0 ? (
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
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-lg font-semibold text-foreground/70">
            Character Summary
          </h2>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => setView("manage")}
              className="min-h-[24px] rounded border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
            >
              Manage characters
            </button>
          )}
        </div>
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
