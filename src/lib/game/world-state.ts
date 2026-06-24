import type { GameState, ValidatedAIResponse, MemoryState, SessionFact } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import type { ActingEvaluation, StateChange } from "@/lib/ai";
import { addSessionFact, addTurn, buildTurnRecord } from "@/lib/ai";
import { applyDigestionProgress, createDigestionState } from "./digestion";
import { tickInjuries } from "./combat";
import { hasItem, isReagentCategory } from "./inventory";
import { getSealedArtifact, mintArtifactItem } from "@/lib/lore";
import { adjustFunds, FUNDS_DISCOVERED_CAP } from "./marketplace";
import { clamp } from "./math";
import { previewSanityImpact } from "./sanity";
import {
  evaluateActingDiscovery,
  type ActingDiscoveryTrigger,
  type ActingMethodState,
} from "./acting-method";
import { cityForLocation, isReachable } from "./place-graph";
import {
  CROSSING_CITY,
  cityIdFromLocation,
  continentOf,
  crossesContinent,
  getCity,
  grantAccessFlag,
  hasAccessFlag,
  isChokepointContinent,
  meetsAccessGate,
  reachedDreamWorldGate,
} from "./travel";
import { registerCustomLocation } from "./location";
import { stripSelfFromNpcs } from "./canon-takeover";
import { reassertFollowersAt, type TrackedNpcState } from "./tracked-npcs";
import type { AccessFlag } from "@/lib/ai";

/** The capability that opens the Forsaken Land (issue #132). */
const DREAM_WORLD_PASSAGE: AccessFlag = "dream-world-passage";

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
  /**
   * The engine-tracked current city (`GameState.currentCity`) — the origin city
   * the gate trusts when the `from` string is a bare district that names no city
   * (issue #101), so a teleport out of a district-level location is still caught.
   */
  fromCity?: string;
  cause?: InvoluntaryMoveCause;
  gateEnabled: boolean;
  turnNumber: number;
  /**
   * The character's current Sequence — fed into the access-gate check for an
   * access-gated destination continent (issue #130). Optional so the existing
   * direct callers/tests need not supply it; a forsaken-land gate that demands a
   * Sequence then treats an absent value as "not high enough".
   */
  sequenceLevel?: number;
  /** The capability flags the character holds — the access-gate check (issue #130). */
  accessFlags?: AccessFlag[];
}

export interface GateLocationChangeResult {
  /** The location that should actually take effect (`from` when blocked). */
  location: string;
  /** True when a cross-city move without a valid cause was refused. */
  blocked: boolean;
  /**
   * True when the permitted move crosses cities (a real relocation) — the caller
   * leaves the origin's scene cast behind. False for a within-city / provisional
   * nudge, where the existing scene cast is preserved.
   */
  crossCity: boolean;
  /** An in-world fact to fold into memory (redirect, or "against your will"). */
  fact?: SessionFact;
}

/**
 * Decide what a proposed `location` change resolves to. With the gate off, or
 * for a reachable (same-city / provisional) move, the change is allowed
 * unchanged. A cross-city move is allowed ONLY with a valid involuntary cause
 * (recorded as an "against your will" fact); otherwise it is blocked — the
 * character stays in `from` and an in-world redirect fact is emitted. The
 * `crossCity` flag reports whether the permitted move was a real relocation
 * (independent of the gate toggle), so the caller knows whether to reset the
 * scene cast. Pure; never throws.
 */
