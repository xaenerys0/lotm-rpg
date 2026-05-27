import type {
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
  phase: GamePhase;
  currentNarrative: string | null;
  currentChoices: Choice[] | null;
  selectedChoiceId: string | null;
  lastResolution: ValidatedAIResponse | null;
  activePillar: GameplayPillar | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export type GameLoopAction =
  | { type: "START_SITUATION" }
  | { type: "SITUATION_READY"; narrative: string; choices: Choice[] }
  | { type: "SELECT_CHOICE"; choiceId: string }
  | { type: "RESOLUTION_READY"; result: ValidatedAIResponse }
  | { type: "APPLY_CONSEQUENCES" }
  | { type: "ERROR"; message: string }
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
