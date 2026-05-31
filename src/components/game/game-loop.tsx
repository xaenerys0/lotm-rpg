"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameSession, GameplayPillar } from "@/lib/game";
import {
  transition,
  applyResolution,
  applyDigestion,
  serializeSession,
  deserializeSession,
  digestionFeedback,
  classifySanityTier,
  isLossOfControl,
  evaluateLossOfControl,
  DEFAULT_PREFERENCES,
  CHOICE_PILLAR_MAP,
  PILLAR_INSTRUCTION_MAP,
  SESSION_KEY_PREFIX,
  PROVIDER_CONFIG_KEY,
  type GamePreferences,
  type SanityTier,
  type LossOfControlSeverity,
} from "@/lib/game";
import { SanityEffects } from "./sanity-effects";
import { loadPreferences } from "./preferences-store";
import type {
  DigestionState,
  ProviderConfig,
  Choice,
  InstructionType,
  AIErrorCode,
} from "@/lib/ai";
import { generate, TOKEN_BUDGET, AIError } from "@/lib/ai";
import { getLoreByPathway, getLoreByCity } from "@/lib/lore";
import { getPathway, getSequence } from "@/lib/rules";
import { noopSubscribe } from "@/lib/react";
import type { LoreEntry } from "@/lib/lore";

function loadProviderConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProviderConfig;
  } catch {
    return null;
  }
}

function saveSessionToStorage(session: GameSession): void {
  try {
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
  } catch {
    // Storage full or unavailable
  }
}

function loadSessionFromStorage(sessionId: string): GameSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY_PREFIX + sessionId);
    if (!raw) return null;
    return deserializeSession(raw);
  } catch {
    return null;
  }
}

function selectLoreEntries(
  pathwayName: string,
  location: string,
): { entries: LoreEntry[]; totalTokens: number } {
  const pathwayLore = getLoreByPathway(pathwayName.toLowerCase());
  const cityLore = getLoreByCity(location.toLowerCase().split(" ")[0]);
  const combined = [...pathwayLore];
  for (const entry of cityLore) {
    if (!combined.some((e) => e.slug === entry.slug)) {
      combined.push(entry);
    }
  }

  const budget = TOKEN_BUDGET.lore;
  let totalTokens = 0;
  const selected: LoreEntry[] = [];
  for (const entry of combined) {
    if (totalTokens + entry.tokenCount > budget) break;
    selected.push(entry);
    totalTokens += entry.tokenCount;
  }
  return { entries: selected, totalTokens };
}

const SANITY_TIER_STYLE: Record<SanityTier, { color: string; glow: string }> = {
  high: {
    color: "bg-sanity-high",
    glow: "shadow-[0_0_8px_var(--color-sanity-high)]",
  },
  medium: {
    color: "bg-sanity-mid",
    glow: "shadow-[0_0_8px_var(--color-sanity-mid)]",
  },
  low: {
    color: "bg-sanity-low",
    glow: "shadow-[0_0_8px_var(--color-sanity-low)]",
  },
  critical: {
    color: "bg-sanity-critical",
    glow: "shadow-[0_0_8px_var(--color-sanity-critical)]",
  },
};

function getSanityStyle(sanity: number, maxSanity: number) {
  const ratio = maxSanity > 0 ? sanity / maxSanity : 0;
  const tier = classifySanityTier(sanity, maxSanity);
  return { ...SANITY_TIER_STYLE[tier], ratio };
}

function getChoiceTypeIcon(type: Choice["type"]): string {
  switch (type) {
    case "investigation":
      return "◈";
    case "dialogue":
      return "❧";
    case "ritual":
      return "✦";
    case "action":
      return "⚔";
  }
}

function buildAICallParams(currentSession: GameSession) {
  const pathway = getPathway(currentSession.gameState.pathwayId);
  const seq = getSequence(
    currentSession.gameState.pathwayId,
    currentSession.gameState.sequenceLevel,
  );
  return {
    pathway,
    seq,
    abilities: seq?.abilities.map((a) => a.name) ?? [],
    actingReqs: seq?.actingRequirements ?? [],
    loreContext: selectLoreEntries(
      pathway?.name ?? "fool",
      currentSession.gameState.location,
    ),
  };
}

