import type { GameState } from "@/lib/ai";
import type { BeyonderCharacteristic, Item } from "@/lib/types/rules";
import type {
  CombatEncounter,
  CombatOutcome,
  CombatPreparationInput,
  CombatResult,
  DecisionKind,
  DecisionOption,
  DecisionPoint,
  Enemy,
  Injury,
  InjurySeverity,
  PathwayMatchup,
  PreparationQuality,
  PreparationTier,
} from "@/lib/types/combat";
import { getGroupForPathway } from "@/lib/rules";
import { sanityDelta } from "./sanity";

/**
 * Combat engine (issue #10).
 *
 * Hybrid combat: a mechanical **preparation** phase, an AI-narrated
 * **exchange** of 2-3 mid-fight decision points, and a deterministic
 * **resolution**. This module owns every mechanic — preparation scoring,
 * the base-advantage calculation (preparation + sequence gap + pathway
 * matchup + a single injected random factor), the decision-point modifiers,
 * outcome resolution, and the consequences (injuries, sanity, items,
 * dropped characteristics). The AI layer only narrates on top of this.
 *
 * Design principle: **preparation helps but never decides.** A well-prepared
 * player has an edge; clever mid-fight choices can overturn a poor start, and a
 * single random factor keeps any fight from being a foregone conclusion.
 *
 * Pure functions only — no side effects, no AI calls. Randomness enters once,
 * as the `randomFactor` captured at encounter creation, so a serialized
 * encounter always resolves the same way.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to 4 decimals to keep advantage maths free of float noise. */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// ─── Preparation Scoring ─────────────────────────────────────────────

const INTELLIGENCE_WEIGHT: Record<CombatPreparationInput["intelligence"], number> = {
  none: 0,
  partial: 0.15,
  thorough: 0.3,
};
const TERRAIN_WEIGHT: Record<CombatPreparationInput["terrain"], number> = {
  none: 0,
  neutral: 0.05,
  favorable: 0.15,
};
const PER_RITUAL_MATERIAL = 0.07;
const RITUAL_MATERIAL_CAP = 0.21;
const PER_SEALED_ARTIFACT = 0.1;
const SEALED_ARTIFACT_CAP = 0.2;
const PER_READIED_ABILITY = 0.05;
const READIED_ABILITY_CAP = 0.15;

/** An ambush leaves no time to prepare — whatever was on hand, capped low. */
export const AMBUSH_PREP_CAP = 0.15;

function preparationTier(score: number): PreparationTier {
  if (score < 0.25) return "poor";
  if (score < 0.5) return "modest";
  if (score < 0.75) return "solid";
  return "thorough";
}

/** An empty preparation — the state of an ambushed, unprepared player. */
export function emptyPreparation(): CombatPreparationInput {
  return {
    intelligence: "none",
    ritualMaterials: [],
    sealedArtifacts: [],
    readiedAbilities: [],
    terrain: "none",
  };
}

/**
 * Score the player's preparation, 0 (none) … 1 (complete). Each dimension is
 * capped so no single one dominates. An ambush caps the total at
 * `AMBUSH_PREP_CAP`.
 */
export function scorePreparation(
  input: CombatPreparationInput,
  ambush: boolean,
): PreparationQuality {
  const intelligence = INTELLIGENCE_WEIGHT[input.intelligence];
  const ritualMaterials = Math.min(
    input.ritualMaterials.length * PER_RITUAL_MATERIAL,
    RITUAL_MATERIAL_CAP,
  );
  const sealedArtifacts = Math.min(
    input.sealedArtifacts.length * PER_SEALED_ARTIFACT,
    SEALED_ARTIFACT_CAP,
  );
  const readiedAbilities = Math.min(
    input.readiedAbilities.length * PER_READIED_ABILITY,
    READIED_ABILITY_CAP,
  );
  const terrain = TERRAIN_WEIGHT[input.terrain];

  let score = clamp(
    intelligence + ritualMaterials + sealedArtifacts + readiedAbilities + terrain,
    0,
    1,
  );
  if (ambush) {
    score = Math.min(score, AMBUSH_PREP_CAP);
  }
  score = round4(score);

  return {
    score,
    tier: preparationTier(score),
    breakdown: {
      intelligence,
      ritualMaterials: round4(ritualMaterials),
      sealedArtifacts: round4(sealedArtifacts),
      readiedAbilities: round4(readiedAbilities),
      terrain,
    },
  };
}

