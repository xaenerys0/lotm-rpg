import type { SessionFact } from "@/lib/ai";
import { sealedArtifactNumberFromItemName } from "@/lib/lore";

import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Acquired powers — copying / stealing / borrowing another Beyonder's power.
// ---------------------------------------------------------------------------
//
// In the engine a character's abilities are DERIVED from `(pathwayId,
// sequenceLevel)` (see `apotheosis.ts` `sequenceAbilities`) — there is no slot
// for a power the character took from someone ELSE. Several pathways and a
// couple of Sealed Artifacts can do exactly that, though, and the canon turns on
// it: an Error-pathway **Prometheus** "steals the Beyonder ability of another,
// taking their power as their own", a White-Tower **Polymath** Analyses and
// **Imitates** a witnessed power, the **Ring of Mimicry** (Sealed Artifact
// 2-081) imitates a witnessed ability, and the **Blood Vessel Thief** (2-105)
// steals an ability for about ten minutes. This module is where those acquired
// powers are RECORDED on the character so they can actually be used — added when
// taken, updated (retuned / a temporary copy refreshed), removed when released,
// and ticked down to expiry for the temporary ones.
//
// The acquisition is CAPABILITY-GATED: a character may only record a power they
// have the means to take (the right pathway rung, or the carried artifact), so
// the affordance never appears for a Beyonder who could not canonically do it.
//
// Mirrors the `hunt.ts` / `anchors.ts` pattern exactly: an optional list on the
// session, strictly validated, preserved on the deserialize `...s` spread, never
// AI-mutable. Pure + deterministic; storage and narration live in the React
// layer like every other session subsystem.

/** Whether an acquired power is kept for good or fades after a while. */
export type PowerPermanence = "permanent" | "temporary";

/**
 * The in-world means by which a power was acquired — each maps to a canon
 * ability (a pathway rung) or a canon Sealed Artifact. The method both gates
 * the acquisition (you must have the capability) and tells the story what
 * happened.
 */
export type PowerAcquisitionMethod =
  | "prometheus-theft"
  | "parasite-siphon"
  | "imitation"
  | "ring-of-mimicry"
  | "blood-vessel-thief";

/** One power the character has taken from someone (or something) else. */
export interface AcquiredPower {
  /** Stable id (the React key + the update/release handle). */
  id: string;
  /** The power's name (e.g. "Flame Leap", "a Sleepless's nightmare touch"). */
  name: string;
  /** What it does, in the character's own terms. */
  description: string;
  /** Who or what it was taken from, if known (flavour — never required). */
  sourceName?: string;
  /** The canon means it was taken by. */
  method: PowerAcquisitionMethod;
  /** Kept for good, or fading. */
  permanence: PowerPermanence;
  /**
   * Turns of use left for a `temporary` power; counts down each turn and the
   * power is released at 0. Absent/ignored for a `permanent` power.
   */
  turnsRemaining?: number;
  /** The turn it was acquired on (for display / journalling). */
  acquiredAtTurn: number;
}

/**
 * A means of acquisition currently available to the character — derived from
 * pathway rung and carried artifacts. Drives the "take a power" affordance and
 * supplies the defaults a freshly-recorded power inherits.
 */
export interface AcquisitionCapability {
  method: PowerAcquisitionMethod;
  /** A one-line, player-facing description of the capability. */
  label: string;
  /** Whether this means yields a lasting or a fading power. */
  permanence: PowerPermanence;
  /** Default turns of use for a `temporary` means (omitted for permanent). */
  defaultDuration?: number;
  /** Where the capability comes from — a pathway rung or a carried artifact. */
  source: "pathway" | "artifact";
}

/** Hard cap on recorded powers, so a long chronicle can't grow unbounded. */
export const MAX_ACQUIRED_POWERS = 24;

/** Length caps for the free-text fields (kept in step with the rest of the engine). */
export const ACQUIRED_POWER_NAME_CAP = 80;
export const ACQUIRED_POWER_DESCRIPTION_CAP = 280;
export const ACQUIRED_POWER_SOURCE_CAP = 80;

