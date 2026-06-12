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
  RetrievedLoreChunk,
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
  buildSanityDirective,
  buildDemigodDirective,
  DEMIGOD_SEQUENCE_THRESHOLD,
  buildGameStatePrompt,
  buildHistoryPrompt,
  buildInstructionPrompt,
  isWithinTokenBudget,
  selectRetrievedForBudget,
  TOKEN_BUDGET,
} from "./prompts";

export {
  SANITY_TIER_THRESHOLDS,
  sanityPercent,
  classifySanityTier,
  sanityNarrationDirective,
  type SanityTier,
} from "./sanity";

export {
  createMemoryState,
  addTurn,
  addSessionFact,
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
  createEmbeddingProvider,
  getEmbeddingModel,
  APPROVED_EMBEDDING_MODELS,
  DEFAULT_EMBEDDING_MODEL_ID,
  EMBEDDING_DIMS,
  type EmbeddingProvider,
  type EmbeddingProviderId,
  type EmbeddingModel,
  type CreateEmbeddingProviderOptions,
} from "./embeddings";

export {
  buildSceneArtPrompt,
  generateSceneArt,
  sceneArtKey,
  sceneArtSupported,
  shouldGenerateSceneArt,
  SCENE_ART_STYLE,
  type SceneArtContext,
} from "./scene-art";

export {
  addUsage,
  DEFAULT_TOKEN_RATES,
  deserializeUsage,
  emptyUsage,
  estimateSessionCost,
  formatTokenCount,
  formatUsage,
  serializeUsage,
  type SessionUsage,
  type TokenRates,
  type TurnUsage,
} from "./usage";

export {
  generatePrologueScene,
  generatePrologueFinale,
  MIN_PROLOGUE_SCENES,
  MAX_PROLOGUE_SCENES,
  PROLOGUE_AFFINITY_COUNT,
  type PrologueTurn,
  type AIPrologueChoice,
  type AIPrologueResponse,
  type AIPrologueFinale,
} from "./prologue-client";
