import type { GameState, MemoryState } from "@/lib/ai";
import { getSequence, siblingPathwayIds } from "@/lib/rules";
import type { Item } from "@/lib/types/rules";

import type {
  AcquiredPower,
  PowerAcquisitionMethod,
  PowerPermanence,
} from "./acquired-powers";
import { MAX_ACQUIRED_POWERS } from "./acquired-powers";
import {
  anchorHighRisk,
  consecrateAnchor,
  emptyAnchorState,
  type AnchorKind,
} from "./anchors";
import { uniquenessItemFor } from "./apotheosis";
import { makePathwaySwitch } from "./pathway-lineage";
import { switchRelation } from "./pathway-switch";
import { PILLAR_SEQUENCE } from "./pillars";
import { createDigestionState } from "./digestion";
import { adjustFunds, getFunds } from "./marketplace";
import { clamp } from "./math";
import { evaluateLossOfControl, type LossOfControlSeverity } from "./sanity";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";
import { applySanityImpact, grantSealedArtifact } from "./world-state";

// ---------------------------------------------------------------------------
// Admin / dev test utilities (gated behind `profiles.is_admin`).
// ---------------------------------------------------------------------------
//
// Reaching an interesting game state organically — a deep Sequence, the endgame,
// a loss of control, a pocket of Sealed Artifacts — takes a long playthrough. So
// an admin can stand a character up in ANY state and exercise the mechanics in a
// click or two. Like `dev-tools.ts`'s `createTestCharacter`, this is a PURE
// builder over the existing engine (no localStorage, no AI): it COMPOSES
// `createDefaultGameState`/`createSession` and the same subsystem functions a
// real playthrough drives (`grantSealedArtifact`, `consecrateAnchor`,
// `uniquenessItemFor`, …), then the React surface persists + activates the save.
//
// Everything an admin builds touches only their OWN local/cloud saves, so this is
// a convenience surface, not a privilege — the gate exists to keep dev tooling
// out of a normal player's way. Pure + deterministic (injected `id`/`now`/
// `random`), under the engine coverage mandate.

/** Full digestion progress — the "ready to advance" state (mirrors createTestCharacter). */
const DIGESTION_COMPLETE = 100;
/** A generous default wallet so the market/potion economy is exercisable at once. */
const DEFAULT_ADMIN_FUNDS = 100_000;
/** Fading powers default to this many turns of use when the spec gives none. */
const DEFAULT_TEMPORARY_POWER_TURNS = 10;
/** Distinct id prefix so admin-built saves are recognisable in the index. */
export const ADMIN_CHARACTER_ID_PREFIX = "admin-";

/**
 * Anchors consecrated for an endgame-ready build — four congregations at full
 * integrity sum to 400 effective support, comfortably above both the apotheosis
 * (`requiredSupport(0)` = 220) and Pillar (`PILLAR_REQUIRED_SUPPORT` = 300) gates,
 * so the ApotheosisPanel / PillarAscensionPanel unlock immediately.
 */
const ENDGAME_ANCHORS: readonly AdminAnchorSpec[] = [
  { kind: "congregation", name: "First Faithful Congregation" },
  { kind: "congregation", name: "Second Faithful Congregation" },
  { kind: "congregation", name: "Third Faithful Congregation" },
  { kind: "congregation", name: "Fourth Faithful Congregation" },
];

/**
 * Which endgame the build should sit at (or none). The `-ready` values POISE the
 * character to attempt the ascent (Seq 1 for apotheosis, Seq 0 for the Pillar);
 * the `enthroned` values stand up an ALREADY-ASCENDED apex so the post-ascension
 * surfaces — the True God / Pillar sheet, the family-pathway kits (issue #210) —
 * can be viewed directly without playing out the rite.
 */
export type AdminEndgame =
  | "none"
  | "apotheosis"
  | "pillar"
  | "true-god"
  | "pillar-enthroned";

