import type {
  AIErrorCode,
  Choice,
  GameState,
  MemoryState,
  ValidatedAIResponse,
  InstructionType,
} from "@/lib/ai";

export type GamePhase =
  | "idle"
  | "situation"
  | "choices"
  | "resolution"
  | "consequences"
  | "error";

export type GameplayPillar = "investigation" | "social" | "divination" | "combat";

export interface GameSession {
  id: string;
  gameState: GameState;
  memory: MemoryState;
  turnCount: number;
  /**
   * The player's current position on the shared canon timeline (issue #63).
   * The retrieval timeline gate filters `canon_order <= canonPosition`, so the
   * narrator sees past + present world-state but never the player's future.
   * Monotonic — it only ever advances (see `advanceCanonPosition`).
   */
  canonPosition: number;
  /**
   * The embedding model locked for this save at character creation (issue
   * #63). A save's query vectors and recorded retrieval ids only make sense
   * inside one model's map, so there is NO mid-save switching — a new
   * character may repick.
   */
  embeddingModelId: string;
  phase: GamePhase;
  currentNarrative: string | null;
  currentChoices: Choice[] | null;
  selectedChoiceId: string | null;
  lastResolution: ValidatedAIResponse | null;
  activePillar: GameplayPillar | null;
  errorMessage: string | null;
  errorCode: AIErrorCode | "CONFIG_MISSING" | null;
  createdAt: number;
  updatedAt: number;
}

export type GameLoopAction =
  | { type: "START_SITUATION" }
  | { type: "SITUATION_READY"; narrative: string; choices: Choice[] }
  | { type: "SELECT_CHOICE"; choiceId: string }
  | { type: "RESOLUTION_READY"; result: ValidatedAIResponse }
  | { type: "APPLY_CONSEQUENCES" }
  | { type: "ERROR"; message: string; errorCode?: AIErrorCode | "CONFIG_MISSING" }
  | { type: "RETRY" };

export interface GameSessionSummary {
  id: string;
  turnCount: number;
  phase: GamePhase;
  location: string;
  pathwayId: number;
  sequenceLevel: number;
  updatedAt: number;
}

export const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  idle: ["situation", "error"],
  situation: ["choices", "error"],
  choices: ["resolution", "error"],
  resolution: ["consequences", "error"],
  consequences: ["situation", "error"],
  error: ["situation", "idle"],
};

export const PILLAR_INSTRUCTION_MAP: Record<GameplayPillar, InstructionType> = {
  investigation: "narrative",
  social: "narrative",
  divination: "evaluation",
  combat: "combat",
};

export const CHOICE_PILLAR_MAP: Record<Choice["type"], GameplayPillar> = {
  investigation: "investigation",
  dialogue: "social",
  ritual: "divination",
  action: "combat",
};
