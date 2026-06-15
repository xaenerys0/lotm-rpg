// ---------------------------------------------------------------------------
// Identity management (issue #22)
// ---------------------------------------------------------------------------
//
// Pathway-gated personas with separate reputations and exposure risk. Pure
// functions; the React layer owns storage and the AI only ever NARRATES the
// active identity (it is threaded into the prompt as presentation context —
// never as a mechanical lever the model can pull).
//
// Capability tiers:
//   - "flawless": the highest transformation sequences (Fool ≤ Seq 6 "Faceless",
//     Error ≤ Seq 5 "Dream Stealer"). A flawless persona reads as a REAL,
//     separate person — never labelled a disguise, accrues NO exposure risk, and
//     cannot be connected to the true self by mundane NPCs (only a fitting
//     Beyonder power or a story beat can pierce it). Dream Stealer is also
//     "fate-proof": even divination / fate-reading slides off it.
//   - "full": pathways whose abilities canonically support living as someone
//     else (e.g. Error's Swindler line from Seq 8). Multiple persistent personas.
//   - "basic": every other Beyonder. One surface-level disguise at a time,
//     easier for NPCs to see through (higher exposure accrual).

export type SocialClass = "lower" | "middle" | "upper" | "noble";

export interface Identity {
  id: string;
  name: string;
  appearance: string;
  socialClass: SocialClass;
  backstory?: string;
  /** Per-NPC / per-organization standing, -100..100. */
  reputation: Record<string, number>;
  /** NPCs who know this identity by face and name. */
  knownBy: string[];
  /** True for a surface-level disguise (basic tier), not a crafted persona. */
  activeDisguise: boolean;
  /** True for a flawless persona — a real, separate person, never a disguise. */
  flawless?: boolean;
  /** True for a fate-proof flawless persona (Dream Stealer) — divination fails. */
  fateProof?: boolean;
  /** 0..100 — accrues with use; high risk invites exposure events. */
  exposureRisk: number;
  /** NPCs who know this identity is the same person as another. */
  exposedTo: string[];
  createdAt: number;
}

export interface IdentityState {
  identities: Identity[];
  /** `null` = the character's true face. */
  activeIdentityId: string | null;
}

export type IdentityCapability = "flawless" | "full" | "basic";

/**
 * Sequence threshold (inclusive — remember lower = stronger) at which a
 * pathway unlocks FULL identity management. Error's Swindler line lives on
 * borrowed faces from Seq 8. (Fool's Faceless is FLAWLESS, see below.)
 */
export const FULL_IDENTITY_THRESHOLDS: Record<number, number> = {
  1: 6,
  8: 8,
};

/**
 * Sequence threshold at which a pathway's transformation becomes FLAWLESS — a
 * persona indistinguishable from a real, separate person. Fool ≤ 6 "Faceless";
 * Error ≤ 5 "Dream Stealer".
 */
export const FLAWLESS_IDENTITY_THRESHOLDS: Record<number, number> = {
  1: 6,
  8: 5,
};

/**
 * Flawless personas that are additionally FATE-PROOF — even divination and
 * fate-reading cannot see through them. Error ≤ 5 "Dream Stealer".
 */
export const FATE_PROOF_THRESHOLDS: Record<number, number> = {
  8: 5,
};

function atOrBelowThreshold(
  table: Record<number, number>,
  pathwayId: number,
  sequenceLevel: number,
): boolean {
  const threshold = table[pathwayId];
  return threshold !== undefined && sequenceLevel <= threshold;
}

export function identityCapability(
  pathwayId: number,
  sequenceLevel: number,
): IdentityCapability {
  if (atOrBelowThreshold(FLAWLESS_IDENTITY_THRESHOLDS, pathwayId, sequenceLevel)) {
    return "flawless";
  }
  if (atOrBelowThreshold(FULL_IDENTITY_THRESHOLDS, pathwayId, sequenceLevel)) {
    return "full";
  }
  return "basic";
}

/** Whether a flawless persona crafted at this pathway+sequence is fate-proof. */
export function isFateProof(pathwayId: number, sequenceLevel: number): boolean {
  return atOrBelowThreshold(FATE_PROOF_THRESHOLDS, pathwayId, sequenceLevel);
}

export function createIdentityState(): IdentityState {
  return { identities: [], activeIdentityId: null };
}

export const MAX_BASIC_IDENTITIES = 1;

export interface NewIdentityFields {
  name: string;
  appearance: string;
  socialClass: SocialClass;
  backstory?: string;
}

