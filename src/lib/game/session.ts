import type { GameState, MemoryState } from "@/lib/ai";
import {
  createMemoryState,
  getEmbeddingModel,
  APPROVED_EMBEDDING_MODELS,
  DEFAULT_EMBEDDING_MODEL_ID,
} from "@/lib/ai";
import { isValidActingMethodStateShape } from "./acting-method";
import { isValidAnchorStateShape } from "./anchors";
import { createDigestionState } from "./digestion";
import { isValidHuntsShape } from "./hunt";
import { isValidIdentityStateShape } from "./identity";
import { isValidProfileStateShape } from "./profile";
import { isValidSocietyShape, migrateSocietyState, type SocietyState } from "./society";
import { DEFAULT_EPOCH_ID, getEpoch } from "@/lib/lore/epochs";
import type { StartScenario } from "@/lib/lore/start-scenarios";
import type { GameSession, GameSessionSummary, GamePhase } from "./types";

const VALID_PHASES: GamePhase[] = [
  "idle",
  "situation",
  "choices",
  "resolution",
  "consequences",
  "error",
];

/** Where a fresh save starts on the shared canon timeline (chapter 1). */
export const DEFAULT_CANON_POSITION = 1;

export interface CreateSessionOptions {
  /** Approved embedding model to lock for this save (character creation). */
  embeddingModelId?: string;
  /** Starting canon-timeline position (e.g. a later-epoch start). */
  canonPosition?: number;
}

export function createSession(
  gameState: GameState,
  id: string = crypto.randomUUID(),
  now: number = Date.now(),
  initialMemory?: MemoryState,
  options: CreateSessionOptions = {},
): GameSession {
  // Validates against the approved list — locking an unknown model would
  // orphan the save from every pre-embedded map.
  const embeddingModelId = getEmbeddingModel(
    options.embeddingModelId ?? DEFAULT_EMBEDDING_MODEL_ID,
  ).id;
  return {
    id,
    gameState,
    memory: initialMemory ?? createMemoryState(),
    turnCount: 0,
    canonPosition: options.canonPosition ?? DEFAULT_CANON_POSITION,
    embeddingModelId,
    phase: "idle",
    currentNarrative: null,
    currentChoices: null,
    selectedChoiceId: null,
    lastResolution: null,
    activePillar: null,
    errorMessage: null,
    errorCode: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultGameState(
  pathwayId: number,
  characterId: string = crypto.randomUUID(),
  characterName?: string,
  characterBackground?: string,
  epoch?: number,
  prologueRecap?: string,
  startScenario?: StartScenario,
): GameState {
  return {
    characterId,
    pathwayId,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    // Varied story openings: a chosen start scenario sets the (randomly varied)
    // starting location; absent (manual fallback / legacy callers) it falls back
    // to the epoch's default starting location.
    location: startScenario?.location ?? getEpoch(epoch).startingLocation,
    ...(epoch !== undefined && epoch !== DEFAULT_EPOCH_ID ? { epoch } : {}),
    activeQuests: [],
    npcsPresent: [],
    digestion: createDigestionState(pathwayId, 9),
    ...(characterName ? { characterName } : {}),
    ...(characterBackground ? { characterBackground } : {}),
    // Durable prologue recap (the prologue → story bridge) — kept in the
    // never-trimmed game-state layer so the narrator never loses the thread.
    ...(prologueRecap ? { prologueRecap } : {}),
    // The first-turn opening beat for the chosen start scenario, so the opening
    // scene matches the varied starting location (consumed only at turn 0).
    ...(startScenario ? { openingBeat: startScenario.openingBeat } : {}),
  };
}

export function sessionToSummary(session: GameSession): GameSessionSummary {
  return {
    id: session.id,
    turnCount: session.turnCount,
    phase: session.phase,
    location: session.gameState.location,
    pathwayId: session.gameState.pathwayId,
    sequenceLevel: session.gameState.sequenceLevel,
    updatedAt: session.updatedAt,
  };
}

export function serializeSession(session: GameSession): string {
  return JSON.stringify(session);
}

export function deserializeSession(json: string): GameSession | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isValidSessionShape(parsed)) {
    return null;
  }

  const s = parsed as Record<string, unknown>;
  const gs = s.gameState as Record<string, unknown>;
  const gameState = {
    ...gs,
    // Seed digestion for sessions saved before the Acting Method mechanic.
    digestion:
      gs.digestion ??
      createDigestionState(gs.pathwayId as number, gs.sequenceLevel as number),
  };
  return {
    ...s,
    gameState,
    errorCode: s.errorCode ?? null,
    // Seed the RAG fields for sessions saved before issue #63: the timeline
    // starts at canon position 1 and the lock falls back to the default model.
    canonPosition: (s.canonPosition as number | undefined) ?? DEFAULT_CANON_POSITION,
    embeddingModelId:
      (s.embeddingModelId as string | undefined) ?? DEFAULT_EMBEDDING_MODEL_ID,
    // Convert legacy society members (which stored arc/hint prose) to the
    // id-based shape so member descriptions are re-derived from current copy.
    ...(s.societyState !== undefined
      ? { societyState: migrateSocietyState(s.societyState as SocietyState) }
      : {}),
  } as GameSession;
}

/**
 * Advance the player's shared-timeline position (issue #63). Monotonic: the
 * timeline gate's guarantee depends on the position never moving backward, so
 * regressions are ignored rather than applied.
 */
export function advanceCanonPosition(
  session: GameSession,
  position: number,
  now: number = Date.now(),
): GameSession {
  if (!Number.isFinite(position) || position <= session.canonPosition) {
    return session;
  }
  return { ...session, canonPosition: position, updatedAt: now };
}