// ─── Main Component ────────────────────────────────────────────────

export function GameLoop({ sessionId }: { sessionId: string }) {
  const sessionCacheRef = useRef<GameSession | null | undefined>(undefined);
  const initialSession = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (sessionCacheRef.current === undefined) {
        sessionCacheRef.current = loadSessionFromStorage(sessionId);
      }
      return sessionCacheRef.current;
    },
    () => null,
  );
  const [session, setSession] = useState<GameSession | null>(initialSession);
  const generationRef = useRef(0);

  const prefsCacheRef = useRef<GamePreferences | null>(null);
  const preferences = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (prefsCacheRef.current === null) {
        prefsCacheRef.current = loadPreferences();
      }
      return prefsCacheRef.current;
    },
    () => DEFAULT_PREFERENCES,
  );

  const updateSession = useCallback((next: GameSession) => {
    setSession(next);
    saveSessionToStorage(next);
  }, []);

  const dispatchMissingConfig = useCallback(
    (currentSession: GameSession, gen: number) => {
      const errSession = transition(currentSession, {
        type: "ERROR",
        message: "No AI provider configured. Visit Settings to add your API key.",
        errorCode: "CONFIG_MISSING",
      });
      if (generationRef.current === gen) updateSession(errSession);
    },
    [updateSession],
  );

  const generateSituation = useCallback(
    async (currentSession: GameSession, gen: number) => {
      const config = loadProviderConfig();
      if (!config) {
        dispatchMissingConfig(currentSession, gen);
        return;
      }

      const { seq, abilities, actingReqs, loreContext } =
        buildAICallParams(currentSession);

      const instruction: InstructionType = currentSession.activePillar
        ? PILLAR_INSTRUCTION_MAP[currentSession.activePillar]
        : "narrative";

      const playerAction =
        currentSession.turnCount === 0
          ? `I begin my journey as a Sequence ${currentSession.gameState.sequenceLevel} ${seq?.name ?? "Beyonder"} in ${currentSession.gameState.location}. Describe the opening scene and give me choices.`
          : "Continue from the previous scene. Describe what happens next and give me choices.";

      try {
        const result = await generate({
          config,
          gameState: currentSession.gameState,
          memory: currentSession.memory,
          loreContext,
          instruction,
          playerAction,
          abilities,
          actingRequirements: actingReqs,
        });

        if (generationRef.current !== gen) return;

        const choices = result.response.choices ?? [
          {
            id: "default-1",
            text: "Observe your surroundings carefully",
            type: "investigation" as const,
          },
          {
            id: "default-2",
            text: "Approach the nearest person",
            type: "dialogue" as const,
          },
          {
            id: "default-3",
            text: "Move on",
            type: "action" as const,
          },
        ];

        const next = transition(currentSession, {
          type: "SITUATION_READY",
          narrative: result.response.narrative,
          choices,
        });
        updateSession(next);
      } catch (err) {
        if (generationRef.current !== gen) return;
        const message =
          err instanceof Error ? err.message : "Failed to generate situation";
        const errorCode = err instanceof AIError ? err.code : undefined;
        const errSession = transition(currentSession, {
          type: "ERROR",
          message,
          errorCode,
        });
        updateSession(errSession);
      }
    },
    [updateSession, dispatchMissingConfig],
  );

  const resolveChoice = useCallback(
    async (currentSession: GameSession, gen: number) => {
      const config = loadProviderConfig();
      if (!config) {
        dispatchMissingConfig(currentSession, gen);
        return;
      }

      const selectedChoice = currentSession.currentChoices?.find(
        (c) => c.id === currentSession.selectedChoiceId,
      );
      if (!selectedChoice) return;

      const pillar: GameplayPillar = CHOICE_PILLAR_MAP[selectedChoice.type];
      const instruction = PILLAR_INSTRUCTION_MAP[pillar];

      const { abilities, actingReqs, loreContext } = buildAICallParams(currentSession);

      try {
        const result = await generate({
          config,
          gameState: currentSession.gameState,
          memory: currentSession.memory,
          loreContext,
          instruction,
          playerAction: selectedChoice.text,
          abilities,
          actingRequirements: actingReqs,
        });

        if (generationRef.current !== gen) return;

        const next = transition(currentSession, {
          type: "RESOLUTION_READY",
          result,
        });
        updateSession({ ...next, activePillar: pillar });
      } catch (err) {
        if (generationRef.current !== gen) return;
        const message = err instanceof Error ? err.message : "Failed to resolve action";
        const errorCode = err instanceof AIError ? err.code : undefined;
        const errSession = transition(currentSession, {
          type: "ERROR",
          message,
          errorCode,
        });
        updateSession(errSession);
      }
    },
    [updateSession, dispatchMissingConfig],
  );

  useEffect(() => {
    if (!session) return;

    if (session.phase === "situation") {
      const gen = ++generationRef.current;
      const snap = session;
      queueMicrotask(() => generateSituation(snap, gen));
    } else if (session.phase === "resolution") {
      const gen = ++generationRef.current;
      const snap = session;
      queueMicrotask(() => resolveChoice(snap, gen));
    }
  }, [session?.phase, session?.turnCount, session?.selectedChoiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartSituation = useCallback(() => {
    if (!session) return;
    const next = transition(session, { type: "START_SITUATION" });
    updateSession(next);
  }, [session, updateSession]);

  const handleSelectChoice = useCallback(
    (choiceId: string) => {
      if (!session) return;
      const next = transition(session, {
        type: "SELECT_CHOICE",
        choiceId,
      });
      updateSession(next);
    },
    [session, updateSession],
  );

  const handleContinue = useCallback(() => {
    if (!session) return;
    const selectedChoice = session.currentChoices?.find(
      (c) => c.id === session.selectedChoiceId,
    );
    const playerAction = selectedChoice?.text ?? "Continue";

    const resolution = session.lastResolution;
    if (resolution) {
      const { gameState, memory } = applyResolution(
        session.gameState,
        session.memory,
        resolution,
        session.turnCount,
        playerAction,
      );
      const updated = { ...session, gameState, memory };
      const next = transition(updated, { type: "APPLY_CONSEQUENCES" });
      updateSession(next);
    }
  }, [session, updateSession]);

  const handleRetry = useCallback(() => {
    if (!session) return;
    const next = transition(session, { type: "RETRY" });
    updateSession(next);
  }, [session, updateSession]);

  // ─── Render ────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lg text-muted">Session not found.</p>
      </div>
    );
  }

  const pathway = getPathway(session.gameState.pathwayId);
  const seq = getSequence(session.gameState.pathwayId, session.gameState.sequenceLevel);
  const lostControl = isLossOfControl(session.gameState);

  return (
    <SanityEffects
      sanity={session.gameState.sanity}
      maxSanity={session.gameState.maxSanity}
    >
      <div className="mx-auto max-w-3xl px-4">
        {/* Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="font-serif text-sm text-foreground/80">
              {seq?.name ?? "Unknown"}{" "}
              <span className="text-muted/60">
                ({pathway?.name ?? "?"} Seq. {session.gameState.sequenceLevel})
              </span>
            </span>
            <span className="text-border">|</span>
            <span>{session.gameState.location}</span>
            <span className="text-border">|</span>
            <span>Turn {session.turnCount}</span>
          </div>
          <div className="flex items-center gap-4">
            <DigestionMeter digestion={session.gameState.digestion} />
            {preferences.sanityMeterVisible && (
              <SanityMeter
                sanity={session.gameState.sanity}
                maxSanity={session.gameState.maxSanity}
              />
            )}
          </div>
        </div>

        {/* Loss of control — sanity has bottomed out (integrates with #12). */}
        {lostControl && (
          <LossOfControlNotice
            severity={evaluateLossOfControl({
              sequenceLevel: session.gameState.sequenceLevel,
              // A fully-digested potion means the character is poised mid-
              // advancement — a fragile moment that escalates the fallout.
              highRisk: session.gameState.digestion?.complete ?? false,
            })}
          />
        )}

        {/* Phase Content */}
        {session.phase === "idle" && <IdlePhase onStart={handleStartSituation} />}
        {session.phase === "situation" && <SituationPhase />}
        {session.phase === "choices" && (
          <ChoicesPhase
            narrative={session.currentNarrative ?? ""}
            choices={session.currentChoices ?? []}
            onSelect={handleSelectChoice}
          />
        )}
        {session.phase === "resolution" && <ResolutionPhase />}
        {session.phase === "consequences" && (
          <ConsequencesPhase session={session} onContinue={handleContinue} />
        )}
        {session.phase === "error" && (
          <ErrorPhase
            message={session.errorMessage ?? "An unknown error occurred."}
            errorCode={session.errorCode}
            onRetry={handleRetry}
          />
        )}
      </div>
    </SanityEffects>
  );
}

