export type {
  GamePhase,
  GameplayPillar,
  GameSession,
  GameLoopAction,
  GameSessionSummary,
} from "./types";

export { VALID_TRANSITIONS, PILLAR_INSTRUCTION_MAP, CHOICE_PILLAR_MAP } from "./types";

export { transition, isValidTransition, InvalidTransitionError } from "./state-machine";

export {
  applyWorldStateChanges,
  applySanityImpact,
  addDiscoveredItems,
  applyDigestion,
  applyResolution,
} from "./world-state";

export {
  DIGESTION_MIN,
  DIGESTION_MAX,
  NEUTRAL_ALIGNMENT,
  CONTRADICTION_THRESHOLD,
  MAX_PROGRESS_PER_EVAL,
  MAX_REVERSE_PER_EVAL,
  MIN_PROGRESS_PER_SESSION,
  createDigestionState,
  computeProgressDelta,
  applyDigestionProgress,
  isDigestionComplete,
  digestionFeedback,
} from "./digestion";

export {
  createSession,
  createDefaultGameState,
  sessionToSummary,
  serializeSession,
  deserializeSession,
  isValidSessionShape,
  isValidDigestionShape,
} from "./session";

export {
  SESSION_KEY_PREFIX,
  SESSION_INDEX_KEY,
  PROVIDER_CONFIG_KEY,
  PROLOGUE_DRAFT_KEY,
  MODELS_CACHE_KEY,
} from "./constants";

export { isValidDraftShape, isActivePrologueDraft, clearDraft } from "./prologue-draft";

export type { PrologueDraft } from "./prologue-draft";

export {
  PROLOGUE_SCENES,
  PATHWAY_JUSTIFICATIONS,
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  scoreSelections,
  recommendPathway,
  dominantAffinity,
  tallyAffinities,
  rankPathways,
  selectTopCandidates,
  createPrologueState,
  createPrologueMemory,
  createAIPrologueMemory,
} from "./prologue";

export type {
  PrologueChoice,
  PrologueScene,
  PrologueSelection,
  PathwayScore,
  PrologueRecommendation,
  PrologueState,
} from "./prologue";
