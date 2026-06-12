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
  canConvene,
  canFoundSociety,
  foundSociety,
  holdGathering,
  isValidSocietyShape,
  recruitMember,
  resolveMemberArc,
  societyKindForPathway,
  GATHERING_COOLDOWN_TURNS,
  SOCIETY_FOUNDING_SEQUENCE,
  SOCIETY_KIND_LABELS,
  type GatheringOutcome,
  type SocietyKind,
  type SocietyMember,
  type SocietyState,
} from "./society";
export {
  composeDeduction,
  composeDialogueAction,
  composeRitualAction,
  detectInputMode,
  gatherClues,
  INPUT_MODE_LABELS,
  RITUAL_STEPS,
  type InputMode,
} from "./input-modes";
export {
  divergenceScore,
  evaluateAchievements,
  getAchievement,
  legacyCount,
  showcaseStats,
  ACHIEVEMENTS,
  type Achievement,
  type ShowcaseStats,
} from "./achievements";
export {
  fetchLeaderboard,
  publishShowcase,
  toShowcaseRow,
  type LeaderboardEntry,
  type LeaderboardMetric,
  type ShowcaseClient,
} from "./showcase-sync";
export {
  addItemToInventory,
  adjustFunds,
  canAfford,
  filterListings,
  getFunds,
  removeItemForListing,
  validateListing,
  LISTING_DAYS,
  PRICE_GUIDANCE,
  STARTING_FUNDS,
  type ListingFilter,
  type ListingStatus,
  type MarketListing,
} from "./marketplace";
export {
  createListing,
  delist,
  fetchActiveListings,
  fetchOwnHistory,
  purchase,
  type MarketplaceClient,
} from "./marketplace-sync";
export {
  composeMessage,
  getMessageTemplate,
  selectMessagesForScene,
  MAX_MESSAGES_PER_SCENE,
  MESSAGE_TEMPLATES,
  type MessageCategory,
  type MessageTemplate,
  type WorldMessage,
} from "./world-messages";
export {
  fetchLocationMessages,
  placeMessage,
  rateMessage,
  type WorldMessagesClient,
} from "./world-messages-sync";
export {
  activeIdentity,
  adjustReputation,
  applyExposure,
  checkExposure,
  createIdentity,
  createIdentityState,
  discardIdentity,
  identityCapability,
  identityPromptContext,
  isValidIdentityStateShape,
  recordIdentityUse,
  switchIdentity,
  EXPOSURE_EVENT_THRESHOLD,
  FULL_IDENTITY_THRESHOLDS,
  MAX_BASIC_IDENTITIES,
  type ExposureEvent,
  type Identity,
  type IdentityCapability,
  type IdentityState,
  type NewIdentityFields,
  type SocialClass,
} from "./identity";
export {
  FREE_TEXT_CHOICE_ID,
  FREE_TEXT_MAX_LENGTH,
  freeTextRejection,
  freeTextToChoice,
  validateFreeText,
  type FreeTextRejection,
  type FreeTextValidation,
} from "./free-text";
export {
  TUTORIAL_REQUIRED_TOPICS,
  TUTORIAL_SCENES,
  type TutorialScene,
} from "./tutorial";
export {
  applySetback,
  buildLegacy,
  deserializeLegacies,
  endSession,
  evaluateFailure,
  fallbackDescentScene,
  legaciesToFacts,
  serializeLegacies,
  SETBACK_SANITY_RATIO,
  type CharacterLegacy,
  type FailureCause,
  type FailureContext,
  type FailureOutcome,
  type FailureVerdict,
  type LegacyFate,
  type LegacyRole,
  type SetbackResult,
} from "./death";
export {
  artifactToItem,
  deserializeArtifacts,
  discoverableArtifacts,
  echoFacts,
  mintArtifact,
  pickStartingEcho,
  serializeArtifacts,
  type TimelineArtifact,
} from "./echoes";
export {
  addAnnotation,
  addJournalEntries,
  annotationsFor,
  createJournal,
  deleteAnnotation,
  deriveJournalEntries,
  deserializeJournal,
  editAnnotation,
  filterJournal,
  journalEventLabel,
  journalToMarkdown,
  JOURNAL_EVENT_TYPES,
  serializeJournal,
  validateJournalFlag,
  type Journal,
  type JournalAnnotation,
  type JournalEntry,
  type JournalEventType,
  type JournalFilter,
} from "./journal";
export {
  deleteAnnotationRemote,
  syncAnnotation,
  syncEntries,
  syncJournal,
  toAnnotationRow,
  toEntryRow,
  type JournalSyncClient,
} from "./journal-sync";
export {
  advanceCanonPosition,
  createSession,
  createDefaultGameState,
  DEFAULT_CANON_POSITION,
  type CreateSessionOptions,
  sessionToSummary,
  serializeSession,
  deserializeSession,
  isValidSessionShape,
  isValidDigestionShape,
  isValidInjuriesShape,
} from "./session";