/** Default lifetimes (in turns) for the temporary means. */
export const IMITATION_DURATION_TURNS = 4;
export const RING_OF_MIMICRY_DURATION_TURNS = 4;
/** The Blood Vessel Thief leaves a stolen ability usable only briefly (~10 minutes). */
export const BLOOD_VESSEL_THIEF_DURATION_TURNS = 2;

/**
 * A pathway means of acquisition: the pathway it belongs to and the sequence at
 * (or below) which it unlocks. Abilities are cumulative, so a rung the
 * character has climbed PAST is still available (`sequenceLevel <= unlocksAt`).
 */
interface PathwayAcquisition {
  pathwayId: number;
  unlocksAtOrBelow: number;
  method: PowerAcquisitionMethod;
  label: string;
  permanence: PowerPermanence;
  defaultDuration?: number;
}

/**
 * The pathway acquisition table — corpus-grounded against `pathways.ts` /
 * `pathway-error.ts`. Error's theft is a PERMANENT binding ("taking their power
 * as their own"); White Tower's Imitation is a TEMPORARY copy of an analysed
 * power.
 */
export const PATHWAY_ACQUISITIONS: readonly PathwayAcquisition[] = [
  {
    // Error Sequence 6 — Prometheus: steal the Beyonder ability of another.
    pathwayId: 8,
    unlocksAtOrBelow: 6,
    method: "prometheus-theft",
    label: "Prometheus — steal a Beyonder's power and take it as your own",
    permanence: "permanent",
  },
  {
    // Error Sequence 4 — Parasite: siphon vitality, memory, and power from a host.
    pathwayId: 8,
    unlocksAtOrBelow: 4,
    method: "parasite-siphon",
    label: "Parasite — siphon a host's vitality, memory, and power",
    permanence: "permanent",
  },
  {
    // White Tower Sequence 6 — Polymath: Analyse, then Imitate a witnessed power.
    pathwayId: 10,
    unlocksAtOrBelow: 6,
    method: "imitation",
    label: "Imitation — analyse a witnessed Beyonder power and copy it",
    permanence: "temporary",
    defaultDuration: IMITATION_DURATION_TURNS,
  },
];

/**
 * The Sealed-Artifact acquisition table, keyed by the artifact's catalogue
 * number (recovered from the carried item's name). Both copy-relics are
 * corpus-grounded in `sealed-artifacts.ts`.
 */
export const ARTIFACT_ACQUISITIONS: Record<
  string,
  Omit<AcquisitionCapability, "source">
> = {
  // 2-081 Ring of Mimicry — imitate Beyonder abilities the wearer has witnessed.
  "2-081": {
    method: "ring-of-mimicry",
    label: "Ring of Mimicry — imitate a Beyonder ability you have witnessed",
    permanence: "temporary",
    defaultDuration: RING_OF_MIMICRY_DURATION_TURNS,
  },
  // 2-105 Blood Vessel Thief — steal a target's ability for about ten minutes.
  "2-105": {
    method: "blood-vessel-thief",
    label: "Blood Vessel Thief — steal a target's ability for a short while",
    permanence: "temporary",
    defaultDuration: BLOOD_VESSEL_THIEF_DURATION_TURNS,
  },
};

/**
 * The means of acquisition available to the character right now: the pathway
 * rungs they have climbed to plus any carried copy/steal Sealed Artifact. Empty
 * when the character has no way to take another's power. Pure.
 */
