import type { SessionFact } from "@/lib/ai";
import { pillarForPathway, siblingPathwayIds, siblingPathwayNames } from "@/lib/rules";

import { anchorHighRisk, effectiveSupport } from "./anchors";
import { trueGodName, uniquenessItemFor } from "./apotheosis";
import {
  ascensionRiteFidelity,
  ASCENSION_INFIDELITY_PENALTY,
  ASCENSION_SUCCESS_FLOOR,
} from "./ascension-rite";
import { evaluateFailure, type FailureVerdict } from "./death";
import { createDigestionState } from "./digestion";
import { hasItemMatching } from "./inventory";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// The Pillars — the apex ABOVE Sequence 0 (issue #99 Part B)
// ---------------------------------------------------------------------------
//
// A True God (Sequence 0) of one of the four god-families may ascend further:
// into the family's Pillar, the cosmic role above the sequences (the canon data
// is `@/lib/rules/pillars`). This mirrors the apotheosis endgame
// (`apotheosis.ts`): the rules engine — never the AI — owns the outcome, the
// attempt rolls exactly once, success rewrites the character at world-shaping
// scale, and failure at this height is absolute (a catastrophic ritual failure
// the death engine resolves as permadeath — a Sequence 0 god has the longest
// way to fall).
//
// The ascent demands INTEGRATION: the god must hold the Uniqueness of every
// sibling pathway in their family (the other True-God seats of the same Pillar)
// and feed them into the throne. Only the four families can ascend; the other
// nine pathways cap at Sequence 0 (`pillarForPathway` returns `undefined`, and
// the panel never appears).
//
// Pure + deterministic under injected randomness; storage and AI narration stay
// in the React layer like every other session subsystem.

/**
 * The sentinel `sequenceLevel` for a Pillar — above Sequence 0 (the True Gods).
 * Negative so every "deeper rung is a lower number" comparison keeps working;
 * every consumer that reads `sequenceLevel` routes through the shared helpers,
 * which special-case it (issue #99 Part D).
 */
export const PILLAR_SEQUENCE = -1;

/** Near-full anchoring — only a vast, devoted faith can seat a Pillar. */
export const PILLAR_REQUIRED_SUPPORT = 300;

/** Sanity floor (as a ratio of max) demanded before the ascent may begin. */
export const PILLAR_SANITY_RATIO = 0.75;

/** The Pillar name a pathway ascends into (its family's apex). */
export function pillarName(pathwayId: number): string {
  return pillarForPathway(pathwayId)?.name ?? "the Pillar";
}

/** The staged ceremony, rendered to the player step by step. */
export const PILLAR_STAGES: readonly string[] = [
  "Gather the Uniquenesses of your sibling pathways — the other True-God seats of your Pillar — into your own existence.",
  "Let the gathered authority converge: the family's separate godhoods becoming the one role above them.",
  "Speak the Pillar's name as your own, and let the Sefirah recognise its sovereign.",
  "Hold a self together as you stop being a god among gods and become the thing the gods answer to.",
];

/**
 * What a Pillar can do — pathway-agnostic framing fed to the narrator in place
 * of a rules-engine `Sequence` (a Pillar is above the sequences entirely; its
 * "abilities" are the authority of a cosmic role, given scale by the Pillar
 * prompt directive).
 */
export const PILLAR_ABILITIES: readonly string[] = [
  "Author and revoke the authorities of the True Gods within your domain",
  "Act across the whole world — and the spaces above and beneath it — by intent alone",
  "Hold the Sefirah of your family as your seat, the source every pathway of it draws from",
  "Stand beyond the reach of the sequences: no Beyonder power, however high, binds you",
];

export interface PillarRequirement {
  id: "sequence" | "family" | "integration" | "anchors" | "sanity";
  label: string;
  met: boolean;
}

/**
 * The requirement checklist for ascending to a Pillar. All of it is data the
 * session already carries — nothing here trusts the AI.
 */
export function pillarRequirements(session: GameSession): PillarRequirement[] {
  const state = session.gameState;
  const pillar = pillarForPathway(state.pathwayId);
  const support = session.anchorState ? effectiveSupport(session.anchorState) : 0;
  const siblings = siblingPathwayIds(state.pathwayId);
  const missingSiblings = siblings.filter(
    (id) => !hasItemMatching(state.inventory, uniquenessItemFor(id)),
  );
  const siblingNames = siblingPathwayNames(state.pathwayId);

  return [
    {
      id: "sequence",
      label: "Be a Sequence 0 True God — the throne below the Pillar is yours",
      met: state.sequenceLevel === 0,
    },
    {
      id: "family",
      label: pillar
        ? `Your pathway belongs to a Pillar's family — the ${pillar.name}`
        : "Your pathway has no Pillar above its godhood — it ends at Sequence 0",
      met: pillar !== undefined,
    },
    {
      id: "integration",
      label:
        siblingNames.length > 0
          ? `Hold the Uniqueness of every sibling pathway — ${siblingNames.join(", ")}`
          : "Hold the Uniquenesses your Pillar demands",
      met: pillar !== undefined && missingSiblings.length === 0,
    },
    {
      id: "anchors",
      label: `Anchors hold ${PILLAR_REQUIRED_SUPPORT} support — a faith vast enough to seat a Pillar`,
      met: support >= PILLAR_REQUIRED_SUPPORT,
    },
    {
      id: "sanity",
      label: "Enter whole — at least three-quarters of your sanity intact",
      met: state.sanity >= state.maxSanity * PILLAR_SANITY_RATIO,
    },
  ];
}