export {
  AMBUSH_PREP_CAP,
  VICTORY_THRESHOLD,
  DEFEAT_THRESHOLD,
  DECISION_POINT_COUNT,
  INJURY_RECOVERY_TURNS,
  INJURY_PENALTY_CAP,
  emptyPreparation,
  scorePreparation,
  computeSequenceGap,
  computePathwayMatchup,
  computeInjuryPenalty,
  computeBaseAdvantage,
  generateDecisionPoints,
  deriveEncounterEnemy,
  createEncounter,
  applyPreparation,
  chooseOption,
  isExchangeComplete,
  resolveOutcome,
  computeConsequences,
  resolveEncounter,
  applyCombatResult,
  tickInjuries,
  isValidEncounterShape,
  type CreateEncounterOptions,
} from "./combat";

export type {
  IntelligenceLevel,
  TerrainAdvantage,
  Enemy,
  CombatPreparationInput,
  PreparationTier,
  PreparationQuality,
  MatchupRelation,
  PathwayMatchup,
  DecisionKind,
  DecisionOption,
  DecisionPoint,
  CombatOutcome,
  InjurySeverity,
  Injury,
  CombatResult,
  CombatPhase,
  CombatEncounter,
} from "@/lib/types/combat";

export {
  SESSION_KEY_PREFIX,
  SESSION_INDEX_KEY,
  PROVIDER_CONFIG_KEY,
  PROLOGUE_DRAFT_KEY,
  MODELS_CACHE_KEY,
  PREFERENCES_KEY,
  JOURNAL_KEY_PREFIX,
  LEGACIES_KEY,
  ECHOES_KEY,
} from "./constants";

export {
  SANITY_MIN,
  SANITY_TIER_THRESHOLDS,
  SANITY_EFFECTS,
  ABILITY_USE_BASE_DRAIN,
  ABILITY_USE_PER_SEQUENCE,
  HORROR_BASE_DRAIN,
  HORROR_PER_GAP,
  MAX_HORROR_DRAIN,
  ADVANCEMENT_DRAIN,
  OUTER_DEITY_DRAIN,
  ACTING_SUCCESS_RECOVERY,
  REST_RECOVERY,
  HUMAN_CONNECTION_RECOVERY,
  ROUTINE_RECOVERY,
  ACTING_NEGLECT_DECAY,
  sanityPercent,
  classifySanityTier,
  sanityEffects,
  sanityDelta,
  isLossOfControl,
  evaluateLossOfControl,
} from "./sanity";

export type {
  SanityTier,
  SanityEffectProfile,
  SanityEvent,
  LossOfControlSeverity,
  LossOfControlContext,
} from "./sanity";

export {
  DEFAULT_PREFERENCES,
  isValidPreferencesShape,
  mergePreferences,
  serializePreferences,
  deserializePreferences,
} from "./preferences";

export type { GamePreferences } from "./preferences";

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