// ─── Sequence Gap & Pathway Matchup ──────────────────────────────────

/**
 * The sequence gap, `enemySequence - playerSequence`. Sequences run 9 (weakest)
 * down to 0 (strongest), so a **positive** gap means the enemy is the higher
 * (weaker) number and the player has the edge.
 */
export function computeSequenceGap(
  playerSequence: number,
  enemySequence: number,
): number {
  return enemySequence - playerSequence;
}

const MUNDANE_EDGE = 0.3;
const SAME_PATHWAY_ADVANTAGE = -0.1;
const KINDRED_ADVANTAGE = 0.1;
const OPPOSED_ADVANTAGE = 0.4;

/**
 * The pathway matchup between the player and an enemy. A Beyonder outclasses a
 * mundane foe; the holy light of the God Almighty group is potent against the
 * Eternal Darkness group (and vice-versa); a shared group is kindred; the same
 * pathway is a slight disadvantage (the enemy knows your methods).
 */
export function computePathwayMatchup(
  playerPathwayId: number,
  enemy: Enemy,
): PathwayMatchup {
  if (!enemy.isBeyonder || enemy.pathwayId === undefined) {
    return { relation: "foreign", advantage: MUNDANE_EDGE };
  }
  if (enemy.pathwayId === playerPathwayId) {
    return { relation: "same", advantage: SAME_PATHWAY_ADVANTAGE };
  }

  const playerGroup = getGroupForPathway(playerPathwayId)?.id;
  const enemyGroup = getGroupForPathway(enemy.pathwayId)?.id;

  if (playerGroup && enemyGroup) {
    if (playerGroup === "god-almighty" && enemyGroup === "eternal-darkness") {
      return { relation: "opposed", advantage: OPPOSED_ADVANTAGE };
    }
    if (playerGroup === "eternal-darkness" && enemyGroup === "god-almighty") {
      return { relation: "opposed", advantage: -OPPOSED_ADVANTAGE };
    }
    if (playerGroup === enemyGroup) {
      return { relation: "kindred", advantage: KINDRED_ADVANTAGE };
    }
  }

  return { relation: "foreign", advantage: 0 };
}

// ─── Injuries (penalty in, recovery out) ─────────────────────────────

const INJURY_PENALTY: Record<InjurySeverity, number> = {
  minor: 0.05,
  major: 0.12,
  grievous: 0.25,
};
const INJURY_PENALTY_CAP = 0.4;
const INJURY_RECOVERY_TURNS: Record<InjurySeverity, number> = {
  minor: 3,
  major: 6,
  grievous: 10,
};

/** The combined advantage penalty from a set of active injuries, capped. */
export function computeInjuryPenalty(injuries: Injury[]): number {
  const total = injuries.reduce(
    (sum, injury) => sum + INJURY_PENALTY[injury.severity],
    0,
  );
  return Math.min(round4(total), INJURY_PENALTY_CAP);
}

// ─── Base Advantage ──────────────────────────────────────────────────

const ADVANTAGE_WEIGHT = {
  preparation: 0.25,
  sequence: 0.45,
  matchup: 0.3,
  random: 0.15,
};
const SEQUENCE_GAP_CLAMP = 4;

interface BaseAdvantageInput {
  prepScore: number;
  sequenceGap: number;
  matchupAdvantage: number;
  randomFactor: number;
  injuryPenalty: number;
}

/**
 * The advantage going into the exchange, before any mid-fight choices.
 * Combines preparation (above/below average), the sequence gap, the pathway
 * matchup, the active-injury penalty, and the single random factor. Centred on
 * 0 — positive favours the player.
 */