export function gateLocationChange({
  from,
  to,
  epoch,
  fromCity,
  cause,
  gateEnabled,
  turnNumber,
  sequenceLevel,
  accessFlags,
}: GateLocationChangeInput): GateLocationChangeResult {
  const crossCity = !isReachable(from, to, epoch, fromCity).reachable;

  // Access-gated continent (issue #130): when the destination resolves to a city
  // on a non-central, access-gated continent (the Forsaken Land), the move is
  // REFUSED unless the character meets the gate — sequence AND required flag —
  // regardless of an involuntary cause AND regardless of the movement-realism
  // toggle. This is a hard canon boundary, not a pacing preference, so it is
  // checked first: the narrator can never route an unqualified character in.
  // Resolved epoch-independently (NOT via `cityForLocation`, which is Fifth-only)
  // so the gate still bites if the narrator names a sealed city in any epoch.
  const destCityId = cityIdFromLocation(to);
  const destCity = destCityId ? getCity(destCityId) : undefined;
  if (
    destCity &&
    continentOf(destCity) !== "central" &&
    !meetsAccessGate(
      { sequenceLevel: sequenceLevel ?? Number.POSITIVE_INFINITY, accessFlags },
      destCity,
    )
  ) {
    return {
      location: from,
      blocked: true,
      crossCity,
      fact: {
        type: "event",
        description: `The way to ${to} is sealed to you — it cannot be reached by any ordinary road. You remain in ${from}.`,
        turnNumber,
      },
    };
  }

  // Crossing chokepoint (issue #132): even a QUALIFIED character (one who holds
  // the passage and so cleared the access gate above) cannot be routed STRAIGHT
  // between the mainland and the City of Silver — every continent crossing goes
  // through the Giant King's Court dream threshold. Like the access gate, this is
  // a hard canon boundary: it bites regardless of an involuntary cause and
  // regardless of the realism toggle, so the narrator can never teleport a
  // character past the Court. Only applied when both endpoints resolve to known
  // cities (origin anchored to the tracked city for a bare district), so an
  // ordinary within-city or unresolved move is untouched.
  const fromCityId =
    cityIdFromLocation(from) ?? (fromCity && getCity(fromCity) ? fromCity : undefined);
  if (
    destCity &&
    destCityId &&
    fromCityId &&
    crossesContinent(fromCityId, destCityId) &&
    fromCityId !== CROSSING_CITY &&
    destCityId !== CROSSING_CITY
  ) {
    // The redirect message depends on WHICH crossing was refused (issue #138):
    // a crossing involving the dream-gated Forsaken Land routes through the Giant
    // King's Court, but a Southern-Continent crossing is a long Berserk Sea
    // voyage — naming the Court for it would be a lore error. Either way the
    // narrator can't teleport across a continent; deliberate travel is the path.
    const fromCityObj = getCity(fromCityId);
    const involvesChokepoint =
      isChokepointContinent(continentOf(destCity)) ||
      (fromCityObj !== undefined && isChokepointContinent(continentOf(fromCityObj)));
    const description = involvesChokepoint
      ? `There is no direct way from ${from} to ${to} — the only passage across lies through Giant King's Court. You remain in ${from}.`
      : `There is no direct way from ${from} to ${to} — such a crossing is a long sea voyage that must be set out on deliberately, not made in passing. You remain in ${from}.`;
    return {
      location: from,
      blocked: true,
      crossCity,
      fact: {
        type: "event",
        description,
        turnNumber,
      },
    };
  }

  if (!gateEnabled) return { location: to, blocked: false, crossCity };

  if (!crossCity) return { location: to, blocked: false, crossCity: false };

  if (cause !== undefined) {
    return {
      location: to,
      blocked: false,
      crossCity: true,
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
    crossCity: true,
    fact: {
      type: "event",
      description: `You cannot simply will yourself from ${from} to ${to} — the journey between cities is one you must set out on deliberately. You remain in ${from}.`,
      turnNumber,
    },
  };
}

/**
 * Whether a discovered item's category is engine/church-gated and so may NOT be
 * freely minted by AI narration: the advancement-critical reagents
 * (`isReagentCategory`) AND Sealed Artifacts (church-catalogued, locked away —
 * earned through the story via the trusted engine path `grantSealedArtifact` or
 * combat spoils, never simply "found" in a scene). Both are stripped from
 * discovery and turned into story leads instead. Pure.
 */
function isDiscoveryBlockedCategory(category: Item["category"]): boolean {
  return isReagentCategory(category) || category === "sealed-artifact";
}

/**
 * Split AI-discovered items into the loot the player may actually carry
 * (`mundane` belongings and the narrator-grantable `uniqueness` artifact) and
 * the engine/church-gated items that must come through the framework. The
 * reagents (`isReagentCategory`) are acquired ONLY via potion-preparation
 * (buy/hunt), combat spoils, or echoes; Sealed Artifacts only via the engine
 * grant or combat spoils — AI narration may mint neither, so they are stripped
 * here and turned into a story lead (`discoveredItemLeadFact`). Pure.
 */
export function partitionDiscoveredItems(items: Item[]): {
  carried: Item[];
  blocked: Item[];
} {
  const carried: Item[] = [];
  const blocked: Item[] = [];
  for (const item of items) {
    (isDiscoveryBlockedCategory(item.category) ? blocked : carried).push(item);
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
    item.category === "sealed-artifact"
      ? `Word of the ${item.name} surfaced — such a thing is catalogued and locked away by the churches; it can only be earned through the story, never simply found.`
      : item.category === "potion-formula"
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
 * On a CROSS-CITY relocation the scene cast is reset to the roster's followers
 * (companions and pursuers travel with the player; the origin's incidental NPCs
 * are left behind). On a within-city / provisional move the existing scene cast
 * is PRESERVED and the followers are merely re-asserted into it — a local
 * narrator nudge no longer wipes the NPCs the player is mid-scene with. An
 * explicit `npcsPresent` write likewise re-asserts the followers, so the AI can
 * never drop a follower (engine truth over the AI string, like
 * `advanceActiveHunts`).
 *
 * Returns the new state plus any facts the gate produced. Pure.
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
            // The engine-tracked city anchors the origin when the location
            // string is a bare district, so a cross-city teleport can't slip
            // the gate just because the player is mid-scene in a district.
            fromCity: next.currentCity,
            cause: isInvoluntaryMoveCause(change.involuntaryCause)
              ? change.involuntaryCause
              : undefined,
            gateEnabled: opts.gateEnabled,
            turnNumber: opts.turnNumber,
            // The access-gate slice (issue #130): a forsaken-land destination is
            // re-checked here too, so the narrator cannot teleport an unqualified
            // character into the sealed continent even with an involuntary cause.
            sequenceLevel: next.sequenceLevel,
            accessFlags: next.accessFlags,
          });
          if (gated.fact) facts.push(gated.fact);
          if (!gated.blocked && gated.location !== next.location) {
            // Cross-city: leave the origin's scene behind (followers only).
            // Within-city / provisional: keep the existing cast, just re-assert
            // the followers — a local nudge must not wipe mid-scene NPCs.
            const base = gated.crossCity ? [] : next.npcsPresent;
            // Keep the tracked current city oriented: update it when the new
            // location names a known city, preserve it for a bare district
            // string (issue #101 — so the map doesn't fall back to Tingen).
            const appliedCity = cityForLocation(gated.location, opts.epoch);
            next = {
              ...next,
              location: gated.location,
              npcsPresent: reassertFollowersAt(base, opts.trackedNpcState),
              ...(appliedCity ? { currentCity: appliedCity } : {}),
            };
            // File a narrator-named venue that matches no known district under
            // the resolved city, so the map can render and pin it instead of
            // keyword-guessing a wrong district (Backlund location sync).
            next = registerCustomLocation(next, opts.epoch);
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
              // Doppelganger suppression (issue #92): strip the player's own
              // canon identity so the narrator can never add them as a separate
              // present NPC. A no-op when not a canon takeover.
              stripSelfFromNpcs(change.newValue.map(String), next.canonCharacterId),
              opts.trackedNpcState,
            ),
          };
        }
        break;
    }
  }

  // In-play capability grant (world build-out 3, issue #132): reaching the
  // Dream-World shadow of Giant King's Court earns the `dream-world-passage` —
  // the capability to cross to the sealed Forsaken Land. This is how a NON-origin
  // character earns entry through the story (the physical Giant King's Court is a
  // forsaken city and stays access-gated; only the dream-world threshold grants).
  if (reachedDreamWorldGate(next.location) && !hasAccessFlag(next, DREAM_WORLD_PASSAGE)) {
    next = grantAccessFlag(next, DREAM_WORLD_PASSAGE);
    facts.push({
      type: "event",
      description:
        "Crossing the Dream-World shadow of Giant King's Court, you grasp the passage between the world and the sealed Forsaken Land — a way no ship can take.",
      turnNumber: opts.turnNumber,
    });
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
 * The trusted engine path by which a character legitimately acquires a Sealed
 * Artifact (a quest reward, a narrated church grant, a dev affordance) — looks
 * up the corpus catalogue by code, mints the carried `Item`, and appends it.
 * Sealed Artifacts are church-gated and so NEVER reach inventory through AI
 * discovery (`partitionDiscoveredItems` blocks them); this is the sanctioned
 * alternative, mirroring how combat spoils (`Enemy.loot`) deliver one. A no-op
 * for an unknown code or one already carried (artifacts are singular). Pure.
 */
export function grantSealedArtifact(state: GameState, artifactNumber: string): GameState {
  const artifact = getSealedArtifact(artifactNumber);
  if (!artifact) return state;
  const item = mintArtifactItem(artifact);
  if (hasItem(state.inventory, item.name)) return state;
  return { ...state, inventory: [...state.inventory, item] };
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
  turnKind?: import("@/lib/ai").TurnKind,
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
    response.actingEvaluation?.alignment,
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
  const turn = buildTurnRecord(
    turnCount,
    playerAction,
    sanitizedResponse,
    undefined,
    turnKind,
  );
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