/** A power to force-grant onto the build (bypasses the normal capability gate). */
export interface AdminAcquiredPowerSpec {
  name: string;
  description?: string;
  method?: PowerAcquisitionMethod;
  permanence?: PowerPermanence;
  sourceName?: string;
}

/** An anchor to consecrate on the build. */
export interface AdminAnchorSpec {
  kind: AnchorKind;
  name: string;
}

export interface AdminCharacterOptions {
  /** 1–22. */
  pathwayId: number;
  /** 1–9 playable rung; an `endgame` build overrides this (Seq 1 / Seq 0). */
  sequenceLevel: number;
  /** `start` = fresh potion (progress 0); `end` = fully digested, ready to advance. */
  digestion: "start" | "end";
  characterName?: string;
  characterBackground?: string;
  /** Wallet in pence (defaults to a deep dev wallet). */
  funds?: number;
  /** Sanity to seed (clamped to the rung's max); defaults to full. */
  sanity?: number;
  /** Reveal the digestion meter / acting UI (defaults to true). */
  knowsActingMethod?: boolean;
  /** Sealed Artifact catalogue codes to grant (unknown codes are no-ops). */
  artifactNumbers?: readonly string[];
  /** Put the build one click from advancing (next potion's ingredients + digested). */
  advancementReady?: boolean;
  /** Powers to force-grant onto the character sheet. */
  acquiredPowers?: readonly AdminAcquiredPowerSpec[];
  /** Anchors to consecrate (defaults to an endgame set when `endgame` is set). */
  anchors?: readonly AdminAnchorSpec[];
  /** Poise the build at an endgame ascent (apotheosis at Seq 1, pillar at Seq 0). */
  endgame?: AdminEndgame;
  /**
   * Pathway switching (issue #211): prepare the switch potion for this TARGET
   * pathway (its current-rung recipe seeded into inventory + digestion complete)
   * so the character is poised to exchange into it from the switch panel.
   */
  switchReadyTarget?: number;
  /**
   * Pathway switching (issue #211): pathways the character has ALREADY switched
   * away from — seeds a fused `pathwayLineage` so the fused abilities show on the
   * sheet and in combat without playing the exchange out.
   */
  fusedPathways?: readonly number[];
}

/** Append a fresh copy of an item to the inventory. */
function withItem(state: GameState, item: Item): GameState {
  return { ...state, inventory: [...state.inventory, { ...item }] };
}

/**
 * Put a game state one click from advancing: the next potion's exact
 * prerequisites in hand and the current potion fully digested (the
 * `createTestCharacter` recipe; the acting-method flag is set on the session).
 */
export function makeAdvancementReadyState(state: GameState): GameState {
  const target = getSequence(state.pathwayId, state.sequenceLevel - 1);
  const items = (target?.prerequisiteItems ?? []).map((item) => ({ ...item }));
  const digestion =
    state.digestion ?? createDigestionState(state.pathwayId, state.sequenceLevel);
  return {
    ...state,
    digestion: { ...digestion, progress: DIGESTION_COMPLETE, complete: true },
    inventory: [...state.inventory, ...items],
  };
}

/**
 * Build a fully-formed admin test character at any pathway, sequence, and
 * digestion state, optionally pre-loaded with artifacts, powers, anchors, a deep
 * wallet, and an endgame readiness. Pure; the caller persists + activates it.
 */
