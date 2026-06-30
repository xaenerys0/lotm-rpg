import type { SessionFact } from "@/lib/ai";
import type { Ritual } from "@/lib/types/rules";
import { getPathway, getSequence } from "@/lib/rules";

import {
  anchorHighRisk,
  anchorsRelevant,
  effectiveSupport,
  requiredSupport,
} from "./anchors";
import { evaluateFailure, type FailureVerdict } from "./death";
import { createDigestionState } from "./digestion";
import { hasItemMatching, removeItemsByName } from "./inventory";
import { clamp } from "./math";
import { ritualFidelity, ritualQuestLabel } from "./ritual";
import { sanityDelta } from "./sanity";
import type { GameSession } from "./types";
import { applySanityImpact } from "./world-state";

// ---------------------------------------------------------------------------
// Sequence advancement (Seq 9 → 2) — climbing a pathway one rung at a time.
// ---------------------------------------------------------------------------
//
// A Beyonder advances by *digesting* the current potion through the Acting
// Method, then drinking the next Sequence's potion. The rules engine — never
// the AI — owns the outcome: success rewrites `sequenceLevel` and re-seeds
// digestion for the new potion; failure is a loss of control resolved by the
// existing death/sanity ladder (a survivable setback at low Sequences, an
// escalating catastrophe higher up).
//
// Canon (novel + wiki): each potion needs its formula, a main ingredient (a
// Beyonder characteristic) and supplementary ingredients; **from Sequence 5
// onward an Advancement Ritual is canon** — without it "the likelihood of
// success plummets to a dangerous point." We model the rite as a SOFT,
// fidelity-weighted factor (issue #209, `ritual.ts`): it no longer hard-gates
// the climb (skipping is allowed but canon-dangerous), but how faithfully it was
// lived out (`ritualFidelity`) feeds `advancementSuccessChance` and
// `advancementHighRisk`. The key to the Acting Method is to "remember you're
// only acting" — over-immersion (a frayed mind) makes losing control far more
// likely. Advancement is therefore never certain: there is always a chance of
// losing control, and it plays out here.
//
// Sequence 1 → 0 (True God) is the apotheosis endgame and lives in
// `apotheosis.ts`; this module deliberately stops at Sequence 2 → 1.
//
// Pure + deterministic under injected randomness; storage and AI narration stay
// in the React layer like every other session subsystem.

/** Highest (weakest) sequence a Beyonder can occupy. */
export const MAX_ADVANCEABLE_SEQUENCE = 9;
/** Lowest sequence this module advances *from* (Seq 1 → 0 is apotheosis). */
export const MIN_ADVANCEABLE_SEQUENCE = 2;

/** Target sequence at or below which canon demands an Advancement Ritual. */
export const RITUAL_REQUIRED_AT_OR_BELOW = 5;

/** Sanity floor (as a ratio of max) demanded before advancement may be tried. */
export const ADVANCEMENT_SANITY_RATIO = 0.25;

/**
 * How far a fully-forgone Advancement Ritual drags down the climb's success
 * chance (issue #209). A faithfully-performed rite costs nothing; skipping it
 * subtracts the full penalty — canon: the odds "plummet to a dangerous point."
 */
export const RITUAL_INFIDELITY_PENALTY = 0.5;

/**
 * Ritual fidelity at or below which the climb is a fragile, high-risk moment —
 * a rushed or skipped rite escalates a loss of control by one step.
 */
export const RITUAL_HIGH_RISK_FIDELITY = 0.5;

/** True when the character occupies a sequence this module can advance from. */
export function isAdvanceableSequence(sequenceLevel: number): boolean {
  return (
    sequenceLevel >= MIN_ADVANCEABLE_SEQUENCE && sequenceLevel <= MAX_ADVANCEABLE_SEQUENCE
  );
}

/** The sequence the character is advancing *into* (one rung lower). */
export function targetSequence(sequenceLevel: number): number {
  return sequenceLevel - 1;
}

/** Whether reaching `targetSeq` canonically requires an Advancement Ritual. */
export function ritualRequiredFor(targetSeq: number): boolean {
  return targetSeq <= RITUAL_REQUIRED_AT_OR_BELOW;
}

export interface AdvancementRequirement {
  id: "sequence" | "digestion" | "ingredients" | "ritual" | "anchors" | "sanity";
  label: string;
  met: boolean;
  /**
   * An advisory row that does NOT gate `canAdvance` — it is presented as still
   * pending rather than a satisfied checkbox. The Advancement Ritual uses this
   * (issue #209): its `met` is always `true` (the rite is a soft, fidelity-
   * weighted factor on the odds, never a hard gate), and `forthcoming` is set
   * while the rite has not yet been performed faithfully.
   */
  forthcoming?: boolean;
}

/**
 * The requirement checklist for advancing to the next Sequence, built entirely
 * from data the session already carries (and the rules engine's canon sequence
 * data) — nothing here trusts the AI. Every requirement is a hard gate.
 */
