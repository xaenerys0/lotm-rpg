import type { GameState, ValidatedAIResponse, MemoryState, SessionFact } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import type { ActingEvaluation, StateChange } from "@/lib/ai";
import { addSessionFact, addTurn, buildTurnRecord } from "@/lib/ai";
import { applyDigestionProgress, createDigestionState } from "./digestion";
import { tickInjuries } from "./combat";
import { isReagentCategory } from "./inventory";
import { adjustFunds, FUNDS_DISCOVERED_CAP } from "./marketplace";
import { clamp } from "./math";
import { previewSanityImpact } from "./sanity";
import {
  evaluateActingDiscovery,
  type ActingDiscoveryTrigger,
  type ActingMethodState,
} from "./acting-method";
import { isReachable } from "./place-graph";
import { reassertFollowersAt, type TrackedNpcState } from "./tracked-npcs";

const AI_MUTABLE_FIELDS = new Set(["location", "activeQuests", "npcsPresent"]);

// ---------------------------------------------------------------------------
// Movement gate (issue #101)
// ---------------------------------------------------------------------------
//
// The narrator may move the character WITHIN a city freely, but a cross-city
// move is the player's deliberate choice (the travel map) — never a teleport for
// pacing. The one exception is an against-their-will relocation, signalled by an
// explicit `involuntaryCause` code on the `location` change. The gate never
// throws: a refused move keeps the character where they are and emits an
// in-world redirect fact (narration), matching the `discoveredItemLeadFact` /
// `freeTextRejection` convention.

/** The recognised against-the-will relocation causes the AI may signal. */
export const INVOLUNTARY_MOVE_CAUSES = [
  "abduction",
  "forced-passage",
  "capability-gated-teleport",
] as const;

export type InvoluntaryMoveCause = (typeof INVOLUNTARY_MOVE_CAUSES)[number];

export function isInvoluntaryMoveCause(value: unknown): value is InvoluntaryMoveCause {
  return (
    typeof value === "string" &&
    (INVOLUNTARY_MOVE_CAUSES as readonly string[]).includes(value)
  );
}

export interface GateLocationChangeInput {
  from: string;
  to: string;
  epoch?: number;
  cause?: InvoluntaryMoveCause;
  gateEnabled: boolean;
  turnNumber: number;
}

export interface GateLocationChangeResult {
  /** The location that should actually take effect (`from` when blocked). */
  location: string;
  /** True when a cross-city move without a valid cause was refused. */
  blocked: boolean;
  /** An in-world fact to fold into memory (redirect, or "against your will"). */
  fact?: SessionFact;
}

/**
 * Decide what a proposed `location` change resolves to. With the gate off, or
 * for a reachable (same-place / same-city / provisional) move, the change is
 * allowed unchanged. A non-reachable (cross-city) move is allowed ONLY with a
 * valid involuntary cause (recorded as an "against your will" fact); otherwise it
 * is blocked — the character stays in `from` and an in-world redirect fact is
 * emitted. Pure; never throws.
 */
export function gateLocationChange({
  from,
  to,
  epoch,
  cause,
  gateEnabled,
  turnNumber,
}: GateLocationChangeInput): GateLocationChangeResult {
  if (!gateEnabled) return { location: to, blocked: false };

  if (isReachable(from, to, epoch).reachable) {
    return { location: to, blocked: false };
  }

  if (cause !== undefined) {
    return {
      location: to,
      blocked: false,
      fact: {
        type: "event",
        description: `Against your will, you are taken from ${from} to ${to}.`,
        turnNumber,
      },
    };
  }

  return {
    location: from,
    blocked: true,
    fact: {
      type: "event",
      description: `You cannot simply will yourself from ${from} to ${to} — the journey between cities is one you must set out on deliberately. You remain in ${from}.`,
      turnNumber,
    },
  };
}

