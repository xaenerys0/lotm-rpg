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
