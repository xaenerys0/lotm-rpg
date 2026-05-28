import type { GameState, MemoryState } from "@/lib/ai";
import { createMemoryState } from "@/lib/ai";
import type { GameSession, GameSessionSummary, GamePhase } from "./types";

const VALID_PHASES: GamePhase[] = [
  "idle",
  "situation",
  "choices",
  "resolution",
  "consequences",
  "error",
];

export function createSession(
  gameState: GameState,
  id: string = crypto.randomUUID(),
  now: number = Date.now(),
  initialMemory?: MemoryState,
): GameSession {
  return {
    id,
    gameState,
    memory: initialMemory ?? createMemoryState(),
    turnCount: 0,
    phase: "idle",
    currentNarrative: null,
    currentChoices: null,
    selectedChoiceId: null,
    lastResolution: null,
    activePillar: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultGameState(
  pathwayId: number,
  characterId: string = crypto.randomUUID(),
  characterName?: string,
  characterBackground?: string,
): GameState {
  return {
    characterId,
    pathwayId,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    location: "Tingen City",
    activeQuests: [],
    npcsPresent: [],
    ...(characterName ? { characterName } : {}),
    ...(characterBackground ? { characterBackground } : {}),
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

  return parsed as GameSession;
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

  if (typeof s.memory !== "object" || s.memory === null) return false;
  const mem = s.memory as Record<string, unknown>;
  if (!Array.isArray(mem.immediateTurns)) return false;
  if (!Array.isArray(mem.recentSummaries)) return false;
  if (!Array.isArray(mem.sessionFacts)) return false;

  return true;
}