export function powerAcquisitionCapabilities(
  session: GameSession,
): AcquisitionCapability[] {
  const state = session.gameState;
  const capabilities: AcquisitionCapability[] = [];

  for (const entry of PATHWAY_ACQUISITIONS) {
    if (
      state.pathwayId === entry.pathwayId &&
      state.sequenceLevel <= entry.unlocksAtOrBelow
    ) {
      capabilities.push({
        method: entry.method,
        label: entry.label,
        permanence: entry.permanence,
        defaultDuration: entry.defaultDuration,
        source: "pathway",
      });
    }
  }

  const seenArtifacts = new Set<string>();
  for (const item of state.inventory) {
    if (item.category !== "sealed-artifact") continue;
    const number = sealedArtifactNumberFromItemName(item.name);
    if (!number || seenArtifacts.has(number)) continue;
    const artifact = ARTIFACT_ACQUISITIONS[number];
    if (!artifact) continue;
    seenArtifacts.add(number);
    capabilities.push({ ...artifact, source: "artifact" });
  }

  return capabilities;
}

/** True when the character has any means to take another's power. */
export function canAcquirePower(session: GameSession): boolean {
  return powerAcquisitionCapabilities(session).length > 0;
}

/** Find the capability for a method, if the character currently has it. */
export function capabilityForMethod(
  session: GameSession,
  method: PowerAcquisitionMethod,
): AcquisitionCapability | undefined {
  return powerAcquisitionCapabilities(session).find((c) => c.method === method);
}

/** Look up a recorded power by id. */
export function findAcquiredPower(
  session: GameSession,
  id: string,
): AcquiredPower | undefined {
  return (session.acquiredPowers ?? []).find((p) => p.id === id);
}

/** Powers retained for good — the character's permanent stolen arsenal. */
export function permanentPowers(session: GameSession): AcquiredPower[] {
  return (session.acquiredPowers ?? []).filter((p) => p.permanence === "permanent");
}

/** Powers still fading — the temporary copies, with their turns left. */
export function temporaryPowers(session: GameSession): AcquiredPower[] {
  return (session.acquiredPowers ?? []).filter((p) => p.permanence === "temporary");
}

/**
 * The ability labels for the acquired powers, surfaced into combat's
 * `availableAbilities` and the narrator prompt so a stolen/copied power is
 * actually usable. A temporary power notes its remaining turns; a permanent one
 * is flagged as stolen. Pure.
 */
export function acquiredPowerAbilityLabels(session: GameSession): string[] {
  return (session.acquiredPowers ?? []).map((p) => {
    if (p.permanence === "temporary") {
      const turns = Math.max(0, p.turnsRemaining ?? 0);
      return `${p.name} (copied — ${turns} turn${turns === 1 ? "" : "s"} left)`;
    }
    return `${p.name} (stolen)`;
  });
}

function trimTo(value: string, cap: number): string {
  const trimmed = value.trim();
  return trimmed.length > cap ? trimmed.slice(0, cap) : trimmed;
}

export interface AcquirePowerInput {
  method: PowerAcquisitionMethod;
  name: string;
  description: string;
  sourceName?: string;
  /** Override the capability's default permanence (e.g. choose to bind a copy). */
  permanence?: PowerPermanence;
  /** Override the capability's default duration for a temporary power. */
  turnsRemaining?: number;
}

export type AcquirePowerOutcome =
  | "acquired"
  | "no-capability"
  | "invalid-method"
  | "missing-name"
  | "at-capacity";

export interface AcquirePowerResult {
  outcome: AcquirePowerOutcome;
  session?: GameSession;
  power?: AcquiredPower;
}

/**
 * ADD a power the character has taken from another. Validates that the
 * character actually has the means (`method` must be a currently-available
 * capability), that a name is given, and that the cap is not exceeded. The
 * permanence/duration default from the capability but may be overridden (a
 * Prometheus might choose to bind a normally-temporary copy; a copy might be
 * given a shorter leash). Seeds a memory fact so the narrator knows. Pure.
 */
