import type { GameState } from "@/lib/ai";

import { deserializeLegacies } from "./death";
import { getFunds, STARTING_FUNDS } from "./marketplace";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Achievements & timeline divergence (issue #18)
// ---------------------------------------------------------------------------
//
// Pure evaluation over a GameSession — every check reads only data the
// session actually carries, so achievements are reproducible from a save
// alone. The divergence score is an HONEST HEURISTIC (documented below), not
// a ground-truth diff against canon.

export interface Achievement {
  id: string;
  name: string;
  description: string;
  check: (session: GameSession) => boolean;
}

const seq = (s: GameSession): number => s.gameState.sequenceLevel;

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-sip",
    name: "The First Sip",
    description: "Survive your first potion and begin the climb.",
    check: (s) => s.turnCount >= 1,
  },
  {
    id: "method-actor",
    name: "Method Actor",
    description: "Fully digest a potion through acting.",
    check: (s) => s.gameState.digestion?.complete === true || seq(s) <= 8,
  },
  {
    id: "sequence-8",
    name: "A Second Rung",
    description: "Advance to Sequence 8.",
    check: (s) => seq(s) <= 8,
  },
  {
    id: "sequence-7",
    name: "Past the Threshold",
    description: "Advance to Sequence 7.",
    check: (s) => seq(s) <= 7,
  },
  {
    id: "sequence-5",
    name: "Named in Whispers",
    description: "Advance to Sequence 5.",
    check: (s) => seq(s) <= 5,
  },
  {
    id: "long-road",
    name: "The Long Road",
    description: "Survive fifty turns in one chronicle.",
    check: (s) => s.turnCount >= 50,
  },
  {
    id: "scarred",
    name: "Scarred, Not Broken",
    description: "Carry an injury and keep walking.",
    check: (s) => (s.gameState.injuries?.length ?? 0) > 0,
  },
  {
    id: "second-face",
    name: "A Second Face",
    description: "Craft an identity and wear it.",
    check: (s) => (s.identityState?.identities.length ?? 0) > 0,
  },
  {
    id: "haunted-timeline",
    name: "Haunted Timeline",
    description: "Begin a chronicle in a world that remembers the fallen.",
    check: (s) =>
      s.memory.sessionFacts.some(
        (fact) =>
          fact.description.includes("lost control in") ||
          fact.description.includes("their story is still whispered") ||
          fact.description.includes("a quiet warning about powers"),
      ),
  },
  {
    id: "merchant",
    name: "Coin Changes Hands",
    description: "Hold a purse that has seen real trade.",
    check: (s) => s.gameState.funds !== undefined && s.gameState.funds !== STARTING_FUNDS,
  },
  {
    id: "the-end",
    name: "The Story Ends Here",
    description: "Lose a character to the dark — and have it matter.",
    check: (s) => s.ended !== undefined,
  },
];

/** Earned achievement ids for a session, in definition order. */
export function evaluateAchievements(session: GameSession): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(session)).map((a) => a.id);
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Timeline divergence, 0..100 — an honest heuristic over observable signals:
 *   +25 capped by turn count (a longer story drifts further),
 *   +10 per fallen predecessor remembered by this timeline (max 30),
 *   +15 when the character has left the canon starting city,
 *   +10 when an identity web exists (canon Klein aside, faces change fates),
 *   +20 when the chronicle has ENDED — a death canon never recorded.
 * It reflects how much this world differs from the untouched baseline, not a
 * literal diff against the novel.
 */
export function divergenceScore(session: GameSession): number {
  const state: GameState = session.gameState;
  let score = Math.min(25, session.turnCount / 2);

  const legacies = session.memory.sessionFacts.filter(
    (fact) =>
      fact.description.includes("lost control in") ||
      fact.description.includes("still whispered") ||
      fact.description.includes("quiet warning about powers"),
  ).length;
  score += Math.min(30, legacies * 10);

  if (!state.location.toLowerCase().includes("tingen")) score += 15;
  if ((session.identityState?.identities.length ?? 0) > 0) score += 10;
  if (session.ended) score += 20;

  return Math.round(Math.min(100, score));
}

/** Public stats for the profile/showcase. */
export interface ShowcaseStats {
  turns: number;
  combatsWon: number;
  potionsConsumed: number;
  funds: number;
}

export function showcaseStats(session: GameSession): ShowcaseStats {
  return {
    turns: session.turnCount,
    // Victories leave "Result:"-style facts; a deterministic proxy from data
    // the session actually records.
    combatsWon: session.memory.sessionFacts.filter((fact) =>
      /victor|defeated the|won the fight/i.test(fact.description),
    ).length,
    // Sequence climbed from 9 implies one potion per rung, plus the first.
    potionsConsumed: 10 - session.gameState.sequenceLevel,
    funds: getFunds(session.gameState),
  };
}

/** Load timeline legacies count for flavor (uses death.ts storage format). */
export function legacyCount(raw: string | null): number {
  if (!raw) return 0;
  return deserializeLegacies(raw)?.length ?? 0;
}
