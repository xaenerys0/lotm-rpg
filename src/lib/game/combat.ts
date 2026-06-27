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
  EncounterContext,
  EncounterFraming,
  Injury,
  InjurySeverity,
  IntelligenceLevel,
  PathwayMatchup,
  PreparationQuality,
  PreparationTier,
  ResolutionLine,
  TerrainAdvantage,
} from "@/lib/types/combat";
import { getGroupForPathway } from "@/lib/rules";
import {
  gradeForArtifactItem,
  bestiaryFor,
  bestiaryFoeSequence,
  type ArtifactGrade,
  type BestiaryFoe,
} from "@/lib/lore";
import { sanityDelta } from "./sanity";
import { clamp, round4 } from "./math";
import { isConsumable, removeItemsByName } from "./inventory";
import type { TrackedDisposition, TrackedNpcState } from "./tracked-npcs";
import { abilityKindTag, combatKitFor } from "./combat-abilities";
import type { CombatAbility } from "@/lib/types/combat";

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
    input.sealedArtifacts.reduce(
      (sum, artifact) => sum + artifactPrepWeight(gradeForArtifactItem(artifact)),
      0,
    ),
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
  // Darkness — the Sleepless strikes from concealment and the dark.
  5: {
    flavor: "You melt into the dark and strike where you are not expected.",
    signatureKind: "evasive",
    options: {
      aggressive: {
        label: "Strike from the dark",
        description: "Lunge from a pool of shadow before they can place you.",
      },
      defensive: {
        label: "Veil of night",
        description: "Wrap the dark close and dull the force of the blow.",
      },
      evasive: {
        label: "Vanish into shadow",
        description: "Slip into the dark and surface a step beyond their reach.",
      },
      ability: {
        label: "Pacify the mind",
        description: "Press a numbing quiet over their will to blunt the assault.",
      },
      artifact: {
        label: "Unseal the charm",
        description: "Break a sealed charm and loose what sleeps inside.",
      },
    },
  },
  // Tyrant — the Sailor answers with the fury of the storm and sea.
  6: {
    flavor: "You answer with the fury of storm and rising sea.",
    signatureKind: "aggressive",
    options: {
      aggressive: {
        label: "Unleash the tempest",
        description: "Loose your mounting wrath as a battering surge of wind and water.",
      },
      defensive: {
        label: "Brace against the gale",
        description: "Set your feet like a deck in a storm and ride the impact.",
      },
      evasive: {
        label: "Slip the current",
        description: "Flow aside like water and let the strike pass through spray.",
      },
      ability: {
        label: "Call the squall",
        description: "Summon wind and rain to harry and unbalance the foe.",
      },
      artifact: {
        label: "Unseal the relic",
        description: "Break a storm-charged seal and call its power forth.",
      },
    },
  },
  // Door — the Apprentice repositions through space.
  7: {
    flavor: "You fold the space between you and never stand where they strike.",
    signatureKind: "evasive",
    options: {
      aggressive: {
        label: "Blink and strike",
        description: "Flash through space to land a blow from an impossible angle.",
      },
      defensive: {
        label: "Door of refuge",
        description: "Open a brief door so the blow falls on empty air.",
      },
      evasive: {
        label: "Step through the door",
        description: "Phase across space, out of reach before the strike lands.",
      },
      ability: {
        label: "Replay a record",
        description: "Loose a recorded power you have stored for just this moment.",
      },
      artifact: {
        label: "Unseal the charm",
        description: "Break a sealed charm and loose what sleeps inside.",
      },
    },
  },
  // Error — the Marauder fights with stolen tricks and sleight of hand.
  8: {
    flavor: "You fight with stolen tricks and sleight of hand.",
    signatureKind: "ability",
    options: {
      aggressive: {
        label: "Strike at the opening",
        description: "Read where their guard fails and take the opening you stole.",
      },
      defensive: {
        label: "Misdirect the blow",
        description: "Feint and deceive so the strike lands where you no longer are.",
      },
      evasive: {
        label: "Pocket and slip away",
        description: "Lift what you can and vanish into the confusion.",
      },
      ability: {
        label: "Turn their own trick",
        description: "Wield a power or tell you stole from the foe against them.",
      },
      artifact: {
        label: "Unseal the charm",
        description: "Break a sealed charm and loose what sleeps inside.",
      },
    },
  },
  // Hanged Man — the Secrets Suppliant endures through sacrifice and shadow.
  9: {
    flavor: "You pay in flesh and shadow what the fight demands, and endure.",
    signatureKind: "defensive",
    options: {
      aggressive: {
        label: "Loose the shadows",
        description: "Send summoned shadows clawing forward at the foe.",
      },
      defensive: {
        label: "Offer the sacrifice",
        description: "Spend flesh and blood to harden yourself against the blow.",
      },
      evasive: {
        label: "Lurk in shadow",
        description: "Sink into your own shadow and wait out the assault.",
      },
      ability: {
        label: "Shadow curse",
        description: "Lay a curse through their shadow to sap their strength.",
      },
      artifact: {
        label: "Unseal the reliquary",
        description: "Break a bound vessel and free the rite within.",
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

// Sealed Artifact combat power scales by danger grade (issue #171): a Grade 0
// (Angel-tier) relic swings a fight harder than a Grade 3, BUT the scaling is
// deliberately MODERATE and capped — one mid-fight invoke is still only one
// option among the sequence gap, matchup, and preparation that decide a fight,
// so a well-prepared Beyonder beats an artifact-wielder (the engine's
// "preparation helps but never decides" rule holds). An item with no resolvable
// catalogue grade keeps the prior flat baseline so balance is unchanged for it.
const ARTIFACT_GRADE_POWER: Record<ArtifactGrade, number> = {
  0: 0.36,
  1: 0.3,
  2: 0.24,
  3: 0.18,
};
const ARTIFACT_GRADE_PREP: Record<ArtifactGrade, number> = {
  0: 0.16,
  1: 0.13,
  2: 0.1,
  3: 0.08,
};

/** Mid-fight invoke modifier for a Sealed Artifact of the given grade (flat fallback). */
function artifactPower(grade: ArtifactGrade | undefined): number {
  return grade === undefined ? OPTION_MODIFIER.artifact : ARTIFACT_GRADE_POWER[grade];
}

/** Readied-preparation score contribution for one artifact, by grade (flat fallback). */
function artifactPrepWeight(grade: ArtifactGrade | undefined): number {
  return grade === undefined ? PER_SEALED_ARTIFACT : ARTIFACT_GRADE_PREP[grade];
}

/** Dynamic carried-artifact options offered per decision point. */
export const MAX_DYNAMIC_ARTIFACT_OPTIONS_PER_POINT = 1;

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
  artifactGrade?: ArtifactGrade,
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
      modifier = artifactPower(artifactGrade);
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

/** Legible, plain-language effect tags for the templated tactics (clarity). */
const KIND_EFFECT_TAG: Record<DecisionKind, string> = {
  aggressive: "Aggressive — strong with an edge, risky without",
  defensive: "Defensive — steadies the fight",
  evasive: "Evasive — buys distance · counts toward escape",
  ability: "Pathway power",
  artifact: "Artifact — potent, but a backlash on your mind",
};

/** How many kit ability options to surface per decision point. */
const MAX_KIT_OPTIONS_PER_POINT = 2;

/**
 * The advantage modifier for a kit ability invoked mid-fight (issue #187,
 * Phase 2). Built from the ability's `potency`: an offensive gambit pays off
 * only with an edge; a control/utility play lands better when you know the foe
 * (intel); an ability that counters the encounter's framing gets a small bump.
 * Stays within the same bounded band as the templated options.
 */
function kitOptionModifier(
  ability: CombatAbility,
  edge: number,
  intel: number,
  framing: EncounterFraming,
): number {
  let modifier = ability.potency;
  if (ability.kind === "offensive") {
    modifier = edge >= EDGE_THRESHOLD ? modifier : modifier * 0.4;
  }
  if (ability.kind === "control" || ability.kind === "utility") {
    modifier += OPTION_MODIFIER.abilityIntel * intel * 0.5;
  }
  if (ability.counters?.includes(framing)) {
    modifier += 0.04;
  }
  return round4(modifier);
}

/**
 * The non-lethal resolution line offered at a decision point, by framing
 * (issue #187, Phase 4): a snap-free line for a puppeteered/coerced opponent, a
 * talk-down line for any other reconcilable framing, and a subdue line for a
 * genuine foe (you can still choose to take them down without killing).
 */
function lineForFraming(framing: EncounterFraming): {
  line: ResolutionLine;
  label: string;
  description: string;
  tag: string;
} {
  if (framing === "mind-controlled" || framing === "coerced") {
    return {
      line: "free",
      label: "Try to snap them free",
      description:
        "Pour your effort into breaking the hold on them, not into hurting them.",
      tag: "Snap-free — commit across the fight to restore them",
    };
  }
  if (isReconcilableFraming(framing)) {
    return {
      line: "talk-down",
      label: "Try to talk them down",
      description:
        "Reach them with words — reason, intimidation, the truth of the matter.",
      tag: "De-escalate — sustain it to end the fight without blood",
    };
  }
  return {
    line: "subdue",
    label: "Subdue without killing",
    description: "Pull your strikes — aim to put them down, not to end them.",
    tag: "Non-lethal — win without a kill",
  };
}

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
  const kit = encounter.availableKit ?? [];
  const framing: EncounterFraming =
    encounter.context?.framing ??
    (encounter.enemy.isBeyonder ? "hostile-beyonder" : "mundane-threat");

  // Dynamic mid-fight capabilities: the player's actual learned abilities and
  // carried artifacts, offered in the moment (not only what was readied during
  // preparation). Deterministic — selection keys off the encounter's stored
  // capability lists and the point index, never fresh randomness — so a
  // serialized fight regenerates the same options.
  const availableAbilities = encounter.availableAbilities ?? [];
  // Dynamic artifact pool: carried artifacts NOT already readied as sealed-prep
  // artifacts. A sealed item is consumed through the templated artifact slot, so
  // offering it dynamically too would let one physical item be spent — and add
  // its modifier — twice. Matched by name, consistent with `removeItemsByName`.
  const sealedNames = new Set(
    (encounter.preparation?.sealedArtifacts ?? []).map((a) => a.name),
  );
  const dynamicArtifactPool = (encounter.availableArtifacts ?? []).filter(
    (a) => !sealedNames.has(a.name),
  );

  let artifactsAllocated = 0;
  // Cursor into `dynamicArtifactPool` so each carried artifact is offered at
  // most once across the whole fight (never re-offered at a later point).
  let dynamicArtifactIndex = 0;
  const points: DecisionPoint[] = [];

  for (let i = 0; i < DECISION_POINT_COUNT; i++) {
    const pointId = `${encounter.id}-dp${i}`;
    const kinds = POINT_KINDS[i];
    const readiedArtifacts = encounter.preparation?.sealedArtifacts ?? [];
    const options: DecisionOption[] = kinds.map((requestedKind) => {
      let kind = requestedKind;
      let consumesArtifact = false;
      // The templated artifact slot spends readied artifacts in order; its power
      // scales with the grade of the specific one consumed (issue #171).
      let artifactGrade: ArtifactGrade | undefined;
      if (kind === "artifact") {
        if (artifactsAllocated < artifactsAvailable) {
          artifactGrade = gradeForArtifactItem(readiedArtifacts[artifactsAllocated]);
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
        modifier: optionModifier(
          kind,
          edge,
          intel,
          kind === style.signatureKind,
          artifactGrade,
        ),
        effectTag: KIND_EFFECT_TAG[kind],
      };
      if (consumesArtifact) {
        option.consumesArtifact = true;
      }
      return option;
    });

    // Append dynamic ability options from the player's COMBAT KIT (issue #187,
    // Phase 2): the canon abilities promoted to costed combat tools, each with a
    // role tag and a potency-derived modifier. Rotated by point index so they
    // vary without repeating in a point and without any randomness.
    if (kit.length > 0) {
      const seen = new Set<number>();
      for (let k = 0; k < MAX_KIT_OPTIONS_PER_POINT; k++) {
        const idx = (i + k) % kit.length;
        if (seen.has(idx)) break;
        seen.add(idx);
        const ability = kit[idx];
        options.push({
          id: `${pointId}-kit-${ability.id}`,
          label: `Invoke ${ability.name}`,
          kind: "ability",
          description: ability.description,
          modifier: kitOptionModifier(ability, edge, intel, framing),
          abilityName: ability.name,
          effectTag: abilityKindTag(ability.kind),
        });
      }
    }

    // Append one acquired/stolen-power option (issue #187: the kit covers the
    // pathway's own abilities, so `availableAbilities` now carries only copied
    // powers — see `game-loop.tsx`). Picked by point index.
    if (availableAbilities.length > 0) {
      const idx = i % availableAbilities.length;
      const ability = availableAbilities[idx];
      options.push({
        id: `${pointId}-dyn-ability-${idx}`,
        label: `Invoke ${ability}`,
        kind: "ability",
        description: `Turn your ${ability} on the ${enemyName}.`,
        modifier: optionModifier(
          "ability",
          edge,
          intel,
          style.signatureKind === "ability",
        ),
        abilityName: ability,
        effectTag: "Acquired power",
      });
    }

    // Append dynamic artifact options — carried artifacts unsealed in the
    // moment, consumed when used. The cursor walks the pool so each artifact is
    // offered at most once across the fight (never the same item twice).
    for (let k = 0; k < MAX_DYNAMIC_ARTIFACT_OPTIONS_PER_POINT; k++) {
      if (dynamicArtifactIndex >= dynamicArtifactPool.length) break;
      const artifact = dynamicArtifactPool[dynamicArtifactIndex];
      dynamicArtifactIndex++;
      options.push({
        id: `${pointId}-dyn-artifact-${i}-${k}`,
        label: `Unleash ${artifact.name}`,
        kind: "artifact",
        description: `Break the seal on ${artifact.name} and loose its power on the ${enemyName}.`,
        modifier: optionModifier(
          "artifact",
          edge,
          intel,
          style.signatureKind === "artifact",
          gradeForArtifactItem(artifact),
        ),
        consumesArtifact: true,
        artifactItem: artifact,
        effectTag: KIND_EFFECT_TAG.artifact,
      });
    }

    // Append the outcome-spectrum lines (issue #187, Phase 4): a framing-keyed
    // non-lethal line every point (snap-free / talk-down / subdue), plus the
    // decisive-win dispositions (capture / spare) at the final point.
    const line = lineForFraming(framing);
    options.push({
      id: `${pointId}-line-${line.line}`,
      // A snap-free / talk-down line trades blows for effort, so it is modelled
      // as a defensive-weight modifier — it does not push your raw advantage.
      label: line.label,
      kind: line.line === "subdue" ? "aggressive" : "defensive",
      description: line.description,
      modifier:
        line.line === "subdue" ? OPTION_MODIFIER.defensive : OPTION_MODIFIER.evasive,
      resolutionLine: line.line,
      effectTag: line.tag,
    });

    if (i === DECISION_POINT_COUNT - 1) {
      options.push({
        id: `${pointId}-line-capture`,
        label: "Beat them, then take them alive",
        kind: "aggressive",
        description: "Press for a decisive win — but to capture, not to kill.",
        modifier: optionModifier("aggressive", edge, intel, false),
        resolutionLine: "capture",
        effectTag: "Capture — on a win, take them prisoner (a lead, not loot)",
      });
      options.push({
        id: `${pointId}-line-spare`,
        label: "Beat them, then let them live",
        kind: "aggressive",
        description: "Press for a decisive win — then stay your hand.",
        modifier: optionModifier("aggressive", edge, intel, false),
        resolutionLine: "spare",
        effectTag: "Spare — win, but leave them alive",
      });
    }

    points.push({
      id: pointId,
      prompt: DECISION_PROMPTS[i](enemyName),
      options,
    });
  }

  return points;
}

// ─── Encounter Lifecycle ─────────────────────────────────────────────

// ─── Encounter Framing & Opponent Selection (issue #187, Phase 1) ────

/**
 * The framings under which a fight can still end without bloodshed — the
 * opponent is not truly your enemy (puppeteered, coerced, broken, or simply at
 * cross-purposes), so a snap-free / talk-down / subdue line is available. A
 * genuine hostile, a mundane threat, or a mindless beast is not reconcilable.
 */
const RECONCILABLE_FRAMINGS = new Set<EncounterFraming>([
  "mind-controlled",
  "coerced",
  "lost-control",
  "rival-motive",
]);

export function isReconcilableFraming(framing: EncounterFraming): boolean {
  return RECONCILABLE_FRAMINGS.has(framing);
}

/** The reconcilable framing an ally is forced into when they attack you. */
const ALLY_DEFAULT_FRAMING: EncounterFraming = "mind-controlled";

/**
 * Engine truth over an AI string: an **ally** who fights you can never be a
 * plain `hostile-beyonder` / `mundane-threat` / `beast`. A non-reconcilable
 * framing proposed for an ally is coerced to `mind-controlled` (the
 * most-common canon reason a comrade turns on you). Any other disposition keeps
 * the proposed framing. This is the validation the design calls for — an ally
 * combatant is forced reconcilable, or the fight is refused.
 */
export function coerceAllyFraming(
  framing: EncounterFraming,
  disposition: TrackedDisposition | undefined,
): EncounterFraming {
  if (disposition === "ally" && !isReconcilableFraming(framing)) {
    return ALLY_DEFAULT_FRAMING;
  }
  return framing;
}

/** Build an `EncounterContext`, deriving `reconcilable` from the framing. */
export function makeEncounterContext(
  framing: EncounterFraming,
  opts: { isKnownPerson: boolean; controllerName?: string; motive?: string } = {
    isKnownPerson: false,
  },
): EncounterContext {
  return {
    framing,
    isKnownPerson: opts.isKnownPerson,
    ...(opts.controllerName !== undefined ? { controllerName: opts.controllerName } : {}),
    ...(opts.motive !== undefined ? { motive: opts.motive } : {}),
    reconcilable: isReconcilableFraming(framing),
  };
}

/** A short, player-facing label for a framing (threat card + narration). */
const FRAMING_LABEL: Record<EncounterFraming, string> = {
  "hostile-beyonder": "Hostile Beyonder",
  "mundane-threat": "Mundane threat",
  "mind-controlled": "Mind-controlled",
  "lost-control": "Lost control",
  "rival-motive": "Rival with their own agenda",
  coerced: "Coerced against their will",
  beast: "Supernatural beast",
};

export function framingLabel(framing: EncounterFraming): string {
  return FRAMING_LABEL[framing];
}

/** One-line, player-facing framing summary for the threat-assessment card. */
export function describeFraming(context: EncounterContext): string {
  if (context.motive) return context.motive;
  switch (context.framing) {
    case "mind-controlled":
      return context.controllerName
        ? `Puppeteered by ${context.controllerName} — they are fighting against their will.`
        : "Puppeteered by another Beyonder — they are fighting against their will.";
    case "coerced":
      return "Forced to attack you against their will.";
    case "lost-control":
      return "They have lost control of themselves — more danger than malice.";
    case "rival-motive":
      return "Not truly your foe — they have an agenda of their own.";
    case "beast":
      return "A supernatural creature, beyond reason.";
    case "mundane-threat":
      return "An ordinary, mortal danger.";
    case "hostile-beyonder":
      return "A genuine enemy Beyonder.";
  }
}

/** The disposition the roster records for a named NPC, if any. */
function dispositionFor(
  name: string,
  trackedNpcState: TrackedNpcState | undefined,
): TrackedDisposition | undefined {
  return trackedNpcState?.roster.find((npc) => npc.name === name)?.disposition;
}

/**
 * The framing for a present, named NPC who comes to blows with the player,
 * derived from the durable roster disposition: an **ally** is reframed (forced
 * reconcilable — they don't truly want this), a roster **hostile** is a genuine
 * enemy, and anyone else is a rival with their own agenda (still reconcilable —
 * a scene can end in words). The engine derives this; an AI-proposed framing is
 * still validated through `coerceAllyFraming`.
 */
function framingForNpc(
  name: string,
  trackedNpcState: TrackedNpcState | undefined,
): EncounterFraming {
  const disposition = dispositionFor(name, trackedNpcState);
  if (disposition === "ally") return ALLY_DEFAULT_FRAMING;
  if (disposition === "hostile") return "hostile-beyonder";
  return "rival-motive";
}

/** A framed opponent the player may choose to fight (surfaced as a target list). */
export interface OpponentOption {
  enemy: Enemy;
  context: EncounterContext;
  /** Where this opponent came from, for the target-selection UI. */
  source: "present-npc" | "pursuer" | "bestiary";
}

export interface SelectOpponentsOptions {
  /** True for an ambush — opponents strike at an even footing, no framing reframe. */
  ambush?: boolean;
  /** The durable roster, so allies are reframed and pursuers surface as targets. */
  trackedNpcState?: TrackedNpcState;
  /** City id for bestiary region filtering; defaults to `state.currentCity`. */
  regionId?: string;
  /** Max curated bestiary picks to surface (default 3). */
  maxBestiary?: number;
}

const DEFAULT_MAX_BESTIARY = 3;

/** Convert a curated bestiary foe into a concrete, Sequence-scaled enemy. */
export function bestiaryFoeToEnemy(foe: BestiaryFoe, playerSequence: number): Enemy {
  return {
    name: foe.name,
    sequenceLevel: bestiaryFoeSequence(foe, playerSequence),
    isBeyonder: foe.isBeyonder,
    description: foe.description,
    ...(foe.pathwayId !== undefined ? { pathwayId: foe.pathwayId } : {}),
    knownAbilities: foe.signatureAbilities,
    bestiaryId: foe.id,
  };
}

/**
 * Scale a non-bestiary opponent to the player: a known confrontation faces a
 * Beyonder a step stronger; an ambusher strikes at an even, mundane footing.
 * The single place this difficulty rule lives (shared by present-NPC opponents
 * and the generic fallback) so a balance change is made once.
 */
function scaledEnemy(
  name: string,
  description: string,
  state: GameState,
  ambush: boolean,
): Enemy {
  return {
    name,
    sequenceLevel: Math.max(0, ambush ? state.sequenceLevel : state.sequenceLevel - 1),
    isBeyonder: !ambush,
    description,
  };
}

/** The enemy stats for a present, named NPC opponent (Sequence scaled to play). */
function npcEnemy(name: string, state: GameState, ambush: boolean): Enemy {
  return scaledEnemy(
    name,
    ambush
      ? "Someone from the scene turns on you without warning."
      : "Someone present in the scene squares off against you.",
    state,
    ambush,
  );
}

/**
 * The framed target list for the current scene (issue #187, Phase 1) — the
 * explicit "who do you fight, and why?" step that retires the silent
 * `npcsPresent[0]` auto-pick. Surfaces, in order: the present NPCs (each with a
 * disposition-derived framing — an ally is reframed, never gated out), any
 * roster pursuers not already in the scene, and curated bestiary picks fitting
 * the region and the player's Sequence. Pure and deterministic.
 */
export function selectOpponents(
  state: GameState,
  opts: SelectOpponentsOptions = {},
): OpponentOption[] {
  const ambush = opts.ambush ?? false;
  const regionId = opts.regionId ?? state.currentCity;
  const maxBestiary = opts.maxBestiary ?? DEFAULT_MAX_BESTIARY;
  const options: OpponentOption[] = [];
  const seenNames = new Set<string>();

  // 1. Present NPCs — each offered WITH a framing (allies reframed reconcilable).
  for (const name of state.npcsPresent) {
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    const framing = framingForNpc(name, opts.trackedNpcState);
    options.push({
      enemy: npcEnemy(name, state, ambush),
      context: makeEncounterContext(framing, { isKnownPerson: true }),
      source: "present-npc",
    });
  }

  // 2. Roster pursuers not already present — hostiles who follow you.
  for (const npc of opts.trackedNpcState?.roster ?? []) {
    if (npc.disposition !== "hostile" || !npc.follows) continue;
    if (seenNames.has(npc.name)) continue;
    seenNames.add(npc.name);
    options.push({
      enemy: npcEnemy(npc.name, state, ambush),
      context: makeEncounterContext("hostile-beyonder", { isKnownPerson: true }),
      source: "pursuer",
    });
  }

  // 3. Curated bestiary picks for the region + Sequence band.
  for (const foe of bestiaryFor(regionId, state.sequenceLevel).slice(0, maxBestiary)) {
    options.push({
      enemy: bestiaryFoeToEnemy(foe, state.sequenceLevel),
      context: makeEncounterContext(foe.framing, {
        isKnownPerson: false,
        ...(foe.motive !== undefined ? { motive: foe.motive } : {}),
      }),
      source: "bestiary",
    });
  }

  return options;
}

/**
 * The guaranteed fallback opponent when the scene surfaces no framed target —
 * a generic, but now-framed, threat scaled to the player. Replaces the old bare
 * `"a lurking Beyonder"` / `"an assailant in the fog"` with the same strings
 * carrying an explicit framing and reconcilability.
 */
function fallbackOpponent(state: GameState, ambush: boolean): OpponentOption {
  const enemy = scaledEnemy(
    ambush ? "an assailant in the fog" : "a lurking Beyonder",
    ambush
      ? "A sudden attacker, seizing the advantage of surprise."
      : "A known threat you have chosen to confront.",
    state,
    ambush,
  );
  const framing: EncounterFraming = ambush ? "mundane-threat" : "hostile-beyonder";
  return {
    enemy,
    context: makeEncounterContext(framing, { isKnownPerson: false }),
    source: "bestiary",
  };
}

/**
 * Derive a single framed opponent for the current scene (the engine entry point
 * the hunt path and any non-picker caller use). Prefers a present NPC or a
 * roster pursuer — each carrying its disposition-derived framing — and otherwise
 * returns the generic framed fallback. The curated bestiary enriches the
 * EXPLICIT target picker (`selectOpponents`), not this silent single pick, so
 * the auto-path stays predictable. Replaces the old `npcsPresent[0]` grab: an
 * ally present is now reframed (mind-controlled), never silently a plain foe.
 */
export function deriveEncounter(
  state: GameState,
  opts: SelectOpponentsOptions = {},
): OpponentOption {
  for (const option of selectOpponents(state, opts)) {
    if (option.source === "present-npc" || option.source === "pursuer") return option;
  }
  return fallbackOpponent(state, opts.ambush ?? false);
}

/**
 * Backward-compatible enemy-only derivation: the framed enemy of
 * `deriveEncounter`. Prefer `deriveEncounter`/`selectOpponents` so the
 * `EncounterContext` is carried; this remains for callers that only need the
 * `Enemy`.
 */
export function deriveEncounterEnemy(
  state: GameState,
  ambush: boolean,
  opts: Omit<SelectOpponentsOptions, "ambush"> = {},
): Enemy {
  return deriveEncounter(state, { ...opts, ambush }).enemy;
}

/**
 * What the player has learned about a foe, gated by their intelligence level —
 * the "learned info pertinent to combat" the UI reveals alongside the enemy's
 * name and description. `none` shows nothing beyond the basics; `partial` reads
 * their rough strength (and pathway, if known) without exact numbers;
 * `thorough` reveals the exact sequence and any abilities learned of. Pure data.
 */
export interface EnemyIntel {
  name: string;
  description?: string;
  /** A coarse strength read vs the player; revealed at `partial` and above. */
  strength: string | null;
  /** The enemy's exact sequence; revealed only at `thorough`. */
  sequenceLevel: number | null;
  /** The enemy's pathway id, if a known Beyonder; revealed at `partial`+. */
  pathwayId: number | null;
  /** Abilities the player has learned the foe wields; revealed at `thorough`. */
  knownAbilities: string[];
}

/**
 * Format what the player knows of an enemy for display, gated by their
 * intelligence level. Reveals only what was actually scouted — never fabricates
 * data the enemy does not carry. Pure.
 */
export function enemyIntel(
  enemy: Enemy,
  intel: IntelligenceLevel,
  playerSequence: number,
): EnemyIntel {
  const base: EnemyIntel = {
    name: enemy.name,
    ...(enemy.description !== undefined ? { description: enemy.description } : {}),
    strength: null,
    sequenceLevel: null,
    pathwayId: null,
    knownAbilities: [],
  };
  if (intel === "none") return base;

  // Positive gap means the enemy holds the higher (weaker) Sequence number.
  const gap = computeSequenceGap(playerSequence, enemy.sequenceLevel);
  const strength =
    gap > 0
      ? "weaker than you"
      : gap < 0
        ? "stronger than you"
        : "your equal in standing";
  const partial: EnemyIntel = {
    ...base,
    strength,
    pathwayId: enemy.isBeyonder ? (enemy.pathwayId ?? null) : null,
  };
  if (intel === "partial") return partial;

  return {
    ...partial,
    sequenceLevel: enemy.sequenceLevel,
    knownAbilities: enemy.knownAbilities ?? [],
  };
}

export interface CreateEncounterOptions {
  id: string;
  enemy: Enemy;
  /** Why this fight is happening (issue #187). Defaults to a generic framing. */
  context?: EncounterContext;
  playerPathwayId: number;
  playerSequence: number;
  /** True for an ambush — skips the preparation phase. */
  ambush?: boolean;
  /** Random factor in [0, 1]; defaults to `Math.random()`. Injected in tests. */
  randomFactor?: number;
  /** The player's active injuries, which penalise their advantage. */
  injuries?: Injury[];
  /** Learned abilities offered as dynamic mid-fight options. */
  availableAbilities?: string[];
  /** Carried artifacts (non-reagent) offered as dynamic mid-fight options. */
  availableArtifacts?: Item[];
  /** Potion-preparation hunt objective (issue #84): the Characteristic sought. */
  huntTarget?: string;
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

  const context =
    options.context ??
    makeEncounterContext(
      options.enemy.isBeyonder ? "hostile-beyonder" : "mundane-threat",
      {
        isKnownPerson: false,
      },
    );
  // An ally opponent is forced reconcilable — but we have no roster here, so the
  // caller (`selectOpponents`) already validated via `coerceAllyFraming`; the
  // passed-in context is trusted, defaulting only when absent.

  const encounter: CombatEncounter = {
    id: options.id,
    enemy: options.enemy,
    context,
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
    availableAbilities: options.availableAbilities ?? [],
    availableArtifacts: options.availableArtifacts ?? [],
    availableKit: combatKitFor(options.playerPathwayId, options.playerSequence),
    ...(options.huntTarget !== undefined ? { huntTarget: options.huntTarget } : {}),
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

const INTELLIGENCE_NARRATION: Record<IntelligenceLevel, string> = {
  none: "no intelligence on the foe",
  partial: "partial intelligence on the foe",
  thorough: "thorough intelligence on the foe",
};

const TERRAIN_NARRATION: Record<TerrainAdvantage, string> = {
  none: "no terrain advantage",
  neutral: "surveyed, neutral ground",
  favorable: "favourable ground of their choosing",
};

/**
 * A plain-language summary of the choices the player has actually committed in
 * this encounter — the preparation (intelligence, terrain, readied abilities,
 * sealed artifacts, ritual materials) and, once the exchange is under way, the
 * tactical options chosen in order. The combat-narration prompt appends this so
 * the narrated fight reflects what the player did rather than a generic clash.
 * Returns "" before the player has committed anything (the bare preparation
 * phase), so the opening line stays clean.
 */
export function combatNarrationContext(encounter: CombatEncounter): string {
  const parts: string[] = [];

  // Encounter framing first (issue #187, Phase 6) — so the narrated fight reads
  // as what it is: a mind-controlled comrade, a coerced ally, a lurking beast.
  // Only the SPECIAL framings narrate; the two defaults (a plain hostile or a
  // plain mundane threat) stay silent so an ordinary fight's opening reads clean.
  const context = encounter.context;
  if (
    context &&
    context.framing !== "hostile-beyonder" &&
    context.framing !== "mundane-threat"
  ) {
    parts.push(
      `This fight is framed as: ${framingLabel(context.framing)} — ${describeFraming(context)}`,
    );
  }

  const prep = encounter.preparation;
  if (prep) {
    const prepBits: string[] = [
      INTELLIGENCE_NARRATION[prep.intelligence],
      TERRAIN_NARRATION[prep.terrain],
    ];
    if (prep.readiedAbilities.length > 0) {
      prepBits.push(`readied abilities: ${prep.readiedAbilities.join(", ")}`);
    }
    if (prep.sealedArtifacts.length > 0) {
      prepBits.push(
        `sealed artifacts: ${prep.sealedArtifacts.map((a) => a.name).join(", ")}`,
      );
    }
    if (prep.ritualMaterials.length > 0) {
      prepBits.push(
        `ritual materials: ${prep.ritualMaterials.map((m) => m.name).join(", ")}`,
      );
    }
    parts.push(`The player entered with ${prepBits.join("; ")}.`);
  }

  const chosen = chosenOptions(encounter);
  if (chosen.length > 0) {
    parts.push(`Tactics chosen, in order: ${chosen.map((o) => o.label).join("; ")}.`);
  }

  return parts.join(" ");
}

// ─── Outcome Resolution ──────────────────────────────────────────────

const VICTORY_THRESHOLD = 0.15;
const DEFEAT_THRESHOLD = -0.3;

/** The chosen resolution lines, tallied (issue #187, Phase 4). */
export type ResolutionLineTally = Record<ResolutionLine, number>;

function emptyLineTally(): ResolutionLineTally {
  return { subdue: 0, free: 0, "talk-down": 0, capture: 0, spare: 0 };
}

function tallyResolutionLines(chosen: DecisionOption[]): ResolutionLineTally {
  const lines = emptyLineTally();
  for (const option of chosen) {
    if (option.resolutionLine) lines[option.resolutionLine]++;
  }
  return lines;
}

export interface OutcomeInput {
  finalAdvantage: number;
  /** Number of decision points in the exchange. */
  decisionCount: number;
  /** Count of evasive picks (a majority routes to escape). */
  evasiveCount: number;
  /** The encounter framing — gates the reconciled outcomes. */
  framing: EncounterFraming;
  /** Whether the framing allows a non-violent resolution. */
  reconcilable: boolean;
  /** The chosen resolution lines. */
  lines: ResolutionLineTally;
}

/**
 * Map a final advantage, the chosen tactics, and the encounter framing to an
 * outcome (issue #187, Phase 4 — the outcome spectrum). Beyond the original
 * win/lose/escape/stalemate, a player's chosen LINE can end a fight without a
 * kill: a sustained de-escalation talks a reconcilable foe down; a dedicated
 * snap-free effort restores a puppeteered/coerced ally on a winning advantage;
 * and a winning player who chose a subdue/capture/spare line ends it
 * accordingly. Driven by the player's choices, never by randomness.
 */
export function resolveOutcome(input: OutcomeInput): CombatOutcome {
  const { finalAdvantage, decisionCount, evasiveCount, framing, reconcilable, lines } =
    input;
  const winning = finalAdvantage >= VICTORY_THRESHOLD;
  // A "committed line" threshold — a majority of the exchange spent on it.
  const committed = Math.max(1, Math.ceil(decisionCount / 2));

  // Talk-down: a sustained de-escalation of a reconcilable foe ends the fight
  // without violence, as long as you are not being routed.
  if (
    reconcilable &&
    lines["talk-down"] >= committed &&
    finalAdvantage > DEFEAT_THRESHOLD
  ) {
    return "talked-down";
  }
  // Snap-free: harder than simply winning — a committed effort AND a winning edge.
  if (
    (framing === "mind-controlled" || framing === "coerced") &&
    lines.free >= committed &&
    winning
  ) {
    return "freed";
  }
  if (winning) {
    // The most deliberate chosen end-state wins out.
    if (lines.capture >= 1) return "captured";
    if (lines.spare >= 1) return "spared";
    if (lines.subdue >= 1) return "subdued";
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

// Sanity-drain scale per outcome. The reconciled outcomes (won without a kill,
// freed an ally, talked them down, captured/spared) are LIGHTER than a bloody
// victory — mercy steadies the mind.
const SANITY_OUTCOME_FACTOR: Record<CombatOutcome, number> = {
  victory: 0.5,
  escape: 1,
  stalemate: 1.2,
  defeat: 1.5,
  subdued: 0.4,
  freed: 0.5,
  "talked-down": 0.3,
  captured: 0.5,
  spared: 0.45,
};

/** Outcomes that are a form of winning the fight (no escape/defeat/stalemate). */
const WINNING_OUTCOMES = new Set<CombatOutcome>([
  "victory",
  "subdued",
  "freed",
  "talked-down",
  "captured",
  "spared",
]);

/** Whether an outcome is a win in some form — used by the UI for tone. */
export function isWinningOutcome(outcome: CombatOutcome): boolean {
  return WINNING_OUTCOMES.has(outcome);
}

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
    case "subdued":
    case "freed":
    case "captured":
    case "spared":
      // A win that still cost something when you were outmatched and it was close.
      if (finalAdvantage <= DOMINANT_VICTORY_MARGIN && sequenceGap < 0) {
        severities.push("minor");
      }
      break;
    case "talked-down":
      // Ended with words — no wound.
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

/** Sanity backlash per consumed Sealed Artifact, by danger grade (deeper = worse). */
const ARTIFACT_BACKLASH_BY_GRADE: Record<ArtifactGrade, number> = {
  0: -18,
  1: -13,
  2: -9,
  3: -6,
};
/** A sealed artifact not in the catalogue still bites (defensive default). */
const ARTIFACT_BACKLASH_UNGRADED = -6;
/** Above this rolled factor, an artifact lurches — its backlash is amplified. */
export const ARTIFACT_VOLATILE_THRESHOLD = 0.8;
const ARTIFACT_VOLATILE_MULTIPLIER = 1.5;

/**
 * The sanity backlash from invoking Sealed Artifacts mid-fight — the canon
 * "loss of control" cost that makes one a high-power, high-RISK play rather than
 * a free buff. Sums a grade-scaled drain per consumed artifact (a Grade 0
 * Angel-tier relic costs far more than a Grade 3) and amplifies it when the
 * encounter's single rolled `randomFactor` says the artifact lurches.
 * Deterministic under that injected factor, so a serialized fight resolves
 * identically. Non-artifact items contribute nothing. Returns ≤ 0.
 */
export function artifactBacklash(consumed: Item[], randomFactor: number): number {
  let total = 0;
  for (const item of consumed) {
    if (item.category !== "sealed-artifact") continue;
    const grade = gradeForArtifactItem(item);
    total +=
      grade === undefined
        ? ARTIFACT_BACKLASH_UNGRADED
        : ARTIFACT_BACKLASH_BY_GRADE[grade];
  }
  if (total === 0) return 0;
  return randomFactor >= ARTIFACT_VOLATILE_THRESHOLD
    ? Math.round(total * ARTIFACT_VOLATILE_MULTIPLIER)
    : total;
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
  subdued: (enemy) => `You overpower the ${enemy} without a kill — they live, beaten.`,
  freed: (enemy) => `You break the hold on the ${enemy}; they are themselves again.`,
  "talked-down": (enemy) =>
    `You reach the ${enemy} with words, and the fight ends without blood.`,
  captured: (enemy) => `You beat the ${enemy} down and take them alive.`,
  spared: (enemy) => `You overcome the ${enemy}, then stay your hand and let them live.`,
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
  // Dynamic artifacts carry the concrete item they spend; sealed-prep artifacts
  // (no `artifactItem`) draw from the readied `sealedArtifacts` list in order.
  const dynamicArtifactItems = chosen
    .filter(
      (o): o is DecisionOption & { artifactItem: Item } => o.artifactItem !== undefined,
    )
    .map((o) => o.artifactItem);
  const consumedSealed = chosen.filter(
    (o) => o.consumesArtifact && o.artifactItem === undefined,
  ).length;

  const ritualMaterials = encounter.preparation?.ritualMaterials ?? [];
  const sealedArtifacts = encounter.preparation?.sealedArtifacts ?? [];
  // Every artifact actually INVOKED this fight (readied-and-used + grabbed
  // mid-fight) — the slice that incurs the sanity backlash below, whether or not
  // the relic is destroyed.
  const invokedArtifacts: Item[] = [
    ...sealedArtifacts.slice(0, consumedSealed),
    ...dynamicArtifactItems,
  ];
  // Items actually LOST (issue #187 §4.6): only those that are CONSUMED by use.
  // Sealed Artifacts persist by default — invoking one carries its backlash but
  // does not destroy it — so a non-consumable relic is NOT added to `itemsLost`.
  // Ritual materials / one-use reagents stay consumed (`isConsumable` default).
  const itemsLost: Item[] = [...ritualMaterials, ...invokedArtifacts].filter(
    isConsumable,
  );

  // Loot and a dropped characteristic come only from a lethal `victory` — the
  // reconciled outcomes (subdued/freed/talked-down/captured/spared) spare the
  // foe, so there is no body to loot and no characteristic falls.
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
    sanityImpact:
      combatSanityImpact(encounter, outcome) +
      artifactBacklash(invokedArtifacts, encounter.randomFactor),
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
  const context =
    encounter.context ??
    makeEncounterContext(
      encounter.enemy.isBeyonder ? "hostile-beyonder" : "mundane-threat",
      { isKnownPerson: false },
    );
  const outcome = resolveOutcome({
    finalAdvantage,
    decisionCount: encounter.decisionPoints.length,
    evasiveCount,
    framing: context.framing,
    reconcilable: context.reconcilable,
    lines: tallyResolutionLines(chosen),
  });
  const result = computeConsequences(encounter, outcome, finalAdvantage);

  return { ...encounter, phase: "resolution", outcome, result };
}

// ─── Applying Results to Game State ──────────────────────────────────

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
    inventory = removeItemsByName(inventory, result.itemsLost);
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
  if (e.huntTarget !== undefined && typeof e.huntTarget !== "string") return false;
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