export function isValidDigestionShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const d = obj as Record<string, unknown>;
  if (!Number.isFinite(d.pathwayId)) return false;
  if (!Number.isFinite(d.sequenceLevel)) return false;
  if (!Number.isFinite(d.progress)) return false;
  if ((d.progress as number) < 0 || (d.progress as number) > 100) return false;
  if (typeof d.complete !== "boolean") return false;
  return true;
}

const INJURY_SEVERITIES = ["minor", "major", "grievous"];

export function isValidInjuriesShape(obj: unknown): boolean {
  if (!Array.isArray(obj)) return false;
  return obj.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    const injury = entry as Record<string, unknown>;
    if (typeof injury.id !== "string" || injury.id.length === 0) return false;
    if (typeof injury.description !== "string") return false;
    if (!INJURY_SEVERITIES.includes(injury.severity as string)) return false;
    if (!Number.isFinite(injury.recoveryTurns)) return false;
    return true;
  });
}

export function isValidSessionShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }

  const s = obj as Record<string, unknown>;

  if (typeof s.id !== "string" || s.id.length === 0) return false;
  if (!Number.isFinite(s.turnCount) || (s.turnCount as number) < 0) return false;
  if (typeof s.phase !== "string" || !VALID_PHASES.includes(s.phase as GamePhase))
    return false;
  if (!Number.isFinite(s.createdAt)) return false;
  if (!Number.isFinite(s.updatedAt)) return false;

  if (typeof s.gameState !== "object" || s.gameState === null) return false;
  const gs = s.gameState as Record<string, unknown>;
  if (typeof gs.characterId !== "string") return false;
  if (!Number.isFinite(gs.pathwayId)) return false;
  if (!Number.isFinite(gs.sequenceLevel)) return false;
  if (!Number.isFinite(gs.sanity)) return false;
  if (!Number.isFinite(gs.maxSanity) || (gs.maxSanity as number) <= 0) return false;
  if (typeof gs.location !== "string") return false;
  if (!Array.isArray(gs.inventory)) return false;
  if (!Array.isArray(gs.activeQuests)) return false;
  if (!Array.isArray(gs.npcsPresent)) return false;
  // Digestion is optional (older sessions predate it) but must be well-shaped
  // when present; it is seeded with a default on deserialize if missing.
  if (gs.digestion !== undefined && !isValidDigestionShape(gs.digestion)) return false;
  // Injuries are optional (older sessions predate combat) but must be
  // well-shaped when present; absent simply means no active injuries.
  if (gs.injuries !== undefined && !isValidInjuriesShape(gs.injuries)) return false;

  // RAG fields (issue #63) are optional (older sessions predate them) but
  // must be valid when present: a finite positive position, and a model id on
  // the approved list (an unknown lock would orphan the save from every map).
  if (s.canonPosition !== undefined) {
    if (!Number.isFinite(s.canonPosition) || (s.canonPosition as number) < 0) {
      return false;
    }
  }
  if (s.embeddingModelId !== undefined) {
    if (!APPROVED_EMBEDDING_MODELS.some((m) => m.id === s.embeddingModelId)) {
      return false;
    }
  }

  // Identity state (issue #22) is optional but strict when present.
  if (s.identityState !== undefined && !isValidIdentityStateShape(s.identityState)) {
    return false;
  }

  // Society state (issue #32) is optional but strict when present.
  if (s.societyState !== undefined && !isValidSocietyShape(s.societyState)) {
    return false;
  }

  // Anchor state (issues #35, #25) is optional but strict when present.
  if (s.anchorState !== undefined && !isValidAnchorStateShape(s.anchorState)) {
    return false;
  }

  // True-self profile (character-info storage) is optional but strict when
  // present — lazily seeded for legacy saves, exactly like identityState.
  if (s.profileState !== undefined && !isValidProfileStateShape(s.profileState)) {
    return false;
  }

  // Acting-method discovery (issue #95) is optional but strict when present —
  // lazily resolved for legacy saves; preserved on the deserialize `...s` spread.
  if (
    s.actingMethodState !== undefined &&
    !isValidActingMethodStateShape(s.actingMethodState)
  ) {
    return false;
  }

  // Hunt quests are optional but strict when present — they ride the deserialize
  // `...s` spread (no seeding); absent simply means no active hunts.
  if (s.hunts !== undefined && !isValidHuntsShape(s.hunts)) {
    return false;
  }

  // The transient engine-turn action text is optional but, when present, must be
  // a string or null (a mid-`consequences` engine turn can be persisted with it
  // set; it is consumed as the turn record's player action on the next continue).
  if (
    s.pendingPlayerAction !== undefined &&
    s.pendingPlayerAction !== null &&
    typeof s.pendingPlayerAction !== "string"
  ) {
    return false;
  }

  // The permadeath marker (issue #12) is optional but strict when present.
  if (s.ended !== undefined) {
    if (typeof s.ended !== "object" || s.ended === null) return false;
    const ended = s.ended as Record<string, unknown>;
    if (ended.fate !== "transformed" && ended.fate !== "dead") return false;
    if (typeof ended.scene !== "string") return false;
    if (!Number.isFinite(ended.at)) return false;
  }

  if (typeof s.memory !== "object" || s.memory === null) return false;
  const mem = s.memory as Record<string, unknown>;
  if (!Array.isArray(mem.immediateTurns)) return false;
  if (!Array.isArray(mem.recentSummaries)) return false;
  if (!Array.isArray(mem.sessionFacts)) return false;
  // The durable running summary is optional (older saves predate it) but must
  // be a string when present.
  if (mem.runningSummary !== undefined && typeof mem.runningSummary !== "string") {
    return false;
  }

  return true;
}
