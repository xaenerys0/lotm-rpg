export type {
  ProviderId,
  ModelTier,
  CallClassification,
  ProviderConfig,
  ModelOption,
  Choice,
  StateChange,
  ActingEvaluation,
  AIResponse,
  ValidatedAIResponse,
  InstructionType,
  GameState,
  DigestionState,
  TurnRecord,
  BulletSummary,
  SessionFact,
  MemoryState,
  PromptLayer,
  PromptAssembly,
  LoreContext,
  PromptInput,
  ChatMessage,
  ProviderRequest,
  ProviderResponse,
} from "./types";

export { PROVIDER_MODELS } from "./types";

export { AIError, type AIErrorCode } from "./errors";

export { createAdapter, inferModelTier, type LLMProviderAdapter } from "./providers";

export {
  assemblePrompt,
  promptToMessages,
  buildSystemPrompt,
  buildLoreContext,
  buildGameStatePrompt,
  buildHistoryPrompt,
  buildInstructionPrompt,
  isWithinTokenBudget,
  TOKEN_BUDGET,
} from "./prompts";

export {
  createMemoryState,
  addTurn,
  summarizeTurn,
  extractSessionFacts,
  estimateMemoryTokens,
  trimMemoryForBudget,
  formatMemoryForPrompt,
  buildTurnRecord,
} from "./memory";

export { parseAIResponse, validateAIResponse, sanitizeAIResponse } from "./validation";

export {
  generate,
  classifyCall,
  selectModel,
  validateProviderConfig,
  listProviderModels,
  type GenerateOptions,
} from "./client";

export {
  generatePrologueScene,
  MIN_PROLOGUE_SCENES,
  MAX_PROLOGUE_SCENES,
  type PrologueTurn,
  type AIPrologueResponse,
} from "./prologue-client";