export function computeBaseAdvantage(input: BaseAdvantageInput): number {
  const preparation = ADVANTAGE_WEIGHT.preparation * (input.prepScore - 0.5);
  const sequence =
    (ADVANTAGE_WEIGHT.sequence *
      clamp(input.sequenceGap, -SEQUENCE_GAP_CLAMP, SEQUENCE_GAP_CLAMP)) /
    SEQUENCE_GAP_CLAMP;
  const matchup = ADVANTAGE_WEIGHT.matchup * clamp(input.matchupAdvantage, -1, 1);
  const random = ADVANTAGE_WEIGHT.random * (input.randomFactor * 2 - 1);
  return round4(preparation + sequence + matchup - input.injuryPenalty + random);
}

// ─── Pathway Combat Styles ───────────────────────────────────────────

interface CombatStyle {
  /** A short evocative descriptor woven into the resolution summary. */
  flavor: string;
  /** The tactic this pathway excels at — earns a modifier bonus. */
  signatureKind: DecisionKind;
  options: Record<DecisionKind, { label: string; description: string }>;
}

const FALLBACK_STYLE: CombatStyle = {
  flavor: "You fight with grim, mortal resolve.",
  signatureKind: "defensive",
  options: {
    aggressive: {
      label: "Press the attack",
      description: "Commit to a decisive strike.",
    },
    defensive: {
      label: "Hold your guard",
      description: "Brace and weather the assault.",
    },
    evasive: { label: "Give ground", description: "Disengage and look for a way out." },
    ability: {
      label: "Use your training",
      description: "Apply what you have learned of the foe.",
    },
    artifact: {
      label: "Unseal the artifact",
      description: "Break a sealed artifact and loose its power.",
    },
  },
};

const PATHWAY_COMBAT_STYLES: Record<number, CombatStyle> = {
  // Fool — the Seer divines the enemy's next move.
  1: {
    flavor: "You read the threads of fate and move a heartbeat ahead.",
    signatureKind: "evasive",
    options: {
      aggressive: {
        label: "Strike from misdirection",
        description: "Feint, then a sudden blow while their attention wavers.",
      },
      defensive: {
        label: "Read the omen",
        description: "Still yourself and let spirit-sight reveal the danger first.",
      },
      evasive: {
        label: "Divine the strike",
        description: "Foresee the blow a heartbeat early and step from its path.",
      },
      ability: {
        label: "Spirit vision",
        description: "Trace the spiritual threads that betray their next intent.",
      },
      artifact: {
        label: "Unseal the charm",
        description: "Break a sealed charm and loose what sleeps inside.",
      },
    },
  },
  // Visionary — the Spectator reads minds and intent.
  2: {
    flavor: "You read their mind faster than they can act on it.",
    signatureKind: "ability",
    options: {
      aggressive: {
        label: "Shatter their composure",
        description: "Drive a spike of dread into the cracks you have read.",
      },
      defensive: {
        label: "Compose yourself",
        description: "Mask your intent behind a placid, unreadable surface.",
      },
      evasive: {
        label: "Slip the gaze",
        description: "Read where they will look, and never be there.",
      },
      ability: {
        label: "Read their intent",
        description: "Parse the micro-tells betraying the strike before it forms.",
      },
      artifact: {
        label: "Unseal the charm",
        description: "Break a sealed charm and loose what sleeps inside.",
      },
    },
  },
  // Sun — the Bard channels searing, holy light.
  3: {
    flavor: "You answer the dark with searing, holy light.",
    signatureKind: "aggressive",
    options: {
      aggressive: {
        label: "Channel searing light",
        description: "Loose a hymn of burning radiance at the foe.",
      },
      defensive: {
        label: "Raise a radiant ward",
        description: "Wrap yourself in light that turns the worst aside.",
      },
      evasive: {
        label: "Withdraw behind the glare",
        description: "Blind them with brilliance and give ground.",
      },
      ability: {
        label: "Sing the warding hymn",
        description: "Let the light reveal corruption and weaken the unclean.",
      },
      artifact: {
        label: "Unseal the relic",
        description: "Break a sanctified seal and call its power forth.",
      },
    },
  },
  // Death — the Corpse Collector manipulates spirits and the grave.
  4: {
    flavor: "You bend the lingering dead to your will.",
    signatureKind: "ability",
    options: {
      aggressive: {
        label: "Loose the hungry dead",
        description: "Send grasping spirits to drag at the foe.",
      },
      defensive: {
        label: "Veil of the grave",
        description: "Draw a deathly stillness close and deaden the blow.",
      },
      evasive: {
        label: "Walk the boundary",
        description: "Step half into the realm of the dead, beyond their reach.",
      },
      ability: {
        label: "Command the spirits",
        description: "Bend the lingering dead to read and harry your enemy.",
      },
      artifact: {
        label: "Unseal the reliquary",
        description: "Break a bound vessel and free the spirit within.",
      },
    },
  },
};

