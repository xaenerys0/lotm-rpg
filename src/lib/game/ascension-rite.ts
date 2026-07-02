import type { SessionFact } from "@/lib/ai";
import { pillarForPathway } from "@/lib/rules";

import { clamp } from "./math";
import { RITE_IN_PROGRESS_GUARD, ritualCircumstanceFidelity } from "./ritual";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// The rite of ascension — the apex endgame as a paced, multi-turn rite
// ---------------------------------------------------------------------------
//
// Seizing Sequence 0 (apotheosis) or ascending above the sequences into a Pillar
// were single-click rolls. That made the most momentous act in a chronicle
// anticlimactic. This turns each into a RITE that is begun once and then MATURES
// over the turns of play — mirroring the Advancement Ritual (`ritual.ts`): the
// player performs the rite ("Begin the rite of ascension"), which the React layer
// pairs with an immediate narrated turn, and from then on it matures each turn of
// normal play (`advanceAscensionRite`, wired into the per-turn tick). The apex is
// grander than a rung, so it matures more slowly.
//
// Progress is the `fidelity` (0..1), accrued each turn scaled by how favourable
// the scene is right then (`ritualCircumstanceFidelity` — reused from the
// Advancement Ritual: a private, unhurt, unhunted moment matures it fastest;
// witnesses, wounds, or pursuers slow it; real danger stalls it). The stored
// fidelity is folded into the ascent odds (`apotheosisSuccessChance` /
// `pillarAscensionSuccessChance`): attempting the transformation on an unripe
// rite is allowed but far more dangerous, so the several-turn maturation is the
// natural path. Never beginning the rite reads as fidelity 0.
//
// The rite is keyed by TIER (true-god / pillar), not a target sequence, since the
// apex has no rung to advance INTO. `AscensionRiteState` is a single optional
// sub-state on the session (mirroring `ritualState` / `formulaPursuit`): strictly
// validated, preserved on the deserialize `...s` spread, never seeded. No DB
// migration (it serializes inside the session blob).
//
// Pure + deterministic; the React layer triggers `beginAscensionRite`, runs the
// rite's narrated turn, ticks `advanceAscensionRite` each turn, and persists.

/** The apex tier a rite ascends into. */
export type AscensionTier = "true-god" | "pillar";

/** An ascension rite the player has begun and is letting mature. */
export interface AscensionRiteState {
  /** Which apex the rite ascends into. */
  tier: AscensionTier;
  /** The pathway whose apex this is (the True God / Pillar family seat). */
  pathwayId: number;
  /**
   * How far the rite has matured, in [0, 1]. Accrues each turn (scaled by the
   * scene's favourability) toward a fully faithful rite; the transformation may
   * be attempted at any point, at whatever fidelity has accrued.
   */
  fidelity: number;
}

/**
 * Fraction of the remaining gap to a faithful rite closed per ideal turn. Lower
 * than the Advancement Ritual's rate — an ascension is the grandest rite there
 * is, and takes longer to form.
 */
export const ASCENSION_PROGRESS_RATE = 0.2;
/** At/above this fidelity the rite counts as fully matured (avoids endless churn). */
export const ASCENSION_FIDELITY_CAP = 0.99;
/**
 * How much a wholly unformed rite (fidelity 0 — never begun, or drunk the instant
 * it opens) drags the ascent odds down. Folded into `apotheosisSuccessChance` /
 * `pillarAscensionSuccessChance` as `−penalty × (1 − fidelity)`, so a fully
 * matured rite costs nothing and skipping it is dire but never impossible.
 */
export const ASCENSION_INFIDELITY_PENALTY = 0.45;
/** The success-chance floor an unformed rite can drag the odds to, never below. */
export const ASCENSION_SUCCESS_FLOOR = 0.05;

/**
 * The apex tier a character can currently ascend into, or `null` when none is
 * available. A Sequence 1 King of Angels of any pathway can seize the throne
 * (apotheosis → True God); a Sequence 0 True God of one of the four Pillar
 * families can ascend above the sequences (→ Pillar). Every other state has no
 * ascension rite.
 */
