import type { SessionFact } from "@/lib/ai";
import {
  areNeighboringPathways,
  getGroupForPathway,
  getPathway,
  getSequence,
} from "@/lib/rules";

import {
  ADVANCEMENT_SANITY_RATIO,
  isAdvanceableSequence,
  targetSequence,
} from "./advancement";
import { anchorsRelevant, effectiveSupport, requiredSupport } from "./anchors";
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
// Pathway switching (issue #211) — advancing along a NEIGHBOURING line.
// ---------------------------------------------------------------------------
//
// Canon (wiki):
// - A switch is an ADVANCEMENT taken along a different line: instead of drinking
//   your own pathway's NEXT potion you drink a neighbouring pathway's next potion,
//   climbing one rung AND changing pathways in a single step ("the powers gained
//   from the new pathway will depend on the set of characteristic that is used to
//   advance").
// - "High-Sequence Beyonders can exchange pathways with similar pathways starting
//   at Sequence 4. The only exception is for the pathways of the Lord of Mysteries
//   group, which can only be exchanged starting at Sequence 3." — i.e. the FIRST
//   allowed switch lands you at Sequence 4 (Sequence 3 for the Mysteries group),
//   so the TARGET rung must be Seq ≤ 4 (≤ 3 for Mysteries).
// - A neighbouring (adjacent, same Above-the-Sequence group) switch is the safe
//   path — no loss of control, no madness. An unrelated pathway is "akin to taking
//   poison, where the best outcome is a half-mad state" (Roselle Gustav is the
//   survivable precedent).
// - On success the Beyonder keeps ALL of their previous pathway's powers, fused
//   with the new pathway's potion — but they join the new pathway partway down and
//   never digested its weaker rungs, so "missing characteristic of lower sequence
//   will lead to lost of some of the corresponding abilities" (modelled by the
//   join-sequence cap in `pathway-fusion.ts`).
//
// The engine — never the AI — owns the outcome. A successful switch ADVANCES one
// rung and rewrites `gameState.pathwayId` to the NEW pathway, records the outgoing
// pathway + its retained abilities, re-seeds digestion, consumes the target
// potion, sheds the old pathway's ritual/formula/hunt pursuits, and drains sanity
// (heavily for the poison). A failed switch is a loss of control resolved by the
// shared death/sanity ladder — an unrelated attempt forces `highRisk`, so poison
// is deadlier than the safe neighbouring advance.
//
// Pure + deterministic under injected randomness; storage and AI narration stay
// in the React layer like every other engine subsystem.

export type SwitchRelation = "neighboring" | "unrelated";

/**
 * The TARGET rung at or below which a neighbouring switch is the safe, canon path.
 * Seq 4 in general; Seq 3 for the Lord of Mysteries group (pathways 1/7/8) per the
 * Law of Similar Sequence Beyonder Characteristics Conservation — the first
 * allowed switch lands you here.
 */
export function switchUnlockSequence(pathwayId: number): number {
  return getGroupForPathway(pathwayId)?.id === "mysteries" ? 3 : 4;
}

/** The rung a switch would ADVANCE the character into (one below the current). */
export function switchTargetSequence(session: GameSession): number {
  return targetSequence(session.gameState.sequenceLevel);
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
  id:
    | "target"
    | "sequence"
    | "threshold"
    | "digestion"
    | "ingredients"
    | "anchors"
    | "sanity";
  label: string;
  met: boolean;
}

/**
 * The requirement checklist for switch-ADVANCING into `targetPathwayId`, built
 * from session data only. Hard gates: a real, different pathway; a climbable rung;
 * the current potion digested; the TARGET pathway's next-rung potion carried;
 * Saint-tier anchors when the target rung demands them; a sanity floor. A
 * NEIGHBOURING target additionally must ADVANCE INTO a rung at/below the canon
 * threshold (Seq 4, or 3 for Mysteries); an UNRELATED target has no threshold gate
 * (it is dangerous at every rung) but its consequences are severe.
 */