export function buildAdminCharacter(
  options: AdminCharacterOptions,
  id: string = `${ADMIN_CHARACTER_ID_PREFIX}${crypto.randomUUID()}`,
  now: number = Date.now(),
  initialMemory?: MemoryState,
): GameSession {
  const endgame = options.endgame ?? "none";
  // A pillar build (poised or enthroned) only reaches the Pillar for a pathway in
  // a Pillar family; otherwise it falls back to the True God tier (its own apex).
  const hasFamily = siblingPathwayIds(options.pathwayId).length > 0;
  const pillarReady = endgame === "pillar" && hasFamily;
  const apotheosisReady =
    endgame === "apotheosis" || (endgame === "pillar" && !hasFamily);
  // Already-ascended apex states — stood up so the post-ascension surfaces (the
  // True God / Pillar sheet, the family-pathway kits, issue #210) can be viewed
  // directly rather than played out through the rite.
  const pillarEnthroned = endgame === "pillar-enthroned" && hasFamily;
  const trueGodEnthroned =
    endgame === "true-god" || (endgame === "pillar-enthroned" && !hasFamily);

  const requestedSeq = clamp(Math.round(options.sequenceLevel), 1, 9);
  // Apotheosis is attempted at Seq 1; the Pillar from a Seq 0 True God. An
  // enthroned Pillar sits above the sequences (PILLAR_SEQUENCE); an enthroned or
  // poised True God at Seq 0.
  const sequenceLevel = pillarEnthroned
    ? PILLAR_SEQUENCE
    : trueGodEnthroned || pillarReady
      ? 0
      : apotheosisReady
        ? 1
        : requestedSeq;

  const base = createDefaultGameState(
    options.pathwayId,
    undefined,
    options.characterName ?? "Admin Subject",
    options.characterBackground,
  );

  const fresh = createDigestionState(options.pathwayId, sequenceLevel);
  // An apotheosis build needs a fully-digested potion to unlock the ascent.
  const digested = options.digestion === "end" || apotheosisReady;
  const digestion = digested
    ? { ...fresh, progress: DIGESTION_COMPLETE, complete: true }
    : fresh;

  let gameState: GameState = {
    ...base,
    sequenceLevel,
    digestion,
    funds: options.funds ?? DEFAULT_ADMIN_FUNDS,
  };

  if (options.sanity !== undefined) {
    gameState = {
      ...gameState,
      sanity: clamp(Math.round(options.sanity), 0, gameState.maxSanity),
    };
  }

  if (options.advancementReady) {
    gameState = makeAdvancementReadyState(gameState);
  }

  // Poise the build to switch into `switchReadyTarget`: digest the current potion
  // and seed the target pathway's current-rung recipe so the switch panel unlocks.
  if (options.switchReadyTarget !== undefined) {
    const switchItems = (
      getSequence(options.switchReadyTarget, gameState.sequenceLevel)
        ?.prerequisiteItems ?? []
    ).map((item) => ({ ...item }));
    gameState = {
      ...gameState,
      inventory: [...gameState.inventory, ...switchItems],
      digestion: {
        ...createDigestionState(gameState.pathwayId, gameState.sequenceLevel),
        progress: 100,
        complete: true,
      },
    };
  }

  // Endgame inventory: the Uniqueness artifact(s) the ascent consumes.
  if (apotheosisReady) {
    gameState = withItem(gameState, uniquenessItemFor(options.pathwayId));
  } else if (pillarReady) {
    for (const siblingId of siblingPathwayIds(options.pathwayId)) {
      gameState = withItem(gameState, uniquenessItemFor(siblingId));
    }
  }

  for (const number of options.artifactNumbers ?? []) {
    gameState = grantSealedArtifact(gameState, number);
  }

  let session = createSession(gameState, id, now, initialMemory);

  if (options.knowsActingMethod ?? true) {
    session = { ...session, actingMethodState: { knowsMethod: true, alignedStreak: 0 } };
  }

  const powers = (options.acquiredPowers ?? [])
    .slice(0, MAX_ACQUIRED_POWERS)
    .map((spec, i) => buildAcquiredPower(spec, `${id}-power-${i}`));
  if (powers.length > 0) session = { ...session, acquiredPowers: powers };

  // An already-fused character (issue #211): record each pathway switched away
  // from with its frozen retained-ability snapshot.
  if (options.fusedPathways && options.fusedPathways.length > 0) {
    const seq = session.gameState.sequenceLevel;
    const switches = options.fusedPathways.map((fromId) =>
      makePathwaySwitch(
        fromId,
        seq,
        switchRelation(session.gameState.pathwayId, fromId),
        0,
      ),
    );
    session = { ...session, pathwayLineage: { switches } };
  }

  const anchorSpecs =
    options.anchors ?? (apotheosisReady || pillarReady ? ENDGAME_ANCHORS : []);
  if (anchorSpecs.length > 0) {
    let anchorState = session.anchorState ?? emptyAnchorState();
    anchorSpecs.forEach((spec, i) => {
      anchorState = consecrateAnchor(anchorState, spec, `${id}-anchor-${i}`);
    });
    session = { ...session, anchorState };
  }

  // The apex ascent is now a paced, multi-turn rite (`ascension-rite.ts`) that the
  // UI requires under way before the attempt. Seed it fully formed for an endgame
  // build so it is genuinely poised to ascend immediately — the builder's contract
  // — rather than made to play out the rite over turns.
  if (apotheosisReady || pillarReady) {
    session = {
      ...session,
      ascensionRite: {
        tier: pillarReady ? "pillar" : "true-god",
        pathwayId: options.pathwayId,
        fidelity: 1,
      },
    };
  }

  return session;
}