export function ascensionTierFor(session: GameSession): AscensionTier | null {
  const { sequenceLevel, pathwayId } = session.gameState;
  if (sequenceLevel === 1) return "true-god";
  if (sequenceLevel === 0 && pillarForPathway(pathwayId) !== undefined) return "pillar";
  return null;
}

/** Close part of the remaining gap to a faithful rite, scaled by the scene. */
function accrueFidelity(current: number, circumstance: number): number {
  return clamp(current + (1 - current) * ASCENSION_PROGRESS_RATE * circumstance, 0, 1);
}

/**
 * The canonical `activeQuests` string for an ascension rite under way — one
 * source of truth so the label added on begin matches the one removed on the
 * ascent (the narrator sees this entry and keeps weaving the maturing rite into
 * the scene).
 */
export function ascensionRiteQuestLabel(tier: AscensionTier): string {
  return tier === "pillar"
    ? "Let the rite of ascension above the sequences mature"
    : "Let the rite of apotheosis mature";
}

function withQuestLabel(quests: string[], label: string): string[] {
  return quests.includes(label) ? quests : [...quests, label];
}

function withoutQuestLabel(quests: string[], label: string): string[] {
  return quests.filter((q) => q !== label);
}

/**
 * Begin the rite of ascension — the single "Begin the rite" trigger. Seeds the
 * rite with a first turn of progress (scaled by the current scene), adds the
 * AI-visible quest label, and records the act so the narrator opens it in
 * context. Idempotent once a rite for this tier is under way (does not reset
 * accrued progress). A no-op when no apex is available. The React layer pairs
 * this with an immediate narrated turn. Pure.
 */
export function beginAscensionRite(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const tier = ascensionTierFor(session);
  if (tier === null) return session;

  const existing = session.ascensionRite;
  if (existing && existing.tier === tier) return session;

  const fidelity = accrueFidelity(0, ritualCircumstanceFidelity(session));
  const label = ascensionRiteQuestLabel(tier);
  // Re-keying (a stale rite for the other tier) — drop its label first so a
  // superseded quest can't linger in `activeQuests`.
  const quests = existing
    ? withoutQuestLabel(
        session.gameState.activeQuests,
        ascensionRiteQuestLabel(existing.tier),
      )
    : session.gameState.activeQuests;

  const fact: SessionFact = {
    type: "event",
    description:
      tier === "pillar"
        ? "Began the rite of ascension above the sequences — gathering the family's godhoods to become a Pillar of the universe."
        : "Began the rite of apotheosis — the ceremony to seize the empty throne of Sequence 0.",
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(quests, label),
    },
    ascensionRite: { tier, pathwayId: session.gameState.pathwayId, fidelity },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Mature the ascension rite under way by one turn of play — the per-turn tick
 * (wired alongside `advanceRitual`). Closes part of the remaining gap to a
 * faithful rite, scaled by the scene's favourability that turn, and keeps the
 * quest label in sync. A no-op when no rite is under way or it has already fully
 * matured (so a long chronicle does not churn). Pure.
 */
export function advanceAscensionRite(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const state = session.ascensionRite;
  if (!state) return session;

  const label = ascensionRiteQuestLabel(state.tier);
  const labelled = session.gameState.activeQuests.includes(label);
  const fidelity = accrueFidelity(state.fidelity, ritualCircumstanceFidelity(session));

  // Nothing to commit when the rite is already labelled AND this turn changed
  // nothing — either it has fully matured (past the cap) or the scene is so
  // hostile it cannot progress at all (circumstance 0). Avoids per-turn churn.
  if (
    labelled &&
    (state.fidelity >= ASCENSION_FIDELITY_CAP || fidelity === state.fidelity)
  ) {
    return session;
  }

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(session.gameState.activeQuests, label),
    },
    ascensionRite: { ...state, fidelity },
    updatedAt: now,
  };
}