const LOSS_OF_CONTROL_COPY: Record<
  LossOfControlSeverity,
  { title: string; body: string }
> = {
  setback: {
    title: "The world goes dark",
    body: "Your mind buckles and the gaslight swims away. You will wake elsewhere, missing time and worse for the wear — but you will wake.",
  },
  transformation: {
    title: "Something is changing",
    body: "Your power slips its leash. Your body answers to it, not to you. Whatever rises from this will not be entirely who you were.",
  },
  fatal: {
    title: "You are lost",
    body: "There is nothing left to hold the shape of you. The thing that remains is no longer a person — only hunger wearing your name.",
  },
};

function LossOfControlNotice({ severity }: { severity: LossOfControlSeverity }) {
  const copy = LOSS_OF_CONTROL_COPY[severity];
  return (
    <div className="mb-6 rounded-md border border-crimson/50 bg-crimson/[0.08] p-5 text-center animate-fade-in">
      <p className="font-serif text-base font-semibold text-sanity-low">{copy.title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/70">
        {copy.body}
      </p>
      <p className="mt-3 text-[10px] tracking-[0.2em] text-muted/40 uppercase">
        Loss of control &mdash; {severity}
      </p>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

function LoadingOrb() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full bg-amber/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-amber/40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-amber/80" />
      </div>
      <p className="font-serif text-sm italic text-muted/60 animate-pulse">
        The fog stirs...
      </p>
    </div>
  );
}

function SanityMeter({ sanity, maxSanity }: { sanity: number; maxSanity: number }) {
  const { color, glow, ratio } = getSanityStyle(sanity, maxSanity);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted/60">Sanity</span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-border/40">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color} ${glow}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="min-w-[3ch] text-right font-mono text-xs text-muted/80">
        {sanity}
      </span>
    </div>
  );
}