/** Construct a valid `AcquiredPower` from a dev spec (no capability gate). */
function buildAcquiredPower(spec: AdminAcquiredPowerSpec, id: string): AcquiredPower {
  const permanence: PowerPermanence = spec.permanence ?? "permanent";
  const power: AcquiredPower = {
    id,
    name: spec.name,
    description: spec.description ?? "",
    method: spec.method ?? "imitation",
    permanence,
    acquiredAtTurn: 0,
  };
  if (spec.sourceName) power.sourceName = spec.sourceName;
  if (permanence === "temporary") power.turnsRemaining = DEFAULT_TEMPORARY_POWER_TURNS;
  return power;
}

// ─── Mutators for the active save ────────────────────────────────────

/** Set the active character's sanity (clamped to its max). */
export function setSessionSanity(session: GameSession, value: number): GameSession {
  const gs = session.gameState;
  return {
    ...session,
    gameState: { ...gs, sanity: clamp(Math.round(value), 0, gs.maxSanity) },
  };
}

/** Set the active character's wallet (floored at 0, via the marketplace economy). */
export function setSessionFunds(session: GameSession, value: number): GameSession {
  const gs = session.gameState;
  return {
    ...session,
    gameState: adjustFunds(gs, Math.round(value) - getFunds(gs)),
  };
}

/** Grant Sealed Artifacts by catalogue code (unknown/duplicate codes are no-ops). */
export function grantArtifactsToSession(
  session: GameSession,
  codes: readonly string[],
): GameSession {
  let gs = session.gameState;
  for (const code of codes) gs = grantSealedArtifact(gs, code);
  return { ...session, gameState: gs };
}

/** Make the active character one click from advancing (and reveal the method). */
export function makeAdvancementReady(session: GameSession): GameSession {
  return {
    ...session,
    gameState: makeAdvancementReadyState(session.gameState),
    actingMethodState: { knowsMethod: true, alignedStreak: 0 },
  };
}

/**
 * Drive the active character to a loss of control by emptying its sanity — the
 * game loop's existing `isLossOfControl`/`FailurePanel` machinery presents the
 * verdict when the character is next opened. No new failure UI.
 */
export function forceLossOfControl(session: GameSession): GameSession {
  const gs = session.gameState;
  return { ...session, gameState: applySanityImpact(gs, -gs.sanity) };
}

/** Preview the loss-of-control severity a zero-sanity break would produce now. */
export function lossOfControlPreview(session: GameSession): LossOfControlSeverity {
  const gs = session.gameState;
  const highRisk = anchorHighRisk(
    session.anchorState ?? emptyAnchorState(),
    gs.sequenceLevel,
  );
  return evaluateLossOfControl({ sequenceLevel: gs.sequenceLevel, highRisk });
}
