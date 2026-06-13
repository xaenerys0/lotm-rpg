"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameSession, GameplayPillar } from "@/lib/game";
import {
  transition,
  applyResolution,
  applyDigestion,
  applyCombatResult,
  createEncounter,
  deriveEncounterEnemy,
  isValidEncounterShape,
  digestionFeedback,
  classifySanityTier,
  isLossOfControl,
  evaluateLossOfControl,
  DEFAULT_PREFERENCES,
  CHOICE_PILLAR_MAP,
  PILLAR_INSTRUCTION_MAP,
  PROVIDER_CONFIG_KEY,
  type GamePreferences,
  type SanityTier,
  type LossOfControlSeverity,
  type CombatEncounter,
  type CombatResult,
  addJournalEntries,
  buildJournalEntry,
  createJournal,
  deriveJournalEntries,
  deserializeJournal,
  serializeJournal,
  syncEntries,
  JOURNAL_KEY_PREFIX,
  type JournalEntry,
  type JournalSyncClient,
  applySetback,
  buildLegacy,
  deserializeLegacies,
  endSession,
  evaluateFailure,
  fallbackDescentScene,
  serializeLegacies,
  LEGACIES_KEY,
  type FailureVerdict,
  apotheosisRequirements,
  apotheosisSuccessChance,
  attemptApotheosis,
  canAttemptApotheosis,
  drawPetition,
  sequenceAbilities,
  trueGodName,
  APOTHEOSIS_STAGES,
  deserializeArtifacts,
  mintArtifact,
  serializeArtifacts,
  ECHOES_KEY,
  freeTextRejection,
  freeTextToChoice,
  validateFreeText,
  FREE_TEXT_MAX_LENGTH,
  applyExposure,
  checkExposure,
  identityPromptContext,
  recordIdentityUse,
  validateJournalFlag,
  composeDeduction,
  composeDialogueAction,
  composeRitualAction,
  detectInputMode,
  gatherClues,
  INPUT_MODE_LABELS,
  RITUAL_STEPS,
  COMBAT_KEY_PREFIX,
  USAGE_KEY_PREFIX,
} from "@/lib/game";
import { SanityEffects } from "./sanity-effects";
import { CombatEncounterView } from "./combat-encounter";
import { loadPreferences } from "./preferences-store";
import type {
  GameState,
  DigestionState,
  ProviderConfig,
  Choice,
  InstructionType,
  AIErrorCode,
} from "@/lib/ai";
import {
  generate,
  addTurn,
  buildTurnRecord,
  TOKEN_BUDGET,
  AIError,
  addUsage,
  deserializeUsage,
  emptyUsage,
  formatUsage,
  serializeUsage,
  type SessionUsage,
  type TurnUsage,
} from "@/lib/ai";
import {
  selectCuratedLore,
  epochNarrationDirective,
  epochOpeningBeat,
  cityNarrationDirective,
  getEpoch,
} from "@/lib/lore";
import { createClient } from "@/lib/supabase/client";
import { SceneArt } from "./scene-art";
import { WorldMessages } from "./world-messages";
import { sceneArtKey, shouldGenerateSceneArt } from "@/lib/ai";
import { getPathway, getSequence } from "@/lib/rules";
import { noopSubscribe } from "@/lib/react";
import {
  loadSessionById,
  persistSession,
  useStoredValue,
} from "@/lib/react/session-store";

function loadProviderConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProviderConfig;
  } catch {
    return null;
  }
}

// Combat encounters live in their own localStorage entry (COMBAT_KEY_PREFIX,
// shared from @/lib/game) so an in-progress fight survives a reload without
// touching the persisted session schema.
function loadCombatFromStorage(sessionId: string): CombatEncounter | null {
  try {
    const raw = localStorage.getItem(COMBAT_KEY_PREFIX + sessionId);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // Reject unknown/old-schema blobs rather than coercing them (mirrors
    // deserializeSession); a malformed encounter would crash the engine/view.
    return isValidEncounterShape(parsed) ? (parsed as CombatEncounter) : null;
  } catch {
    return null;
  }
}

function saveCombatToStorage(sessionId: string, encounter: CombatEncounter): void {
  try {
    localStorage.setItem(COMBAT_KEY_PREFIX + sessionId, JSON.stringify(encounter));
  } catch {
    // Storage full or unavailable
  }
}

function clearCombatFromStorage(sessionId: string): void {
  try {
    localStorage.removeItem(COMBAT_KEY_PREFIX + sessionId);
  } catch {
    // Storage unavailable
  }
}

// Rough per-session token usage (issue #15) — its own localStorage entry
// (USAGE_KEY_PREFIX, shared from @/lib/game) so the session schema is untouched.
function loadUsageFromStorage(sessionId: string): SessionUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY_PREFIX + sessionId);
    return (raw ? deserializeUsage(raw) : null) ?? emptyUsage();
  } catch {
    return emptyUsage();
  }
}

function saveUsageToStorage(sessionId: string, usage: SessionUsage): void {
  try {
    localStorage.setItem(USAGE_KEY_PREFIX + sessionId, serializeUsage(usage));
  } catch {
    // Storage full or unavailable
  }
}

