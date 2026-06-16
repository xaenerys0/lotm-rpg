"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { GameSession, GameplayPillar } from "@/lib/game";
import {
  transition,
  applyResolution,
  narrationOnly,
  partitionDiscoveredItems,
  discoveredItemLeadFact,
  applyDigestion,
  applyCombatResult,
  createEncounter,
  deriveEncounterEnemy,
  isValidEncounterShape,
  isReagentCategory,
  digestionFeedback,
  classifySanityTier,
  isLossOfControl,
  evaluateLossOfControl,
  resolveActingMethodState,
  previewSanityImpact,
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
  advancementRequirements,
  advancementSuccessChance,
  attemptAdvancement,
  isAdvanceableSequence,
  meetsRequirements,
  targetSequence,
  deliverHuntedItem,
  getFunds,
  potionPreparationPlan,
  purchasePotionItem,
  type PotionItemStatus,
  startHunt,
  clearHunt,
  advanceActiveHunts,
  findHunt,
  isHuntReady,
  huntQuestLabel,
  type HuntState,
  deserializeArtifacts,
  mintArtifact,
  serializeArtifacts,
  ECHOES_KEY,
  freeTextRejection,
  freeTextToChoice,
  validateFreeText,
  FREE_TEXT_MAX_LENGTH,
  activeIdentity,
  applyExposure,
  checkExposure,
  createIdentityState,
  detectAssumeIdentityIntent,
  hasPreparedIdentity,
  switchIdentity,
  identityCapability,
  identityPromptContext,
  ASSUME_VIA_PANEL_NARRATIVE,
  UNPREPARED_IDENTITY_NARRATIVE,
  applyProfileChange,
  isDrasticChange,
  pierceRecognition,
  profilePromptContext,
  proposalToChange,
  recognitionPromptContext,
  recordIdentityUse,
  resolveProfileState,
  validateSelfChangeProposal,
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
  ValidatedAIResponse,
  AIResponse,
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
import { retrieveLoreForTurn } from "./lore-retrieval-client";
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

// Wrap a narration-only AI response as the `ValidatedAIResponse` an
// engine-decided turn (advancement / apotheosis) carries through
// ENGINE_RESOLUTION. The engine already committed the mechanical effects, so the
// response only narrates — no validation work to do.
function engineResolution(response: AIResponse): ValidatedAIResponse {
  return { response, validation: { valid: true, violations: [] } };
}

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
    const key = JOURNAL_KEY_PREFIX + sessionId;
    const raw = localStorage.getItem(key);
    const existing = raw ? deserializeJournal(raw) : null;
    // Backward-compat: fall back to a fresh journal ONLY when nothing was
    // stored. If a journal IS stored but can't be parsed (a legacy/corrupted
    // shape), do NOT overwrite it — replacing it with a fresh journal would
    // destroy the player's existing entries and annotations. We skip the local
    // write in that case; the best-effort Supabase sync below still records the
    // new entries additively (server-side).
    if (existing || !raw) {
      localStorage.setItem(
        key,
        serializeJournal(addJournalEntries(existing ?? createJournal(), entries)),
      );
    }
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
    // True-self ground truth (character-info storage): pronouns/appearance/etc.
    profileContext: currentSession.profileState
      ? profilePromptContext(currentSession.profileState, currentSession.gameState)
      : null,
    // Recognition gap (character-info storage): only while showing the TRUE
    // face — a worn persona already presents as someone else entirely.
    recognitionContext:
      currentSession.profileState &&
      (currentSession.identityState?.activeIdentityId ?? null) === null
        ? recognitionPromptContext(currentSession.profileState)
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
      // Progressive disclosure: a character only sees curated lore for rungs of
      // the pathway they have actually reached (issue: P2 sequence gate).
      currentSession.gameState.sequenceLevel,
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
          const {
            abilities,
            actingReqs,
            loreContext,
            identityContext,
            profileContext,
            recognitionContext,
            epochContext,
            cityNarration,
          } = buildAICallParams(session);
          const result = await generate({
            config: providerConfig,
            gameState: session.gameState,
            memory: session.memory,
            loreContext,
            identityContext,
            profileContext,
            recognitionContext,
            epochContext,
            cityNarration,
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
      // Route the ascent through the normal turn loop (like advancement) so the
      // tease becomes the current scene and a memory turn record — the narrator
      // continues as a True God with full awareness, no side-channel banner.
      updateSession(
        transition(result.session, {
          type: "ENGINE_RESOLUTION",
          result: engineResolution({ narrative: result.tease }),
          playerAction: `I seize the throne and ascend to Sequence 0, becoming ${result.honorific}, a True God of the pathway.`,
        }),
      );
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

  // Sequence advancement (Seq 9 → 2): the engine — not the AI — decides whether
  // the climb holds. Success rewrites `sequenceLevel`; a loss of control routes
  // through the same setback / permadeath machinery as any other failure.
  const [advancing, setAdvancing] = useState(false);
  // Synchronous re-entry lock — `advancing` is async React state, so a rapid
  // second click can pass the check before it commits. The ref is set before the
  // roll so the climb is rolled exactly once (mirrors `endingInFlight`).
  const advancingRef = useRef(false);

  // Potion preparation (issue #84): `prepNotice` surfaces a refused purchase
  // (e.g. unaffordable) in-world. The hunt objective rides on the persisted
  // CombatEncounter (`combat.huntTarget`), not React state, so a mid-hunt reload
  // still grants the Characteristic on victory.
  const [prepNotice, setPrepNotice] = useState<string | null>(null);

  const handleAdvancement = useCallback(async () => {
    if (!session || endingInFlight.current || advancingRef.current) return;
    advancingRef.current = true;
    try {
      const result = attemptAdvancement(session);

      if (result.outcome === "advanced") {
        setAdvancing(true);
        const advanced = result.session;
        // The ritual / digestion plays out in narration (best-effort; a
        // deterministic scene covers a missing provider).
        let scene = `You drink the Sequence ${result.newSequenceLevel} potion${
          result.ritual ? ` and complete the rite — ${result.ritual.description}` : ""
        }. The role sinks into your bones until it is indistinguishable from you: you are a ${result.roleName} now.`;
        let aiResponse: AIResponse | null = null;
        if (providerConfig) {
          try {
            const {
              abilities,
              actingReqs,
              loreContext,
              identityContext,
              profileContext,
              recognitionContext,
              epochContext,
              cityNarration,
            } = buildAICallParams(advanced);
            const res = await generate({
              config: providerConfig,
              gameState: advanced.gameState,
              memory: advanced.memory,
              loreContext,
              identityContext,
              profileContext,
              recognitionContext,
              epochContext,
              cityNarration,
              instruction: "advancement",
              playerAction: `Narrate my advancement to Sequence ${result.newSequenceLevel}, ${result.roleName}${
                result.ritual
                  ? `, performing the ritual: ${result.ritual.description}`
                  : ""
              }. I have fully digested the previous potion through the Acting Method.`,
              abilities,
              actingRequirements: actingReqs,
            });
            if (res.response.narrative) scene = res.response.narrative;
            aiResponse = res.response;
            recordUsage(res.usage);
          } catch {
            // Deterministic scene already set.
          }
        }
        appendJournalEntries(session.id, [
          buildJournalEntry(advanced.gameState, advanced.turnCount, {
            eventType: "advancement",
            summary: `Advanced to Sequence ${result.newSequenceLevel}, ${result.roleName}.`,
            narrative: scene,
            arc: `Sequence ${result.newSequenceLevel}`,
          }),
        ]);
        // Route the engine-decided climb through the normal turn loop: the
        // narration becomes the current scene AND a memory turn record (so the
        // narrator knows on the next turn it happened), with the AI response
        // stripped to narration so it cannot re-apply the effects the engine
        // already committed. No more side-channel banner.
        const resolution = engineResolution(
          aiResponse
            ? { ...narrationOnly(aiResponse), narrative: scene }
            : { narrative: scene },
        );
        const playerAction = `I drink the Sequence ${result.newSequenceLevel} potion and undergo the advancement to ${result.roleName}${
          result.ritual ? `, performing the rite: ${result.ritual.description}` : ""
        }. I have fully digested the previous potion through the Acting Method.`;
        updateSession(
          transition(advanced, {
            type: "ENGINE_RESOLUTION",
            result: resolution,
            playerAction,
          }),
        );
        setAdvancing(false);
        return;
      }

      // Lost control: a survivable setback is endured in place (shared with the
      // zero-sanity path); permadeath routes through the shared ending path.
      if (result.verdict.outcome === "permadeath") {
        await concludeChronicle(
          result.verdict,
          descentAction(
            "Narrate the advancement turning on the character — the potion overwhelms the mind and control is lost. This is",
            result.verdict.severity,
          ),
        );
        return;
      }
      handleSetback();
    } finally {
      advancingRef.current = false;
    }
  }, [
    session,
    providerConfig,
    recordUsage,
    updateSession,
    concludeChronicle,
    handleSetback,
  ]);

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
  }, []);

  const startCombat = useCallback(
    (ambush: boolean, huntTarget?: string) => {
      if (!session) return;
      // The player's actual abilities and carried artifacts ride onto the
      // encounter so they can be invoked dynamically mid-fight (not only readied
      // in preparation). Reagents are excluded — a potion ingredient is not a
      // combat artifact.
      const { abilities } = sequenceAbilities(
        session.gameState.pathwayId,
        session.gameState.sequenceLevel,
      );
      const availableArtifacts = session.gameState.inventory.filter(
        (item) => !isReagentCategory(item.category),
      );
      const encounter = createEncounter({
        id: crypto.randomUUID(),
        enemy: deriveEncounterEnemy(session.gameState, ambush),
        playerPathwayId: session.gameState.pathwayId,
        playerSequence: session.gameState.sequenceLevel,
        ambush,
        injuries: session.gameState.injuries ?? [],
        availableAbilities: abilities,
        availableArtifacts,
        huntTarget,
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
      let next: GameSession = { ...session, gameState, memory, updatedAt: Date.now() };

      // A hunt (issue #84) that ended in victory yields the Beyonder
      // Characteristic it was after — the engine grants it plus spoils, and
      // records it as a discovery. The objective rides on the persisted
      // encounter, so this survives a mid-hunt reload.
      const huntTarget = combat.huntTarget;
      if (huntTarget && result.outcome === "victory") {
        const hunted = deliverHuntedItem(next, huntTarget);
        if (hunted.outcome === "delivered" && hunted.session) {
          next = hunted.session;
          appendJournalEntries(session.id, [
            buildJournalEntry(next.gameState, next.turnCount, {
              eventType: "discovery",
              summary: `Hunted and claimed ${huntTarget} for the next potion.`,
              narrative: `You hunted down and claimed ${huntTarget}, taking its spoils for the climb ahead.`,
              arc: `Sequence ${next.gameState.sequenceLevel}`,
            }),
          ]);
        }
        // The quarry is down — retire the tracking quest (its label drops from
        // activeQuests). On a loss/escape the hunt stays ready to re-engage.
        next = clearHunt(next, huntTarget);
      }

      updateSession(next);
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

  // Potion preparation (issue #84). Buying a prerequisite spends funds; the
  // engine validates and delivers. An unaffordable buy is surfaced in-world
  // rather than silently failing.
  const handlePurchaseItem = useCallback(
    (itemName: string) => {
      if (!session) return;
      const result = purchasePotionItem(session, itemName);
      if (result.outcome === "purchased" && result.session) {
        appendJournalEntries(session.id, [
          buildJournalEntry(result.session.gameState, result.session.turnCount, {
            eventType: "discovery",
            summary: `Acquired ${itemName} for the next potion.`,
            narrative: `You secured ${itemName}, one step closer to the next Sequence's potion.`,
            arc: `Sequence ${result.session.gameState.sequenceLevel}`,
          }),
        ]);
        updateSession(result.session);
        setPrepNotice(null);
      } else if (result.outcome === "unaffordable") {
        setPrepNotice(
          `You cannot yet afford ${itemName} (${result.cost} pence). Hunt the Characteristic for spoils, or sell what you carry.`,
        );
      }
    },
    [session, updateSession],
  );

  // Hunting a Beyonder Characteristic now begins a tracked, multi-turn QUEST to
  // find the creature (longer/harder the deeper the rung). The search plays out
  // over normal turns; when the quarry is cornered the player engages it through
  // the unified combat system (`handleEngageHunt`), and victory grants the
  // Characteristic in `handleCombatResult` exactly as before.
  const handleHuntItem = useCallback(
    (itemName: string) => {
      if (!session) return;
      const result = startHunt(session, itemName);
      if (result.outcome === "started" && result.session) {
        appendJournalEntries(session.id, [
          buildJournalEntry(result.session.gameState, result.session.turnCount, {
            eventType: "discovery",
            summary: `Began the hunt for ${itemName}.`,
            narrative: `You set out to track down the creature that carries ${itemName} — the hunt for the next potion's Characteristic has begun.`,
            arc: `Sequence ${result.session.gameState.sequenceLevel}`,
          }),
        ]);
        updateSession(result.session);
        setPrepNotice(null);
      } else if (result.outcome === "already-hunting") {
        setPrepNotice(`You are already tracking ${itemName}.`);
      } else {
        setPrepNotice(`You cannot hunt ${itemName} just now.`);
      }
    },
    [session, updateSession],
  );

  // The quarry is cornered — engage it through the unified combat system. The
  // hunt rides on `combat.huntTarget`, so victory delivers the Characteristic.
  const handleEngageHunt = useCallback(
    (itemName: string) => {
      if (!session) return;
      setPrepNotice(null);
      startCombat(false, itemName);
    },
    [session, startCombat],
  );

  // Give up tracking a Characteristic: drops the hunt and its quest label.
  const handleAbandonHunt = useCallback(
    (itemName: string) => {
      if (!session) return;
      updateSession(clearHunt(session, itemName));
    },
    [session, updateSession],
  );

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
        profileContext,
        recognitionContext,
        epochContext,
        cityNarration,
      } = buildAICallParams(currentSession);

      const instruction: InstructionType = currentSession.activePillar
        ? PILLAR_INSTRUCTION_MAP[currentSession.activePillar]
        : "narrative";

      const playerAction =
        currentSession.turnCount === 0
          ? (currentSession.gameState.openingBeat ??
            epochOpeningBeat(currentSession.gameState.epoch) ??
            `I begin my journey as a Sequence ${currentSession.gameState.sequenceLevel} ${seq?.name ?? "Beyonder"} in ${currentSession.gameState.location}. Describe the opening scene and give me choices.`)
          : "Continue from the previous scene. Describe what happens next and give me choices.";

      // Best-effort gated retrieval (issues #63/#64): extends the curated lore
      // with novel/wiki chunks the character may canonically know. Never blocks
      // the turn — resolves to [] when retrieval is unavailable.
      const retrievedChunks = await retrieveLoreForTurn(currentSession, config);
      if (generationRef.current !== gen) return;

      try {
        const result = await generate({
          config,
          gameState: currentSession.gameState,
          memory: currentSession.memory,
          loreContext,
          retrievedChunks,
          identityContext,
          profileContext,
          recognitionContext,
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
        profileContext,
        recognitionContext,
        epochContext,
        cityNarration,
      } = buildAICallParams(currentSession);

      const retrievedChunks = await retrieveLoreForTurn(currentSession, config);
      if (generationRef.current !== gen) return;

      try {
        const result = await generate({
          config,
          gameState: currentSession.gameState,
          memory: currentSession.memory,
          loreContext,
          retrievedChunks,
          identityContext,
          profileContext,
          recognitionContext,
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

  // Acting-method discovery announcement (issue #95): a transient role="status"
  // reveal shown the turn the player earns the secret.
  const [methodNotice, setMethodNotice] = useState<string | null>(null);

  // In-turn true-self change (character-info storage): the AI may flag a
  // declaration the player made; it is NEVER applied without this confirm.
  const [selfChangeHandledTurn, setSelfChangeHandledTurn] = useState<number | null>(null);

  const handleConfirmSelfChange = useCallback(
    (createGap: boolean) => {
      if (!session) return;
      const proposal = validateSelfChangeProposal(
        session.lastResolution?.response.proposedSelfChange,
      );
      if (!proposal) return;
      const profileState = resolveProfileState(session.profileState);
      const result = applyProfileChange(
        profileState,
        session.gameState,
        proposalToChange(proposal),
        { createGap, npcsPresent: session.gameState.npcsPresent },
      );
      updateSession({
        ...session,
        gameState: result.gameState,
        profileState: result.profileState,
        updatedAt: Date.now(),
      });
      setSelfChangeHandledTurn(session.turnCount);
    },
    [session, updateSession],
  );

  const handleFreeText = useCallback(
    (input: string) => {
      if (!session) return;
      // Assuming a persona is a deliberate engine action (the panel below),
      // never something the narrator commits from typed intent. Catch a typed
      // attempt here so it can't silently fail to associate and only pollute
      // the AI context (issue #22): steer the player to the switch instead.
      if (detectAssumeIdentityIntent(input)) {
        const identityState = session.identityState ?? createIdentityState();
        setFreeTextNotice(
          hasPreparedIdentity(identityState)
            ? ASSUME_VIA_PANEL_NARRATIVE
            : UNPREPARED_IDENTITY_NARRATIVE,
        );
        return;
      }
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
    // An engine-decided turn (advancement / apotheosis) carries its own action
    // text so the turn record reads as what the player did, keeping the next AI
    // prompt aware of it.
    const isEngineTurn = session.pendingPlayerAction != null;
    const playerAction =
      session.pendingPlayerAction ?? selectedChoice?.text ?? "Continue";

    const resolution = session.lastResolution;
    if (resolution) {
      const result = applyResolution(
        session.gameState,
        session.memory,
        resolution,
        session.turnCount,
        playerAction,
        resolveActingMethodState(session.actingMethodState),
      );
      const { gameState, memory } = result;
      // Acting-method discovery (issue #95): the moment the player earns the
      // secret, announce it; the meter and clearer feedback unlock thereafter.
      if (result.discovery.discoveredThisTurn) {
        setMethodNotice(
          result.discovery.trigger === "taught"
            ? "You understand now — it is by living the role that the power becomes truly yours. They call it the Acting Method."
            : result.discovery.trigger === "completion"
              ? "As the last of it settles into you, the truth comes plain: living the role was what made it yours all along. The Acting Method."
              : "A pattern resolves in your mind: it is staying true to your role, turn upon turn, that has been settling the power within you. The Acting Method.",
        );
      }
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

      // Recognition gap (character-info storage): while showing the TRUE face,
      // a present NPC who knew the prior self may deduce this is the same person
      // (the inverse of identity exposure — it re-links rather than penalises).
      let profileState = session.profileState;
      if (
        profileState?.recognition &&
        (identityState?.activeIdentityId ?? null) === null
      ) {
        const result = pierceRecognition(profileState, gameState.npcsPresent);
        profileState = result.state;
        if (result.pierced.length > 0) {
          setFreeTextNotice(
            `${result.pierced.join(", ")} ${result.pierced.length === 1 ? "studies" : "study"} your changed face — and the recognition lands. They know who you were.`,
          );
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
      // detections from the state delta, recorded before the phase advances. An
      // engine turn already wrote its own explicit entry (and its before/after
      // state are identical, so derivation would find nothing) — skip it.
      if (!isEngineTurn) {
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
      }
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
        actingMethodState: result.actingMethodState,
        ...(identityState ? { identityState } : {}),
        ...(profileState ? { profileState } : {}),
      };
      // A turn of play closes the distance on every active hunt (and keeps the
      // AI-visible quest labels in sync).
      const tracked = advanceActiveHunts(updated);
      const next = transition(tracked, { type: "APPLY_CONSEQUENCES" });
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
  // Acting-method discovery (issue #95): the digestion meter/number stays hidden
  // until the method is discovered, even with the toggle on.
  const knowsMethod = resolveActingMethodState(session.actingMethodState).knowsMethod;
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
            {knowsMethod && preferences.digestionMeterVisible && (
              <DigestionMeter digestion={session.gameState.digestion} />
            )}
            {preferences.sanityMeterVisible && (
              <SanityMeter
                sanity={session.gameState.sanity}
                maxSanity={session.gameState.maxSanity}
              />
            )}
          </div>
        </div>

        {/* Acting-method discovered (issue #95) — the secret is earned. */}
        {methodNotice && (
          <div
            role="status"
            className="mb-6 rounded-md border border-occult/40 bg-occult/[0.06] p-5 animate-fade-in"
          >
            <p className="gaslit font-serif text-sm font-semibold text-occult-bright">
              The Acting Method
            </p>
            <p className="mt-2 font-serif text-sm italic leading-relaxed text-foreground/85">
              {methodNotice}
            </p>
            <button
              type="button"
              onClick={() => setMethodNotice(null)}
              className="mt-3 min-h-[24px] rounded px-2 py-1 text-xs font-medium text-occult-bright hover:underline"
            >
              I see
            </button>
          </div>
        )}

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

        {/* Advancement and apotheosis now flow through the normal turn loop
            (rendered inline in the consequences phase + recorded to memory), so
            there is no separate success banner to surface here. */}

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
                <QuestLogPanel
                  session={session}
                  busy={facingFate}
                  onEngageHunt={handleEngageHunt}
                  onAbandonHunt={handleAbandonHunt}
                />
                <IdentityActionPanel session={session} onUpdate={updateSession} />
                <CombatLauncher onStart={startCombat} />
                {session.gameState.digestion?.complete === true &&
                  isAdvanceableSequence(session.gameState.sequenceLevel) && (
                    <>
                      <PotionPreparationPanel
                        session={session}
                        busy={advancing || facingFate}
                        notice={prepNotice}
                        onPurchase={handlePurchaseItem}
                        onHunt={handleHuntItem}
                      />
                      <AdvancementPanel
                        session={session}
                        busy={advancing || facingFate}
                        onAttempt={() => void handleAdvancement()}
                      />
                    </>
                  )}
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
              <>
                {selfChangeHandledTurn !== session.turnCount && (
                  <SelfChangeConfirm
                    session={session}
                    onConfirm={handleConfirmSelfChange}
                    onDismiss={() => setSelfChangeHandledTurn(session.turnCount)}
                  />
                )}
                <ConsequencesPhase
                  session={session}
                  onContinue={handleContinue}
                  config={providerConfig}
                  sceneArtEnabled={preferences.sceneArtEnabled}
                  knowsMethod={knowsMethod}
                  digestionMeterVisible={preferences.digestionMeterVisible}
                  sanityMeterVisible={preferences.sanityMeterVisible}
                />
              </>
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

const SELF_CHANGE_LABELS: Record<string, string> = {
  name: "name",
  appearance: "appearance",
  gender: "gender",
  pronouns: "pronouns",
  epithet: "title",
  age: "age",
  marks: "distinguishing marks",
};

function SelfChangeConfirm({
  session,
  onConfirm,
  onDismiss,
}: {
  session: GameSession;
  onConfirm: (createGap: boolean) => void;
  onDismiss: () => void;
}) {
  const proposal = validateSelfChangeProposal(
    session.lastResolution?.response.proposedSelfChange,
  );
  const profileState = resolveProfileState(session.profileState);
  const flawlessCapable =
    identityCapability(session.gameState.pathwayId, session.gameState.sequenceLevel) ===
    "flawless";
  const change = proposal ? proposalToChange(proposal) : null;
  const suggestedGap = change
    ? isDrasticChange(
        profileState.profile,
        { ...profileState.profile, ...(change.edits ?? {}) },
        { flawlessCapable },
      )
    : false;
  const [gap, setGap] = useState(suggestedGap);

  if (!proposal) return null;

  return (
    <section
      role="status"
      aria-labelledby="self-change-confirm"
      className="mb-6 rounded-lg border border-occult/40 bg-occult/[0.06] p-5"
    >
      <h3
        id="self-change-confirm"
        className="font-serif text-base font-semibold text-occult-bright"
      >
        A change in who you are
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-foreground/85">
        You declared a new {SELF_CHANGE_LABELS[proposal.field] ?? proposal.field}:{" "}
        <span className="font-medium text-foreground">{proposal.value}</span>. Make it
        truly so?
      </p>
      <div className="mt-3 flex items-start gap-2">
        <input
          id="self-change-gap"
          type="checkbox"
          checked={gap}
          onChange={(e) => setGap(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <label htmlFor="self-change-gap" className="text-xs leading-relaxed text-muted">
          People who knew me won&rsquo;t recognise this face.
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onConfirm(gap)}
          className="rounded-md bg-amber/90 px-4 py-2 text-sm font-medium text-background hover:bg-amber"
        >
          Yes — this is who I am now
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          Not yet
        </button>
      </div>
    </section>
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

// Assume a prepared persona from the play surface (issue #22). Switching faces
// is a deliberate engine action (`switchIdentity`) — the same one the character
// sheet uses — so the narrator picks up the worn persona via
// `identityPromptContext` on the next turn. When nothing has been prepared, the
// panel says so in-world and points back to the character sheet to craft one,
// rather than leaving the player to discover the empty list themselves.
function IdentityActionPanel({
  session,
  onUpdate,
}: {
  session: GameSession;
  onUpdate: (next: GameSession) => void;
}) {
  const identityState = session.identityState ?? createIdentityState();
  const active = activeIdentity(identityState);

  // Event-handler only (never during render) — useCallback marks it as such for
  // the purity lint, matching the character sheet's identity switcher.
  const wear = useCallback(
    (id: string | null) => {
      onUpdate({
        ...session,
        identityState: switchIdentity(session.identityState ?? createIdentityState(), id),
        updatedAt: Date.now(),
      });
    },
    [session, onUpdate],
  );

  if (!hasPreparedIdentity(identityState)) {
    return (
      <section
        aria-labelledby="assume-identity-heading"
        className="mt-8 rounded-lg border border-border/50 bg-surface/30 p-5"
      >
        <h2
          id="assume-identity-heading"
          className="font-serif text-base font-semibold text-foreground"
        >
          Another Face
        </h2>
        <p role="status" className="mt-2 text-sm leading-relaxed text-foreground/85">
          {UNPREPARED_IDENTITY_NARRATIVE}
        </p>
        <Link
          href="/character"
          className="mt-3 inline-flex min-h-[24px] items-center rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-2 text-sm font-medium text-amber transition-colors hover:border-amber/50"
        >
          Go to your character sheet
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="assume-identity-heading"
      className="mt-8 rounded-lg border border-border/50 bg-surface/30 p-5"
    >
      <h2
        id="assume-identity-heading"
        className="font-serif text-base font-semibold text-foreground"
      >
        Another Face
      </h2>
      <p className="mt-1 text-sm text-foreground/85">
        {active ? (
          <>
            Currently wearing{" "}
            <span className="font-medium text-amber">{active.name}</span>.
          </>
        ) : (
          "You wear your own face. Slip into one you have prepared:"
        )}
      </p>
      <ul className="mt-3 space-y-2">
        {identityState.identities.map((identity) => {
          const isActive = identity.id === identityState.activeIdentityId;
          return (
            <li
              key={identity.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-surface/40 px-3 py-2"
            >
              <span className="text-sm text-foreground">{identity.name}</span>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => wear(isActive ? null : identity.id)}
                className="min-h-[24px] rounded-md border border-amber/30 bg-amber/[0.06] px-3 py-1.5 text-xs font-medium text-amber transition-colors hover:border-amber/50"
              >
                {isActive ? "Return to your own face" : "Slip into this face"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
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

// The quest log: every quest the player is tracking in one place — the
// AI-narrated story quests (`activeQuests`) and the structured hunt quests with
// their tracking progress. Renders nothing when there is nothing to track.
function QuestLogPanel({
  session,
  busy,
  onEngageHunt,
  onAbandonHunt,
}: {
  session: GameSession;
  busy: boolean;
  onEngageHunt: (itemName: string) => void;
  onAbandonHunt: (itemName: string) => void;
}) {
  const hunts = session.hunts ?? [];
  const huntLabels = new Set(hunts.map(huntQuestLabel));
  // Story quests are shown plainly; hunts get their own progress rows, so their
  // labels are filtered out of the general list to avoid a duplicate entry.
  const generalQuests = session.gameState.activeQuests.filter(
    (quest) => !huntLabels.has(quest),
  );

  if (hunts.length === 0 && generalQuests.length === 0) return null;

  return (
    <section
      aria-labelledby="quest-log-heading"
      className="mt-8 rounded-lg border border-border/50 bg-surface/30 p-5"
    >
      <h2
        id="quest-log-heading"
        className="font-serif text-base font-semibold text-foreground"
      >
        Quest Log
      </h2>

      {generalQuests.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {generalQuests.map((quest) => (
            <li key={quest} className="flex items-start gap-2 text-sm text-foreground/85">
              <span aria-hidden="true" className="text-amber">
                ◆
              </span>
              <span>{quest}</span>
            </li>
          ))}
        </ul>
      )}

      {hunts.length > 0 && (
        <ul className="mt-4 space-y-3">
          {hunts.map((hunt) => (
            <HuntQuestRow
              key={hunt.targetItemName}
              hunt={hunt}
              busy={busy}
              onEngage={onEngageHunt}
              onAbandon={onAbandonHunt}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// One hunt in the quest log: the quarry, a tracking-progress bar, and — once the
// creature is cornered — the button to engage it through the unified combat
// system. An abandon action drops the hunt entirely.
function HuntQuestRow({
  hunt,
  busy,
  onEngage,
  onAbandon,
}: {
  hunt: HuntState;
  busy: boolean;
  onEngage: (itemName: string) => void;
  onAbandon: (itemName: string) => void;
}) {
  const ready = isHuntReady(hunt);
  const done = hunt.totalTurns - hunt.turnsRemaining;
  const pct = hunt.totalTurns > 0 ? Math.round((done / hunt.totalTurns) * 100) : 100;

  return (
    <li className="rounded-md border border-crimson/30 bg-crimson/[0.04] p-3">
      <p className="text-sm font-medium text-foreground">Hunt: {hunt.targetItemName}</p>
      <div
        role="progressbar"
        aria-label={`Hunt progress for ${hunt.targetItemName}`}
        aria-valuemin={0}
        aria-valuemax={hunt.totalTurns}
        aria-valuenow={done}
        aria-valuetext={
          ready
            ? "The quarry is cornered"
            : `Tracking — ${done} of ${hunt.totalTurns} turns`
        }
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          aria-hidden="true"
          className="h-full bg-crimson"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {ready
          ? "You have cornered the quarry — engage it when you are ready."
          : `Closing in… ${hunt.turnsRemaining} turn${
              hunt.turnsRemaining === 1 ? "" : "s"
            } of tracking remain.`}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {ready && (
          <button
            type="button"
            onClick={() => onEngage(hunt.targetItemName)}
            disabled={busy}
            className="min-h-[24px] rounded-md border border-crimson/40 bg-crimson/[0.08] px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-crimson/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Engage the quarry
          </button>
        )}
        <button
          type="button"
          onClick={() => onAbandon(hunt.targetItemName)}
          disabled={busy}
          className="min-h-[24px] rounded px-2 py-1 text-xs text-muted hover:text-foreground/80"
        >
          Abandon the hunt
        </button>
      </div>
    </li>
  );
}

// The engine's requirement checklist, shared by the ritual-attempt panels.
function RitualRequirementList({
  requirements,
}: {
  requirements: readonly { id: string; label: string; met: boolean }[];
}) {
  return (
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
  );
}

// The shared arm-then-confirm ritual panel used by both advancement (Seq 9 → 2)
// and apotheosis (Seq 1 → 0). The checklist is the engine's own requirement
// verdicts; the two-step confirm makes an irreversible attempt deliberate. The
// confirm disarms on click, so a panel that survives a resolution (e.g. a
// survivable setback) returns to the un-armed state rather than re-firing.
function RitualAttemptPanel({
  headingId,
  heading,
  intro,
  requirements,
  ready,
  busy,
  armLabel,
  confirmLabel,
  confirmBusyLabel,
  cancelLabel,
  oddsText,
  onAttempt,
  children,
}: {
  headingId: string;
  heading: string;
  intro: string;
  requirements: readonly { id: string; label: string; met: boolean }[];
  ready: boolean;
  busy: boolean;
  armLabel: string;
  confirmLabel: string;
  confirmBusyLabel: string;
  cancelLabel: string;
  oddsText: string;
  onAttempt: () => void;
  children?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);

  return (
    <section
      aria-labelledby={headingId}
      className="mt-8 rounded-lg border border-occult/30 bg-occult/[0.04] p-5"
    >
      <h2
        id={headingId}
        className="gaslit font-serif text-base font-semibold text-occult-bright"
      >
        {heading}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{intro}</p>
      <RitualRequirementList requirements={requirements} />
      {ready && children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!armed ? (
          <button
            type="button"
            onClick={() => setArmed(true)}
            disabled={!ready || busy}
            className="min-h-[24px] rounded-md border border-occult/40 bg-occult/[0.08] px-4 py-2 text-sm font-medium text-occult-bright transition-colors hover:border-occult/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {armLabel}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                onAttempt();
                setArmed(false);
              }}
              disabled={busy}
              className="min-h-[24px] rounded-md border border-crimson/40 bg-crimson/[0.08] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-crimson/60 disabled:opacity-40"
            >
              {busy ? confirmBusyLabel : confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => setArmed(false)}
              disabled={busy}
              className="min-h-[24px] rounded px-2 py-1 text-xs text-muted hover:text-foreground/80"
            >
              {cancelLabel}
            </button>
          </>
        )}
        {ready && <span className="text-xs text-muted">{oddsText}</span>}
      </div>
    </section>
  );
}

// Potion preparation (issue #84): once the current potion is digested, the next
// Sequence's potion must be assembled before the engine will let the Beyonder
// climb. Each prerequisite is bought with funds or — for a Beyonder
// Characteristic — hunted via a combat encounter; deeper rungs cost more and the
// Characteristic becomes hunt-only. Hides itself once everything is in hand.
function PotionPreparationPanel({
  session,
  busy,
  notice,
  onPurchase,
  onHunt,
}: {
  session: GameSession;
  busy: boolean;
  notice: string | null;
  onPurchase: (itemName: string) => void;
  onHunt: (itemName: string) => void;
}) {
  const plan = potionPreparationPlan(session);
  const funds = getFunds(session.gameState);
  // Everything is in hand — the AdvancementPanel takes over.
  if (plan.allOwned) return null;

  return (
    <section
      aria-labelledby="potion-prep-heading"
      className="mt-8 rounded-lg border border-amber/30 bg-amber/[0.04] p-5"
    >
      <h2
        id="potion-prep-heading"
        className="gaslit font-serif text-base font-semibold text-amber"
      >
        Prepare the Sequence {plan.targetSeq} potion
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Your potion is digested. Gather the formula and ingredients for the next Sequence
        before you can attempt the climb. Your purse holds {funds} pence.
      </p>
      <ul className="mt-3 space-y-2">
        {plan.items.map((status: PotionItemStatus) => (
          <li
            key={status.item.name}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={status.owned ? "text-occult-bright" : "text-muted"}
              >
                {status.owned ? "✦" : "◇"}
              </span>
              <span
                className={status.owned ? "text-foreground/85" : "text-foreground/80"}
              >
                {status.item.name}
                <span className="sr-only">
                  {status.owned ? " — in hand" : " — still needed"}
                </span>
              </span>
            </span>
            {!status.owned && (
              <span className="flex flex-wrap items-center gap-2">
                {status.methods.includes("purchase") && (
                  <button
                    type="button"
                    onClick={() => onPurchase(status.item.name)}
                    disabled={busy || funds < status.cost}
                    className="min-h-[24px] rounded-md border border-amber/40 bg-amber/[0.08] px-3 py-1 text-xs font-medium text-amber transition-colors hover:border-amber/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Buy ({status.cost} pence)
                  </button>
                )}
                {status.methods.includes("hunt") &&
                  (findHunt(session, status.item.name) ? (
                    <span className="text-xs text-muted">
                      Hunt underway — see the Quest Log
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onHunt(status.item.name)}
                      disabled={busy}
                      className="min-h-[24px] rounded-md border border-crimson/40 bg-crimson/[0.08] px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-crimson/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Begin the hunt
                    </button>
                  ))}
              </span>
            )}
          </li>
        ))}
      </ul>
      {notice && (
        <p role="status" className="mt-3 text-xs text-amber">
          {notice}
        </p>
      )}
    </section>
  );
}

// Sequence advancement (Seq 9 → 2): shown once the current potion is fully
// digested. A loss of control is always possible — and catastrophic at the
// higher rungs — so the attempt is deliberate.
function AdvancementPanel({
  session,
  busy,
  onAttempt,
}: {
  session: GameSession;
  busy: boolean;
  onAttempt: () => void;
}) {
  const requirements = advancementRequirements(session);
  const ready = meetsRequirements(requirements);
  const chance = Math.round(advancementSuccessChance(session) * 100);
  const target = targetSequence(session.gameState.sequenceLevel);
  const roleName =
    getSequence(session.gameState.pathwayId, target)?.name ?? `Sequence ${target}`;

  return (
    <RitualAttemptPanel
      headingId="advancement-heading"
      heading={`The next rung: Sequence ${target}, ${roleName}`}
      intro="The potion is digested and the role is yours. Drink the next Sequence's potion to climb — but a Beyonder who forgets they are only acting can lose themselves in the ascent."
      requirements={requirements}
      ready={ready}
      busy={busy}
      armLabel="Prepare to advance"
      confirmLabel="Drink and undergo the advancement"
      confirmBusyLabel="The potion takes hold…"
      cancelLabel="Not yet"
      oddsText={`You judge your odds of holding control near ${chance}%.`}
      onAttempt={onAttempt}
    />
  );
}

// Apotheosis (issue #30): shown to a Sequence 1 King of Angels. Failure at this
// height is permadeath, so the staged ceremony is previewed once ready.
function ApotheosisPanel({
  session,
  busy,
  onAttempt,
}: {
  session: GameSession;
  busy: boolean;
  onAttempt: () => void;
}) {
  const requirements = apotheosisRequirements(session);
  const ready = canAttemptApotheosis(session);
  const chance = Math.round(apotheosisSuccessChance(session) * 100);
  const honorific = trueGodName(session.gameState.pathwayId);

  return (
    <RitualAttemptPanel
      headingId="apotheosis-heading"
      heading={`The throne of ${honorific} stands empty`}
      intro="One rung remains. Sequence 0 is not climbed — it is seized, once, by the one the pathway accepts."
      requirements={requirements}
      ready={ready}
      busy={busy}
      armLabel="Begin the apotheosis ritual"
      confirmLabel="Seize the throne — irrevocably"
      confirmBusyLabel="The world holds its breath…"
      cancelLabel="Step back"
      oddsText={`The augurs put your odds near ${chance}%. Failure is not survivable.`}
      onAttempt={onAttempt}
    >
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground/75">
        {APOTHEOSIS_STAGES.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>
    </RitualAttemptPanel>
  );
}

function ConsequencesPhase({
  session,
  onContinue,
  config,
  sceneArtEnabled,
  knowsMethod,
  digestionMeterVisible,
  sanityMeterVisible,
}: {
  session: GameSession;
  onContinue: () => void;
  config: ProviderConfig | null;
  sceneArtEnabled: boolean;
  knowsMethod: boolean;
  digestionMeterVisible: boolean;
  sanityMeterVisible: boolean;
}) {
  const resolution = session.lastResolution;
  if (!resolution) return null;

  const response = resolution.response;
  // The numeric digestion/alignment readout is doubly gated (issue #95): the
  // player must have discovered the method AND opted the meter on.
  const showDigestionNumbers = knowsMethod && digestionMeterVisible;
  // Scene art (issue #20): the AI's journal flag marks the key moments.
  const artFlag = validateJournalFlag(response.journalEntry);
  const illustrate = artFlag !== null && shouldGenerateSceneArt(artFlag.eventType);
  const hasStateChanges =
    response.worldStateChanges && response.worldStateChanges.length > 0;
  // Only mundane loot actually enters inventory; advancement-critical reagents
  // the AI tried to grant become story leads (issue #90). Render them the same
  // way applyResolution commits them so the panel never shows a phantom reagent.
  const { carried: discoveredItems, blocked: discoveredLeads } = partitionDiscoveredItems(
    response.itemsDiscovered ?? [],
  );
  const hasItems = discoveredItems.length > 0;
  const hasLeads = discoveredLeads.length > 0;
  // Hybrid sanity (issue #95): the SAME pure helper applyResolution commits on
  // Continue, so the previewed number can never drift from the applied one.
  const sanityTotal = previewSanityImpact(
    response.sanityEventTags,
    response.sanityImpact,
    session.gameState.sequenceLevel,
  ).total;
  const hasSanityImpact = sanityTotal !== 0;
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
      {(hasSanityImpact || hasStateChanges || hasItems || hasLeads || hasActingEval) && (
        <div className="mb-6 space-y-3 rounded-md border border-border/30 bg-background/50 p-4">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
            Consequences
          </p>

          {hasSanityImpact && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Sanity</span>
              {sanityMeterVisible ? (
                <span
                  className={
                    sanityTotal > 0
                      ? "font-medium text-sanity-high"
                      : "font-medium text-sanity-low"
                  }
                >
                  {sanityTotal > 0 ? "+" : ""}
                  {sanityTotal}
                </span>
              ) : (
                <span className="font-serif italic text-foreground/70">
                  {sanityTotal > 0
                    ? "your mind steadies a little"
                    : "your mind frays a little"}
                </span>
              )}
            </div>
          )}

          {hasActingEval && (
            <div className="text-sm">
              {/* The mechanic — alignment %, digestion delta, the AI's scoring
                  reasoning — only surfaces once the method is discovered AND the
                  meter is opted on. Pre-discovery only the vague prose shows. */}
              {showDigestionNumbers && (
                <>
                  <span className="text-muted">Acting: </span>
                  <span className="text-gaslight">
                    {Math.round(response.actingEvaluation!.alignment * 100)}% alignment
                  </span>
                  {digestionPreview && digestionPreview.delta !== 0 && (
                    <span
                      className={`ml-2 font-medium ${
                        digestionPreview.delta > 0
                          ? "text-occult-bright"
                          : "text-sanity-low"
                      }`}
                    >
                      {digestionPreview.delta > 0 ? "+" : ""}
                      {digestionPreview.delta}% digestion
                    </span>
                  )}
                </>
              )}
              {knowsMethod && response.actingEvaluation!.reasoning && (
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
                    knowsMethod,
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
            discoveredItems.map((item, i) => (
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

          {hasLeads &&
            discoveredLeads.map((item, i) => (
              <div key={`lead-${i}`} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-occult-bright" aria-hidden="true">
                  {"✧"}
                </span>
                <div>
                  <span className="text-foreground/80">
                    {discoveredItemLeadFact(item, 0).description}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Digestion complete — advancement available. Gated on discovery so the
          mechanic is never named to a player who hasn't earned the secret
          (issue #95); completing digestion in practice implies discovery. */}
      {knowsMethod &&
        (digestionState?.complete ?? session.gameState.digestion?.complete) && (
          <div className="mb-6 rounded-md border border-occult/40 bg-occult/[0.06] p-4 text-center">
            <p className="font-serif text-sm text-occult-bright">
              <span aria-hidden="true">✦ </span>The potion is fully digested. Continue,
              and you may undergo the advancement to the next Sequence when you are ready.
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