function getCombatStyle(pathwayId: number): CombatStyle {
  return PATHWAY_COMBAT_STYLES[pathwayId] ?? FALLBACK_STYLE;
}

// ─── Decision Points ─────────────────────────────────────────────────

const DECISION_POINT_COUNT = 3;
const OPTION_MODIFIER = {
  aggressiveEdge: 0.22,
  aggressivePenalty: -0.06,
  defensive: 0.1,
  evasive: 0.05,
  abilityBase: 0.08,
  abilityIntel: 0.16,
  artifact: 0.2,
};
const SIGNATURE_BONUS = 0.05;
const EDGE_THRESHOLD = 0.5;

const INTEL_FACTOR: Record<CombatPreparationInput["intelligence"], number> = {
  none: 0,
  partial: 0.5,
  thorough: 1,
};

/**
 * How favoured the player is, 0 … 1, blending matchup, sequence gap,
 * preparation, and injuries. Drives whether an aggressive gambit pays off.
 */
function edgeFactor(encounter: CombatEncounter): number {
  const prepScore = encounter.prepQuality?.score ?? 0;
  return clamp(
    0.5 +
      0.5 * encounter.matchup.advantage +
      0.08 * clamp(encounter.sequenceGap, -SEQUENCE_GAP_CLAMP, SEQUENCE_GAP_CLAMP) +
      0.4 * (prepScore - 0.5) -
      encounter.injuryPenalty,
    0,
    1,
  );
}

function optionModifier(
  kind: DecisionKind,
  edge: number,
  intelFactor: number,
  isSignature: boolean,
): number {
  let modifier: number;
  switch (kind) {
    case "aggressive":
      modifier =
        edge >= EDGE_THRESHOLD
          ? OPTION_MODIFIER.aggressiveEdge
          : OPTION_MODIFIER.aggressivePenalty;
      break;
    case "defensive":
      modifier = OPTION_MODIFIER.defensive;
      break;
    case "evasive":
      modifier = OPTION_MODIFIER.evasive;
      break;
    case "ability":
      modifier = OPTION_MODIFIER.abilityBase + OPTION_MODIFIER.abilityIntel * intelFactor;
      break;
    case "artifact":
      modifier = OPTION_MODIFIER.artifact;
      break;
  }
  if (isSignature) {
    modifier += SIGNATURE_BONUS;
  }
  return round4(modifier);
}

// Each point offers three tactics. Slot 2 reaches for a sealed artifact when
// one is available, falling back to an evasive option otherwise.
const POINT_KINDS: DecisionKind[][] = [
  ["defensive", "aggressive", "evasive"],
  ["ability", "aggressive", "evasive"],
  ["defensive", "aggressive", "artifact"],
];

const DECISION_PROMPTS = [
  (enemy: string) => `The ${enemy} commits to its opening assault.`,
  (enemy: string) => `The ${enemy} presses harder, hunting for an opening.`,
  (enemy: string) =>
    `The fight hangs in the balance — one last exchange with the ${enemy}.`,
];

/**
 * Generate the 2-3 mid-fight decision points for an encounter whose
 * preparation has been applied. Each option carries a deterministic,
 * context-aware modifier so the "best" play depends on the situation — knowing
 * your enemy (intelligence) makes ability gambits land, and an edge makes
 * aggression pay off.
 */
