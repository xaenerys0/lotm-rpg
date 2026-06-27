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

/**
 * Why a fight is happening — who you are facing and the reason (issue #187,
 * combat overhaul Phase 1). Replaces the old silent "the first present NPC is
 * your enemy" assumption. An ally never becomes a plain foe: they appear under a
 * *reconcilable* framing that explains why they are fighting you.
 */
export type EncounterFraming =
  | "hostile-beyonder" // a genuine enemy Beyonder
  | "mundane-threat" // thugs, beasts, ordinary danger
  | "mind-controlled" // an ally/NPC puppeteered by another Beyonder
  | "lost-control" // an ally/NPC who has lost control of themselves
  | "rival-motive" // someone with their own agenda, not truly your foe
  | "coerced" // forced to attack you against their will
  | "beast"; // a supernatural creature / monster

/**
 * The in-world context of an encounter: who the opponent is and why the fight is
 * happening. Carried on the `CombatEncounter` and surfaced to the player as the
 * threat-assessment framing, and to the narrator so the prose matches mechanics.
 */
export interface EncounterContext {
  framing: EncounterFraming;
  /** True when the opponent is someone the player knows (ally/companion/named NPC). */
  isKnownPerson: boolean;
  /** If mind-controlled/coerced: the puppeteer's identity, when known. */
  controllerName?: string;
  /** One-line in-world reason this fight is happening. */
  motive?: string;
  /** Whether a non-lethal / snap-free / talk-down resolution is available. */
  reconcilable: boolean;
}

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
  /** Source bestiary entry id, when drawn from the curated catalogue (issue #187). */
  bestiaryId?: string;
}

/** The combat role a curated ability fills (issue #187, Phase 2). */
export type AbilityKind = "offensive" | "defensive" | "control" | "evasive" | "utility";

/**
 * A canon ability promoted to a real combat tool (issue #187, Phase 2). Derived
 * from each pathway's corpus abilities by `combatKitFor`, classified into a
 * combat role with a cost, cooldown, and potency so the exchange offers a
 * pathway-authentic toolkit instead of three templated verbs.
 */
export interface CombatAbility {
  id: string;
  /** Canon ability name. */
  name: string;
  kind: AbilityKind;
  /** Canon description, condensed for combat. */
  description: string;
  /** Sanity cost when invoked (≤ 0 applied as a drain). */
  sanityCost: number;
  /** Strain added to the loss-of-control meter; 0 for safe abilities. */
  controlStrain: number;
  /** Rounds before re-use within one fight. */
  cooldown: number;
  /** Advantage contribution before edge/intel scaling. */
  potency: number;
  /** Framings this ability is especially strong against. */
  counters?: EncounterFraming[];
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

/**
 * A non-lethal line of effort the player can pursue across the exchange (issue
 * #187, Phase 4 outcome spectrum). Tagged on a `DecisionOption`; the engine
 * tallies the chosen lines and, combined with the encounter framing and the
 * final advantage, resolves a richer outcome than win/lose. `subdue`/`capture`/
 * `spare` are available in any fight; `free`/`talk-down` only when the framing
 * is reconcilable.
 */
export type ResolutionLine = "subdue" | "free" | "talk-down" | "capture" | "spare";

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
  /**
   * For a dynamic ability option: the concrete learned ability invoked in the
   * moment. Lets the player wield their actual abilities mid-fight rather than
   * only the ones readied during preparation.
   */
  abilityName?: string;
  /**
   * For a dynamic artifact option: the concrete carried artifact invoked in the
   * moment (pairs with `consumesArtifact`). Removed from inventory on use.
   */
  artifactItem?: Item;
  /**
   * A non-lethal resolution line this option advances (issue #187, Phase 4).
   * Choosing it counts toward a `subdued`/`freed`/`talked-down`/`captured`/
   * `spared` outcome instead of a plain victory.
   */
  resolutionLine?: ResolutionLine;
  /**
   * A legible, plain-language effect/risk tag shown on the option (issue #187
   * clarity). Surfaces the direction of a choice without leaking the exact
   * hidden modifier.
   */
  effectTag?: string;
}

/** A mid-fight decision the player resolves. */
export interface DecisionPoint {
  id: string;
  /** Engine-generated prompt; the AI may replace it with richer narration. */
  prompt: string;
  options: DecisionOption[];
}

export type CombatOutcome =
  | "victory"
  | "defeat"
  | "escape"
  | "stalemate"
  // Outcome spectrum (issue #187, Phase 4) — beyond win/lose:
  | "subdued" // won non-lethally — no kill, no dropped characteristic
  | "freed" // broke the control over a turned ally — ally restored
  | "talked-down" // ended by words/intimidation/motive — no violence
  | "captured" // foe taken alive (interrogation/leverage/recruit hook)
  | "spared"; // a decisive win, but you let them live

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
  /**
   * Why this fight is happening and who the opponent is (issue #187, Phase 1).
   * Optional so legacy serialized encounters stay valid; a fight created without
   * one is treated as a `hostile-beyonder`/`mundane-threat` by the engine.
   */
  context?: EncounterContext;
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
   * The player's learned abilities at encounter start, surfaced as dynamic
   * in-the-moment options at each decision point. Captured on the encounter (not
   * looked up live) so a serialized fight regenerates identical decision points.
   */
  availableAbilities?: string[];
  /**
   * The player's carried artifacts at encounter start (inventory minus
   * advancement reagents), offered as dynamic mid-fight options that consume the
   * item when used. Captured on the encounter for the same determinism reason.
   */
  availableArtifacts?: Item[];
  /**
   * The player's pathway-and-Sequence combat ability kit (issue #187, Phase 2):
   * the canon abilities promoted to costed combat tools, offered as the exchange
   * options. Captured at encounter start (from `combatKitFor`) so a serialized
   * fight regenerates identical options. Optional for legacy encounters.
   */
  availableKit?: CombatAbility[];
  /**
   * Potion-preparation hunt objective (issue #84): the name of the Beyonder
   * Characteristic this fight is hunting for. Set when the encounter is launched
   * from the PotionPreparationPanel; on victory the engine grants the item.
   * Lives on the (persisted) encounter rather than React state so a mid-hunt
   * reload still knows the fight's purpose. Absent for ordinary combat.
   */
  huntTarget?: string;
}
