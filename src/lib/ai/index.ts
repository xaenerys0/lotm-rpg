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
  CustomLocation,
  DigestionState,
  Continent,
  AccessFlag,
  TurnRecord,
  TurnKind,
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

export { PROVIDER_MODELS, ACCESS_FLAGS, isAccessFlag } from "./types";

export { AIError, type AIErrorCode, extractProviderMessage } from "./errors";

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
  capRunningSummary,
  capWithEllipsis,
  RUNNING_SUMMARY_CHAR_CAP,
  CHARS_PER_TOKEN,
} from "./memory";

export { parseAIResponse, validateAIResponse, sanitizeAIResponse } from "./validation";

export {
  generate,
  classifyCall,
  selectModel,
  validateProviderConfig,
  listProviderModels,
  findUnservedModels,
  probeModelAccess,
  type GenerateOptions,
  type ModelAccessResult,
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
  sceneArtKey,
  shouldGenerateSceneArt,
  SCENE_ART_STYLE,
  type SceneArtContext,
} from "./scene-art";

export {
  generateImage,
  imageArtSupported,
  imageProviderRequiresKey,
  imageProviderNeedsBaseUrl,
  imageProviderNeedsModel,
  defaultImageBaseUrl,
  IMAGE_PROVIDER_MODELS,
  type ImageProviderId,
  type ImageProviderConfig,
  type ImageModelOption,
} from "./image-providers";

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
  generateCanonPrologueScene,
  generateCanonPrologueFinale,
  MIN_PROLOGUE_SCENES,
  MAX_PROLOGUE_SCENES,
  PROLOGUE_MIN_CHOICES,
  PROLOGUE_MAX_CHOICES,
  PROLOGUE_MIN_REGIONS_PER_SCENE,
  PROLOGUE_MAX_AFFINITIES_PER_CHOICE,
  PROLOGUE_AFFINITY_REGIONS,
  PROLOGUE_PLAYABLE_PATHWAY_IDS,
  type PrologueAffinityRegion,
  type PrologueTurn,
  type AIPrologueChoice,
  type AIPrologueResponse,
  type AIPrologueFinale,
  type CanonPrologueChoice,
  type CanonPrologueScene,
  type CanonPrologueFinale,
  type CanonPrologueContext,
} from "./prologue-client";