export function generateDecisionPoints(encounter: CombatEncounter): DecisionPoint[] {
  const style = getCombatStyle(encounter.playerPathwayId);
  const edge = edgeFactor(encounter);
  const intel = INTEL_FACTOR[encounter.preparation?.intelligence ?? "none"];
  const artifactsAvailable = encounter.preparation?.sealedArtifacts.length ?? 0;
  const enemyName = encounter.enemy.name;

  let artifactsAllocated = 0;
  const points: DecisionPoint[] = [];

  for (let i = 0; i < DECISION_POINT_COUNT; i++) {
    const pointId = `${encounter.id}-dp${i}`;
    const kinds = POINT_KINDS[i];
    const options: DecisionOption[] = kinds.map((requestedKind) => {
      let kind = requestedKind;
      let consumesArtifact = false;
      if (kind === "artifact") {
        if (artifactsAllocated < artifactsAvailable) {
          consumesArtifact = true;
          artifactsAllocated++;
        } else {
          kind = "evasive";
        }
      }
      const template = style.options[kind];
      const option: DecisionOption = {
        id: `${pointId}-${kind}`,
        label: template.label,
        kind,
        description: template.description,
        modifier: optionModifier(kind, edge, intel, kind === style.signatureKind),
      };
      if (consumesArtifact) {
        option.consumesArtifact = true;
      }
      return option;
    });

    points.push({
      id: pointId,
      prompt: DECISION_PROMPTS[i](enemyName),
      options,
    });
  }

  return points;
}

// ─── Encounter Lifecycle ─────────────────────────────────────────────

/**
 * Derive a plausible foe from the current scene. A prepared confrontation faces
 * a known Beyonder a step stronger than the player (a lower sequence number); an
 * ambusher strikes at a roughly even footing. A named NPC present becomes the
 * foe, otherwise a generic threat. Encodes the (balance-bearing) difficulty
 * curve, so it lives in the engine rather than the UI; richer, lore-driven
 * enemies are a follow-up.
 */
export function deriveEncounterEnemy(state: GameState, ambush: boolean): Enemy {
  const sequenceLevel = Math.max(
    0,
    ambush ? state.sequenceLevel : state.sequenceLevel - 1,
  );
  const name =
    state.npcsPresent[0] ?? (ambush ? "an assailant in the fog" : "a lurking Beyonder");
  return {
    name,
    sequenceLevel,
    isBeyonder: !ambush,
    description: ambush
      ? "A sudden attacker, seizing the advantage of surprise."
      : "A known threat you have chosen to confront.",
  };
}

export interface CreateEncounterOptions {
  id: string;
  enemy: Enemy;
  playerPathwayId: number;
  playerSequence: number;
  /** True for an ambush — skips the preparation phase. */
  ambush?: boolean;
  /** Random factor in [0, 1]; defaults to `Math.random()`. Injected in tests. */
  randomFactor?: number;
  /** The player's active injuries, which penalise their advantage. */
  injuries?: Injury[];
}

/**
 * Create a combat encounter. A prepared fight starts in the `preparation`
 * phase; an ambush skips straight to the `exchange` with an empty (capped)
 * preparation.
 */
export function createEncounter(options: CreateEncounterOptions): CombatEncounter {
  const ambush = options.ambush ?? false;
  const randomFactor = clamp(options.randomFactor ?? Math.random(), 0, 1);
  const sequenceGap = computeSequenceGap(
    options.playerSequence,
    options.enemy.sequenceLevel,
  );
  const matchup = computePathwayMatchup(options.playerPathwayId, options.enemy);
  const injuryPenalty = computeInjuryPenalty(options.injuries ?? []);

  const encounter: CombatEncounter = {
    id: options.id,
    enemy: options.enemy,
    ambush,
    phase: "preparation",
    playerPathwayId: options.playerPathwayId,
    playerSequence: options.playerSequence,
    randomFactor,
    injuryPenalty,
    preparation: null,
    prepQuality: null,
    sequenceGap,
    matchup,
    baseAdvantage: 0,
    decisionPoints: [],
    decisionIndex: 0,
    chosenOptionIds: [],
    accumulatedModifier: 0,
    outcome: null,
    result: null,
  };

  if (ambush) {
    return applyPreparation(encounter, emptyPreparation());
  }
  return encounter;
}