export function advancementRequirements(session: GameSession): AdvancementRequirement[] {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);
  const targetSeq = getSequence(state.pathwayId, target);
  const requirements: AdvancementRequirement[] = [];

  requirements.push({
    id: "sequence",
    label: "Stand on a rung you can still climb from (Sequence 9 – 2)",
    met: isAdvanceableSequence(state.sequenceLevel),
  });

  requirements.push({
    id: "digestion",
    label: "Your current potion is fully digested — the role acted to its end",
    met: state.digestion?.complete === true,
  });

  // Canon ingredients for the target potion: formula + main ingredient
  // (a Beyonder characteristic) + supplementary ingredients.
  const prerequisiteItems = targetSeq?.prerequisiteItems ?? [];
  const missingItems = prerequisiteItems.filter(
    (item) => !hasItemMatching(state.inventory, item),
  );
  if (prerequisiteItems.length > 0) {
    requirements.push({
      id: "ingredients",
      label:
        missingItems.length === 0
          ? "Carry the formula and every ingredient for the next potion"
          : `Still need: ${missingItems.map((i) => i.name).join(", ")}`,
      met: missingItems.length === 0,
    });
  }

  // From Sequence 5 onward an Advancement Ritual is canon. It is no longer a HARD
  // gate (issue #209): the climb is always attemptable, but how faithfully the
  // rite was lived out feeds `advancementSuccessChance` — skipping it is allowed
  // but canon-dangerous. So this row is ADVISORY (`met: true`); `forthcoming`
  // reflects whether the rite is still unperformed, and the label warns that a
  // forgone rite makes losing control the likely outcome.
  if (ritualRequiredFor(target)) {
    const ritual = targetSeq?.advancementRitual;
    if (ritual) {
      const fidelity = ritualFidelity(session, target);
      requirements.push({
        id: "ritual",
        label:
          fidelity >= 1
            ? `Advancement Ritual performed: ${ritual.description}`
            : `Perform the Advancement Ritual to steady the climb — skipping it is perilous: ${ritual.description}`,
        met: true,
        forthcoming: fidelity < 1,
      });
    }
  }

  // Anchors steady a high-Sequence form (Saint tier and above).
  if (anchorsRelevant(target)) {
    const support = session.anchorState ? effectiveSupport(session.anchorState) : 0;
    const needed = requiredSupport(target);
    requirements.push({
      id: "anchors",
      label: `Anchors hold ${needed} support — enough to keep your new shape`,
      met: support >= needed,
    });
  }

  requirements.push({
    id: "sanity",
    label: "Enter with a steady mind — at least a quarter of your sanity intact",
    met: state.sanity >= state.maxSanity * ADVANCEMENT_SANITY_RATIO,
  });

  return requirements;
}

/** Every requirement in a prebuilt checklist is met. */
export function meetsRequirements(requirements: AdvancementRequirement[]): boolean {
  return requirements.every((req) => req.met);
}

/** Every requirement is met and the sequence is in range. */
export function canAdvance(session: GameSession): boolean {
  if (!isAdvanceableSequence(session.gameState.sequenceLevel)) return false;
  return meetsRequirements(advancementRequirements(session));
}

/**
 * Success odds for the next advancement: high at the low Sequences, falling as
 * the rungs get higher (a lower number), and **never certain** — the chance of
 * losing control is permanent. Anchor surplus and a fuller mind steady the
 * climb.
 */
export function advancementSuccessChance(session: GameSession): number {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);

  // Base falls ~0.05 per rung climbed: Seq 8 (target) ≈ 0.9 … Seq 1 ≈ 0.55.
  let chance = 0.9 - (MAX_ADVANCEABLE_SEQUENCE - 1 - target) * 0.05;

  const sanityRatio = state.maxSanity > 0 ? state.sanity / state.maxSanity : 0;
  chance += (sanityRatio - 0.5) * 0.1;

  if (anchorsRelevant(target) && session.anchorState) {
    const surplus = Math.max(
      0,
      effectiveSupport(session.anchorState) - requiredSupport(target),
    );
    chance += Math.min(0.1, surplus / 400);
  }

  // The Advancement Ritual is what survives the surge of the new characteristic
  // (issue #209): a faithfully-lived rite costs nothing, while a rushed or
  // forgone one drags the odds down toward the canon "dangerous point."
  const ritual = getSequence(state.pathwayId, target)?.advancementRitual;
  if (ritualRequiredFor(target) && ritual) {
    chance -= RITUAL_INFIDELITY_PENALTY * (1 - ritualFidelity(session, target));
  }

  // Always leave a real chance of losing control, and never a sure thing.
  return clamp(chance, 0.05, 0.95);
}

