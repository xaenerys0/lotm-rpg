import type { SessionFact } from "@/lib/ai";
import {
  areNeighboringPathways,
  getGroupForPathway,
  getPathway,
  getSequence,
} from "@/lib/rules";

import { ADVANCEMENT_SANITY_RATIO, isAdvanceableSequence } from "./advancement";
import { evaluateFailure, type FailureVerdict } from "./death";
import { createDigestionState } from "./digestion";
import { clearFormulaPursuit } from "./formula-pursuit";
import { clearHunt } from "./hunt";
import { removeItemsByName } from "./inventory";
import { clamp } from "./math";
import { makePathwaySwitch, recordPathwaySwitch } from "./pathway-lineage";
import { hasCrossPathwayPotion } from "./potion-preparation";
import { clearRitual } from "./ritual";
import { sanityDelta } from "./sanity";
import type { GameSession } from "./types";
import { applySanityImpact } from "./world-state";

// ---------------------------------------------------------------------------
// Pathway switching (issue #211) — exchanging one pathway for another.
// ---------------------------------------------------------------------------
//
// Canon (wiki):
// - "High-Sequence Beyonders can exchange pathways with similar pathways starting
//   at Sequence 4. The only exception is for the pathways of the Lord of Mysteries
//   group, which can only be exchanged starting at Sequence 3."
// - A neighbouring (adjacent, same Above-the-Sequence group) switch is the safe
//   path — no loss of control, no madness. An unrelated pathway is "akin to taking
//   poison, where the best outcome is a half-mad state" (Roselle Gustav is the
//   survivable precedent).
// - On success the Beyonder keeps their previous powers, fused with the new
//   pathway's — modelled in `pathway-lineage.ts`.
//
// The engine — never the AI — owns the outcome. A successful switch rewrites
// `gameState.pathwayId` to the NEW pathway (so future advancement climbs it),
// keeps the rung, records the outgoing pathway + its retained abilities, re-seeds
// digestion, consumes the cross-pathway potion, sheds the old pathway's
// ritual/formula/hunt pursuits, and drains sanity (heavily for the poison). A
// failed switch is a loss of control resolved by the shared death/sanity ladder —
// an unrelated attempt forces `highRisk`, so poison is deadlier at the same rung.
//
// Pure + deterministic under injected randomness; storage and AI narration stay
// in the React layer like every other engine subsystem.

export type SwitchRelation = "neighboring" | "unrelated";

/**
 * The rung at or below which a neighbouring switch is the safe, canon path. Seq 4
 * in general; Seq 3 for the Lord of Mysteries group (pathways 1/7/8) per the Law
 * of Similar Sequence Beyonder Characteristics Conservation. (Sequences count
 * DOWN, so "starting at Sequence 4" means `sequenceLevel <= 4`.)
 */
export function switchUnlockSequence(pathwayId: number): number {
  return getGroupForPathway(pathwayId)?.id === "mysteries" ? 3 : 4;
}

/** Whether the target is an adjacent (safe) or an unrelated (poison) pathway. */
export function switchRelation(
  currentPathwayId: number,
  targetPathwayId: number,
): SwitchRelation {
  return areNeighboringPathways(currentPathwayId, targetPathwayId)
    ? "neighboring"
    : "unrelated";
}

export interface SwitchRequirement {
  id: "target" | "sequence" | "threshold" | "digestion" | "ingredients" | "sanity";
  label: string;
  met: boolean;
}

/**
 * The requirement checklist for switching into `targetPathwayId`, built from
 * session data only. Hard gates: a real, different pathway; a non-apex rung; the
 * current potion digested; the cross-pathway potion carried; a sanity floor. A
 * NEIGHBOURING target additionally must stand at/below the canon threshold; an
 * UNRELATED target has no threshold gate (it is dangerous at every rung) but its
 * consequences are severe.
 */