// Story journal capture (issue #11): entries persist locally alongside the
// session and batch-sync to Supabase best-effort after each turn.
function appendJournalEntries(sessionId: string, entries: JournalEntry[]): void {
  if (entries.length === 0) return;
  try {
    const raw = localStorage.getItem(JOURNAL_KEY_PREFIX + sessionId);
    const journal = (raw ? deserializeJournal(raw) : null) ?? createJournal();
    localStorage.setItem(
      JOURNAL_KEY_PREFIX + sessionId,
      serializeJournal(addJournalEntries(journal, entries)),
    );
  } catch {
    // Storage full or unavailable — the turn proceeds regardless.
  }
  void (async () => {
    try {
      const client = createClient();
      const { data } = await client.auth.getUser();
      if (!data.user) return;
      await syncEntries(
        client as unknown as JournalSyncClient,
        data.user.id,
        sessionId,
        entries,
      );
    } catch {
      // Offline or unreachable — localStorage already has the entries.
    }
  })();
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

// The two irrevocable endings (loss-of-control permadeath, failed apotheosis)
// share one closing-scene instruction; only the lead-in clause differs.
function descentAction(lead: string, severity: FailureVerdict["severity"]): string {
  const fate =
    severity === "fatal"
      ? "their death"
      : "their irreversible transformation into something monstrous";
  return `${lead} ${fate}. This ends their story: write a closing scene, no choices.`;
}

function buildAICallParams(currentSession: GameSession) {
  const pathway = getPathway(currentSession.gameState.pathwayId);
  const seq = getSequence(
    currentSession.gameState.pathwayId,
    currentSession.gameState.sequenceLevel,
  );
  // True-God-aware abilities (issue #30): Sequence 0 has no rules `Sequence`.
  const { abilities, acting } = sequenceAbilities(
    currentSession.gameState.pathwayId,
    currentSession.gameState.sequenceLevel,
  );
  return {
    pathway,
    seq,
    abilities,
    actingReqs: acting,
    // Active persona (issue #22): narrator presentation context.
    identityContext: currentSession.identityState
      ? identityPromptContext(currentSession.identityState)
      : null,
    // Epoch tone (issues #26/#29): null for the Fifth-Epoch baseline.
    epochContext: epochNarrationDirective(currentSession.gameState.epoch),
    // Curated guardrail selection lives in @/lib/lore (tested); the component
    // stays a thin caller (issue #63).
    loreContext: selectCuratedLore(
      pathway?.name ?? "fool",
      currentSession.gameState.location,
      TOKEN_BUDGET.lore,
      currentSession.gameState.epoch,
    ),
    // Per-city narration tone (issue #23): one tone sentence per city, null
    // for cities (incl. the Tingen start) with no specific tone.
    cityNarration: cityNarrationDirective(currentSession.gameState.location),
  };
}

// ─── Main Component ────────────────────────────────────────────────

export function GameLoop({ sessionId }: { sessionId: string }) {
  const initialSession = useStoredValue(() => loadSessionById(sessionId), null);
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

  const configCacheRef = useRef<ProviderConfig | null | undefined>(undefined);
  const providerConfig = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (configCacheRef.current === undefined) {
        configCacheRef.current = loadProviderConfig();
      }
      return configCacheRef.current;
    },
    () => null,
  );

  const combatCacheRef = useRef<CombatEncounter | null | undefined>(undefined);
  const initialCombat = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (combatCacheRef.current === undefined) {
        combatCacheRef.current = loadCombatFromStorage(sessionId);
      }
      return combatCacheRef.current;
    },
    () => null,
  );
  const [combat, setCombat] = useState<CombatEncounter | null>(initialCombat ?? null);

  const usageCacheRef = useRef<SessionUsage | undefined>(undefined);
  const initialUsage = useSyncExternalStore(
    noopSubscribe,
    () => {
      if (usageCacheRef.current === undefined) {
        usageCacheRef.current = loadUsageFromStorage(sessionId);
      }
      return usageCacheRef.current;
    },
    () => null,
  );
  const [usage, setUsage] = useState<SessionUsage | null>(initialUsage ?? null);

  const recordUsage = useCallback(
    (turn: TurnUsage | undefined) => {
      if (!turn) return;
      setUsage((prev) => {
        const next = addUsage(prev ?? emptyUsage(), turn);
        saveUsageToStorage(sessionId, next);
        return next;
      });
    },
    [sessionId],
  );
  const updateSession = useCallback((next: GameSession) => {
    setSession(next);
    persistSession(next);
  }, []);

  // Death & failure flow (issue #12). The rules engine owns the verdict; the
  // AI only narrates the descent (best-effort, with a deterministic fallback).
  const [setbackNotes, setSetbackNotes] = useState<string[] | null>(null);
  const [facingFate, setFacingFate] = useState(false);
  // Synchronous re-entrancy lock for the irrevocable endings (permadeath and
  // apotheosis). A ref, not state, so a rapid second click is blocked within
  // the same tick — before React can flush the `facingFate` re-render that
  // disables the button. Prevents an already-resolved apotheosis from being
  // re-rolled or the legacy/journal from being written twice.
  const endingInFlight = useRef(false);

  const handleSetback = useCallback(() => {
    if (!session) return;
    const result = applySetback(session.gameState, Math.random, session.turnCount);
    setSetbackNotes(result.notes);
    updateSession({
      ...session,
      gameState: result.state,
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, ...result.facts],
      },
      updatedAt: Date.now(),
    });
  }, [session, updateSession]);

  // The shared ending: legacy + echo persistence, the narrated final scene,
  // the death journal entry, and the session's end. Used by loss-of-control
  // permadeath (issue #12) and a failed apotheosis (issue #30).
  const concludeChronicle = useCallback(
    async (verdict: FailureVerdict, descentAction: string) => {
      if (!session || endingInFlight.current) return;
      endingInFlight.current = true;
      setFacingFate(true);
      const legacy = buildLegacy(session, verdict.severity);

      // The world remembers: persist the legacy for future characters.
      try {
        const raw = localStorage.getItem(LEGACIES_KEY);
        const legacies = (raw ? deserializeLegacies(raw) : null) ?? [];
        localStorage.setItem(LEGACIES_KEY, serializeLegacies([...legacies, legacy]));
      } catch {
        // Storage unavailable — the session still ends.
      }

      // Timeline echoes (issue #31): the fall also mints a physical artifact a
      // future character — in this epoch or later — may discover.
      try {
        const rawEchoes = localStorage.getItem(ECHOES_KEY);
        const artifacts = (rawEchoes ? deserializeArtifacts(rawEchoes) : null) ?? [];
        localStorage.setItem(
          ECHOES_KEY,
          serializeArtifacts([...artifacts, mintArtifact(session, legacy)]),
        );
      } catch {
        // Storage unavailable — the echo is lost to the fog.
      }

      // AI narrates the descent; the deterministic scene covers any failure.
      let scene = fallbackDescentScene(verdict.severity, session.gameState);
      if (providerConfig) {
        try {
          const { abilities, actingReqs, loreContext } = buildAICallParams(session);
          const result = await generate({
            config: providerConfig,
            gameState: session.gameState,
            memory: session.memory,
            loreContext,
            instruction: "narrative",
            playerAction: descentAction,
            abilities,
            actingRequirements: actingReqs,
          });
          if (result.response.narrative) scene = result.response.narrative;
          recordUsage(result.usage);
        } catch {
          // Fallback scene already set.
        }
      }

      appendJournalEntries(session.id, [
        buildJournalEntry(session.gameState, session.turnCount, {
          eventType: "death",
          summary: legacy.epitaph,
          narrative: scene,
        }),
      ]);

      updateSession(endSession(session, legacy, scene));
      setFacingFate(false);
      endingInFlight.current = false;
    },
    [session, providerConfig, recordUsage, updateSession],
  );

  const handlePermadeath = useCallback(async () => {
    if (!session) return;
    const verdict = evaluateFailure({
      cause: "loss-of-control",
      sequenceLevel: session.gameState.sequenceLevel,
      highRisk: session.gameState.digestion?.complete ?? false,
    });
    await concludeChronicle(
      verdict,
      descentAction(
        "Narrate the character's final descent — sanity has collapsed entirely and this is",
        verdict.severity,
      ),
    );
  }, [session, concludeChronicle]);

  // Apotheosis (issue #30): the engine — not the AI — decides the ascent.
  // Success writes Sequence 0 and the tease; failure at this height is
  // absolute and routes through the same permadeath machinery.
  const [ascension, setAscension] = useState<{
    honorific: string;
    tease: string;
  } | null>(null);

  const handleApotheosis = useCallback(async () => {
    // The attempt is irrevocable and rolls exactly once — take the synchronous
    // lock before the roll so a rapid second click cannot re-roll it.
    if (!session || endingInFlight.current) return;
    endingInFlight.current = true;
    const result = attemptApotheosis(session);
    if (result.outcome === "ascended") {
      appendJournalEntries(session.id, [
        buildJournalEntry(session.gameState, session.turnCount, {
          eventType: "advancement",
          summary: `Became ${result.honorific} — the Sequence 0 True God of the pathway.`,
          narrative: result.tease,
          arc: "Sequence 0",
        }),
      ]);
      setAscension({ honorific: result.honorific, tease: result.tease });
      updateSession(result.session);
      endingInFlight.current = false;
      return;
    }
    // Failure hands off to the shared ending path; release the lock so
    // concludeChronicle can re-acquire it synchronously (no await between).
    endingInFlight.current = false;
    await concludeChronicle(
      result.verdict,
      descentAction(
        "Narrate the apotheosis ritual collapsing at the final threshold — the pathway rejects the ascent and the character is unmade. This is",
        result.verdict.severity,
      ),
    );
  }, [session, updateSession, concludeChronicle]);

  const handleFullRestart = useCallback(() => {
    // Full restart: fresh timeline — the canonical baseline is restored by
    // wiping the legacy list and its artifact echoes. Old sessions/journals
    // stay readable as records.
    try {
      localStorage.removeItem(LEGACIES_KEY);
      localStorage.removeItem(ECHOES_KEY);
    } catch {
      // Storage unavailable
    }
    // Clear any lingering ascension banner so it cannot bleed into a new run.
    setAscension(null);
  }, []);

  const startCombat = useCallback(
    (ambush: boolean) => {
      if (!session) return;
      const encounter = createEncounter({
        id: crypto.randomUUID(),
        enemy: deriveEncounterEnemy(session.gameState, ambush),
        playerPathwayId: session.gameState.pathwayId,
        playerSequence: session.gameState.sequenceLevel,
        ambush,
        injuries: session.gameState.injuries ?? [],
      });
      setCombat(encounter);
      saveCombatToStorage(session.id, encounter);
    },
    [session],
  );

  const handleCombatUpdate = useCallback(
    (next: CombatEncounter) => {
      if (!session) return;
      setCombat(next);
      saveCombatToStorage(session.id, next);
    },
    [session],
  );

  const handleCombatResult = useCallback(
    (result: CombatResult) => {
      if (!session || !combat) return;
      const gameState = applyCombatResult(session.gameState, result);
      // Record the fight so the narrator remembers it next turn.
      const turn = buildTurnRecord(session.turnCount, `Combat: ${combat.enemy.name}`, {
        narrative: result.narrativeSummary,
      });
      const memory = addTurn(session.memory, turn);
      updateSession({ ...session, gameState, memory, updatedAt: Date.now() });
      clearCombatFromStorage(session.id);
      setCombat(null);
    },
    [session, combat, updateSession],
  );

  const handleCombatExit = useCallback(() => {
    if (!session) return;
    clearCombatFromStorage(session.id);
    setCombat(null);
  }, [session]);

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

      const {
        seq,
        abilities,
        actingReqs,
        loreContext,
        identityContext,
        epochContext,
        cityNarration,
      } = buildAICallParams(currentSession);

      const instruction: InstructionType = currentSession.activePillar
        ? PILLAR_INSTRUCTION_MAP[currentSession.activePillar]
        : "narrative";

      const playerAction =
        currentSession.turnCount === 0
          ? (epochOpeningBeat(currentSession.gameState.epoch) ??
            `I begin my journey as a Sequence ${currentSession.gameState.sequenceLevel} ${seq?.name ?? "Beyonder"} in ${currentSession.gameState.location}. Describe the opening scene and give me choices.`)
          : "Continue from the previous scene. Describe what happens next and give me choices.";

      try {
        const result = await generate({
          config,
          gameState: currentSession.gameState,
          memory: currentSession.memory,
          loreContext,
          identityContext,
          epochContext,
          cityNarration,
          instruction,
          playerAction,
          abilities,
          actingRequirements: actingReqs,
        });

        if (generationRef.current !== gen) return;
        recordUsage(result.usage);

        const choices = result.response.choices?.length
          ? result.response.choices
          : [
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
    [updateSession, dispatchMissingConfig, recordUsage],
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

      const {
        abilities,
        actingReqs,
        loreContext,
        identityContext,
        epochContext,
        cityNarration,
      } = buildAICallParams(currentSession);

      try {
        const result = await generate({
          config,
          gameState: currentSession.gameState,
          memory: currentSession.memory,
          loreContext,
          identityContext,
          epochContext,
          cityNarration,
          instruction,
          playerAction: selectedChoice.text,
          abilities,
          actingRequirements: actingReqs,
        });

        if (generationRef.current !== gen) return;
        recordUsage(result.usage);

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
    [updateSession, dispatchMissingConfig, recordUsage],
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

  // Free-text action (issue #19): validated by the rules engine, then wrapped
  // as a synthetic choice so the normal resolution machinery (sanity, acting,
  // journal) runs unchanged. Rejections are narrated, never errored.
  const [freeTextNotice, setFreeTextNotice] = useState<string | null>(null);

  const handleFreeText = useCallback(
    (input: string) => {
      if (!session) return;
      const validation = validateFreeText(input);
      if (!validation.ok) {
        setFreeTextNotice(freeTextRejection(validation.reason));
        return;
      }
      setFreeTextNotice(null);
      const choice = freeTextToChoice(validation.text);
      const withChoice = {
        ...session,
        currentChoices: [...(session.currentChoices ?? []), choice],
      };
      const next = transition(withChoice, {
        type: "SELECT_CHOICE",
        choiceId: choice.id,
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
      // Identity bookkeeping (issue #22): a public turn in a persona teaches
      // present NPCs that face and accrues exposure; once risk runs high, a
      // shared witness may connect two faces.
      let identityState = session.identityState;
      let exposureNarrative: string | null = null;
      if (identityState && identityState.activeIdentityId) {
        identityState = recordIdentityUse(identityState, gameState.npcsPresent);
        const exposure = checkExposure(identityState);
        if (exposure) {
          identityState = applyExposure(identityState, exposure);
          exposureNarrative = `${exposure.npc} looks at you a heartbeat too long — and you see the recognition land. Two of your faces are now one person to them.`;
          setFreeTextNotice(exposureNarrative);
        }
      }

      // Divine petitions (issue #30): a True God hears worshippers — some
      // turns a petition arrives as a memory fact the narrator weaves in.
      let memoryAfterPetitions = memory;
      if (gameState.sequenceLevel === 0) {
        const petition = drawPetition(gameState.pathwayId, session.turnCount);
        if (petition) {
          memoryAfterPetitions = {
            ...memory,
            sessionFacts: [...memory.sessionFacts, petition],
          };
        }
      }

      // Journal capture (issue #11): the AI's flag plus deterministic
      // detections from the state delta, recorded before the phase advances.
      const seq = getSequence(gameState.pathwayId, gameState.sequenceLevel);
      appendJournalEntries(
        session.id,
        deriveJournalEntries({
          prevState: session.gameState,
          nextState: gameState,
          response: resolution.response,
          turnNumber: session.turnCount,
          arc: `Sequence ${gameState.sequenceLevel} — ${seq?.name ?? "Beyonder"}`,
        }),
      );
      if (exposureNarrative) {
        appendJournalEntries(session.id, [
          buildJournalEntry(gameState, session.turnCount, {
            eventType: "major-event",
            summary: "An identity was exposed.",
            narrative: exposureNarrative,
          }),
        ]);
      }
      const updated = {
        ...session,
        gameState,
        memory: memoryAfterPetitions,
        ...(identityState ? { identityState } : {}),
      };
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
  // Sequence 0 (issue #30) has no rules-engine Sequence — present the honorific
  // instead of the empty "Unknown" fallback.
  const sequenceLabel =
    session.gameState.sequenceLevel === 0
      ? trueGodName(session.gameState.pathwayId)
      : (seq?.name ?? "Unknown");
  const epoch = getEpoch(session.gameState.epoch);
  // Combat only needs ability names; the True-God-aware derivation lives in one
  // place (sequenceAbilities) rather than running the full AI-call bundle.
  const { abilities: combatAbilities } = sequenceAbilities(
    session.gameState.pathwayId,
    session.gameState.sequenceLevel,
  );

  return (
    <SanityEffects
      sanity={session.gameState.sanity}
      maxSanity={session.gameState.maxSanity}
    >
      <div className="mx-auto max-w-3xl px-4">
        {/* Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="font-serif text-sm text-foreground/80">
              {sequenceLabel}{" "}
              <span className="text-muted">
                ({pathway?.name ?? "?"} Seq. {session.gameState.sequenceLevel})
              </span>
            </span>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <span>{session.gameState.location}</span>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <span title={epoch.era}>{epoch.name}</span>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <span>Turn {session.turnCount}</span>
            {usage !== null && usage.turns > 0 && (
              <>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span
                  className="text-muted"
                  title="Estimated session token usage — rough; your own API key pays the provider"
                >
                  {formatUsage(usage)}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <DigestionMeter digestion={session.gameState.digestion} />
            {preferences.sanityMeterVisible && (
              <SanityMeter
                sanity={session.gameState.sanity}
                maxSanity={session.gameState.maxSanity}
              />
            )}
          </div>
        </div>

        {/* Setback aftermath — transient consequence report (issue #12). */}
        {setbackNotes && !lostControl && (
          <div
            role="status"
            className="mb-6 rounded-md border border-amber/40 bg-amber/[0.06] p-5 animate-fade-in"
          >
            <p className="font-serif text-sm font-semibold text-amber">
              You survived — barely.
            </p>
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-foreground/80">
              {setbackNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSetbackNotes(null)}
              className="mt-3 min-h-[24px] rounded px-2 py-1 text-xs font-medium text-amber hover:underline"
            >
              Carry on
            </button>
          </div>
        )}

        {/* Apotheosis achieved (issue #30) — the glimpse above the sequences. */}
        {ascension && (
          <div
            role="status"
            className="mb-6 rounded-md border border-occult/40 bg-occult/[0.08] p-5 animate-fade-in"
          >
            <p className="gaslit font-serif text-base font-semibold text-occult-bright">
              You are {ascension.honorific} now. Sequence 0. A True God.
            </p>
            <p className="mt-2 font-serif text-sm italic leading-relaxed text-foreground/85">
              {ascension.tease}
            </p>
            <button
              type="button"
              onClick={() => setAscension(null)}
              className="mt-3 min-h-[24px] rounded px-2 py-1 text-xs font-medium text-occult-bright hover:underline"
            >
              Take the throne
            </button>
          </div>
        )}

        {/* Loss of control — sanity has bottomed out (issue #12). */}
        {lostControl && !session.ended && (
          <FailurePanel
            severity={evaluateLossOfControl({
              sequenceLevel: session.gameState.sequenceLevel,
              // A fully-digested potion means the character is poised mid-
              // advancement — a fragile moment that escalates the fallout.
              highRisk: session.gameState.digestion?.complete ?? false,
            })}
            busy={facingFate}
            onSetback={handleSetback}
            onPermadeath={() => void handlePermadeath()}
          />
        )}

        {/* Permadeath: the story is over; the record remains (issue #12). */}
        {session.ended ? (
          <DeathScreen ended={session.ended} onFullRestart={handleFullRestart} />
        ) : combat ? (
          <CombatEncounterView
            encounter={combat}
            gameState={session.gameState}
            abilities={combatAbilities}
            config={providerConfig}
            onUpdate={handleCombatUpdate}
            onApplyResult={handleCombatResult}
            onExit={handleCombatExit}
          />
        ) : (
          <>
            {/* Phase Content */}
            {session.phase === "idle" && <IdlePhase onStart={handleStartSituation} />}
            {session.phase === "situation" && <SituationPhase />}
            {session.phase === "choices" && (
              <>
                <ChoicesPhase
                  narrative={session.currentNarrative ?? ""}
                  choices={session.currentChoices ?? []}
                  gameState={session.gameState}
                  onSelect={handleSelectChoice}
                  onFreeText={handleFreeText}
                  freeTextNotice={freeTextNotice}
                />
                <CombatLauncher onStart={startCombat} />
                {session.gameState.sequenceLevel === 1 && (
                  <ApotheosisPanel
                    session={session}
                    busy={facingFate}
                    onAttempt={() => void handleApotheosis()}
                  />
                )}
                <WorldMessages location={session.gameState.location} />
              </>
            )}
            {session.phase === "resolution" && <ResolutionPhase />}
            {session.phase === "consequences" && (
              <ConsequencesPhase
                session={session}
                onContinue={handleContinue}
                config={providerConfig}
                sceneArtEnabled={preferences.sceneArtEnabled}
              />
            )}
            {session.phase === "error" && (
              <ErrorPhase
                message={session.errorMessage ?? "An unknown error occurred."}
                errorCode={session.errorCode}
                onRetry={handleRetry}
              />
            )}
          </>
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

function FailurePanel({
  severity,
  busy,
  onSetback,
  onPermadeath,
}: {
  severity: LossOfControlSeverity;
  busy: boolean;
  onSetback: () => void;
  onPermadeath: () => void;
}) {
  const copy = LOSS_OF_CONTROL_COPY[severity];
  const isSetback = severity === "setback";
  return (
    <div className="mb-6 rounded-md border border-crimson/50 bg-crimson/[0.08] p-5 text-center animate-fade-in">
      <p className="font-serif text-base font-semibold text-sanity-low">{copy.title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/70">
        {copy.body}
      </p>
      <p className="mt-3 text-[10px] tracking-[0.2em] text-muted uppercase">
        Loss of control &mdash; {severity}
      </p>
      <button
        type="button"
        onClick={isSetback ? onSetback : onPermadeath}
        disabled={busy}
        className="mt-4 rounded-md border border-crimson/50 bg-crimson/[0.12] px-5 py-2.5 text-sm font-medium text-sanity-low transition-all duration-200 hover:bg-crimson/[0.2] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? "The dark closes in..."
          : isSetback
            ? "Endure the breakdown"
            : "Face your fate"}
      </button>
    </div>
  );
}

function DeathScreen({
  ended,
  onFullRestart,
}: {
  ended: NonNullable<GameSession["ended"]>;
  onFullRestart: () => void;
}) {
  return (
    <div className="rounded-lg border border-crimson/40 bg-crimson/[0.05] p-8 text-center animate-fade-in">
      <h2 className="font-serif text-2xl font-bold text-sanity-low">
        {ended.fate === "dead" ? "The story ends here" : "Something else walks on"}
      </h2>
      <p className="mx-auto mt-4 max-w-xl font-serif text-base leading-relaxed whitespace-pre-wrap text-foreground/85">
        {ended.scene}
      </p>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        This chronicle is closed, but it is not erased — its journal remains readable as a
        historical record, and the world remembers what happened here.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/play"
          className="rounded-md bg-amber/90 px-5 py-2.5 text-sm font-medium text-background transition-all duration-200 hover:bg-amber"
        >
          Begin anew in this world
        </Link>
        <Link
          href="/play"
          onClick={onFullRestart}
          className="rounded-md border border-border px-5 py-2.5 text-sm text-muted transition-all duration-200 hover:border-amber/40 hover:text-foreground"
        >
          Restart the timeline completely
        </Link>
      </div>
      <p className="mt-3 text-[11px] text-muted">
        Beginning anew keeps this timeline — your next character will find traces of this
        one. A full restart returns the world to its canonical baseline.
      </p>
    </div>
  );
}

// ─── Mode assist (issue #24) ───────────────────────────────────────

function ModeAssist({
  mode,
  gameState,
  onCompose,
}: {
  mode: ReturnType<typeof detectInputMode>;
  gameState: GameState;
  onCompose: (action: string) => void;
}) {
  const [materials, setMaterials] = useState<string[]>([]);
  const [intent, setIntent] = useState("");
  const [npc, setNpc] = useState("");
  const [topic, setTopic] = useState("");
  const [clueA, setClueA] = useState("");
  const [clueB, setClueB] = useState("");

  if (mode === "ritual") {
    return (
      <div className="mt-6 rounded-md border border-occult/25 bg-occult/[0.04] p-4">
        <p className="text-xs font-semibold tracking-wide text-occult-bright uppercase">
          Guided ritual
        </p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-muted">
          {RITUAL_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {gameState.inventory.length > 0 && (
          <fieldset className="mt-3">
            <legend className="mb-1 text-xs text-muted">Materials to lay out</legend>
            <div className="flex flex-wrap gap-2">
              {gameState.inventory.map((item, index) => {
                const checked = materials.includes(item.name);
                return (
                  <label
                    key={`${item.name}-${index}`}
                    className={`min-h-[24px] cursor-pointer rounded-md border px-2.5 py-1 text-xs ${
                      checked
                        ? "border-occult/50 bg-occult/15 text-occult-bright"
                        : "border-border text-muted hover:border-occult/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setMaterials((prev) =>
                          checked
                            ? prev.filter((name) => name !== item.name)
                            : [...prev, item.name],
                        )
                      }
                      className="sr-only"
                    />
                    {item.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="ritual-intent" className="mb-1 block text-xs text-muted">
              The petition
            </label>
            <input
              id="ritual-intent"
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Show me the face of the thief…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-serif text-sm text-foreground placeholder-muted focus:border-occult/50 focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled={intent.trim() === ""}
            onClick={() => {
              onCompose(composeRitualAction(materials, intent));
              setIntent("");
              setMaterials([]);
            }}
            className="rounded-md border border-occult/40 bg-occult/[0.08] px-3 py-2 text-xs font-medium text-occult-bright hover:border-occult/60 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Enact the ritual
          </button>
        </div>
      </div>
    );
  }

  if (mode === "dialogue" && gameState.npcsPresent.length > 0) {
    return (
      <div className="mt-6 flex flex-wrap items-end gap-2 rounded-md border border-border/60 bg-surface/40 p-4">
        <div>
          <label htmlFor="dialogue-npc" className="mb-1 block text-xs text-muted">
            Speak with
          </label>
          <select
            id="dialogue-npc"
            value={npc}
            onChange={(e) => setNpc(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
          >
            <option value="">choose…</option>
            {gameState.npcsPresent.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="dialogue-topic" className="mb-1 block text-xs text-muted">
            Ask about
          </label>
          <input
            id="dialogue-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="the missing sailor…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-serif text-sm text-foreground placeholder-muted focus:border-amber/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          disabled={!npc || topic.trim() === ""}
          onClick={() => {
            onCompose(composeDialogueAction(npc, topic));
            setTopic("");
          }}
          className="rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-2 text-xs font-medium text-amber hover:border-amber/50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Ask
        </button>
      </div>
    );
  }

  if (mode === "investigation") {
    const clues = gatherClues(gameState);
    if (clues.length < 2) return null;
    return (
      <div className="mt-6 flex flex-wrap items-end gap-2 rounded-md border border-border/60 bg-surface/40 p-4">
        <div>
          <label htmlFor="clue-a" className="mb-1 block text-xs text-muted">
            First clue
          </label>
          <select
            id="clue-a"
            value={clueA}
            onChange={(e) => setClueA(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
          >
            <option value="">choose…</option>
            {clues.map((clue) => (
              <option key={clue} value={clue}>
                {clue}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="clue-b" className="mb-1 block text-xs text-muted">
            Second clue
          </label>
          <select
            id="clue-b"
            value={clueB}
            onChange={(e) => setClueB(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber/50 focus:outline-none"
          >
            <option value="">choose…</option>
            {clues
              .filter((clue) => clue !== clueA)
              .map((clue) => (
                <option key={clue} value={clue}>
                  {clue}
                </option>
              ))}
          </select>
        </div>
        <button
          type="button"
          disabled={!clueA || !clueB}
          onClick={() => onCompose(composeDeduction(clueA, clueB))}
          className="rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-2 text-xs font-medium text-amber hover:border-amber/50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Weigh the clues
        </button>
      </div>
    );
  }

  return null;
}

// ─── Sub-Components ──────────────────────────────────────────────

function LoadingOrb() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-12 w-12" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-amber/20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-amber/40 animate-pulse" />
        <div className="candle-flicker absolute inset-4 rounded-full bg-amber/80" />
      </div>
      <p className="font-serif text-sm italic text-muted animate-pulse">
        The fog stirs...
      </p>
    </div>
  );
}

function SanityMeter({ sanity, maxSanity }: { sanity: number; maxSanity: number }) {
  const { color, glow, ratio } = getSanityStyle(sanity, maxSanity);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted" id="sanity-meter-label">
        Sanity
      </span>
      <div
        role="progressbar"
        aria-labelledby="sanity-meter-label"
        aria-valuemin={0}
        aria-valuemax={maxSanity}
        aria-valuenow={sanity}
        aria-valuetext={`${sanity} of ${maxSanity}`}
        className="h-2 w-24 overflow-hidden rounded-full bg-border/40"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${color} ${glow}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="min-w-[3ch] text-right font-mono text-xs text-muted">
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
        className="text-xs text-muted"
        id="digestion-meter-label"
        title="Digestion — act in character to assimilate your potion"
      >
        Digestion
      </span>
      <div
        role="progressbar"
        aria-labelledby="digestion-meter-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={complete ? "Fully digested" : `${progress}%`}
        className="h-2 w-24 overflow-hidden rounded-full bg-border/40"
      >
        <div
          className={`h-full rounded-full bg-occult transition-all duration-700 ${
            complete ? "shadow-[0_0_8px_var(--color-occult)]" : ""
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="min-w-[3ch] text-right font-mono text-xs text-muted">
        {complete ? <span aria-hidden="true">✦</span> : `${progress}%`}
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
    <div role="status" className="flex flex-col items-center py-20 animate-fade-in">
      <LoadingOrb />
      <p className="mt-6 max-w-sm text-center font-serif text-sm text-muted">
        Weaving the threads of fate...
      </p>
    </div>
  );
}

function ChoicesPhase({
  narrative,
  choices,
  gameState,
  onSelect,
  onFreeText,
  freeTextNotice,
}: {
  narrative: string;
  choices: Choice[];
  gameState: GameState;
  onSelect: (id: string) => void;
  onFreeText: (input: string) => void;
  freeTextNotice: string | null;
}) {
  const [freeText, setFreeText] = useState("");
  // Context-dependent input mode (issue #24): inferred from the scene itself.
  const mode = detectInputMode(choices, narrative);
  return (
    <div className="animate-fade-in-up">
      {/* Narrative */}
      <div className="mb-8">
        <div className="mx-auto mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            narrative
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="parchment rounded-lg border border-border/40 px-6 py-5 sm:px-8 sm:py-6">
          <p className="font-serif text-base leading-[1.85] text-foreground/90 sm:text-lg">
            {narrative}
          </p>
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-2.5">
        <p className="mb-3 text-center text-xs tracking-[0.2em] text-muted uppercase">
          {INPUT_MODE_LABELS[mode]}
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
              <span
                className="mt-0.5 shrink-0 text-sm text-amber/50 transition-colors group-hover:text-amber"
                aria-hidden="true"
              >
                {getChoiceTypeIcon(choice.type)}
              </span>
              <div className="flex-1">
                <p className="font-serif text-sm leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground">
                  {choice.text}
                </p>
                <span className="mt-1 block text-[10px] tracking-wider text-muted uppercase">
                  {choice.type}
                </span>
              </div>
              <span
                className="mt-1 text-xs text-muted/20 transition-colors group-hover:text-amber/40"
                aria-hidden="true"
              >
                &rsaquo;
              </span>
            </div>
          </button>
        ))}
        {/* Mode-specific guided input (issue #24) — composes through the
          validated free-text pipeline, so one resolution path serves all. */}
        <ModeAssist mode={mode} gameState={gameState} onCompose={onFreeText} />

        {/* Free text (issue #19): optional — choosers can ignore it entirely. */}
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            onFreeText(freeText);
            setFreeText("");
          }}
        >
          <label htmlFor="free-text-action" className="mb-1.5 block text-xs text-muted">
            Or act on your own
          </label>
          <div className="flex items-end gap-2">
            <input
              id="free-text-action"
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={FREE_TEXT_MAX_LENGTH}
              placeholder="I follow the sound of the bells…"
              className="w-full rounded-md border border-border bg-background px-4 py-3 font-serif text-sm text-foreground placeholder-muted transition-colors duration-200 focus:border-amber/50 focus:outline-none focus:ring-1 focus:ring-amber/20"
            />
            <button
              type="submit"
              disabled={freeText.trim() === ""}
              className="shrink-0 rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm font-medium text-amber transition-all duration-200 hover:border-amber/50 hover:bg-amber/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Act
            </button>
          </div>
          {freeTextNotice && (
            <p
              role="status"
              className="mt-3 font-serif text-sm italic text-foreground/70"
            >
              {freeTextNotice}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function ResolutionPhase() {
  return (
    <div role="status" className="flex flex-col items-center py-20 animate-fade-in">
      <LoadingOrb />
      <p className="mt-6 max-w-sm text-center font-serif text-sm text-muted">
        The consequences unfold...
      </p>
    </div>
  );
}

function CombatLauncher({ onStart }: { onStart: (ambush: boolean) => void }) {
  return (
    <div className="mt-8 border-t border-border/40 pt-5">
      <p className="mb-3 text-center text-[10px] tracking-[0.2em] text-muted uppercase">
        Or steel yourself for violence
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onStart(false)}
          className="min-h-[24px] rounded-md border border-crimson/30 bg-crimson/[0.06] px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:border-crimson/50 hover:bg-crimson/[0.1]"
        >
          <span aria-hidden="true">⚔ </span>Confront a known threat
        </button>
        <button
          type="button"
          onClick={() => onStart(true)}
          className="min-h-[24px] rounded-md border border-border/50 bg-surface/30 px-4 py-2.5 text-sm text-muted transition-colors hover:border-border hover:text-foreground/80"
        >
          Brave an ambush
        </button>
      </div>
    </div>
  );
}

// Apotheosis (issue #30): shown to a Sequence 1 King of Angels. The checklist
// is the engine's own requirement verdicts; the attempt is two-step (arm, then
// confirm) because failure at this height is permadeath.
function ApotheosisPanel({
  session,
  busy,
  onAttempt,
}: {
  session: GameSession;
  busy: boolean;
  onAttempt: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const requirements = apotheosisRequirements(session);
  const ready = canAttemptApotheosis(session);
  const chance = Math.round(apotheosisSuccessChance(session) * 100);
  const honorific = trueGodName(session.gameState.pathwayId);

  return (
    <section
      aria-labelledby="apotheosis-heading"
      className="mt-8 rounded-lg border border-occult/30 bg-occult/[0.04] p-5"
    >
      <h2
        id="apotheosis-heading"
        className="gaslit font-serif text-base font-semibold text-occult-bright"
      >
        The throne of {honorific} stands empty
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        One rung remains. Sequence 0 is not climbed — it is seized, once, by the one the
        pathway accepts.
      </p>
      <ul className="mt-3 space-y-1.5">
        {requirements.map((req) => (
          <li key={req.id} className="flex items-start gap-2 text-sm">
            <span
              aria-hidden="true"
              className={req.met ? "text-occult-bright" : "text-muted"}
            >
              {req.met ? "✦" : "◇"}
            </span>
            <span className={req.met ? "text-foreground/85" : "text-muted"}>
              {req.label}
              <span className="sr-only">{req.met ? " — met" : " — not yet met"}</span>
            </span>
          </li>
        ))}
      </ul>
      {ready && (
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground/75">
          {APOTHEOSIS_STAGES.map((stage) => (
            <li key={stage}>{stage}</li>
          ))}
        </ol>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!armed ? (
          <button
            type="button"
            onClick={() => setArmed(true)}
            disabled={!ready || busy}
            className="min-h-[24px] rounded-md border border-occult/40 bg-occult/[0.08] px-4 py-2 text-sm font-medium text-occult-bright transition-colors hover:border-occult/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Begin the apotheosis ritual
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onAttempt}
              disabled={busy}
              className="min-h-[24px] rounded-md border border-crimson/40 bg-crimson/[0.08] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-crimson/60 disabled:opacity-40"
            >
              {busy ? "The world holds its breath…" : "Seize the throne — irrevocably"}
            </button>
            <button
              type="button"
              onClick={() => setArmed(false)}
              disabled={busy}
              className="min-h-[24px] rounded px-2 py-1 text-xs text-muted hover:text-foreground/80"
            >
              Step back
            </button>
          </>
        )}
        {ready && (
          <span className="text-xs text-muted">
            The augurs put your odds near {chance}%. Failure is not survivable.
          </span>
        )}
      </div>
    </section>
  );
}

function ConsequencesPhase({
  session,
  onContinue,
  config,
  sceneArtEnabled,
}: {
  session: GameSession;
  onContinue: () => void;
  config: ProviderConfig | null;
  sceneArtEnabled: boolean;
}) {
  const resolution = session.lastResolution;
  if (!resolution) return null;

  const response = resolution.response;
  // Scene art (issue #20): the AI's journal flag marks the key moments.
  const artFlag = validateJournalFlag(response.journalEntry);
  const illustrate = artFlag !== null && shouldGenerateSceneArt(artFlag.eventType);
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
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            resolution
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="rounded-lg border border-border/40 bg-surface/50 px-6 py-5 sm:px-8 sm:py-6">
          <p className="font-serif text-base leading-[1.85] text-foreground/90 sm:text-lg">
            {response.narrative}
          </p>
        </div>
        {illustrate && artFlag && (
          <SceneArt
            artKey={sceneArtKey(session.id, session.turnCount)}
            context={{
              summary: artFlag.summary,
              location: session.gameState.location,
              ...(seq ? { pathwayName: seq.name } : {}),
            }}
            config={config}
            enabled={sceneArtEnabled}
          />
        )}
      </div>

      {/* Consequences Summary */}
      {(hasSanityImpact || hasStateChanges || hasItems || hasActingEval) && (
        <div className="mb-6 space-y-3 rounded-md border border-border/30 bg-background/50 p-4">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
            Consequences
          </p>

          {hasSanityImpact && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Sanity</span>
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
              <span className="text-muted">Acting: </span>
              <span className="text-gaslight">
                {Math.round(response.actingEvaluation!.alignment * 100)}% alignment
              </span>
              {digestionPreview && digestionPreview.delta !== 0 && (
                <span
                  className={`ml-2 font-medium ${
                    digestionPreview.delta > 0 ? "text-occult-bright" : "text-sanity-low"
                  }`}
                >
                  {digestionPreview.delta > 0 ? "+" : ""}
                  {digestionPreview.delta}% digestion
                </span>
              )}
              {response.actingEvaluation!.reasoning && (
                <p className="mt-1 text-xs italic text-muted">
                  {response.actingEvaluation!.reasoning}
                </p>
              )}
              {digestionPreview && digestionState && (
                <p className="mt-1 text-xs italic text-occult-bright">
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
                <span className="text-muted">{change.field}: </span>
                <span className="text-foreground/70">{change.reason}</span>
              </div>
            ))}

          {hasItems &&
            response.itemsDiscovered!.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber" aria-hidden="true">
                  {"✦"}
                </span>
                <div>
                  <span className="font-medium text-amber">{item.name}</span>
                  <span className="ml-1 text-muted">{item.description}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Digestion complete — advancement available */}
      {(digestionState?.complete ?? session.gameState.digestion?.complete) && (
        <div className="mb-6 rounded-md border border-occult/40 bg-occult/[0.06] p-4 text-center">
          <p className="font-serif text-sm text-occult-bright">
            <span aria-hidden="true">✦ </span>The potion is fully digested. Advancement to
            the next Sequence is now within reach.
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
    <div role="alert" className="py-16 text-center animate-fade-in-up">
      <div
        className="mx-auto mb-4 h-8 w-8 rounded-full border border-crimson/40 bg-crimson/[0.08]"
        aria-hidden="true"
      >
        <span className="flex h-full w-full items-center justify-center text-sm text-sanity-low">
          !
        </span>
      </div>
      <p className="font-serif text-base text-foreground/70">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
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
