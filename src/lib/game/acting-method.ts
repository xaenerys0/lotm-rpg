/**
 * Acting-method discovery (issue #95).
 *
 * The Acting Method — that role-playing your Sequence is what digests the
 * potion — is LOTM *secret knowledge*. A Beyonder often does not begin knowing
 * it; it is earned through play. Until it is discovered the digestion meter
 * stays hidden and the consequences-panel feedback is vague, diegetic prose.
 * Discovery flips the flag permanently.
 *
 * Triggers:
 * - **taught:** an NPC explicitly teaches it, or the player finds it in lore
 *   (both surfaced by the AI via `actingMethodTaught`).
 * - **repetition:** the engine infers it after a sustained run of aligned
 *   acting (`ACTING_DISCOVERY_STREAK` turns at or above
 *   `ACTING_ALIGNED_THRESHOLD`) — the player intuits the pattern themselves.
 * - **completion:** a backstop — the moment the potion is fully digested. You
 *   cannot assimilate a potion through the role without grasping that the role
 *   was the method, and the advancement UI (which names the mechanic) surfaces
 *   at completion, so the flag must already be set by then.
 *
 * The tutorial deliberately does NOT grant it, and a neglect "scare" is NOT a
 * trigger. Pure functions only — no side effects, no AI calls. Follows the
 * optional, strictly-validated per-session state pattern of
 * `identityState`/`profileState`.
 */

export interface ActingMethodState {
  /** Whether the player has discovered the Acting Method. Set once, never cleared. */
  knowsMethod: boolean;
  /**
   * Consecutive aligned-acting turns, counting toward the repetition trigger.
   * Resets to 0 on any lapse; ignored once `knowsMethod` is true.
   */
  alignedStreak: number;
}

/** Alignment at or above which a turn counts as "acting in character". */
export const ACTING_ALIGNED_THRESHOLD = 0.5;

/**
 * Sustained aligned turns after which the engine infers the method (the
 * repetition trigger). A potion fills in roughly this many strong turns, so a
 * diligent role-player nearly always discovers the method before completing
 * digestion.
 */
export const ACTING_DISCOVERY_STREAK = 6;

export function createActingMethodState(): ActingMethodState {
  return { knowsMethod: false, alignedStreak: 0 };
}

/**
 * Lazy boundary mirroring `resolveProfileState` — returns the stored state or a
 * fresh one. Legacy/fresh saves carry no `actingMethodState`; resolving it here
 * keeps the engine from having to seed it eagerly.
 */
export function resolveActingMethodState(state?: ActingMethodState): ActingMethodState {
  return state ?? createActingMethodState();
}

export function isValidActingMethodStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const s = obj as Record<string, unknown>;
  if (typeof s.knowsMethod !== "boolean") return false;
  if (!Number.isFinite(s.alignedStreak) || (s.alignedStreak as number) < 0) {
    return false;
  }
  return true;
}

export type ActingDiscoveryTrigger = "taught" | "repetition" | "completion";

export interface ActingDiscoveryResult {
  state: ActingMethodState;
  discoveredThisTurn: boolean;
  trigger: ActingDiscoveryTrigger | null;
}

/**
 * Evaluate one turn's effect on acting-method discovery. Short-circuits once the
 * method is already known (the streak no longer matters). An explicit teaching
 * flag (`taughtFlag`) or full digestion (`digestionComplete`) discovers it
 * immediately; otherwise the aligned streak advances on in-character acting and
 * resets on a lapse, and crossing `ACTING_DISCOVERY_STREAK` discovers it via
 * repetition. Pure — returns the next state plus whether discovery happened this
 * turn and which trigger fired.
 */
export function evaluateActingDiscovery({
  state,
  alignment,
  taughtFlag,
  digestionComplete = false,
}: {
  state: ActingMethodState;
  alignment?: number;
  taughtFlag: boolean;
  digestionComplete?: boolean;
}): ActingDiscoveryResult {
  // Already known — nothing changes.
  if (state.knowsMethod) {
    return { state, discoveredThisTurn: false, trigger: null };
  }

  // Taught by an NPC or found in lore — immediate discovery, regardless of the
  // current streak.
  if (taughtFlag) {
    return {
      state: { ...state, knowsMethod: true },
      discoveredThisTurn: true,
      trigger: "taught",
    };
  }

  // Backstop: fully digesting the potion reveals the method by definition.
  if (digestionComplete) {
    return {
      state: { ...state, knowsMethod: true },
      discoveredThisTurn: true,
      trigger: "completion",
    };
  }

  // The streak grows on aligned acting and resets otherwise.
  const aligned = alignment !== undefined && alignment >= ACTING_ALIGNED_THRESHOLD;
  const alignedStreak = aligned ? state.alignedStreak + 1 : 0;

  // Sustained aligned acting — the player infers the pattern for themselves.
  if (alignedStreak >= ACTING_DISCOVERY_STREAK) {
    return {
      state: { knowsMethod: true, alignedStreak },
      discoveredThisTurn: true,
      trigger: "repetition",
    };
  }

  return {
    state: { ...state, alignedStreak },
    discoveredThisTurn: false,
    trigger: null,
  };
}
