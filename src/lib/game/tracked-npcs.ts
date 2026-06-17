// ---------------------------------------------------------------------------
// Tracked-NPC roster (issue #101) — who moves WITH you.
// ---------------------------------------------------------------------------
//
// `npcsPresent` on `GameState` is the transient cast of the current scene — it is
// wiped on every location change. That dropped companions who should travel with
// the player (and let pursuers be shaken simply by walking out of frame). This
// module adds a small, durable roster of NPCs the player is meaningfully bound
// to: allies who follow (a party) and hostiles who follow (pursuers). One
// mechanism covers both — disposition + a `follows` flag.
//
// Follows the `hunt.ts` / `anchors.ts` pattern: an optional session sub-state,
// strictly validated, lazily resolved, preserved on the deserialize `...s`
// spread (no seeding). Distinct from the transient `npcsPresent` string list —
// when a move clears the scene, anyone in the roster who `follows` is re-asserted
// at the destination (engine truth over the AI's npc string).
//
// Pure; storage and journaling live in the React layer like every subsystem.

import type { GameSession } from "./types";
import type { SessionFact } from "@/lib/ai";

export type TrackedDisposition = "ally" | "hostile" | "neutral";

/** One NPC the player is bound to across scenes. */
export interface TrackedNpc {
  name: string;
  disposition: TrackedDisposition;
  /** Whether this NPC travels with the player on a move (party / pursuer). */
  follows: boolean;
}

export interface TrackedNpcState {
  roster: TrackedNpc[];
}

const DISPOSITIONS: readonly TrackedDisposition[] = ["ally", "hostile", "neutral"];

export function emptyTrackedNpcState(): TrackedNpcState {
  return { roster: [] };
}

/** Lazy `?? empty` boundary, mirroring `resolveActingMethodState`. */
export function resolveTrackedNpcState(
  state: TrackedNpcState | undefined,
): TrackedNpcState {
  return state ?? emptyTrackedNpcState();
}

/** Everyone in the roster who travels with the player (party + pursuers). */
export function followers(state: TrackedNpcState): TrackedNpc[] {
  return state.roster.filter((npc) => npc.follows);
}

/** The names of the followers — the cast re-asserted at a move's destination. */
export function companionsPresentOnMove(state: TrackedNpcState): string[] {
  return followers(state).map((npc) => npc.name);
}

/**
 * Union `npcsPresent` with the roster's followers, preserving order (existing
 * present NPCs first, then any follower not already listed). The single helper
 * both the AI-move path (called with the freshly-cleared `[]`) and `travelTo`
 * use, so companions and pursuers reappear at the destination and an AI attempt
 * to wipe `npcsPresent` can never drop a follower. Pure.
 */
export function reassertFollowersAt(
  npcsPresent: string[],
  state: TrackedNpcState,
): string[] {
  const result = [...npcsPresent];
  for (const name of companionsPresentOnMove(state)) {
    if (!result.includes(name)) result.push(name);
  }
  return result;
}

/**
 * Add an NPC to the roster (idempotent on name), appending a reversible
 * `npc-encounter` memory fact. Returns a NEW `GameSession`. Pure.
 */
export function joinRoster(
  session: GameSession,
  npc: TrackedNpc,
  now: number = Date.now(),
): GameSession {
  const state = resolveTrackedNpcState(session.trackedNpcState);
  if (state.roster.some((n) => n.name === npc.name)) return session;

  const verb =
    npc.disposition === "hostile"
      ? "has taken up your trail"
      : npc.disposition === "ally"
        ? "now travels at your side"
        : "falls in alongside you";
  const fact: SessionFact = {
    type: "npc-encounter",
    description: `${npc.name} ${verb}.`,
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    trackedNpcState: { roster: [...state.roster, npc] },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Mark an NPC as a PURSUER (hostile follower) — the story's channel, applied
 * from the narrator's `AIResponse.pursuers`. Unlike `joinRoster` this UPSERTS by
 * name: a name already on the roster as a companion (or neutral) is CONVERTED to
 * a hostile pursuer (the story has turned them against the character), and only
 * an already-active hostile follower is a no-op (so a still-pursuing enemy is not
 * re-announced each turn). Appends an `npc-encounter` fact on a real change.
 * Returns a NEW `GameSession`. Pure.
 */
export function markPursuer(
  session: GameSession,
  name: string,
  now: number = Date.now(),
): GameSession {
  const state = resolveTrackedNpcState(session.trackedNpcState);
  const existing = state.roster.find((n) => n.name === name);
  if (existing && existing.disposition === "hostile" && existing.follows) {
    return session;
  }

  const npc: TrackedNpc = { name, disposition: "hostile", follows: true };
  const roster = existing
    ? state.roster.map((n) => (n.name === name ? npc : n))
    : [...state.roster, npc];
  const fact: SessionFact = {
    type: "npc-encounter",
    description: existing
      ? `${name} turns against you — now on your trail.`
      : `${name} has taken up your trail.`,
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    trackedNpcState: { roster },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/** Internal: remove a roster member by name with a worded `event` fact. */
function removeFromRoster(
  session: GameSession,
  name: string,
  describe: (npc: TrackedNpc) => string,
  now: number,
): GameSession {
  const state = resolveTrackedNpcState(session.trackedNpcState);
  const npc = state.roster.find((n) => n.name === name);
  if (!npc) return session;

  const fact: SessionFact = {
    type: "event",
    description: describe(npc),
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    trackedNpcState: { roster: state.roster.filter((n) => n.name !== name) },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Drop a companion who parts ways (idempotent on name), appending a reversible
 * `event` memory fact. Returns a NEW `GameSession`. Pure.
 */
export function leaveRoster(
  session: GameSession,
  name: string,
  now: number = Date.now(),
): GameSession {
  return removeFromRoster(
    session,
    name,
    (npc) => `${npc.name} parts ways with you.`,
    now,
  );
}

/**
 * Drop a pursuer the player has shaken off (idempotent on name), appending a
 * reversible `event` memory fact. Returns a NEW `GameSession`. Pure.
 */
export function shakeOff(
  session: GameSession,
  name: string,
  now: number = Date.now(),
): GameSession {
  return removeFromRoster(
    session,
    name,
    (npc) => `You shake off ${npc.name}'s pursuit.`,
    now,
  );
}

export function isValidTrackedNpcShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const n = obj as Record<string, unknown>;
  if (typeof n.name !== "string" || n.name.length === 0) return false;
  if (!DISPOSITIONS.includes(n.disposition as TrackedDisposition)) return false;
  if (typeof n.follows !== "boolean") return false;
  return true;
}

/** Strict shape check for a session's `trackedNpcState` (empty roster valid). */
export function isValidTrackedNpcStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const s = obj as Record<string, unknown>;
  if (!Array.isArray(s.roster)) return false;
  return s.roster.every(isValidTrackedNpcShape);
}
