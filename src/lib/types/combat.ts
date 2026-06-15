import type { BeyonderCharacteristic, Item } from "./rules";

/**
 * Combat system types (issue #10).
 *
 * Hybrid combat: a mechanical preparation phase followed by an AI-narrated
 * resolution with mid-fight decision points. The deterministic engine
 * (`src/lib/game/combat.ts`) owns all mechanics; the AI layer only narrates.
 *
 * Pure data — no methods or side effects (see `src/lib/types/CLAUDE.md`).
 */

/** What the player knows about an enemy going into a fight. */
export type IntelligenceLevel = "none" | "partial" | "thorough";

/** Terrain / positioning secured before the fight. */
export type TerrainAdvantage = "none" | "neutral" | "favorable";

/** An enemy combatant. */
export interface Enemy {
  name: string;
  /** Pathway id if the enemy is a Beyonder; undefined for a mundane threat. */
  pathwayId?: number;
  /** Sequence level (9 weakest … 0 strongest). Mundane foes use 9. */
  sequenceLevel: number;
  /** True if the enemy is a Beyonder — drops a characteristic when slain. */
  isBeyonder: boolean;
  /** Short flavour description shown to the player. */
  description?: string;
  /** Abilities the player has learned about (informs intelligence). */
  knownAbilities?: string[];
  /** Loot awarded to the player on victory. */
  loot?: Item[];
}

/** The mechanical preparation a player completes before a known fight. */
export interface CombatPreparationInput {
  /** Intelligence gathered on the enemy (pathway, sequence, abilities). */
  intelligence: IntelligenceLevel;
  /** Ritual materials prepared — consumed by the act of preparing. */
  ritualMaterials: Item[];
  /** Sealed artifacts readied — consumed only when used mid-fight. */
  sealedArtifacts: Item[];
  /** Abilities the player has chosen to ready. */
  readiedAbilities: string[];
  /** Terrain / positioning secured. */
  terrain: TerrainAdvantage;
}

export type PreparationTier = "poor" | "modest" | "solid" | "thorough";

export interface PreparationQuality {
  /** Overall preparation score, 0 (none) … 1 (complete). */
  score: number;
  tier: PreparationTier;
  /** Per-dimension contribution to the score (for UI feedback). */
  breakdown: {
    intelligence: number;
    ritualMaterials: number;
    sealedArtifacts: number;
    readiedAbilities: number;
    terrain: number;
  };
}

/** Pathway relationship between the player and a Beyonder enemy. */
export type MatchupRelation = "same" | "kindred" | "opposed" | "foreign";

export interface PathwayMatchup {
  relation: MatchupRelation;
  /** Advantage contribution in [-1, 1]; positive favours the player. */
  advantage: number;
}

/** The tactical posture a decision option represents. */
export type DecisionKind =
  | "aggressive"
  | "defensive"
  | "evasive"
  | "artifact"
  | "ability";

/** A single tactical option presented at a decision point. */
export interface DecisionOption {
  id: string;
  label: string;
  kind: DecisionKind;
  description: string;
  /** Advantage delta applied if chosen; can be negative. */
  modifier: number;
  /** True if choosing this consumes a sealed artifact (lost after the fight). */
  consumesArtifact?: boolean;
}

/** A mid-fight decision the player resolves. */
export interface DecisionPoint {
  id: string;
  /** Engine-generated prompt; the AI may replace it with richer narration. */
  prompt: string;
  options: DecisionOption[];
}

export type CombatOutcome = "victory" | "defeat" | "escape" | "stalemate";

export type InjurySeverity = "minor" | "major" | "grievous";

export interface Injury {
  id: string;
  description: string;
  severity: InjurySeverity;
  /** Turns of normal play remaining before the injury heals. */
  recoveryTurns: number;
}

export interface CombatResult {
  outcome: CombatOutcome;
  injuries: Injury[];
  /** Sanity delta (negative drains). Applied via `applySanityImpact`. */
  sanityImpact: number;
  itemsGained: Item[];
  itemsLost: Item[];
  /** Characteristics dropped by a defeated Beyonder enemy. */
  characteristicsDropped: BeyonderCharacteristic[];
  narrativeSummary: string;
}

export type CombatPhase = "preparation" | "exchange" | "resolution";

/**
 * The live state of a combat encounter — a self-contained mini state machine
 * advanced by the pure functions in `src/lib/game/combat.ts`. Serializable so
 * an in-progress fight survives a page reload.
 */
export interface CombatEncounter {
  id: string;
  enemy: Enemy;
  /** True for an ambush — no preparation phase, capped preparation score. */
  ambush: boolean;
  phase: CombatPhase;
  /** Player pathway/sequence captured at encounter start. */
  playerPathwayId: number;
  playerSequence: number;
  /** Random factor rolled once at creation, in [0, 1], for reproducibility. */
  randomFactor: number;
  /** Penalty from the player's active injuries, in [0, 1]. */
  injuryPenalty: number;
  preparation: CombatPreparationInput | null;
  prepQuality: PreparationQuality | null;
  /** enemySequence - playerSequence; positive favours the player. */
  sequenceGap: number;
  matchup: PathwayMatchup;
  /** Advantage before mid-fight choices; set once preparation is applied. */
  baseAdvantage: number;
  decisionPoints: DecisionPoint[];
  /** Index of the decision point currently awaiting a choice. */
  decisionIndex: number;
  /** Chosen option id per resolved decision point. */
  chosenOptionIds: string[];
  /** Accumulated advantage delta from chosen options. */
  accumulatedModifier: number;
  outcome: CombatOutcome | null;
  result: CombatResult | null;
  /**
   * Potion-preparation hunt objective (issue #84): the name of the Beyonder
   * Characteristic this fight is hunting for. Set when the encounter is launched
   * from the PotionPreparationPanel; on victory the engine grants the item.
   * Lives on the (persisted) encounter rather than React state so a mid-hunt
   * reload still knows the fight's purpose. Absent for ordinary combat.
   */
  huntTarget?: string;
}