export function switchRequirements(
  session: GameSession,
  targetPathwayId: number,
): SwitchRequirement[] {
  const state = session.gameState;
  const targetPathway = getPathway(targetPathwayId);
  const relation = switchRelation(state.pathwayId, targetPathwayId);
  const target = switchTargetSequence(session);
  const targetRole = getSequence(targetPathwayId, target)?.name;
  const requirements: SwitchRequirement[] = [];

  requirements.push({
    id: "target",
    label: "Choose a real, different pathway to exchange into",
    met: targetPathway !== undefined && targetPathwayId !== state.pathwayId,
  });

  requirements.push({
    id: "sequence",
    label: "Stand on a rung you can still climb from (Sequence 9 – 2)",
    met: isAdvanceableSequence(state.sequenceLevel),
  });

  if (relation === "neighboring") {
    const unlock = switchUnlockSequence(targetPathwayId);
    requirements.push({
      id: "threshold",
      label: `Exchange only into Sequence ${unlock} or deeper — the first safe rung for this group`,
      met: target <= unlock,
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
      targetRole ?? targetPathway?.name ?? "new"
    } potion`,
    met: hasCrossPathwayPotion(session, targetPathwayId),
  });

  // Advancing into the Saint tier or deeper needs anchors to keep the new shape.
  if (anchorsRelevant(target)) {
    const support = session.anchorState ? effectiveSupport(session.anchorState) : 0;
    requirements.push({
      id: "anchors",
      label: `Anchors hold ${requiredSupport(target)} support — enough to keep your new shape`,
      met: support >= requiredSupport(target),
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
 * the death ladder). Only an unrelated (poison) switch is: a neighbouring switch
 * is the safe path and is only ever eligible with a steady mind (the sanity-floor
 * requirement gates it), so a frayed neighbouring attempt cannot reach here.
 */
export function switchHighRisk(relation: SwitchRelation): boolean {
  return relation === "unrelated";
}

export interface PathwaySwitched {
  outcome: "switched";
  session: GameSession;
  /** The pathway just adopted. */
  targetPathwayId: number;
  /** The rung just climbed into on the new pathway. */
  newSequenceLevel: number;
  /** The role name of the new pathway at the rung just reached (for narration). */
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
 * engine — not the AI — adopts the new pathway AND advances one rung, records the
 * outgoing pathway and the full kit retained (fused) from it, re-seeds digestion,
 * consumes the target pathway's next-rung potion, sheds the old pathway's
 * pursuits, drains sanity (heavily for the poison), and records memory facts.
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
        highRisk: switchHighRisk(relation),
      }),
    };
  }

  const fromPathwayId = state.pathwayId;
  // The character LEAVES the old pathway at their current rung and CLIMBS one rung
  // into the new pathway (`target`) — a switch is an advancement along a new line.
  const leftAtSequence = state.sequenceLevel;
  const target = switchTargetSequence(session);
  const fromName = getPathway(fromPathwayId)?.name ?? "the old pathway";
  const toName = getPathway(targetPathwayId)?.name ?? "the new pathway";
  const roleName = getSequence(targetPathwayId, target)?.name ?? `Sequence ${target}`;

  // `atSequence` = the sequence LEFT behind, so the full old kit is frozen and the
  // new pathway's join rung (`atSequence - 1`) is recoverable for the loss model.
  const switchEntry = makePathwaySwitch(
    fromPathwayId,
    leftAtSequence,
    relation,
    session.turnCount,
  );

  const cleaned = shedOldPathwayPursuits(session, now);
  const targetPotionItems = getSequence(targetPathwayId, target)?.prerequisiteItems ?? [];

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
          ? `Advanced by exchanging into the neighbouring ${toName} pathway, becoming a Sequence ${target} ${roleName}. The old ${fromName} powers fused with the new — a certain mutation.`
          : `Drank an unrelated ${toName} potion — poison to a ${fromName} Beyonder — and survived the exchange into a half-mad Sequence ${target} ${roleName}, the two pathways grinding into something bizarre.`,
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
    newSequenceLevel: target,
    roleName,
    relation,
    session: {
      ...cleaned,
      gameState: {
        ...drained,
        pathwayId: targetPathwayId,
        sequenceLevel: target,
        inventory: removeItemsByName(cleaned.gameState.inventory, targetPotionItems),
        digestion: createDigestionState(targetPathwayId, target),
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