/**
 * Split AI-discovered items into the loot the player may actually carry
 * (`mundane` belongings and the narrator-grantable `uniqueness` artifact) and
 * the advancement-critical reagents that must come through the framework. The
 * reagents (`isReagentCategory`) are acquired ONLY via potion-preparation
 * (buy/hunt), combat spoils, or echoes — AI narration may not mint them, so they
 * are stripped here and turned into a story lead (`discoveredItemLeadFact`).
 * Pure.
 */
export function partitionDiscoveredItems(items: Item[]): {
  carried: Item[];
  blocked: Item[];
} {
  const carried: Item[] = [];
  const blocked: Item[] = [];
  for (const item of items) {
    (isReagentCategory(item.category) ? blocked : carried).push(item);
  }
  return { carried, blocked };
}

/**
 * Turn a blocked advancement-critical item the AI tried to grant into a story
 * lead: a `quest-progress` memory fact pointing the player at the proper
 * acquisition route (the preparation framework) rather than silently dropping
 * the narration. Pure.
 */
export function discoveredItemLeadFact(item: Item, turnNumber: number): SessionFact {
  const description =
    item.category === "potion-formula"
      ? `A lead surfaced toward the formula "${item.name}" — it must still be obtained through the proper channels for the next potion.`
      : item.category === "main-ingredient"
        ? `Word of the ${item.name} Beyonder Characteristic surfaced — it must still be hunted or bought for the next potion.`
        : `Learned where ${item.name} might be acquired for the next potion.`;
  return { type: "quest-progress", description, turnNumber };
}

/**
 * The diegetic memory fact recorded when the player discovers the Acting Method
 * (issue #95). Phrased to the trigger so the narrator can weave it in — a
 * teaching moment reads differently from a self-realization. Pure.
 */
export function actingMethodDiscoveryFact(
  trigger: ActingDiscoveryTrigger | null,
  turnNumber: number,
): SessionFact {
  const description =
    trigger === "taught"
      ? "Learned the secret of the Acting Method: it is by truly living the role of one's Sequence that the potion is assimilated."
      : trigger === "completion"
        ? "In fully assimilating the potion, came to understand what made it possible — living the role of one's Sequence. The Acting Method."
        : "Came to understand, through long practice, that staying true to the role of one's Sequence is what quietly settles the potion within — the Acting Method.";
  return { type: "event", description, turnNumber };
}

/**
 * Strip an AI response down to narration (and an optional journal flag) for an
 * engine-decided turn (advancement / apotheosis). The engine has already
 * committed every mechanical effect — sequence change, ingredient consumption,
 * sanity drain, re-seeded digestion — so feeding the full response through
 * `applyResolution` would double-apply sanity/digestion/items/world changes.
 * Keeping only the narrative lets the outcome flow through the normal turn loop
 * (becoming `currentNarrative` and a memory turn record so the next prompt knows
 * it happened) without the AI re-deciding anything. Pure.
 */
export function narrationOnly(response: AIResponse): AIResponse {
  return {
    narrative: response.narrative,
    ...(response.journalEntry ? { journalEntry: response.journalEntry } : {}),
  };
}

export interface ApplyWorldStateOptions {
  /** Character epoch — threads into the reachability gate (Fifth-Epoch only). */
  epoch?: number;
  /** The movement realism gate (player override; default on). */
  gateEnabled: boolean;
  /** The tracked-NPC roster — followers re-asserted on a move. */
  trackedNpcState: TrackedNpcState;
  /** Turn number for any redirect/relocation fact. */
  turnNumber: number;
}

/**
 * Apply the AI-mutable world-state changes from a turn. Only the allowlisted
 * fields (`location`, `activeQuests`, `npcsPresent`) are written. The `location`
 * field passes through `gateLocationChange` (issue #101) — a cross-city teleport
 * without a valid `involuntaryCause` is refused (location unchanged) and turned
 * into an in-world redirect fact instead of a silent write.
 *
 * On an ACTUAL location change the scene cast is reset to the roster's followers
 * (companions and pursuers travel with the player); on an explicit `npcsPresent`
 * write the followers are likewise re-asserted, so the AI can never drop a
 * follower (engine truth over the AI string, like `advanceActiveHunts`).
 *
 * Ordering within one batch (Risk 4): a `location` change resets `npcsPresent`
 * to the followers, and any `npcsPresent` write unions the followers back in —
 * so followers stay authoritative regardless of the order the two changes
 * arrive. Returns the new state plus any facts the gate produced. Pure.
 */