/**
 * Apply the player's preparation, score it, fix the base advantage, generate
 * the decision points, and advance to the `exchange` phase. A no-op outside the
 * `preparation` phase.
 */
export function applyPreparation(
  encounter: CombatEncounter,
  input: CombatPreparationInput,
): CombatEncounter {
  if (encounter.phase !== "preparation") {
    return encounter;
  }

  const prepQuality = scorePreparation(input, encounter.ambush);
  const baseAdvantage = computeBaseAdvantage({
    prepScore: prepQuality.score,
    sequenceGap: encounter.sequenceGap,
    matchupAdvantage: encounter.matchup.advantage,
    randomFactor: encounter.randomFactor,
    injuryPenalty: encounter.injuryPenalty,
  });

  const next: CombatEncounter = {
    ...encounter,
    preparation: input,
    prepQuality,
    baseAdvantage,
    phase: "exchange",
    decisionIndex: 0,
    chosenOptionIds: [],
    accumulatedModifier: 0,
  };

  return { ...next, decisionPoints: generateDecisionPoints(next) };
}

/**
 * Resolve the current decision point with the chosen option, accumulating its
 * modifier and advancing to the next point. A no-op outside the `exchange`
 * phase, when the exchange is already complete, or for an unknown option id.
 */
export function chooseOption(
  encounter: CombatEncounter,
  optionId: string,
): CombatEncounter {
  if (encounter.phase !== "exchange") {
    return encounter;
  }
  const point = encounter.decisionPoints[encounter.decisionIndex];
  if (!point) {
    return encounter;
  }
  const option = point.options.find((o) => o.id === optionId);
  if (!option) {
    return encounter;
  }

  return {
    ...encounter,
    chosenOptionIds: [...encounter.chosenOptionIds, optionId],
    accumulatedModifier: round4(encounter.accumulatedModifier + option.modifier),
    decisionIndex: encounter.decisionIndex + 1,
  };
}

/** True once every decision point has been resolved. */
export function isExchangeComplete(encounter: CombatEncounter): boolean {
  return (
    encounter.decisionPoints.length > 0 &&
    encounter.decisionIndex >= encounter.decisionPoints.length
  );
}

/** The options the player chose, in order. */
function chosenOptions(encounter: CombatEncounter): DecisionOption[] {
  const options: DecisionOption[] = [];
  encounter.chosenOptionIds.forEach((id, i) => {
    const option = encounter.decisionPoints[i]?.options.find((o) => o.id === id);
    if (option) {
      options.push(option);
    }
  });
  return options;
}

// ─── Outcome Resolution ──────────────────────────────────────────────

const VICTORY_THRESHOLD = 0.15;
const DEFEAT_THRESHOLD = -0.3;

/**
 * Map a final advantage and the chosen tactics to an outcome. A clear edge
 * wins; a player who chose to flee (a majority of evasive picks) escapes rather
 * than trading blows; a clear deficit is a defeat; anything between is a
 * stalemate.
 */
export function resolveOutcome(
  finalAdvantage: number,
  evasiveCount: number,
  decisionCount: number,
): CombatOutcome {
  if (finalAdvantage >= VICTORY_THRESHOLD) {
    return "victory";
  }
  const escapeThreshold = Math.ceil(decisionCount / 2);
  if (decisionCount > 0 && evasiveCount >= escapeThreshold) {
    return "escape";
  }
  if (finalAdvantage <= DEFEAT_THRESHOLD) {
    return "defeat";
  }
  return "stalemate";
}

// ─── Consequences ────────────────────────────────────────────────────

const SANITY_OUTCOME_FACTOR: Record<CombatOutcome, number> = {
  victory: 0.5,
  escape: 1,
  stalemate: 1.2,
  defeat: 1.5,
};
const MAX_COMBAT_SANITY_DRAIN = -40;
const DOMINANT_VICTORY_MARGIN = 0.4;

