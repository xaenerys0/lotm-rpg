"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { ProviderConfig, MemoryState } from "@/lib/ai";
import type { GameSessionSummary } from "@/lib/game";
import {
  createSession,
  createDefaultGameState,
  createCanonCharacterSession,
  seedArchetype,
  sequenceClassificationFor,
  sequenceLabel,
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
  createTestCharacter,
  devToolsEnabled,
  isUndeletableCharacter,
} from "@/lib/game";
import { ALL_PATHWAYS, getSequence } from "@/lib/rules";
import {
  selectStartScenario,
  selectStartScenarioForLocation,
  getStartScenario,
  getStartArchetype,
  buildCustomArchetype,
  matchCanonCharacter,
  getCanonCharacter,
  type StartArchetype,
  type StartSelection,
} from "@/lib/lore";
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
import { PageHeader } from "./page-header";

type DashboardView = "home" | "character-creation" | "playing" | "manage";

// How many characters the "Your Characters" roster shows per page. Six fills the
// sm:grid-cols-2 / lg:grid-cols-3 grid as a tidy two rows before paginating.
const PAGE_SIZE = 6;

// "Last played" line on each roster card. Deterministic, dependency-free.
function formatLastPlayed(updatedAt: number): string {
  return `Last played ${new Date(updatedAt).toLocaleDateString()}`;
}

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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // Two-step confirm so a destructive delete is never a single misclick.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // "Your Characters" roster pagination. `safePage` clamps the page during render
  // (rather than a setState-in-render) so the roster shrinking — e.g. after a
  // delete drops the last page — never leaves us pointing past the end.
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = sessions.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const handleStartNewGame = useCallback(
    (
      pathwayId: number,
      characterName: string,
      characterBackground: string,
      initialMemory: MemoryState,
      epoch: number,
      prologueRecap: string,
      start: StartSelection,
      selectedSequence?: number,
    ) => {
      // Canon-character takeover (issue #92). Two entry points resolve to the
      // SAME seeded save: the GUIDED canon prologue (`start.kind ===
      // "canon-takeover"`, which also carries a canon-faithful prologue recap to
      // pin), and the implicit end-of-creation match (the player typed a canon
      // name AND that figure's pathway via the manual path). Either way a full
      // canon preset (pathway, starting sequence, location, timeline position,
      // prefilled durable backstory + personality) supersedes the generic path,
      // while still layering the same world-continuity facts (legacies + echoes).
      // The implicit path is gated on the chosen EPOCH matching the preset's so a
      // player who deliberately picked a different era is not silently forced into
      // the Fifth; the guided path locked the epoch from the preset already.
      const canonPreset =
        start.kind === "canon-takeover"
          ? getCanonCharacter(start.canonCharacterId)
          : (() => {
              const m = matchCanonCharacter(characterName, pathwayId);
              return m && m.epoch === epoch ? m : null;
            })();
      if (canonPreset) {
        const echoes = loadTimelineEchoes(epoch);
        const seededMemory = withLegacyFacts({
          ...initialMemory,
          sessionFacts: [...initialMemory.sessionFacts, ...echoes.facts],
        });
        // The guided prologue supplies a canon-faithful recap to pin; the
        // implicit manual-path match has none (the static openingRecap stands).
        const recapOverride = start.kind === "canon-takeover" ? prologueRecap : undefined;
        let canonSession = createCanonCharacterSession(
          canonPreset,
          seededMemory,
          undefined,
          {},
          recapOverride,
        );
        if (echoes.carried) {
          canonSession = {
            ...canonSession,
            gameState: {
              ...canonSession.gameState,
              inventory: [
                ...canonSession.gameState.inventory,
                artifactToItem(echoes.carried),
              ],
            },
          };
        }
        persistSession(canonSession);
        saveSessionIndex([canonSession.id, ...loadSessionIndex()]);
        saveActiveSessionId(canonSession.id);
        setActiveSessionId(canonSession.id);
        setView("playing");
        return;
      }
      // Start archetypes (issue #131): beginning embedded in a circle — either a
      // curated preset OR a player-authored custom circle (built into a normal
      // archetype). It carries its own location + opening beat and seeds a real
      // social position; it takes precedence over the plain location pick.
      let archetype: StartArchetype | undefined;
      if (start.kind === "archetype") {
        archetype = getStartArchetype(start.archetypeId);
      } else if (start.kind === "custom") {
        archetype = buildCustomArchetype(start.circle, epoch);
      }
      // Varied story openings: a preferred location sets the start (the scene
      // still varies among that place's openings); "random" draws a fully random
      // start for the epoch. Pathway never biases the draw. Skipped when a circle
      // (preset or custom) is chosen — it supplies the opening itself.
      const startScenario = archetype
        ? undefined
        : start.kind === "origin-scenario"
          ? // An access-gated origin start (issue #132): resolve by id so
            // createDefaultGameState seeds its accessFlags + currentCity.
            getStartScenario(start.scenarioId)
          : start.kind === "location"
            ? selectStartScenarioForLocation(epoch, start.location)
            : selectStartScenario(epoch);
      const gameState = createDefaultGameState(
        pathwayId,
        undefined,
        characterName,
        characterBackground,
        epoch,
        prologueRecap,
        startScenario,
        archetype,
        selectedSequence,
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
      const baseSession = createSession(seededState, undefined, undefined, {
        ...memory,
        sessionFacts: [...memory.sessionFacts, ...echoes.facts],
      });
      // Archetype GameSession-level seeds (issue #131): tracked allies, optional
      // society pre-membership, and relationship grounding facts.
      const session = archetype ? seedArchetype(baseSession, archetype) : baseSession;

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

  // Dev-only: seed a premade test character poised at the scene-art triggers
  // (fixed id → idempotent re-seed; gated by NEXT_PUBLIC_DEV_TOOLS at render).
  const handleSeedTestCharacter = useCallback(() => {
    const session = createTestCharacter();
    persistSession(session);
    // Fixed id — only add to the index the first time so re-seeding doesn't
    // duplicate the entry.
    const index = loadSessionIndex();
    if (!index.includes(session.id)) saveSessionIndex([session.id, ...index]);
    saveActiveSessionId(session.id);
    setActiveSessionId(session.id);
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
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-amber"
        >
          <span aria-hidden="true">←</span> Back to Dashboard
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
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-amber"
        >
          <span aria-hidden="true">←</span> Back to Dashboard
        </button>
        <PageHeader
          eyebrow="Roster"
          title="Manage Characters"
          description="Remove a character to permanently delete its save, journal, and all associated data. This cannot be undone."
        />

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
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
              const title =
                s.sequenceLevel <= 0
                  ? `${sequenceLabel(s.pathwayId, s.sequenceLevel)} — ${pathway?.name ?? "?"} pathway, ${sequenceClassificationFor(s.sequenceLevel)}`
                  : `${seq?.name ?? "Unknown"} — ${pathway?.name ?? "?"} pathway, Sequence ${s.sequenceLevel}`;
              return (
                <li key={s.id} className="rounded-xl border border-border bg-surface p-4">
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
                    {isUndeletableCharacter(s.id) ? (
                      <span className="text-xs italic text-muted" role="status">
                        Protected — test character
                      </span>
                    ) : confirming ? (
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
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Fifth Epoch"
        title="Welcome, Beyonder"
        description="The Fifth Epoch stirs. Your journey through the world of mysteries awaits."
      />

      {/* No Provider Configured */}
      {!hasConfig && (
        <div className="rounded-xl border border-amber/30 bg-amber/[0.04] p-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Configure Your AI Provider
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Before you begin, configure an AI provider in Settings. The game uses your own
            API key to generate narrative and gameplay.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center rounded-lg border border-amber/40 bg-amber/[0.08] px-4 py-2 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/60 hover:bg-amber/[0.14]"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Provider Configured — primary call to action */}
      {hasConfig && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-amber/30 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(224,167,60,0.10), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Start a new chronicle
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Choose your Beyonder pathway and begin your story in the Fifth Epoch.
            </p>
            <button
              type="button"
              onClick={() => setView("character-creation")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-gold hover:shadow-[0_12px_28px_-12px_rgba(224,167,60,0.55)]"
            >
              Begin journey
              <span aria-hidden="true">→</span>
            </button>
            {devToolsEnabled() && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs text-muted">
                  Dev tools: seed a premade Sequence&nbsp;9 character ready to advance
                  (and fight) so you can reach the scene-art moments in a click or two.
                </p>
                <button
                  type="button"
                  onClick={handleSeedTestCharacter}
                  className="mt-3 inline-flex min-h-[24px] items-center rounded-lg border border-occult/50 px-3 py-1.5 text-xs font-medium text-occult-bright transition-colors hover:border-occult hover:bg-occult/10"
                >
                  Seed test character
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Your Characters
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select a character to resume their chronicle where you left off.
            </p>
          </div>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => setView("manage")}
              className="inline-flex min-h-[24px] shrink-0 items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
            >
              Manage characters
            </button>
          )}
        </div>
        {sessions.length > 0 ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((s) => {
                const pathway = ALL_PATHWAYS.find((p) => p.id === s.pathwayId);
                const seq = pathway ? getSequence(pathway.id, s.sequenceLevel) : null;
                const rungName =
                  s.sequenceLevel <= 0
                    ? sequenceLabel(s.pathwayId, s.sequenceLevel)
                    : (seq?.name ?? "Unknown");
                const title = s.characterName ?? rungName;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleContinue(s.id)}
                    aria-label={`Resume ${title} — ${pathway?.name ?? "?"} pathway, ${rungName} (Sequence ${s.sequenceLevel}), Turn ${s.turnCount}`}
                    className="group flex flex-col rounded-xl border border-border bg-surface p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40 hover:shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-serif text-base font-semibold text-foreground">
                        {title}
                      </p>
                      <span className="shrink-0 rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
                        Seq {s.sequenceLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {rungName} · {pathway?.name ?? "?"} pathway
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                      <span aria-hidden="true">◦</span>
                      {s.location}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
                      <span>Turn {s.turnCount}</span>
                      <span>{formatLastPlayed(s.updatedAt)}</span>
                    </div>
                    <span
                      aria-hidden="true"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-amber"
                    >
                      Resume <span>→</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  className="min-h-[24px] rounded border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="text-xs text-muted" role="status">
                  Page {safePage + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                  disabled={safePage === pageCount - 1}
                  className="min-h-[24px] rounded border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="font-serif text-sm italic text-muted">
              No character created yet. Start a new game to forge your Beyonder identity.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
