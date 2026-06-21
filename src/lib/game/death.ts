import type { GameState, SessionFact } from "@/lib/ai";
import { DEFAULT_EPOCH_ID, isFifthEpoch } from "@/lib/lore";
import { pickRandom } from "@/lib/lore/random";

import { evaluateLossOfControl, type LossOfControlSeverity } from "./sanity";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Death & failure engine (issue #12)
// ---------------------------------------------------------------------------
//
// Context-dependent consequences, owned by the rules engine (never the AI):
// a failure resolves to a recoverable SETBACK or to PERMADEATH. On permadeath
// the world persists — the fallen character becomes a legacy (a monster, a
// legend, or a cautionary tale) that future characters in the same timeline
// encounter as memory facts. A full restart wipes the legacy list and
// restores the canonical baseline. Pure functions; storage in the UI layer.

export type FailureCause = "loss-of-control" | "combat-defeat" | "ritual-failure";

export type FailureOutcome = "setback" | "permadeath";

export interface FailureVerdict {
  cause: FailureCause;
  severity: LossOfControlSeverity;
  outcome: FailureOutcome;
}

export interface FailureContext {
  cause: FailureCause;
  sequenceLevel: number;
  /** Fragile moment (mid-advancement digestion, Outer Deity influence). */
  highRisk?: boolean;
  /**
   * For combat/ritual causes: whether the failure was catastrophic (a fatal
   * blow, a ritual inviting something through). Non-catastrophic failures are
   * always setbacks per the design — defeat should sting, not end the story.
   */
  catastrophic?: boolean;
}

/**
 * Evaluate a failure into its consequence. Loss of control defers to the
 * sanity engine's severity ladder; combat and ritual failures are setbacks
 * unless catastrophic, in which case the same sequence-scaled ladder applies
 * (powerful Beyonders fail more terribly).
 */
export function evaluateFailure(context: FailureContext): FailureVerdict {
  let severity: LossOfControlSeverity;
  if (context.cause === "loss-of-control") {
    severity = evaluateLossOfControl({
      sequenceLevel: context.sequenceLevel,
      highRisk: context.highRisk,
    });
  } else if (context.catastrophic) {
    severity = evaluateLossOfControl({
      sequenceLevel: context.sequenceLevel,
      // A catastrophic external failure is already the escalated case.
      highRisk: true,
    });
  } else {
    severity = "setback";
  }
  return {
    cause: context.cause,
    severity,
    outcome: severity === "setback" ? "setback" : "permadeath",
  };
}

export interface SetbackResult {
  state: GameState;
  /** Player-facing consequence lines. */
  notes: string[];
  /** Memory facts so the narrator remembers the fall and its costs. */
  facts: SessionFact[];
}

// Where a broken Beyonder wakes up — displaced, never comfortably home. The
// place must fit the ERA: a setback in the Age of Chaos cannot drop the
// character into a gas-lit Iron-Age warehouse. One pool per epoch, each drawn
// from that epoch's own setting (see `EPOCHS` in `@/lib/lore`); an absent or
// unknown epoch falls back to the Fifth (the default era).
const DISPLACEMENT_PLACES_BY_EPOCH: Record<number, readonly string[]> = {
  // First Epoch — Age of Chaos: hide tents, raw wilderness, bronze and bone.
  1: [
    "a cold fire-pit at the edge of the camp",
    "a thicket beyond the hide tents",
    "a hollow among moss-grown standing stones",
    "the muddy bank of a nameless river",
    "a low cave mouth in the wild lands",
  ],
  // Second Epoch — Dark Epoch: inhuman gods rule, humans hidden or enslaved.
  2: [
    "a slave-pen beneath the overseers' hall",
    "a hidden cellar deep in the human enclave",
    "the cold shadow of a god-idol's plinth",
    "a refuse-ditch at the enclave's edge",
    "a cramped warren below the dominion's streets",
  ],
  // Third Epoch — Cataclysm Epoch: revolt and crusade, war-camps and banners.
  3: [
    "a churned-mud trench at the camp's edge",
    "an abandoned supply tent behind the lines",
    "the lee of a broken siege-engine",
    "a field-surgeon's cot among the wounded",
    "the ashes of a burned-out roadside shrine",
  ],
  // Fourth Epoch — Epoch of the Gods: Solomon Empire, pilgrims and petitioners.
  4: [
    "a pilgrims' almshouse cot",
    "a colonnade nook outside a temple",
    "a debtor's cell in the imperial undercroft",
    "a back alley off the processional way",
    "an abandoned shrine on the capital's outskirts",
  ],
  // Fifth Epoch — Iron Age: gas-lit Loen, the baseline setting.
  5: [
    "a fog-choked alley",
    "a derelict chapel cellar",
    "the bank of the canal",
    "a pauper's ward cot",
    "an abandoned warehouse",
  ],
};

/** Fraction of sanity restored after surviving a breakdown. */
export const SETBACK_SANITY_RATIO = 0.25;

/**
 * Apply a recoverable setback: wake with a sliver of sanity, lose roughly half
 * your carried items, displaced to an unknown corner of the same locale,
 * reputation dented. Deterministic given the injected random source. The
 * displacement place is drawn from the character's `epoch` so a breakdown never
 * relocates them into another era's setting (an absent/unknown epoch falls back
 * to the Fifth).
 */
export function applySetback(
  state: GameState,
  random: () => number = Math.random,
  turnNumber: number = 0,
  epoch?: number,
): SetbackResult {
  const notes: string[] = [];
  const facts: SessionFact[] = [];

  const sanity = Math.max(1, Math.ceil(state.maxSanity * SETBACK_SANITY_RATIO));
  notes.push("You wake with your mind in tatters, but you wake.");

  // Lose ~half the inventory, chosen by the injected randomness.
  const lostCount = Math.floor(state.inventory.length / 2);
  const remaining = [...state.inventory];
  const lostNames: string[] = [];
  for (let i = 0; i < lostCount; i++) {
    const lost = pickRandom(remaining, random);
    lostNames.push(lost.name);
    remaining.splice(remaining.indexOf(lost), 1);
  }
  if (lostNames.length > 0) {
    notes.push(`Missing from your pockets: ${lostNames.join(", ")}.`);
  }

  // Resolve to a known epoch pool up front (mirroring `getEpoch`): an absent or
  // unknown id falls back to the Fifth, and both the place pool and the
  // city-anchoring below read this same resolved id so they can never disagree.
  const epochId =
    epoch !== undefined && epoch in DISPLACEMENT_PLACES_BY_EPOCH
      ? epoch
      : DEFAULT_EPOCH_ID;
  const places = DISPLACEMENT_PLACES_BY_EPOCH[epochId];
  const place = pickRandom(places, random);
  // The Fifth Epoch anchors displacement to the character's current city — its
  // cross-city travel is gated, so a breakdown must not teleport them to another
  // city. Earlier epochs have no city model, so the era-appropriate place stands
  // on its own.
  const location = isFifthEpoch(epochId)
    ? `${capitalize(place)} in ${state.location.split(" ")[0] || "the city"}`
    : capitalize(place);
  notes.push(`You come to in ${place}, with no memory of how you got there.`);

  notes.push("Word of your breakdown spreads; your standing suffers.");
  facts.push({
    type: "event",
    description: `Suffered a public loss of control; woke in ${place} with belongings missing and reputation damaged.`,
    turnNumber,
  });

  return {
    state: { ...state, sanity, inventory: remaining, location },
    notes,
    facts,
  };
}

// --- permadeath & legacy -----------------------------------------------------

export type LegacyFate = "transformed" | "dead";
export type LegacyRole = "monster" | "legend" | "cautionary-tale";

/** What a fallen character leaves behind in the shared timeline. */
export interface CharacterLegacy {
  characterId: string;
  characterName?: string;
  pathwayId: number;
  sequenceLevel: number;
  fate: LegacyFate;
  role: LegacyRole;
  location: string;
  turnCount: number;
  /** One-line epitaph used in memory facts and the death screen. */
  epitaph: string;
  timestamp: number;
}

/**
 * Build the legacy a character leaves on permadeath. A transformation leaves
 * a monster loose in the world; a death leaves a legend (the powerful) or a
 * cautionary tale (everyone else).
 */
export function buildLegacy(
  session: GameSession,
  severity: LossOfControlSeverity,
  now: number = Date.now(),
): CharacterLegacy {
  const state = session.gameState;
  const fate: LegacyFate = severity === "fatal" ? "dead" : "transformed";
  const role: LegacyRole =
    fate === "transformed"
      ? "monster"
      : state.sequenceLevel <= 6
        ? "legend"
        : "cautionary-tale";

  const name = state.characterName ?? "A nameless Beyonder";
  const epitaph =
    fate === "transformed"
      ? `${name} lost control in ${state.location}; something monstrous now wears their shape.`
      : role === "legend"
        ? `${name}, a Sequence ${state.sequenceLevel} Beyonder, fell in ${state.location}; their story is still whispered.`
        : `${name} died in ${state.location} — a quiet warning about powers taken too lightly.`;

  return {
    characterId: state.characterId,
    ...(state.characterName ? { characterName: state.characterName } : {}),
    pathwayId: state.pathwayId,
    sequenceLevel: state.sequenceLevel,
    fate,
    role,
    location: state.location,
    turnCount: session.turnCount,
    epitaph,
    timestamp: now,
  };
}

/** Mark a session as ended by permadeath (pure). The session is preserved —
 * its inventory, memory, and journal stay readable as historical records. */
export function endSession(
  session: GameSession,
  legacy: CharacterLegacy,
  scene: string,
  now: number = Date.now(),
): GameSession {
  return {
    ...session,
    ended: {
      fate: legacy.fate,
      severity: legacy.fate === "dead" ? "fatal" : "transformation",
      scene,
      at: now,
    },
    updatedAt: now,
  };
}

/**
 * Seed a new character's memory with the timeline's legacies so the narrator
 * can surface tangible evidence of previous characters (the world remembers).
 */
export function legaciesToFacts(legacies: readonly CharacterLegacy[]): SessionFact[] {
  return legacies.map((legacy) => ({
    type: "event",
    description:
      legacy.role === "monster"
        ? `${legacy.epitaph} The creature has not been dealt with.`
        : legacy.epitaph,
    turnNumber: 0,
  }));
}

export function serializeLegacies(legacies: readonly CharacterLegacy[]): string {
  return JSON.stringify(legacies);
}

/** Strict-shape parse; null for anything malformed. */
export function deserializeLegacies(json: string): CharacterLegacy[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const valid = parsed.every(
    (l: unknown) =>
      typeof l === "object" &&
      l !== null &&
      typeof (l as CharacterLegacy).characterId === "string" &&
      typeof (l as CharacterLegacy).epitaph === "string" &&
      ((l as CharacterLegacy).fate === "transformed" ||
        (l as CharacterLegacy).fate === "dead"),
  );
  return valid ? (parsed as CharacterLegacy[]) : null;
}

/** Deterministic fallback descent scene when no AI narration is available. */
export function fallbackDescentScene(
  severity: LossOfControlSeverity,
  state: GameState,
): string {
  const name = state.characterName ?? "the Beyonder";
  if (severity === "fatal") {
    return `The last thread snaps. Whatever held ${name} together scatters into the fog over ${state.location}, and the gas lamps gutter as one. No body is ever found — only a silence where a person used to be.`;
  }
  return `The change comes quietly at first: a wrongness in the joints, a hunger that thinks in someone else's voice. By the time the screaming starts in ${state.location}, ${name} is already gone — and the thing that remains remembers just enough to hide.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