function injuryDescription(severity: InjurySeverity, enemyName: string): string {
  switch (severity) {
    case "minor":
      return `Bruises and shallow cuts from the ${enemyName}.`;
    case "major":
      return `A serious wound dealt by the ${enemyName}.`;
    case "grievous":
      return `A grievous, near-crippling wound from the ${enemyName}.`;
  }
}

function makeInjury(
  encounterId: string,
  index: number,
  severity: InjurySeverity,
  enemyName: string,
): Injury {
  return {
    id: `${encounterId}-inj-${index}`,
    description: injuryDescription(severity, enemyName),
    severity,
    recoveryTurns: INJURY_RECOVERY_TURNS[severity],
  };
}

function injuriesFor(
  encounter: CombatEncounter,
  outcome: CombatOutcome,
  finalAdvantage: number,
): Injury[] {
  const { id, sequenceGap, enemy } = encounter;
  const severities: InjurySeverity[] = [];

  switch (outcome) {
    case "victory":
      if (finalAdvantage <= DOMINANT_VICTORY_MARGIN && sequenceGap < 0) {
        severities.push("minor");
      }
      break;
    case "escape":
      severities.push("minor");
      break;
    case "stalemate":
      severities.push(sequenceGap < 0 ? "major" : "minor");
      break;
    case "defeat":
      severities.push("major");
      if (sequenceGap <= -3) {
        severities.push("grievous");
      }
      break;
  }

  return severities.map((severity, index) => makeInjury(id, index, severity, enemy.name));
}

function combatSanityImpact(encounter: CombatEncounter, outcome: CombatOutcome): number {
  const horror = sanityDelta({
    type: "horror-encounter",
    playerSequence: encounter.playerSequence,
    horrorSequence: encounter.enemy.sequenceLevel,
  });
  const scaled = Math.round(horror * SANITY_OUTCOME_FACTOR[outcome]);
  return Math.max(MAX_COMBAT_SANITY_DRAIN, scaled);
}

const OUTCOME_SENTENCE: Record<CombatOutcome, (enemy: string) => string> = {
  victory: (enemy) => `You overcome the ${enemy}.`,
  defeat: (enemy) => `The ${enemy} overwhelms you.`,
  escape: (enemy) => `You break away from the ${enemy} and escape.`,
  stalemate: (enemy) =>
    `Neither you nor the ${enemy} can force a decision; you part bloodied.`,
};

function narrativeSummary(encounter: CombatEncounter, outcome: CombatOutcome): string {
  const style = getCombatStyle(encounter.playerPathwayId);
  return `${OUTCOME_SENTENCE[outcome](encounter.enemy.name)} ${style.flavor}`;
}

/**
 * Compute the full consequences of a resolved encounter: injuries scaled to the
 * outcome and sequence gap, sanity drain, loot gained, materials/artifacts
 * spent, and any characteristic dropped by a slain Beyonder.
 */
export function computeConsequences(
  encounter: CombatEncounter,
  outcome: CombatOutcome,
  finalAdvantage: number,
): CombatResult {
  const chosen = chosenOptions(encounter);
  const consumedArtifacts = chosen.filter((o) => o.consumesArtifact).length;

  const ritualMaterials = encounter.preparation?.ritualMaterials ?? [];
  const sealedArtifacts = encounter.preparation?.sealedArtifacts ?? [];
  const itemsLost: Item[] = [
    ...ritualMaterials,
    ...sealedArtifacts.slice(0, consumedArtifacts),
  ];

  const itemsGained: Item[] = outcome === "victory" ? (encounter.enemy.loot ?? []) : [];

  const characteristicsDropped: BeyonderCharacteristic[] =
    outcome === "victory" &&
    encounter.enemy.isBeyonder &&
    encounter.enemy.pathwayId !== undefined
      ? [
          {
            pathwayId: encounter.enemy.pathwayId,
            sequenceLevel: encounter.enemy.sequenceLevel,
            quantity: 1,
          },
        ]
      : [];

  return {
    outcome,
    injuries: injuriesFor(encounter, outcome, finalAdvantage),
    sanityImpact: combatSanityImpact(encounter, outcome),
    itemsGained,
    itemsLost,
    characteristicsDropped,
    narrativeSummary: narrativeSummary(encounter, outcome),
  };
}