/**
 * Create a persona. Full capability allows any number of persistent
 * identities; basic capability allows ONE surface-level disguise at a time
 * (flagged `activeDisguise`, faster to fray). Throws on a duplicate name or
 * when the basic cap is hit — the UI surfaces both as in-world limits.
 */
export function createIdentity(
  state: IdentityState,
  fields: NewIdentityFields,
  capability: IdentityCapability,
  now: number = Date.now(),
  id: string = crypto.randomUUID(),
  fateProof: boolean = false,
): IdentityState {
  const name = fields.name.trim();
  if (name === "") throw new Error("An identity needs a name.");
  if (state.identities.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`The name "${name}" is already one of your faces.`);
  }
  if (capability === "basic" && state.identities.length >= MAX_BASIC_IDENTITIES) {
    throw new Error(
      "Without the right abilities you can hold only one disguise at a time — discard it first.",
    );
  }
  const identity: Identity = {
    id,
    name,
    appearance: fields.appearance.trim(),
    socialClass: fields.socialClass,
    ...(fields.backstory?.trim() ? { backstory: fields.backstory.trim() } : {}),
    reputation: {},
    knownBy: [],
    activeDisguise: capability === "basic",
    ...(capability === "flawless"
      ? { flawless: true, ...(fateProof ? { fateProof } : {}) }
      : {}),
    exposureRisk: 0,
    exposedTo: [],
    createdAt: now,
  };
  return { ...state, identities: [...state.identities, identity] };
}

/** Discard a persona entirely (its reputation and exposure history go too). */
export function discardIdentity(state: IdentityState, id: string): IdentityState {
  return {
    identities: state.identities.filter((i) => i.id !== id),
    activeIdentityId: state.activeIdentityId === id ? null : state.activeIdentityId,
  };
}

/**
 * Switch the active face — a deliberate action, never automatic. `null`
 * returns to the character's true identity. Throws on an unknown id.
 */
export function switchIdentity(state: IdentityState, id: string | null): IdentityState {
  if (id !== null && !state.identities.some((i) => i.id === id)) {
    throw new Error(`Unknown identity "${id}".`);
  }
  return { ...state, activeIdentityId: id };
}

export function activeIdentity(state: IdentityState): Identity | null {
  return state.identities.find((i) => i.id === state.activeIdentityId) ?? null;
}

// Exposure accrual: every public turn in a persona costs a little; being
// seen by NPCs costs more; a surface disguise frays roughly twice as fast.
export const EXPOSURE_PER_USE = 2;
export const EXPOSURE_PER_NEW_NPC = 3;
export const DISGUISE_EXPOSURE_MULTIPLIER = 2;
export const EXPOSURE_EVENT_THRESHOLD = 60;

/**
 * Record a turn spent in the active identity in front of `npcsPresent`:
 * the NPCs learn this face (per-identity awareness — they do NOT cross-
 * reference other identities), and exposure risk accrues.
 */
export function recordIdentityUse(
  state: IdentityState,
  npcsPresent: readonly string[],
): IdentityState {
  const active = activeIdentity(state);
  if (!active) return state;

  const newNpcs = npcsPresent.filter((npc) => !active.knownBy.includes(npc));
  // A flawless persona IS a real person to the world: NPCs still learn this
  // face, but no exposure risk ever accrues — there is nothing to see through.
  if (active.flawless) {
    return updateIdentity(state, active.id, {
      knownBy: [...active.knownBy, ...newNpcs],
    });
  }
  const multiplier = active.activeDisguise ? DISGUISE_EXPOSURE_MULTIPLIER : 1;
  const risk = Math.min(
    100,
    active.exposureRisk +
      multiplier * (EXPOSURE_PER_USE + EXPOSURE_PER_NEW_NPC * newNpcs.length),
  );

  return updateIdentity(state, active.id, {
    knownBy: [...active.knownBy, ...newNpcs],
    exposureRisk: risk,
  });
}

/** Adjust an identity's standing with one NPC or organization (-100..100). */
export function adjustReputation(
  state: IdentityState,
  identityId: string,
  subject: string,
  delta: number,
): IdentityState {
  const identity = state.identities.find((i) => i.id === identityId);
  if (!identity) return state;
  const current = identity.reputation[subject] ?? 0;
  const next = Math.max(-100, Math.min(100, current + delta));
  return updateIdentity(state, identityId, {
    reputation: { ...identity.reputation, [subject]: next },
  });
}