function DigestionMeter({ digestion }: { digestion?: DigestionState }) {
  const progress = digestion?.progress ?? 0;
  const complete = digestion?.complete ?? false;

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs text-muted/60"
        title="Digestion — act in character to assimilate your potion"
      >
        Digestion
      </span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-border/40">
        <div
          className={`h-full rounded-full bg-occult transition-all duration-700 ${
            complete ? "shadow-[0_0_8px_var(--color-occult)]" : ""
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="min-w-[3ch] text-right font-mono text-xs text-muted/80">
        {complete ? "✦" : `${progress}%`}
      </span>
    </div>
  );
}

function IdlePhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="py-16 text-center animate-fade-in-up">
      <div className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-amber/40 to-transparent" />
      <p className="mx-auto max-w-md font-serif text-lg leading-relaxed text-foreground/70">
        The gaslight flickers. The Fifth Epoch awaits your first move.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 rounded-md border border-amber/40 bg-amber/[0.08] px-6 py-3 font-serif text-sm font-medium text-amber transition-all duration-300 hover:border-amber/60 hover:bg-amber/[0.14] hover:shadow-[0_0_20px_rgba(217,119,6,0.1)]"
      >
        Begin
      </button>
      <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-amber/40 to-transparent" />
    </div>
  );
}

function SituationPhase() {
  return (
    <div className="flex flex-col items-center py-20 animate-fade-in">
      <LoadingOrb />
      <p className="mt-6 max-w-sm text-center font-serif text-sm text-muted/50">
        Weaving the threads of fate...
      </p>
    </div>
  );
}

function ChoicesPhase({
  narrative,
  choices,
  onSelect,
}: {
  narrative: string;
  choices: Choice[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="animate-fade-in-up">
      {/* Narrative */}
      <div className="mb-8">
        <div className="mx-auto mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] tracking-[0.3em] text-muted/30 uppercase">
            narrative
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="rounded-lg border border-border/40 bg-surface/50 px-6 py-5 sm:px-8 sm:py-6">
          <p className="font-serif text-base leading-[1.85] text-foreground/90 sm:text-lg">
            {narrative}
          </p>
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-2.5">
        <p className="mb-3 text-center text-xs tracking-[0.2em] text-muted/40 uppercase">
          Choose your path
        </p>
        {choices.map((choice, i) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelect(choice.id)}
            className="group relative w-full rounded-md border border-border/60 bg-surface/30 px-5 py-4 text-left transition-all duration-200 hover:border-amber/30 hover:bg-surface/60 hover:shadow-[0_0_16px_rgba(217,119,6,0.04)]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-sm text-amber/50 transition-colors group-hover:text-amber">
                {getChoiceTypeIcon(choice.type)}
              </span>
              <div className="flex-1">
                <p className="font-serif text-sm leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground">
                  {choice.text}
                </p>
                <span className="mt-1 block text-[10px] tracking-wider text-muted/30 uppercase">
                  {choice.type}
                </span>
              </div>
              <span className="mt-1 text-xs text-muted/20 transition-colors group-hover:text-amber/40">
                &rsaquo;
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResolutionPhase() {
  return (
    <div className="flex flex-col items-center py-20 animate-fade-in">
      <LoadingOrb />
      <p className="mt-6 max-w-sm text-center font-serif text-sm text-muted/50">
        The consequences unfold...
      </p>
    </div>
  );
}

function ConsequencesPhase({
  session,
  onContinue,
}: {
  session: GameSession;
  onContinue: () => void;
}) {
  const resolution = session.lastResolution;
  if (!resolution) return null;

  const response = resolution.response;
  const hasStateChanges =
    response.worldStateChanges && response.worldStateChanges.length > 0;
  const hasItems = response.itemsDiscovered && response.itemsDiscovered.length > 0;
  const hasSanityImpact =
    response.sanityImpact !== undefined && response.sanityImpact !== 0;
  const hasActingEval = response.actingEvaluation !== undefined;

  // Preview the digestion change this acting evaluation will apply on Continue.
  // Reuses applyDigestion (the same engine call applyResolution makes) so the
  // preview always matches reality, including its re-seed-on-mismatch logic.
  const digestionPreview = response.actingEvaluation
    ? applyDigestion(session.gameState, response.actingEvaluation)
    : null;
  const digestionState = digestionPreview?.state.digestion;
  const seq = digestionPreview
    ? getSequence(session.gameState.pathwayId, session.gameState.sequenceLevel)
    : null;

  return (
    <div className="animate-fade-in-up">
      {/* Resolution Narrative */}
      <div className="mb-6">
        <div className="mx-auto mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] tracking-[0.3em] text-muted/30 uppercase">
            resolution
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="rounded-lg border border-border/40 bg-surface/50 px-6 py-5 sm:px-8 sm:py-6">
          <p className="font-serif text-base leading-[1.85] text-foreground/90 sm:text-lg">
            {response.narrative}
          </p>
        </div>
      </div>

      {/* Consequences Summary */}
      {(hasSanityImpact || hasStateChanges || hasItems || hasActingEval) && (
        <div className="mb-6 space-y-3 rounded-md border border-border/30 bg-background/50 p-4">
          <p className="text-[10px] tracking-[0.2em] text-muted/40 uppercase">
            Consequences
          </p>

          {hasSanityImpact && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted/60">Sanity</span>
              <span
                className={
                  response.sanityImpact! > 0
                    ? "font-medium text-sanity-high"
                    : "font-medium text-sanity-low"
                }
              >
                {response.sanityImpact! > 0 ? "+" : ""}
                {response.sanityImpact}
              </span>
            </div>
          )}

          {hasActingEval && (
            <div className="text-sm">
              <span className="text-muted/60">Acting: </span>
              <span className="text-gaslight">
                {Math.round(response.actingEvaluation!.alignment * 100)}% alignment
              </span>
              {digestionPreview && digestionPreview.delta !== 0 && (
                <span
                  className={`ml-2 font-medium ${
                    digestionPreview.delta > 0 ? "text-occult" : "text-sanity-low"
                  }`}
                >
                  {digestionPreview.delta > 0 ? "+" : ""}
                  {digestionPreview.delta}% digestion
                </span>
              )}
              {response.actingEvaluation!.reasoning && (
                <p className="mt-1 text-xs italic text-muted/50">
                  {response.actingEvaluation!.reasoning}
                </p>
              )}
              {digestionPreview && digestionState && (
                <p className="mt-1 text-xs italic text-occult/70">
                  {digestionFeedback(
                    seq?.name ?? "Beyonder",
                    digestionState,
                    digestionPreview.delta,
                  )}
                </p>
              )}
            </div>
          )}

          {hasStateChanges &&
            response.worldStateChanges!.map((change, i) => (
              <div key={i} className="text-sm">
                <span className="text-muted/60">{change.field}: </span>
                <span className="text-foreground/70">{change.reason}</span>
              </div>
            ))}

          {hasItems &&
            response.itemsDiscovered!.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber">{"✦"}</span>
                <div>
                  <span className="font-medium text-amber/80">{item.name}</span>
                  <span className="ml-1 text-muted/50">{item.description}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Digestion complete — advancement available */}
      {(digestionState?.complete ?? session.gameState.digestion?.complete) && (
        <div className="mb-6 rounded-md border border-occult/40 bg-occult/[0.06] p-4 text-center">
          <p className="font-serif text-sm text-occult">
            ✦ The potion is fully digested. Advancement to the next Sequence is now within
            reach.
          </p>
        </div>
      )}

      {/* Continue */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md border border-amber/40 bg-amber/[0.08] px-6 py-3 font-serif text-sm font-medium text-amber transition-all duration-300 hover:border-amber/60 hover:bg-amber/[0.14] hover:shadow-[0_0_20px_rgba(217,119,6,0.1)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ErrorPhase({
  message,
  errorCode,
  onRetry,
}: {
  message: string;
  errorCode: AIErrorCode | "CONFIG_MISSING" | null | undefined;
  onRetry: () => void;
}) {
  const showSettings =
    errorCode === "CONFIG_MISSING" ||
    errorCode === "AUTH_ERROR" ||
    errorCode === "QUOTA_EXCEEDED";
  const showRetry = errorCode !== "CONFIG_MISSING";

  return (
    <div className="py-16 text-center animate-fade-in-up">
      <div className="mx-auto mb-4 h-8 w-8 rounded-full border border-crimson/40 bg-crimson/[0.08]">
        <span className="flex h-full w-full items-center justify-center text-sm text-sanity-low">
          !
        </span>
      </div>
      <p className="font-serif text-base text-foreground/70">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted/60">{message}</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        {showSettings && (
          <Link
            href="/settings"
            className="rounded-md border border-amber/40 bg-amber/[0.08] px-5 py-2.5 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/60 hover:bg-amber/[0.14]"
          >
            Go to Settings
          </Link>
        )}
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-amber/30 bg-amber/[0.06] px-5 py-2.5 text-sm text-amber transition-all duration-200 hover:border-amber/50 hover:bg-amber/[0.1]"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