export function applyWorldStateChanges(
  state: GameState,
  changes: StateChange[],
  opts: ApplyWorldStateOptions,
): { state: GameState; facts: SessionFact[] } {
  let next = { ...state };
  const facts: SessionFact[] = [];

  for (const change of changes) {
    if (!AI_MUTABLE_FIELDS.has(change.field)) {
      continue;
    }

    switch (change.field) {
      case "location":
        if (typeof change.newValue === "string") {
          const gated = gateLocationChange({
            from: next.location,
            to: change.newValue,
            epoch: opts.epoch,
            cause: isInvoluntaryMoveCause(change.involuntaryCause)
              ? change.involuntaryCause
              : undefined,
            gateEnabled: opts.gateEnabled,
            turnNumber: opts.turnNumber,
          });
          if (gated.fact) facts.push(gated.fact);
          if (!gated.blocked && gated.location !== next.location) {
            next = {
              ...next,
              location: gated.location,
              npcsPresent: reassertFollowersAt([], opts.trackedNpcState),
            };
          }
        }
        break;
      case "activeQuests":
        if (Array.isArray(change.newValue)) {
          next = { ...next, activeQuests: change.newValue.map(String) };
        }
        break;
      case "npcsPresent":
        if (Array.isArray(change.newValue)) {
          next = {
            ...next,
            npcsPresent: reassertFollowersAt(
              change.newValue.map(String),
              opts.trackedNpcState,
            ),
          };
        }
        break;
    }
  }

  return { state: next, facts };
}

export function applySanityImpact(state: GameState, impact: number): GameState {
  const newSanity = Math.max(0, Math.min(state.maxSanity, state.sanity + impact));
  return { ...state, sanity: newSanity };
}

export function addDiscoveredItems(state: GameState, items: Item[]): GameState {
  return { ...state, inventory: [...state.inventory, ...items] };
}

/**
 * Advance (or reverse) digestion of the current potion based on the AI's acting
 * evaluation. Re-seeds the digestion state if it is missing or no longer
 * matches the character's current pathway/sequence (e.g. after advancement).
 */
export function applyDigestion(
  state: GameState,
  evaluation: ActingEvaluation,
): { state: GameState; delta: number } {
  const current = state.digestion;
  const digestion =
    current &&
    current.pathwayId === state.pathwayId &&
    current.sequenceLevel === state.sequenceLevel
      ? current
      : createDigestionState(state.pathwayId, state.sequenceLevel);

  const { state: nextDigestion, delta } = applyDigestionProgress(
    digestion,
    evaluation.alignment,
  );

  return { state: { ...state, digestion: nextDigestion }, delta };
}