export function canAttemptPillarAscension(session: GameSession): boolean {
  return pillarRequirements(session).every((req) => req.met);
}

/**
 * Success odds once every requirement is met: harder and lower-capped than the
 * apotheosis — the climb above the sequences is the rarest thing in the world.
 * Anchor surplus beyond the requirement and a fuller mind both steady it.
 */
export function pillarAscensionSuccessChance(session: GameSession): number {
  const state = session.gameState;
  const support = session.anchorState ? effectiveSupport(session.anchorState) : 0;
  const surplus = Math.max(0, support - PILLAR_REQUIRED_SUPPORT);
  const sanityRatio = state.maxSanity > 0 ? state.sanity / state.maxSanity : 0;
  // How faithfully the rite of ascension has matured drags the odds when rushed —
  // ascending above the sequences the instant the rite opens is dire but allowed.
  const fidelity = ascensionRiteFidelity(session);
  const chance =
    0.5 +
    Math.min(0.15, surplus / 600) +
    sanityRatio * 0.2 -
    ASCENSION_INFIDELITY_PENALTY * (1 - fidelity);
  return Math.max(ASCENSION_SUCCESS_FLOOR, Math.min(0.9, chance));
}

/** Shown to a player who seats a Pillar — the view from above the ladder. */
export const ABOVE_THE_SEQUENCE_TEASE =
  "You are no longer on the ladder. From here the sequences are a single structure, and the structure is a body, and you are one of the four bones that hold it open. The other three turn, without surprise, to regard their new peer.";

export interface PillarEnthroned {
  outcome: "enthroned";
  session: GameSession;
  pillarName: string;
  /** The view from above the sequences. */
  tease: string;
}

export interface PillarUnmade {
  outcome: "unmade";
  verdict: FailureVerdict;
}

export type PillarAscensionResult = PillarEnthroned | PillarUnmade;

/**
 * Attempt the Pillar ascension. Deterministic under the injected randomness. On
 * success the engine — not the AI — writes `PILLAR_SEQUENCE`: the integrated
 * sibling Uniquenesses are consumed, digestion resets for the new existence,
 * and the narrator learns what happened through memory facts. On failure the
 * death engine resolves a catastrophic ritual failure at Sequence 0 (fatal on
 * the ladder); the caller routes it through the same permadeath machinery as
 * any other ending.
 */
export function attemptPillarAscension(
  session: GameSession,
  random: () => number = Math.random,
  now: number = Date.now(),
): PillarAscensionResult {
  const state = session.gameState;

  if (!canAttemptPillarAscension(session)) {
    return {
      outcome: "unmade",
      verdict: evaluateFailure({
        cause: "ritual-failure",
        sequenceLevel: state.sequenceLevel,
        catastrophic: true,
        highRisk: true,
      }),
    };
  }

  if (random() >= pillarAscensionSuccessChance(session)) {
    return {
      outcome: "unmade",
      verdict: evaluateFailure({
        cause: "ritual-failure",
        sequenceLevel: 0,
        catastrophic: true,
        highRisk: session.anchorState
          ? anchorHighRisk(session.anchorState, 0)
          : undefined,
      }),
    };
  }

  const name = pillarName(state.pathwayId);
  // The integrated sibling Uniquenesses are consumed by the ascent.
  const consumedNames = new Set(
    siblingPathwayIds(state.pathwayId).map((id) => uniquenessItemFor(id).name),
  );
  const facts: SessionFact[] = [
    {
      type: "event",
      description: `Ascended above Sequence 0 to become ${name}, one of the four Pillars of the universe — integrating the godhoods of ${trueGodName(
        state.pathwayId,
      )}'s sibling pathways. Every True God, church, and rival power in the world felt the order of things change.`,
      turnNumber: session.turnCount,
    },
    {
      type: "event",
      description: ABOVE_THE_SEQUENCE_TEASE,
      turnNumber: session.turnCount,
    },
  ];

  return {
    outcome: "enthroned",
    pillarName: name,
    tease: ABOVE_THE_SEQUENCE_TEASE,
    session: {
      ...session,
      gameState: {
        ...state,
        sequenceLevel: PILLAR_SEQUENCE,
        // The sibling Uniquenesses are consumed by the ascent — they ARE the
        // Pillar now.
        inventory: state.inventory.filter((item) => !consumedNames.has(item.name)),
        digestion: createDigestionState(state.pathwayId, PILLAR_SEQUENCE),
      },
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, ...facts],
      },
      updatedAt: now,
    },
  };
}