export function switchRequirements(
  session: GameSession,
  targetPathwayId: number,
): SwitchRequirement[] {
  const state = session.gameState;
  const targetPathway = getPathway(targetPathwayId);
  const relation = switchRelation(state.pathwayId, targetPathwayId);
  const requirements: SwitchRequirement[] = [];

  requirements.push({
    id: "target",
    label: "Choose a real, different pathway to exchange into",
    met: targetPathway !== undefined && targetPathwayId !== state.pathwayId,
  });

  requirements.push({
    id: "sequence",
    label: "Stand on a mortal rung (Sequence 9 – 2) — the apex cannot switch",
    met: isAdvanceableSequence(state.sequenceLevel),
  });

  if (relation === "neighboring") {
    const unlock = switchUnlockSequence(state.pathwayId);
    requirements.push({
      id: "threshold",
      label: `Be High-Sequence enough — Sequence ${unlock} or deeper to exchange safely`,
      met: state.sequenceLevel <= unlock,
    });
  }

  requirements.push({
    id: "digestion",
    label: "Your current potion is fully digested — the role acted to its end",
    met: state.digestion?.complete === true,
  });

  requirements.push({
    id: "ingredients",
    label: `Carry the formula and every ingredient for the ${
      targetPathway?.name ?? "new"
    } potion`,
    met: hasCrossPathwayPotion(session, targetPathwayId),
  });

  requirements.push({
    id: "sanity",
    label: "Enter with a steady mind — at least a quarter of your sanity intact",
    met: state.sanity >= state.maxSanity * ADVANCEMENT_SANITY_RATIO,
  });

  return requirements;
}

/** Every requirement in a prebuilt checklist is met. */
export function meetsSwitchRequirements(requirements: SwitchRequirement[]): boolean {
  return requirements.every((req) => req.met);
}

/** Whether the character may attempt a switch into `targetPathwayId` right now. */
export function canAttemptSwitch(session: GameSession, targetPathwayId: number): boolean {
  return meetsSwitchRequirements(switchRequirements(session, targetPathwayId));
}

/**
 * Success odds for switching into `targetPathwayId`. A neighbouring switch is
 * strong (the safe canon path), steadied by a fuller mind; an unrelated switch is
 * poison — capped low and heavily sanity-dependent, the Roselle survivable-outlier
 * (the low-odds success IS the "half-mad best case"). Never certain either way.
 */
export function pathwaySwitchSuccessChance(
  session: GameSession,
  targetPathwayId: number,
): number {
  const state = session.gameState;
  const sanityRatio = state.maxSanity > 0 ? state.sanity / state.maxSanity : 0;
  if (switchRelation(state.pathwayId, targetPathwayId) === "neighboring") {
    return clamp(0.75 + (sanityRatio - 0.5) * 0.2, 0.4, 0.9);
  }
  return clamp(0.1 + sanityRatio * 0.3, 0.05, 0.4);
}

/**
 * Whether a failed switch is a high-risk loss of control (escalated one step up
 * the death ladder). An unrelated (poison) switch ALWAYS is; a neighbouring switch
 * only when the mind is already frayed.
 */
export function switchHighRisk(session: GameSession, relation: SwitchRelation): boolean {
  if (relation === "unrelated") return true;
  const state = session.gameState;
  return state.sanity < state.maxSanity * ADVANCEMENT_SANITY_RATIO;
}

export interface PathwaySwitched {
  outcome: "switched";
  session: GameSession;
  /** The pathway just adopted. */
  targetPathwayId: number;
  /** The role name of the new pathway at the current rung (for narration). */
  roleName: string;
  relation: SwitchRelation;
}

export interface PathwaySwitchLostControl {
  outcome: "lost-control";
  verdict: FailureVerdict;
}

export type PathwaySwitchResult = PathwaySwitched | PathwaySwitchLostControl;

/** Shed the old pathway's ritual / formula / hunt pursuits — they target its rung. */
function shedOldPathwayPursuits(session: GameSession, now: number): GameSession {
  let next = clearRitual(session, now);
  next = clearFormulaPursuit(next, now);
  for (const hunt of next.hunts ?? []) {
    next = clearHunt(next, hunt.targetItemName, now);
  }
  return next;
}

/**
 * Attempt the switch. Deterministic under the injected randomness. On success the
 * engine — not the AI — adopts the new pathway, keeps the rung, records the
 * outgoing pathway and the abilities retained (fused) from it, re-seeds digestion,
 * consumes the cross-pathway potion, sheds the old pathway's pursuits, drains
 * sanity (heavily for the poison), and records what happened through memory facts.
 * On failure the death engine resolves a loss of control (unrelated forces
 * `highRisk`); the caller routes it through the same setback / permadeath
 * machinery as any other failure.
 */