export interface ExposureEvent {
  /** The NPC who connected the faces. */
  npc: string;
  /** The identities they linked (the active one plus the recognized one). */
  identityIds: [string, string];
}

/**
 * Check whether this turn exposes the active identity: once risk crosses the
 * threshold, an NPC who knows BOTH the active face and another of the
 * player's faces (or their true face — any other identity) may connect them.
 * Deterministic given the injected random source.
 */
export function checkExposure(
  state: IdentityState,
  random: () => number = Math.random,
): ExposureEvent | null {
  const active = activeIdentity(state);
  if (!active) return null;
  // A flawless persona is never connected to another face by mundane NPCs — it
  // reads as a wholly separate, real person. Only a fitting Beyonder power or a
  // story beat (narrative-only, outside this engine) can pierce it.
  if (active.flawless) return null;
  if (active.exposureRisk < EXPOSURE_EVENT_THRESHOLD) return null;
  // The chance scales with how far past the threshold the risk has run.
  const chance = (active.exposureRisk - EXPOSURE_EVENT_THRESHOLD) / 100 + 0.15;
  if (random() >= chance) return null;

  for (const other of state.identities) {
    if (other.id === active.id) continue;
    const witness = active.knownBy.find(
      (npc) => other.knownBy.includes(npc) && !active.exposedTo.includes(npc),
    );
    if (witness) {
      return { npc: witness, identityIds: [active.id, other.id] };
    }
  }
  return null;
}

/**
 * Apply an exposure event: the witness now knows the two faces are one
 * person; both personas take a reputation hit with them, and the active
 * identity's risk resets to a wary simmer.
 */
export function applyExposure(state: IdentityState, event: ExposureEvent): IdentityState {
  let next = state;
  for (const id of event.identityIds) {
    const identity = next.identities.find((i) => i.id === id);
    if (!identity) continue;
    next = updateIdentity(next, id, {
      exposedTo: identity.exposedTo.includes(event.npc)
        ? identity.exposedTo
        : [...identity.exposedTo, event.npc],
    });
    next = adjustReputation(next, id, event.npc, -20);
  }
  const active = activeIdentity(next);
  if (active && event.identityIds.includes(active.id)) {
    next = updateIdentity(next, active.id, { exposureRisk: 30 });
  }
  return next;
}

/**
 * One line of presentation context for the narrator — tone/content adapt to
 * the active persona, but the AI is told it is presentation, not truth.
 */
export function identityPromptContext(state: IdentityState): string | null {
  const active = activeIdentity(state);
  if (!active) return null;
  const who = `"${active.name}" (${active.socialClass} class${
    active.appearance ? `; ${active.appearance}` : ""
  })`;
  if (active.flawless) {
    const fate = active.fateProof
      ? " Even divination and fate-reading slide off this identity entirely — it cannot be pierced by any ordinary means."
      : "";
    return `The character is living as ${who}. This transformation is FLAWLESS: to everyone, including those who knew the character before, this is a real, separate person — never narrate it as a disguise or hint that it might be seen through.${fate}`;
  }
  return `The character is currently presenting as ${who}. NPCs know and treat this persona separately from their other faces. Narrate tone, address, and social access accordingly — this is a presentation, not the character's true self.`;
}

/** Strict-ish shape validation for persisted identity state. */
export function isValidIdentityStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Array.isArray(s.identities)) return false;
  if (s.activeIdentityId !== null && typeof s.activeIdentityId !== "string") {
    return false;
  }
  return s.identities.every((entry: unknown) => {
    if (typeof entry !== "object" || entry === null) return false;
    const i = entry as Record<string, unknown>;
    return (
      typeof i.id === "string" &&
      typeof i.name === "string" &&
      typeof i.appearance === "string" &&
      ["lower", "middle", "upper", "noble"].includes(i.socialClass as string) &&
      typeof i.reputation === "object" &&
      i.reputation !== null &&
      Array.isArray(i.knownBy) &&
      typeof i.activeDisguise === "boolean" &&
      (i.flawless === undefined || typeof i.flawless === "boolean") &&
      (i.fateProof === undefined || typeof i.fateProof === "boolean") &&
      Number.isFinite(i.exposureRisk) &&
      Array.isArray(i.exposedTo)
    );
  });
}

// --- internals ---------------------------------------------------------------

function updateIdentity(
  state: IdentityState,
  id: string,
  patch: Partial<Identity>,
): IdentityState {
  return {
    ...state,
    identities: state.identities.map((identity) =>
      identity.id === id ? { ...identity, ...patch } : identity,
    ),
  };
}
