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
   * Acquired powers — Beyonder abilities the character copied, stole, or
   * borrowed from someone else (e.g. an Error Prometheus's permanent theft, a
   * White Tower Polymath's temporary Imitation, the Ring of Mimicry / Blood
   * Vessel Thief artifacts). Abilities are otherwise DERIVED from
   * `pathwayId`/`sequenceLevel`, so this is the only place another's power is
   * recorded on the character. Absent on saves that never took one; strictly
   * validated when present (`isValidAcquiredPowersShape`), NEVER AI-mutable, and
   * preserved on the deserialize `...s` spread (no seeding), exactly like
   * `hunts`. The temporary ones tick down each turn (`tickAcquiredPowers`).
   */
  acquiredPowers?: import("./acquired-powers").AcquiredPower[];
  /**
   * Advancement ritual in progress (issue #99 Part C). From Sequence 5 the rite
   * is performed STEP BY STEP across turns before the climb unlocks; this tracks
   * the progress. Absent when no rite is under way; strictly validated when
   * present and preserved on the deserialize `...s` spread (no seeding), exactly
   * like `anchorState`. No DB migration — it serializes inside the session blob.
   */
  ritualState?: import("./ritual").RitualState;
  /**
   * Formula pursuit in progress (issue #171, "The Climb"): seeking the next
   * potion's closely-guarded recipe through the story over several turns — the
   * alternative to trading for it. Only one is ever in play (the next potion's),
   * so it is a single optional sub-state, not a list. Absent when no pursuit is
   * under way; strictly validated when present and preserved on the deserialize
   * `...s` spread (no seeding), exactly like `ritualState`. No DB migration.
   */
  formulaPursuit?: import("./formula-pursuit").FormulaPursuitState;
  /**
   * Tracked-NPC roster (issue #101): the durable cast the player is bound to —
   * allies who follow (a party) and hostiles who follow (pursuers) — distinct
   * from the transient, scene-scoped `gameState.npcsPresent`. Followers are
   * re-asserted at a move's destination so companions travel with the player.
   * Absent on saves that never rostered anyone; strictly validated when present,
   * exactly like `hunts`. Preserved on the deserialize `...s` spread (no seeding).
   */
  trackedNpcState?: import("./tracked-npcs").TrackedNpcState;
  /**
   * Transient player-action text for an engine-decided turn (advancement /
   * apotheosis) that is routed straight into `consequences` via
   * `ENGINE_RESOLUTION`. Carried so the turn record reads as what the player
   * did (e.g. "I drank the potion and advanced") rather than a bare "Continue",
   * keeping the next AI prompt aware of it. Cleared on `APPLY_CONSEQUENCES`.
   */
  pendingPlayerAction?: string | null;
  /**
   * Transient structured kind for that same engine-decided turn (issue #171),
   * carried alongside `pendingPlayerAction` so the committed turn record is
   * stamped `combat`/`advancement` and the chronicle styles it without sniffing
   * the action string. Cleared on `APPLY_CONSEQUENCES`. Rides the deserialize
   * `...s` spread; a rare mid-`consequences` reload that loses it falls back to
   * the chronicle's string classifier.
   */
  pendingTurnKind?: import("@/lib/ai").TurnKind | null;
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
  | { type: "PRESENT_NEXT_CHOICES"; result: ValidatedAIResponse; choices: Choice[] }
  | {
      type: "ENGINE_RESOLUTION";
      result: ValidatedAIResponse;
      playerAction: string;
      kind?: import("@/lib/ai").TurnKind;
    }
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
  /** The character's chosen name, for the active-character switcher labels. */
  characterName?: string;
}

export const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  idle: ["situation", "error"],
  situation: ["choices", "error"],
  // `consequences` reachable directly for an engine-decided turn (advancement /
  // apotheosis) via ENGINE_RESOLUTION — the outcome is already committed, so it
  // skips the AI resolution-generation step and renders inline like any turn.
  choices: ["resolution", "consequences", "error"],
  // A normal player turn loops `resolution → choices` (PRESENT_NEXT_CHOICES): the
  // resolution narrates the outcome AND presents the next decision in one beat, so
  // the turn no longer regenerates a separate forward-looking scene that could
  // assume actions the player never chose. `consequences` stays reachable for an
  // engine-decided turn (advancement / apotheosis / combat) whose narration-only
  // response carries no player choices and resumes via `situation`.
  resolution: ["consequences", "choices", "error"],
  consequences: ["situation", "error"],
  error: ["situation", "idle"],
};

// The instruction each gameplay pillar resolves under. NOTE the "combat" pillar
// (a plain `action`-type choice — physical/decisive moves in ordinary play) maps
// to the pacing-bound "narrative" instruction, NOT the engine-driven "combat" one:
// real combat is a separate state machine (CombatLauncher → CombatEncounterView,
// which calls generate() with instruction "combat" directly). The "combat"
// instruction is pacing-EXEMPT and tells the narrator to invent no new choices —
// correct for an active encounter, wrong for an ordinary action choice, which
// must end at the next decision point and present choices like any other turn
// (the action-assumption fix). Keeping it on "combat" would over-narrate action
// choices and drop their inline next-choices to the default fallback.
export const PILLAR_INSTRUCTION_MAP: Record<GameplayPillar, InstructionType> = {
  investigation: "narrative",
  social: "narrative",
  divination: "evaluation",
  combat: "narrative",
};

export const CHOICE_PILLAR_MAP: Record<Choice["type"], GameplayPillar> = {
  investigation: "investigation",
  dialogue: "social",
  ritual: "divination",
  action: "combat",
};