/**
 * Resolve the encounter into a final outcome and consequences. Computes the
 * final advantage (base + chosen modifiers), determines the outcome, and
 * advances to the `resolution` phase. A no-op once already resolved.
 */
export function resolveEncounter(encounter: CombatEncounter): CombatEncounter {
  if (encounter.phase === "resolution") {
    return encounter;
  }

  const finalAdvantage = round4(encounter.baseAdvantage + encounter.accumulatedModifier);
  const chosen = chosenOptions(encounter);
  const evasiveCount = chosen.filter((o) => o.kind === "evasive").length;
  const outcome = resolveOutcome(
    finalAdvantage,
    evasiveCount,
    encounter.decisionPoints.length,
  );
  const result = computeConsequences(encounter, outcome, finalAdvantage);

  return { ...encounter, phase: "resolution", outcome, result };
}

// ─── Applying Results to Game State ──────────────────────────────────

function removeItems(inventory: Item[], lost: Item[]): Item[] {
  const remaining = [...inventory];
  for (const item of lost) {
    const index = remaining.findIndex((i) => i.name === item.name);
    if (index !== -1) {
      remaining.splice(index, 1);
    }
  }
  return remaining;
}

/**
 * Apply a combat result to the game state: clamp the sanity drain, drop spent
 * materials/artifacts, add loot, and record any new injuries. Dropped enemy
 * characteristics are surfaced in the result but not added to a player ledger
 * (the game state holds no characteristic inventory yet).
 */
export function applyCombatResult(state: GameState, result: CombatResult): GameState {
  const sanity = clamp(state.sanity + result.sanityImpact, 0, state.maxSanity);
  let inventory = state.inventory;
  if (result.itemsLost.length > 0) {
    inventory = removeItems(inventory, result.itemsLost);
  }
  if (result.itemsGained.length > 0) {
    inventory = [...inventory, ...result.itemsGained];
  }

  const next: GameState = { ...state, sanity, inventory };
  if (result.injuries.length > 0) {
    next.injuries = [...(state.injuries ?? []), ...result.injuries];
  }
  return next;
}

const COMBAT_PHASES = ["preparation", "exchange", "resolution"];

/**
 * Validate a deserialized combat encounter's shape before trusting it. The
 * encounter is the most complex serialized object in the game and is fed
 * straight into the engine and the UI, so — like `isValidSessionShape` — we
 * reject unknown JSON rather than coerce it. Checks the fields the engine and
 * view index into; nested option details are tolerated.
 */
export function isValidEncounterShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const e = obj as Record<string, unknown>;
  if (typeof e.id !== "string" || e.id.length === 0) return false;
  if (!COMBAT_PHASES.includes(e.phase as string)) return false;
  if (typeof e.enemy !== "object" || e.enemy === null) return false;
  const enemy = e.enemy as Record<string, unknown>;
  if (typeof enemy.name !== "string") return false;
  if (!Number.isFinite(enemy.sequenceLevel)) return false;
  if (typeof enemy.isBeyonder !== "boolean") return false;
  if (!Number.isFinite(e.playerPathwayId)) return false;
  if (!Number.isFinite(e.playerSequence)) return false;
  if (!Number.isFinite(e.decisionIndex)) return false;
  if (!Array.isArray(e.decisionPoints)) return false;
  if (!Array.isArray(e.chosenOptionIds)) return false;
  return true;
}

/**
 * Heal active injuries by one turn of normal play, dropping any that reach full
 * recovery. A no-op when the player carries no injuries.
 */
export function tickInjuries(state: GameState): GameState {
  if (!state.injuries || state.injuries.length === 0) {
    return state;
  }
  const injuries = state.injuries
    .map((injury) => ({ ...injury, recoveryTurns: injury.recoveryTurns - 1 }))
    .filter((injury) => injury.recoveryTurns > 0);
  return { ...state, injuries };
}

export {
  VICTORY_THRESHOLD,
  DEFEAT_THRESHOLD,
  DECISION_POINT_COUNT,
  INJURY_RECOVERY_TURNS,
  INJURY_PENALTY_CAP,
};
