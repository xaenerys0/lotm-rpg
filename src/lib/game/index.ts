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
  applyResolution,
} from "./world-state";

export {
  createSession,
  createDefaultGameState,
  sessionToSummary,
  serializeSession,
  deserializeSession,
  isValidSessionShape,
} from "./session";

export { SESSION_KEY_PREFIX, SESSION_INDEX_KEY, PROVIDER_CONFIG_KEY } from "./constants";

export {
  PROLOGUE_SCENES,
  PATHWAY_JUSTIFICATIONS,
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  scoreSelections,
  recommendPathway,
  createPrologueState,
  createPrologueMemory,
} from "./prologue";

export type {
  PrologueChoice,
  PrologueScene,
  PrologueSelection,
  PathwayScore,
  PrologueRecommendation,
  PrologueState,
} from "./prologue";