export function applyResolution(
  gameState: GameState,
  memory: MemoryState,
  result: ValidatedAIResponse,
  turnCount: number,
  playerAction: string,
  actingMethodState: ActingMethodState,
  epoch: number | undefined,
  trackedNpcState: TrackedNpcState,
  movementGateEnabled: boolean,
): {
  gameState: GameState;
  memory: MemoryState;
  digestionDelta: number;
  sanity: { tagDelta: number; residual: number; total: number };
  actingMethodState: ActingMethodState;
  discovery: { discoveredThisTurn: boolean; trigger: ActingDiscoveryTrigger | null };
} {
  let updated = { ...gameState };
  const response = result.response;

  // Hybrid sanity (issue #95): the engine owns the magnitude of tagged events
  // (scored against the PRE-mutation Sequence, so an advancement this turn does
  // not retroactively change the cost), and the AI keeps a small residual
  // free-form impact clamped to ±5. The consequences panel previews the same
  // `previewSanityImpact` so the shown and applied numbers can never drift.
  const sanity = previewSanityImpact(
    response.sanityEventTags,
    response.sanityImpact,
    gameState.sequenceLevel,
  );
  if (sanity.total !== 0) {
    updated = applySanityImpact(updated, sanity.total);
  }

  let worldStateFacts: SessionFact[] = [];
  if (response.worldStateChanges && response.worldStateChanges.length > 0) {
    const applied = applyWorldStateChanges(updated, response.worldStateChanges, {
      epoch,
      gateEnabled: movementGateEnabled,
      trackedNpcState,
      turnNumber: turnCount,
    });
    updated = applied.state;
    worldStateFacts = applied.facts;
  }

  // Only `mundane` loot enters inventory from AI narration; advancement-critical
  // reagents are stripped and recorded as story leads, so narration cannot
  // bypass the potion-preparation framework (issue #90).
  const { carried, blocked } = partitionDiscoveredItems(response.itemsDiscovered ?? []);
  if (carried.length > 0) {
    updated = addDiscoveredItems(updated, carried);
  }

  // Money found (or lost) in the fiction reaches the wallet, bounded per turn so
  // it cannot be conjured to buy a deep-Sequence ingredient outright.
  if (response.fundsDiscovered) {
    const clamped = clamp(
      Math.trunc(response.fundsDiscovered),
      -FUNDS_DISCOVERED_CAP,
      FUNDS_DISCOVERED_CAP,
    );
    updated = adjustFunds(updated, clamped);
  }

  let digestionDelta = 0;
  if (response.actingEvaluation) {
    const digestionResult = applyDigestion(updated, response.actingEvaluation);
    updated = digestionResult.state;
    digestionDelta = digestionResult.delta;
  }

  // Acting-method discovery (issue #95): taught by an NPC / found in lore (the
  // AI flag), inferred by the engine after a sustained run of aligned acting, or
  // — as a backstop — the moment digestion completes (you cannot fully assimilate
  // the potion through the role without grasping that that is what you were
  // doing; this also keeps the advancement UI, which names the mechanic, from
  // ever surfacing to a player still flagged as not knowing it). The tutorial
  // does NOT grant it and a neglect scare is NOT a trigger.
  const discovery = evaluateActingDiscovery({
    state: actingMethodState,
    alignment: response.actingEvaluation?.alignment,
    taughtFlag: response.actingMethodTaught === true,
    digestionComplete: updated.digestion?.complete === true,
  });

  // A turn of normal play heals active combat injuries (issue #10).
  updated = tickInjuries(updated);

  // Build the turn record from a response carrying only the carried (mundane)
  // items, so the memory fact extractor and recent-summary bullet never report a
  // blocked reagent as "discovered". The blocked items become lead facts instead.
  const sanitizedResponse = { ...response, itemsDiscovered: carried };
  const turn = buildTurnRecord(turnCount, playerAction, sanitizedResponse);
  let updatedMemory = addTurn(memory, turn);
  // Movement-gate narration (issue #101): a refused cross-city teleport, or an
  // against-the-will relocation, is recorded so the narrator weaves it in.
  for (const fact of worldStateFacts) {
    updatedMemory = addSessionFact(updatedMemory, fact);
  }
  for (const item of blocked) {
    updatedMemory = addSessionFact(
      updatedMemory,
      discoveredItemLeadFact(item, turnCount),
    );
  }
  if (discovery.discoveredThisTurn) {
    updatedMemory = addSessionFact(
      updatedMemory,
      actingMethodDiscoveryFact(discovery.trigger, turnCount),
    );
  }

  return {
    gameState: updated,
    memory: updatedMemory,
    digestionDelta,
    sanity,
    actingMethodState: discovery.state,
    discovery: {
      discoveredThisTurn: discovery.discoveredThisTurn,
      trigger: discovery.trigger,
    },
  };
}