export function acquirePower(
  session: GameSession,
  input: AcquirePowerInput,
  idFactory: () => string = () => crypto.randomUUID(),
  now: number = Date.now(),
): AcquirePowerResult {
  // Derive the available means ONCE (the inventory scan is the cost) and reuse
  // it for both the lookup and the "is any means available at all?" distinction.
  const capabilities = powerAcquisitionCapabilities(session);
  const capability = capabilities.find((c) => c.method === input.method);
  if (!capability) {
    // Distinguish "no capability at all" from "that specific method isn't yours"
    // so the UI can steer correctly.
    return {
      outcome: capabilities.length > 0 ? "invalid-method" : "no-capability",
    };
  }

  const name = trimTo(input.name ?? "", ACQUIRED_POWER_NAME_CAP);
  if (name.length === 0) return { outcome: "missing-name" };

  const existing = session.acquiredPowers ?? [];
  if (existing.length >= MAX_ACQUIRED_POWERS) return { outcome: "at-capacity" };

  const permanence = input.permanence ?? capability.permanence;
  const power: AcquiredPower = {
    id: idFactory(),
    name,
    description: trimTo(input.description ?? "", ACQUIRED_POWER_DESCRIPTION_CAP),
    method: input.method,
    permanence,
    acquiredAtTurn: session.turnCount,
  };
  const source = input.sourceName
    ? trimTo(input.sourceName, ACQUIRED_POWER_SOURCE_CAP)
    : "";
  if (source.length > 0) power.sourceName = source;
  if (permanence === "temporary") {
    const duration =
      input.turnsRemaining ?? capability.defaultDuration ?? IMITATION_DURATION_TURNS;
    power.turnsRemaining = Math.max(1, Math.round(duration));
  }

  const fromWhom = power.sourceName ? ` from ${power.sourceName}` : "";
  const verb = permanence === "permanent" ? "Took" : "Copied";
  const fact: SessionFact = {
    type: "event",
    description: `${verb} the Beyonder power "${power.name}"${fromWhom} — ${
      permanence === "permanent"
        ? "bound into yourself as your own"
        : `a fading imitation that will last about ${power.turnsRemaining} turns`
    }.`,
    turnNumber: session.turnCount,
  };

  return {
    outcome: "acquired",
    power,
    session: {
      ...session,
      acquiredPowers: [...existing, power],
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, fact],
      },
      updatedAt: now,
    },
  };
}

export interface UpdateAcquiredPowerInput {
  name?: string;
  description?: string;
  sourceName?: string;
  permanence?: PowerPermanence;
  /** Reset/refresh the remaining turns for a temporary power. */
  turnsRemaining?: number;
}

export type UpdateAcquiredPowerOutcome = "updated" | "not-found" | "missing-name";

export interface UpdateAcquiredPowerResult {
  outcome: UpdateAcquiredPowerOutcome;
  session?: GameSession;
  power?: AcquiredPower;
}

/**
 * UPDATE a recorded power — rename, re-describe, re-attribute, refresh a
 * temporary copy's remaining turns, or convert between permanent/temporary (a
 * Prometheus binding a copy for good, or letting a binding lapse). Only the
 * provided fields change. Pure.
 */
export function updateAcquiredPower(
  session: GameSession,
  id: string,
  changes: UpdateAcquiredPowerInput,
  now: number = Date.now(),
): UpdateAcquiredPowerResult {
  const existing = session.acquiredPowers ?? [];
  const current = existing.find((p) => p.id === id);
  if (!current) return { outcome: "not-found" };

  const next: AcquiredPower = { ...current };

  if (changes.name !== undefined) {
    const name = trimTo(changes.name, ACQUIRED_POWER_NAME_CAP);
    if (name.length === 0) return { outcome: "missing-name" };
    next.name = name;
  }
  if (changes.description !== undefined) {
    next.description = trimTo(changes.description, ACQUIRED_POWER_DESCRIPTION_CAP);
  }
  if (changes.sourceName !== undefined) {
    const source = trimTo(changes.sourceName, ACQUIRED_POWER_SOURCE_CAP);
    if (source.length > 0) next.sourceName = source;
    else delete next.sourceName;
  }
  if (changes.permanence !== undefined) {
    next.permanence = changes.permanence;
  }

  if (next.permanence === "permanent") {
    // A bound power no longer fades.
    delete next.turnsRemaining;
  } else {
    // Temporary: take the explicit refresh, else keep the current count, else
    // fall back to a single turn so it never lingers as an undefined countdown.
    const turns =
      changes.turnsRemaining ?? next.turnsRemaining ?? IMITATION_DURATION_TURNS;
    next.turnsRemaining = Math.max(1, Math.round(turns));
  }

  return {
    outcome: "updated",
    power: next,
    session: {
      ...session,
      acquiredPowers: existing.map((p) => (p.id === id ? next : p)),
      updatedAt: now,
    },
  };
}