/**
 * How faithfully the ascension rite for the current apex has matured, in [0, 1].
 * `0` when no rite is under way for the tier the character can currently ascend
 * into (i.e. the player has not begun one, or none is available). Otherwise the
 * accrued fidelity. Drives the ascent-odds penalty in `apotheosis.ts` /
 * `pillars.ts`.
 */
export function ascensionRiteFidelity(session: GameSession): number {
  const tier = ascensionTierFor(session);
  if (tier === null) return 0;
  const state = session.ascensionRite;
  if (!state || state.tier !== tier) return 0;
  return clamp(state.fidelity, 0, 1);
}

/**
 * Whether a rite for the character's current apex is under way (begun, maturing).
 * False when the player has not begun one. The UI shows the maturing-progress
 * surface when true, the "Begin the rite" trigger when false.
 */
export function ascensionRiteInProgress(session: GameSession): boolean {
  const tier = ascensionTierFor(session);
  if (tier === null) return false;
  const state = session.ascensionRite;
  return state !== undefined && state.tier === tier;
}

/** Whether the rite has fully matured (past the cap) — the safest moment to ascend. */
export function ascensionRiteReady(session: GameSession): boolean {
  return (
    ascensionRiteInProgress(session) &&
    ascensionRiteFidelity(session) >= ASCENSION_FIDELITY_CAP
  );
}

/**
 * The binding `## Ritual in Progress` narrator block (threaded via
 * `GenerateOptions.ritualContext` → `prompts.ts`), or `null` when no apex rite is
 * under way. The apex counterpart to `ritualNarratorContext` (issue #220): tells
 * the narrator that beginning/performing the rite is NOT the ascension itself —
 * the character has not yet become a True God / Pillar — so it portrays the rite
 * forming and the power gathering, never a completed ascension (which only the
 * engine-committed ascent may narrate). Pure.
 */
export function ascensionRiteNarratorContext(session: GameSession): string | null {
  const state = session.ascensionRite;
  const tier = ascensionTierFor(session);
  // Only surface a rite that matches the apex the character can currently ascend
  // into (a stale rite for the other tier is inert — mirrors `ascensionRiteFidelity`).
  if (!state || tier === null || state.tier !== tier) return null;

  const opening =
    tier === "pillar"
      ? "A rite of ascension above the Sequences — drawing a god-family's authority together to become a Pillar of the universe — is under way."
      : "A rite of apotheosis — the ceremony to seize the empty throne of Sequence 0 and become a True God — is under way.";
  const becoming = tier === "pillar" ? "a Pillar above the Sequences" : "a True God";

  return (
    `${opening} This is the protective, world-shaking rite performed to endure the ` +
    `transformation; beginning or performing it does NOT complete the ascension. The ` +
    `character has NOT yet become ${becoming} or gained that dominion, and remains ` +
    `who they are now. Portray the rite taking shape and the vast power gathering — ` +
    `the pressure, the peril, the threshold drawing nearer — but ${RITE_IN_PROGRESS_GUARD} ` +
    `The transformation completes only later, when the game commits it.`
  );
}

/** Drop any rite under way (consumed on a successful ascent, or abandoned). */
export function clearAscensionRite(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const state = session.ascensionRite;
  if (state === undefined) return session;
  const label = ascensionRiteQuestLabel(state.tier);
  return {
    ...session,
    ascensionRite: undefined,
    gameState: {
      ...session.gameState,
      activeQuests: withoutQuestLabel(session.gameState.activeQuests, label),
    },
    updatedAt: now,
  };
}

export function isValidAscensionRiteShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (s.tier !== "true-god" && s.tier !== "pillar") return false;
  if (!Number.isFinite(s.pathwayId)) return false;
  if (
    !Number.isFinite(s.fidelity) ||
    (s.fidelity as number) < 0 ||
    (s.fidelity as number) > 1
  ) {
    return false;
  }
  return true;
}