export interface AdvancementAdvanced {
  outcome: "advanced";
  session: GameSession;
  /** The sequence just reached. */
  newSequenceLevel: number;
  /** The role name of the new sequence (for narration / journaling). */
  roleName: string;
  /** The canon ritual performed, if the new rung demanded one. */
  ritual?: Ritual;
}

export interface AdvancementLostControl {
  outcome: "lost-control";
  verdict: FailureVerdict;
}

export type AdvancementResult = AdvancementAdvanced | AdvancementLostControl;

/**
 * Attempt the advancement. Deterministic under the injected randomness. On
 * success the engine — not the AI — writes the new `sequenceLevel`, consumes the
 * potion's ingredients, re-seeds digestion for the new potion, drains sanity for
 * the upheaval, and records what happened through memory facts. On failure the
 * death engine resolves a loss of control; the caller routes it through the same
 * setback / permadeath machinery as any other failure.
 */
export function attemptAdvancement(
  session: GameSession,
  random: () => number = Math.random,
  now: number = Date.now(),
): AdvancementResult {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);

  // A flagrantly unready attempt (the UI gates this, but guard anyway) is itself
  // a loss of control — the body rejects a potion it was never prepared for.
  if (
    !isAdvanceableSequence(state.sequenceLevel) ||
    !meetsRequirements(advancementRequirements(session))
  ) {
    return {
      outcome: "lost-control",
      verdict: evaluateFailure({
        cause: "loss-of-control",
        sequenceLevel: state.sequenceLevel,
        highRisk: true,
      }),
    };
  }

  if (random() >= advancementSuccessChance(session)) {
    return {
      outcome: "lost-control",
      verdict: evaluateFailure({
        cause: "loss-of-control",
        sequenceLevel: state.sequenceLevel,
        highRisk: advancementHighRisk(session),
      }),
    };
  }

  const targetSeq = getSequence(state.pathwayId, target);
  const roleName = targetSeq?.name ?? `Sequence ${target}`;
  const pathwayName = getPathway(state.pathwayId)?.name ?? "the pathway";
  const ritual = ritualRequiredFor(target) ? targetSeq?.advancementRitual : undefined;
  const prerequisiteItems = targetSeq?.prerequisiteItems ?? [];

  // Advancement is a violent upheaval of the self — it always drains sanity.
  const drained = applySanityImpact(state, sanityDelta({ type: "advancement" }));

  const facts: SessionFact[] = [
    {
      type: "event",
      description: `Digested the potion and advanced to Sequence ${target}, ${roleName}, of the ${pathwayName} pathway.`,
      turnNumber: session.turnCount,
    },
  ];
  if (ritual) {
    // Note how faithfully the rite was lived out so the narrator frames the
    // climb accordingly (issue #209): faithful, rushed, or forgone.
    const fidelity = ritualFidelity(session, target);
    const manner =
      fidelity >= 1
        ? "performed faithfully"
        : fidelity <= 0
          ? "forgone — survived the surge by sheer luck"
          : "rushed";
    facts.push({
      type: "event",
      description: `The advancement ritual to become a ${roleName} was ${manner}: ${ritual.description}`,
      turnNumber: session.turnCount,
    });
  }

  return {
    outcome: "advanced",
    newSequenceLevel: target,
    roleName,
    ritual,
    session: {
      ...session,
      gameState: {
        ...drained,
        sequenceLevel: target,
        inventory: removeItemsByName(state.inventory, prerequisiteItems),
        digestion: createDigestionState(state.pathwayId, target),
        // Drop the rite's quest label too — normally `advanceRitual` removed it
        // on completion, but a climb taken with a rite still in progress would
        // otherwise leave it stranded in `activeQuests` (issue #209).
        activeQuests: drained.activeQuests.filter((q) => q !== ritualQuestLabel(target)),
      },
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, ...facts],
      },
      // The performed rite is consumed by the climb — the next rung needs its
      // own ritual performed from scratch (issue #99 Part C).
      ritualState: undefined,
      updatedAt: now,
    },
  };
}

/**
 * Whether the attempt is a fragile, high-risk moment that escalates a loss of
 * control by one step — an under-anchored high form, a frayed mind from
 * over-immersion in the role ("remember you're only acting"), or a rushed /
 * forgone Advancement Ritual (issue #209): without the rite there is nothing to
 * steady the surge of the new characteristic.
 */
export function advancementHighRisk(session: GameSession): boolean {
  const state = session.gameState;
  const target = targetSequence(state.sequenceLevel);
  if (
    anchorsRelevant(target) &&
    session.anchorState &&
    anchorHighRisk(session.anchorState, target)
  ) {
    return true;
  }
  if (
    ritualRequiredFor(target) &&
    getSequence(state.pathwayId, target)?.advancementRitual &&
    ritualFidelity(session, target) < RITUAL_HIGH_RISK_FIDELITY
  ) {
    return true;
  }
  return state.sanity < state.maxSanity * ADVANCEMENT_SANITY_RATIO;
}