/**
 * REMOVE a recorded power (released, lost, or given away). Seeds a memory fact.
 * A no-op when no such power exists. Pure.
 */
export function releasePower(
  session: GameSession,
  id: string,
  now: number = Date.now(),
): GameSession {
  const existing = session.acquiredPowers ?? [];
  const power = existing.find((p) => p.id === id);
  if (!power) return session;

  const fact: SessionFact = {
    type: "event",
    description: `Released the acquired power "${power.name}" — it is yours no longer.`,
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    acquiredPowers: existing.filter((p) => p.id !== id),
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Advance every temporary power by one turn of play and drop those that have
 * faded to nothing. Permanent powers are untouched. An expiry seeds one memory
 * fact so the narrator stops crediting the lost copy. A no-op when there are no
 * temporary powers. Pure — call it each turn like `advanceActiveHunts`.
 */
export function tickAcquiredPowers(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const existing = session.acquiredPowers ?? [];
  if (existing.length === 0) return session;
  if (!existing.some((p) => p.permanence === "temporary")) return session;

  const expired: AcquiredPower[] = [];
  const remaining: AcquiredPower[] = [];
  for (const power of existing) {
    if (power.permanence !== "temporary") {
      remaining.push(power);
      continue;
    }
    const left = Math.max(0, (power.turnsRemaining ?? 0) - 1);
    if (left <= 0) expired.push(power);
    else remaining.push({ ...power, turnsRemaining: left });
  }

  if (expired.length === 0) {
    // Some temporary powers ticked down but none expired — still a new state.
    return { ...session, acquiredPowers: remaining, updatedAt: now };
  }

  const facts: SessionFact[] = expired.map((power) => ({
    type: "event",
    description: `The copied power "${power.name}" faded — you can no longer call on it.`,
    turnNumber: session.turnCount,
  }));

  return {
    ...session,
    acquiredPowers: remaining,
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, ...facts],
    },
    updatedAt: now,
  };
}

const ACQUISITION_METHODS: readonly PowerAcquisitionMethod[] = [
  "prometheus-theft",
  "parasite-siphon",
  "imitation",
  "ring-of-mimicry",
  "blood-vessel-thief",
];

export function isValidAcquiredPowerShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const p = obj as Record<string, unknown>;
  if (typeof p.id !== "string" || p.id.length === 0) return false;
  if (typeof p.name !== "string" || p.name.length === 0) return false;
  if (typeof p.description !== "string") return false;
  if (p.sourceName !== undefined && typeof p.sourceName !== "string") return false;
  if (!ACQUISITION_METHODS.includes(p.method as PowerAcquisitionMethod)) return false;
  if (p.permanence !== "permanent" && p.permanence !== "temporary") return false;
  if (
    p.turnsRemaining !== undefined &&
    (!Number.isFinite(p.turnsRemaining) || (p.turnsRemaining as number) < 0)
  ) {
    return false;
  }
  if (!Number.isFinite(p.acquiredAtTurn)) return false;
  return true;
}

/** Strict shape check for a session's `acquiredPowers` list (empty is valid). */
export function isValidAcquiredPowersShape(obj: unknown): boolean {
  if (!Array.isArray(obj)) return false;
  return obj.every(isValidAcquiredPowerShape);
}
