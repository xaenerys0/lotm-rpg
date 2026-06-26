import type { SessionFact } from "@/lib/ai";
import { sealedArtifactNumberFromItemName } from "@/lib/lore";

import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Acquired powers — copying / stealing / borrowing another Beyonder's power.
// ---------------------------------------------------------------------------
//
// In the engine a character's abilities are DERIVED from `(pathwayId,
// sequenceLevel)` (see `apotheosis.ts` `sequenceAbilities`) — there is no slot
// for a power the character took from someone ELSE. Several pathways and a few
// Sealed Artifacts can do exactly that, though, each corpus-verified below: an
// Error **Prometheus** steals a power and wields it ~10 minutes; an Error
// **Parasite** takes one for good on emerging from a host; a Door **Scribe**
// Records a witnessed active power for a single use; a White-Tower **Polymath**
// Analyses and Imitates a witnessed power; a Hanged Man **Shepherd** Grazes a
// soul and wields its powers until they wear away; plus the relics **Ring of
// Mimicry** (2-081), **Blood Vessel Thief** (2-105), **Leymano's Travels** (the
// Tarot Club's copy-once notebook), and **Creeping Hunger** (the Shepherd-souls
// glove). This module is where those acquired powers are RECORDED on the
// character so they can actually be used — added when taken, updated (retuned /
// a copy refreshed), removed when released, and ticked down to expiry for the
// temporary ones (only Parasite's taking is permanent).
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
  | "scribe-record"
  | "imitation"
  | "shepherd-grazing"
  | "ring-of-mimicry"
  | "blood-vessel-thief"
  | "leymano-spellbook"
  | "creeping-hunger";

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
/** A Blood Vessel Thief leaves a stolen ability usable only briefly (~10 minutes). */
export const BLOOD_VESSEL_THIEF_DURATION_TURNS = 2;
/** A Prometheus wields a stolen power for "about ten minutes" (corpus) — brief. */
export const PROMETHEUS_THEFT_DURATION_TURNS = 2;
/** A Scribe's Record (and Leymano's Travels) stores a power for a SINGLE use. */
export const SINGLE_USE_DURATION_TURNS = 1;
/**
 * A Grazed soul (Hanged Man Shepherd / Creeping Hunger) is held a long while but
 * is NOT permanent: corpus — "Even if the Soul of a target stays Grazed, it will
 * gradually wear away afterwards, meaning it can't be permanently kept by them."
 * So it is temporary with a long lifetime, refreshable by re-grazing.
 */
export const GRAZED_SOUL_DURATION_TURNS = 12;

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
 * The pathway acquisition table — corpus-grounded against each pathway's
 * `<Pathway>/Abilities` wiki page. **All durations/permanences verified against
 * the corpus, not memory:**
 * - Error → Prometheus (Seq 6): "Steal a target's Beyonder power and use it
 *   themselves for about ten minutes" — TEMPORARY (the victim recovers it after
 *   hours-to-days; the thief's window is brief).
 * - Error → Parasite (Seq 4): Parasitism is a "Theft of Life"; a Parasite
 *   "will always Steal something when emerging from their Parasitized host" —
 *   a PERMANENT taking.
 * - Door → Scribe (Seq 6): "Record" a witnessed (ACTIVE) Beyonder power,
 *   "storing them for a single use" — TEMPORARY, single-use.
 * - White Tower → Polymath (Seq 6): Analyse, then Imitate — TEMPORARY.
 * - Hanged Man → Shepherd (Seq 5): "Grazing" swallows a target's Soul and uses
 *   "those Beyonder powers for themselves" — but the soul "will gradually wear
 *   away afterwards, meaning it can't be permanently kept" (corpus), so this is
 *   TEMPORARY with a long lifetime, not permanent.
 */
