import type { SessionFact } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import { getCumulativeAbilities, getPathway, getSequence } from "@/lib/rules";

import { effectiveSupport, requiredSupport, anchorHighRisk } from "./anchors";
import { evaluateFailure, type FailureVerdict } from "./death";
import { createDigestionState } from "./digestion";
import { hasItemMatching } from "./inventory";
import { PILLAR_ABILITIES, PILLAR_ACTING, PILLAR_SEQUENCE, pillarName } from "./pillars";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Sequence 0 endgame — apotheosis to True God (issue #30)
// ---------------------------------------------------------------------------
//
// The ultimate achievement: a Sequence 1 King of Angels gathers the pathway's
// remaining essence and its UNIQUENESS, then attempts the apotheosis ritual.
// The rules engine — never the AI — owns the outcome. Success rewrites the
// character at world scale (the narration shifts to cosmic stakes via the
// godhood prompt directive, and worshippers begin to petition); failure at
// this height is absolute — the existing death engine resolves it as a
// catastrophic ritual failure (Sequence 1 on the ladder = fatal).
//
// Pure + deterministic under injected randomness; storage and AI narration
// stay in the React layer like every other session subsystem.

/**
 * Canon honorific assumed on attaining Sequence 0, per pathway id. The Seq 0
 * title is the pathway's Above-the-Sequence name (the wiki
 * Module:Sequence/standard Seq 0 entry — e.g. the Fool, the White Tower); the
 * Fool keeps its definite-article styling. All twenty-two are covered (issue
 * #99 Part A); `trueGodName` still falls back to the pathway name for safety.
 */
export const TRUE_GOD_NAMES: Record<number, string> = {
  1: "The Fool",
  2: "Visionary",
  3: "Sun",
  4: "Death",
  5: "Darkness",
  6: "Tyrant",
  7: "Door",
  8: "Error",
  9: "Hanged Man",
  10: "White Tower",
  11: "Twilight Giant",
  12: "Justiciar",
  13: "Black Emperor",
  14: "Red Priest",
  15: "Demoness",
  16: "Mother",
  17: "Moon",
  18: "Hermit",
  19: "Paragon",
  20: "Wheel of Fortune",
  21: "Abyss",
  22: "Chained",
};

export function trueGodName(pathwayId: number): string {
  return TRUE_GOD_NAMES[pathwayId] ?? getPathway(pathwayId)?.name ?? "True God";
}

/**
 * The pathway's Uniqueness — the singular characteristic without which no one
 * becomes the pathway's True God. The narrator can grant it through play; it
 * is an ordinary inventory item so every existing channel (quests, gatherings,
 * the marketplace) can carry it.
 */
export function uniquenessItemFor(pathwayId: number): Item {
  const pathway = getPathway(pathwayId)?.name ?? "the pathway";
  return {
    name: `${pathway} Uniqueness`,
    description: `The singular, indivisible core characteristic of the ${pathway} pathway. There is exactly one in all the world.`,
    // Its own category, not lumped with mundane loot or the advancement-ladder
    // reagents: the Uniqueness is the singular endgame artifact the narrator
    // grants through play (so it stays outside the engine-only reagent block,
    // issue #90) and is never sold by any channel.
    category: "uniqueness",
  };
}

/** Sanity floor (as a ratio of max) demanded before the ritual may begin. */
export const APOTHEOSIS_SANITY_RATIO = 0.5;

/** The staged ceremony, rendered to the player step by step. */
export const APOTHEOSIS_STAGES: readonly string[] = [
  "Consume the gathered essence of your pathway — every remaining drop of Sequence 1 concentrate.",
  "Take the Uniqueness into yourself and let it judge whether you are the pathway, acted to its end.",
  "Proclaim your honorific name, so that the world must hear it three times.",
  "Hold your self together while everything above the sequences turns to look.",
];

/**
 * What a True God can do — pathway-agnostic framing fed to the narrator in
 * place of a rules-engine `Sequence` (Sequence 0 has no potion to digest into;
 * its "abilities" are authority itself, given world scale by the godhood
 * prompt directive).
 */
export const TRUE_GOD_ABILITIES: readonly string[] = [
  "Absolute authority over the pathway's entire domain",
  "Hear worshippers' prayers and answer them across any distance",
  "Perceive and act anywhere in the world at the speed of intent",
  "Confer or revoke blessings, oracles, and divine punishments",
];

/** The acting method does not end at the throne — it tightens. */
export const TRUE_GOD_ACTING: readonly string[] = [
  "Be the god the faithful believe in — every public act is doctrine now",
  "Never act beneath your station; a god who plays mortal frays",
  "Answer faith with presence; a silent god breeds heresy and rivals",
];

/**
 * The ability and acting-requirement names to present for a character at this
 * sequence. Sequence 0 has no rules-engine `Sequence`, so a True God's
 * authority is framed here instead of resolving to an empty lookup — one place
 * for the True-God-aware derivation the prompt and UI both need.
 *
 * Abilities are **cumulative**: the list carries every power from the rungs the
 * character has climbed (the current Sequence up through Sequence 9), with the
 * earlier, now-enhanced powers tagged `(enhanced)` so the narrator knows the
 * Beyonder still wields them — strengthened — at the current rung. Acting
 * requirements stay scoped to the current Sequence: they describe the role
 * being digested now, not the roles already mastered.
 */
export function sequenceAbilities(
  pathwayId: number,
  level: number,
): { abilities: string[]; acting: string[] } {
  // A Pillar (above the sequences, issue #99 Part B) has neither a `Sequence`
  // nor a True God's domain-bound authority — its abilities are the authority of
  // a cosmic role itself.
  if (level === PILLAR_SEQUENCE) {
    return { abilities: [...PILLAR_ABILITIES], acting: [...PILLAR_ACTING] };
  }
  if (level === 0) {
    return { abilities: [...TRUE_GOD_ABILITIES], acting: [...TRUE_GOD_ACTING] };
  }
  const seq = getSequence(pathwayId, level);
  return {
    abilities: getCumulativeAbilities(pathwayId, level).map((a) =>
      a.enhanced ? `${a.name} (enhanced)` : a.name,
    ),
    acting: seq?.actingRequirements ?? [],
  };
}

/**
 * The tier a sequence level belongs to (issue #99 Part D). Extends the rules
 * `SequenceClassification` upward with the two apex tiers that have no stored
 * `Sequence`: `"True God"` (Seq 0) and `"Pillar"` (above the sequences,
 * `PILLAR_SEQUENCE`). The single derivation every site shares so the new tiers
 * can't render as a stray classification or a bare number.
 */
export type SequenceTier = "Pillar" | "True God" | "Demigod" | "High" | "Mid" | "Low";

export function sequenceClassificationFor(level: number): SequenceTier {
  if (level < 0) return "Pillar"; // PILLAR_SEQUENCE
  if (level === 0) return "True God";
  if (level <= 2) return "Demigod"; // Seq 2-1 (Angel / King of Angels)
  if (level <= 4) return "High"; // Seq 4-3 (Saint)
  if (level <= 7) return "Mid"; // Seq 7-5
  return "Low"; // Seq 9-8
}

/**
 * The display name for a character at any level (issue #99 Part D) — the single
 * label helper every status bar, character sheet, showcase, leaderboard, and
 * journal arc routes through, so Seq 0 reads as its True God honorific and a
 * Pillar (`PILLAR_SEQUENCE`) as its Above-the-Sequence name rather than leaking
 * "Sequence 0" / "Sequence -1". Below the apex it is the rules `Sequence` name
 * (falling back to a plain "Sequence N" only when the data is unexpectedly
 * absent).
 */
export function sequenceLabel(pathwayId: number, level: number): string {
  if (level === PILLAR_SEQUENCE) return pillarName(pathwayId);
  if (level === 0) return trueGodName(pathwayId);
  return getSequence(pathwayId, level)?.name ?? `Sequence ${level}`;
}

export interface ApotheosisRequirement {
  id: "sequence" | "digestion" | "uniqueness" | "anchors" | "sanity";
  label: string;
  met: boolean;
}

/**
 * The requirement checklist for attempting apotheosis. All of it is data the
 * session already carries — nothing here trusts the AI.
 */
export function apotheosisRequirements(session: GameSession): ApotheosisRequirement[] {
  const state = session.gameState;
  const uniqueness = uniquenessItemFor(state.pathwayId);
  const uniquenessName = uniqueness.name;
  const support = session.anchorState ? effectiveSupport(session.anchorState) : 0;
  const needed = requiredSupport(0);
  return [
    {
      id: "sequence",
      label: "Stand at Sequence 1 — a King of Angels, one step from the throne",
      met: state.sequenceLevel === 1,
    },
    {
      id: "digestion",
      label: "Your current potion is fully digested — the role acted to its end",
      met: state.digestion?.complete === true,
    },
    {
      id: "uniqueness",
      label: `Carry the ${uniquenessName}`,
      met: hasItemMatching(state.inventory, uniqueness),
    },
    {
      id: "anchors",
      label: `Anchors hold ${needed} support — enough faith to keep a god's shape`,
      met: support >= needed,
    },
    {
      id: "sanity",
      label: "Enter with a clear mind — at least half your sanity intact",
      met: state.sanity >= state.maxSanity * APOTHEOSIS_SANITY_RATIO,
    },
  ];
}

export function canAttemptApotheosis(session: GameSession): boolean {
  return apotheosisRequirements(session).every((req) => req.met);
}

/**
 * Success odds once every requirement is met: strong but never certain. Anchor
 * surplus beyond the requirement and a fuller mind both steady the ascent.
 */
export function apotheosisSuccessChance(session: GameSession): number {
  const state = session.gameState;
  const support = session.anchorState ? effectiveSupport(session.anchorState) : 0;
  const surplus = Math.max(0, support - requiredSupport(0));
  const sanityRatio = state.maxSanity > 0 ? state.sanity / state.maxSanity : 0;
  const chance = 0.6 + Math.min(0.15, surplus / 400) + sanityRatio * 0.2;
  return Math.min(0.95, chance);
}

/** Shown once to a player who reaches Sequence 0 — and never explained. */
export const ABOVE_SEQUENCE_TEASE =
  "From the throne you finally see it: the sequences are rungs, and the ladder leans against something. Far above, where no pathway reaches, something old notices that a new god is looking up.";

export interface ApotheosisAscended {
  outcome: "ascended";
  session: GameSession;
  honorific: string;
  /** The one glimpse past the top of the ladder. */
  tease: string;
}

export interface ApotheosisUnmade {
  outcome: "unmade";
  verdict: FailureVerdict;
}

export type ApotheosisResult = ApotheosisAscended | ApotheosisUnmade;

/**
 * Attempt the apotheosis. Deterministic under the injected randomness. On
 * success the engine — not the AI — writes Sequence 0: the Uniqueness is
 * consumed, digestion resets for the new existence, and the narrator learns
 * what happened through memory facts. On failure the death engine resolves a
 * catastrophic ritual failure at Sequence 1 (fatal on the ladder); the caller
 * routes it through the same permadeath machinery as any other ending.
 */
export function attemptApotheosis(
  session: GameSession,
  random: () => number = Math.random,
  now: number = Date.now(),
): ApotheosisResult {
  if (!canAttemptApotheosis(session)) {
    return {
      outcome: "unmade",
      verdict: evaluateFailure({
        cause: "ritual-failure",
        sequenceLevel: session.gameState.sequenceLevel,
        catastrophic: true,
        highRisk: true,
      }),
    };
  }

  if (random() >= apotheosisSuccessChance(session)) {
    return {
      outcome: "unmade",
      verdict: evaluateFailure({
        cause: "ritual-failure",
        sequenceLevel: 1,
        catastrophic: true,
        highRisk: session.anchorState
          ? anchorHighRisk(session.anchorState, 1)
          : undefined,
      }),
    };
  }

  const state = session.gameState;
  const honorific = trueGodName(state.pathwayId);
  const uniquenessName = uniquenessItemFor(state.pathwayId).name;
  const facts: SessionFact[] = [
    {
      type: "event",
      description: `Completed the apotheosis ritual and became ${honorific}, the Sequence 0 True God of the pathway. The world's churches, hidden orders, and rival gods all felt it happen.`,
      turnNumber: session.turnCount,
    },
    {
      type: "event",
      description: ABOVE_SEQUENCE_TEASE,
      turnNumber: session.turnCount,
    },
  ];

  return {
    outcome: "ascended",
    honorific,
    tease: ABOVE_SEQUENCE_TEASE,
    session: {
      ...session,
      gameState: {
        ...state,
        sequenceLevel: 0,
        // The Uniqueness is consumed by the ascent — it IS the new god.
        inventory: state.inventory.filter((item) => item.name !== uniquenessName),
        digestion: createDigestionState(state.pathwayId, 0),
      },
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, ...facts],
      },
      updatedAt: now,
    },
  };
}

// ─── Post-apotheosis play: divine petitions ──────────────────────────

/** Per-turn chance a worshipper's petition reaches the new god. */
export const PETITION_CHANCE = 0.35;

const PETITIONS = [
  "a dockworker prays for a brother lost at sea, and the prayer arrives like a letter slid under a door",
  "a village priest begs guidance against a thing wearing his bishop's face",
  "a child asks, very politely, for it to stop raining on market day",
  "a heretic dares you to prove you exist, and the dare carries strange weight",
  "a dying scholar offers everything she knows for one more year",
  "a rival church's congregation prays AGAINST you, and you feel each voice",
] as const;

/**
 * Draw the turn's divine petition, if any — a memory fact the narrator weaves
 * into the scene (post-apotheosis gameplay: worshippers, divine politics).
 * Deterministic under the injected randomness; null when no petition arrives.
 */
export function drawPetition(
  pathwayId: number,
  turnNumber: number,
  random: () => number = Math.random,
): SessionFact | null {
  if (random() >= PETITION_CHANCE) return null;
  const petition = PETITIONS[Math.floor(random() * PETITIONS.length)];
  return {
    type: "event",
    description: `A petition rises to ${trueGodName(pathwayId)}: ${petition}.`,
    turnNumber,
  };
}