export function attemptPathwaySwitch(
  session: GameSession,
  targetPathwayId: number,
  random: () => number = Math.random,
  now: number = Date.now(),
): PathwaySwitchResult {
  const state = session.gameState;
  const relation = switchRelation(state.pathwayId, targetPathwayId);

  // A flagrantly ineligible attempt (the UI gates this, but guard anyway) is
  // itself a loss of control — the body rejects a foreign potion it was never
  // prepared for.
  if (!canAttemptSwitch(session, targetPathwayId)) {
    return {
      outcome: "lost-control",
      verdict: evaluateFailure({
        cause: "loss-of-control",
        sequenceLevel: state.sequenceLevel,
        highRisk: true,
      }),
    };
  }

  if (random() >= pathwaySwitchSuccessChance(session, targetPathwayId)) {
    return {
      outcome: "lost-control",
      verdict: evaluateFailure({
        cause: "loss-of-control",
        sequenceLevel: state.sequenceLevel,
        highRisk: switchHighRisk(session, relation),
      }),
    };
  }

  const fromPathwayId = state.pathwayId;
  const atSequence = state.sequenceLevel;
  const fromName = getPathway(fromPathwayId)?.name ?? "the old pathway";
  const toName = getPathway(targetPathwayId)?.name ?? "the new pathway";
  const roleName =
    getSequence(targetPathwayId, atSequence)?.name ?? `Sequence ${atSequence}`;

  const switchEntry = makePathwaySwitch(
    fromPathwayId,
    atSequence,
    relation,
    session.turnCount,
  );

  const cleaned = shedOldPathwayPursuits(session, now);
  const targetPotionItems =
    getSequence(targetPathwayId, atSequence)?.prerequisiteItems ?? [];

  // Switching is an upheaval of the self — it always drains sanity, and the poison
  // of an unrelated pathway drains far more (the "half-mad" cost).
  const drain =
    relation === "unrelated"
      ? sanityDelta({ type: "advancement" }) + sanityDelta({ type: "outer-deity" })
      : sanityDelta({ type: "advancement" });
  const drained = applySanityImpact(cleaned.gameState, drain);

  const facts: SessionFact[] = [
    {
      type: "event",
      description:
        relation === "neighboring"
          ? `Exchanged the ${fromName} pathway for the neighbouring ${toName} pathway at Sequence ${atSequence}, ${roleName}. The old powers fused with the new — a certain mutation.`
          : `Drank an unrelated ${toName} potion — poison to a ${fromName} Beyonder — and survived the exchange in a half-mad haze, the two pathways grinding into something bizarre.`,
      turnNumber: session.turnCount,
    },
  ];
  if (switchEntry.retained.length > 0) {
    facts.push({
      type: "event",
      description: `Powers kept from the ${fromName} pathway, fused into the new form: ${switchEntry.retained
        .map((a) => a.name)
        .join(", ")}.`,
      turnNumber: session.turnCount,
    });
  }

  return {
    outcome: "switched",
    targetPathwayId,
    roleName,
    relation,
    session: {
      ...cleaned,
      gameState: {
        ...drained,
        pathwayId: targetPathwayId,
        inventory: removeItemsByName(cleaned.gameState.inventory, targetPotionItems),
        digestion: createDigestionState(targetPathwayId, atSequence),
      },
      pathwayLineage: recordPathwaySwitch(cleaned.pathwayLineage, switchEntry),
      memory: {
        ...cleaned.memory,
        sessionFacts: [...cleaned.memory.sessionFacts, ...facts],
      },
      updatedAt: now,
    },
  };
}

/**
 * The neighbouring pathways the character could switch into from here — the safe
 * candidates the switch UI lists. Every same-group adjacent pathway (an unrelated
 * poison switch is offered separately, gated behind an explicit confirm).
 */
export function neighboringSwitchTargets(session: GameSession): number[] {
  const current = getPathway(session.gameState.pathwayId);
  if (!current) return [];
  return current.neighboringPathways.filter(
    (id) => getPathway(id) !== undefined && id !== current.id,
  );
}