export const PATHWAY_ACQUISITIONS: readonly PathwayAcquisition[] = [
  {
    // Error Sequence 6 — Prometheus: steal a power and wield it ~10 minutes.
    pathwayId: 8,
    unlocksAtOrBelow: 6,
    method: "prometheus-theft",
    label: "Prometheus — steal a Beyonder's power and wield it for a short while",
    permanence: "temporary",
    defaultDuration: PROMETHEUS_THEFT_DURATION_TURNS,
  },
  {
    // Error Sequence 4 — Parasite: Theft of Life; always steals on emerging.
    pathwayId: 8,
    unlocksAtOrBelow: 4,
    method: "parasite-siphon",
    label: "Parasite — leech a host and take a power from them",
    permanence: "permanent",
  },
  {
    // Door Sequence 6 — Scribe: Record a witnessed active power for one use.
    pathwayId: 7,
    unlocksAtOrBelow: 6,
    method: "scribe-record",
    label: "Record — copy a witnessed active Beyonder power for a single use",
    permanence: "temporary",
    defaultDuration: SINGLE_USE_DURATION_TURNS,
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
  {
    // Hanged Man Sequence 5 — Shepherd: Graze a soul and use its powers, which
    // wear away over a long while (corpus) — temporary-long, not permanent.
    pathwayId: 9,
    unlocksAtOrBelow: 5,
    method: "shepherd-grazing",
    label: "Grazing — swallow a soul and wield its Beyonder powers for a long while",
    permanence: "temporary",
    defaultDuration: GRAZED_SOUL_DURATION_TURNS,
  },
];

/**
 * How a carried Sealed Artifact is recognised: either by its church catalogue
 * number (recovered from the minted item name) or — for the famous relics that
 * have NO canon church number (held privately, never church-catalogued) — by a
 * lowercase substring of the carried item's name. Keeping both in one matcher
 * list means the same loop handles both kinds without a fabricated code.
 */
type ArtifactMatcher = { number: string } | { nameIncludes: string };

interface ArtifactAcquisition extends Omit<AcquisitionCapability, "source"> {
  match: ArtifactMatcher;
}

/**
 * The Sealed-Artifact acquisition table — every relic corpus-grounded.
 * - 2-081 Ring of Mimicry (church-catalogued): imitate a witnessed power.
 * - 2-105 Blood Vessel Thief (church-catalogued): steal an ability ~10 minutes.
 * - Leymano's Travels (Door relic, NO church number): "Copies Beyonder abilities
 *   it has seen, allowing them to be reused only once" — the Tarot Club's
 *   rental notebook (its ability is the Door Scribe's Record).
 * - Creeping Hunger (Hanged Man / Shepherd relic, NO church number): "Can use
 *   the stored souls' Beyonder abilities."
 */
export const ARTIFACT_ACQUISITIONS: readonly ArtifactAcquisition[] = [
  {
    match: { number: "2-081" },
    method: "ring-of-mimicry",
    label: "Ring of Mimicry — imitate a Beyonder ability you have witnessed",
    permanence: "temporary",
    defaultDuration: RING_OF_MIMICRY_DURATION_TURNS,
  },
  {
    match: { number: "2-105" },
    method: "blood-vessel-thief",
    label: "Blood Vessel Thief — steal a target's ability for a short while",
    permanence: "temporary",
    defaultDuration: BLOOD_VESSEL_THIEF_DURATION_TURNS,
  },
  {
    match: { nameIncludes: "leymano" },
    method: "leymano-spellbook",
    label: "Leymano's Travels — copy a witnessed Beyonder power for a single use",
    permanence: "temporary",
    defaultDuration: SINGLE_USE_DURATION_TURNS,
  },
  {
    // Like the Shepherd's Grazing it embodies, a stored soul wears away (and the
    // glove consumes a soul per day) — temporary-long, not permanent.
    match: { nameIncludes: "creeping hunger" },
    method: "creeping-hunger",
    label: "Creeping Hunger — wield the Beyonder powers of the souls it has stored",
    permanence: "temporary",
    defaultDuration: GRAZED_SOUL_DURATION_TURNS,
  },
];

/**
 * Does a carried sealed-artifact item satisfy an artifact matcher? `churchNumber`
 * is the item's recovered church code (or `undefined`). A church-numbered item is
 * matched ONLY by number; an un-numbered item ONLY by name — so a future
 * numbered relic whose name happens to contain "leymano"/"creeping hunger" can
 * never misfire the name path.
 */
function artifactMatches(
  item: { name: string },
  match: ArtifactMatcher,
  churchNumber: string | undefined,
): boolean {
  if ("number" in match) return churchNumber === match.number;
  return (
    churchNumber === undefined && item.name.toLowerCase().includes(match.nameIncludes)
  );
}

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

  const seenMethods = new Set<PowerAcquisitionMethod>(capabilities.map((c) => c.method));
  for (const item of state.inventory) {
    if (item.category !== "sealed-artifact") continue;
    const churchNumber = sealedArtifactNumberFromItemName(item.name);
    for (const artifact of ARTIFACT_ACQUISITIONS) {
      if (seenMethods.has(artifact.method)) continue;
      if (!artifactMatches(item, artifact.match, churchNumber)) continue;
      seenMethods.add(artifact.method);
      capabilities.push({
        method: artifact.method,
        label: artifact.label,
        permanence: artifact.permanence,
        defaultDuration: artifact.defaultDuration,
        source: "artifact",
      });
    }
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
  "scribe-record",
  "imitation",
  "shepherd-grazing",
  "ring-of-mimicry",
  "blood-vessel-thief",
  "leymano-spellbook",
  "creeping-hunger",
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
