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
  /**
   * Pathway-gated personas (issue #22). Absent on sessions that have never
   * created an identity; `activeIdentityId: null` = the true face.
   */
  identityState?: import("./identity").IdentityState;
  /**
   * Secret society / Tarot Club state (issue #32). Absent until founded.
   */
  societyState?: import("./society").SocietyState;
  /**
   * Anchors (issues #35, #25). The tier-gated stabilising resource that opposes
   * a high-Sequence Beyonder's godhood pressure. Absent on sessions that have
   * never consecrated an anchor (a Seq 9 starter needs none); strictly validated
   * when present — exactly like `identityState`.
   */
  anchorState?: import("./anchors").AnchorState;
  /**
   * True-self profile (character-info storage): the mutable record of who the
   * character actually is — gender, pronouns, appearance, epithet, age, marks,
   * demeanor traits, a notes log, former names, and any open recognition gap.
   * Absent on legacy/fresh saves (lazily seeded via `resolveProfileState`);
   * strictly validated when present, exactly like `identityState`.
   */
  profileState?: import("./profile").ProfileState;
  /**
   * Acting-method discovery (issue #95). The persisted `knowsMethod` flag +
   * `alignedStreak` counter behind the "earned through play" discovery of the
   * Acting Method (it gates the hidden digestion meter and vague-vs-clear
   * feedback). Absent on legacy/fresh saves (lazily resolved via
   * `resolveActingMethodState`); strictly validated when present, exactly like
   * `profileState`. Not seeded by `createSession`.
   */
  actingMethodState?: import("./acting-method").ActingMethodState;
  /**
   * Active hunt quests (advancement/combat streamline). Tracking a Beyonder
   * Characteristic's creature plays out over several turns before the fight;
   * more than one can run at once. Absent on saves that have never started a
   * hunt; strictly validated when present, exactly like `actingMethodState`.
   */
  hunts?: import("./hunt").HuntState[];
  /**
   * Transient player-action text for an engine-decided turn (advancement /
   * apotheosis) that is routed straight into `consequences` via
   * `ENGINE_RESOLUTION`. Carried so the turn record reads as what the player
   * did (e.g. "I drank the potion and advanced") rather than a bare "Continue",
   * keeping the next AI prompt aware of it. Cleared on `APPLY_CONSEQUENCES`.
   */
  pendingPlayerAction?: string | null;
  /**
   * Permadeath marker (issue #12). Set once, never cleared: the session is
   * preserved as a historical record (inventory, memory, journal stay
   * readable) but play cannot continue.
   */
  ended?: {
    fate: "transformed" | "dead";
    severity: "transformation" | "fatal";
    /** The narrated descent scene shown on the death screen. */
    scene: string;
    at: number;
  };
  createdAt: number;
  updatedAt: number;
}

export type GameLoopAction =
  | { type: "START_SITUATION" }
  | { type: "SITUATION_READY"; narrative: string; choices: Choice[] }
  | { type: "SELECT_CHOICE"; choiceId: string }
  | { type: "RESOLUTION_READY"; result: ValidatedAIResponse }
  | { type: "ENGINE_RESOLUTION"; result: ValidatedAIResponse; playerAction: string }
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
  // `consequences` reachable directly for an engine-decided turn (advancement /
  // apotheosis) via ENGINE_RESOLUTION — the outcome is already committed, so it
  // skips the AI resolution-generation step and renders inline like any turn.
  choices: ["resolution", "consequences", "error"],
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
