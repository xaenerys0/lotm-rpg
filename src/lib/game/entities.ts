import {
  CURATED_ENTITY_PROFILES,
  getCuratedEntityProfile,
} from "@/lib/lore/entity-profiles";
import { getPathway, getSequence } from "@/lib/rules";
import type {
  AuthoritativeEntityRecord,
  CharacteristicOwnership,
  CombatProfile,
  EntityId,
  EntityKind,
  EntityLifeState,
  EntityMechanicalProfileState,
  EntityProtection,
  EntityRegistryState,
  EntitySource,
  MechanicalProfileProvenance,
  MechanicalProfileSnapshot,
} from "@/lib/types/entities";
import type {
  CharacteristicForm,
  CharacteristicItemMetadata,
  Item,
} from "@/lib/types/rules";

import { ITEM_CATEGORIES } from "./inventory";
import { canonicalize } from "./receipt-fingerprint";
import { deterministicSeed, normalizeIdentitySurface } from "./stable-identifiers";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// The authoritative entity registry (issue #227).
//
// One place answers "who is this, and are they alive". Before this, four surfaces
// each kept their own answer — the tracked-NPC roster, `GameState.npcsPresent`,
// society membership, and the person-Codex — all keyed by NAME, while combat
// carried no individual identity at all (`bestiaryId` names a TEMPLATE). So two
// people could share a name, a dead follower could be re-asserted by travel, and
// nothing could say whether the thing you just killed owned a characteristic.
//
// This module is additive for now: the registry rides along as an optional session
// sub-state (the `hunts`/`characteristicLedger` pattern — strictly validated,
// preserved on the deserialize `...s` spread, no DB migration). Authority moves
// onto it in the next phase; nothing here changes existing behaviour yet.
//
// Invariants:
//
// - **No mechanical API accepts a name.** `resolveEntityByName` exists for display
//   and migration and can answer `ambiguous`; every mutation takes an `EntityId`.
// - **A profile is trusted or absent.** `unknown` → `known` may happen once, from
//   the curated catalogue, an engine-owned versioned generator, a hunt, or a
//   trusted script. An equal re-assignment is a no-op; a differing one is
//   REJECTED. The validated snapshot is persisted, so a later catalogue change can
//   never rewrite an existing save.
// - **Ownership is stated, never inferred.** `isBeyonder`/`pathwayId` describe how
//   a thing fights. Only `characteristicOwnership` authorizes precipitation.
//
// Pure + deterministic. Design doc: `docs/entity-death-design.md`.
// ---------------------------------------------------------------------------

export const ENTITY_REGISTRY_SCHEMA_VERSION = 1;

/** Bumped when a generator recipe's output changes for the same inputs. */
export const PROFILE_GENERATOR_VERSION = 1;

/** The engine-owned generator recipes. A save records which one produced a profile. */
export const GENERATOR_RECIPES = ["beyonder-encounter/v1"] as const;
export type GeneratorRecipeId = (typeof GENERATOR_RECIPES)[number];

const ENTITY_KINDS: readonly EntityKind[] = [
  "player",
  "person",
  "mystical-creature",
  "evil-spirit",
  "construct",
  "mundane",
  "unknown",
];

const LIFE_STATES: readonly EntityLifeState[] = ["alive", "dead", "transformed"];

/** A fresh, empty registry. */
export function emptyEntityRegistry(): EntityRegistryState {
  return {
    schemaVersion: ENTITY_REGISTRY_SCHEMA_VERSION,
    entities: [],
    presentEntityIds: [],
  };
}

/** The session's registry, or a fresh empty one for a save that never had one. */
export function resolveEntityRegistry(session: GameSession): EntityRegistryState {
  return session.entityRegistry ?? emptyEntityRegistry();
}

/** The profile state a newly registered entity starts in: nothing is assumed. */
export function unknownProfileState(): EntityMechanicalProfileState {
  return { status: "unknown", profileRevision: 0 };
}

// --- validation -------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

/** A whole, non-negative count — never coerced (see `quantity` below). */
function isWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

const CHARACTERISTIC_FORMS: readonly CharacteristicForm[] = ["raw", "fused-mystical"];

/** A carried characteristic's provenance is unforgeable, so every arm is checked. */
function isValidCharacteristicOriginShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case "death":
      return isNonBlankString(value.deathEventId);
    case "legacy-import":
      return isNonBlankString(value.migrationId);
    case "curated-acquisition":
      return isNonBlankString(value.acquisitionId);
    default:
      return false;
  }
}

/**
 * `Item.characteristic` (issue #227) is the ITEM'S IDENTITY — the `unitId` that
 * makes a characteristic consumable / tradeable / losable exactly once — so it is
 * validated as strictly as an ownership stack: a real canon rung, a known form,
 * and a well-formed origin. Skipping it would let a malformed or unattributable
 * unit ride into a "validated" persisted snapshot.
 */
function isValidCharacteristicMetadataShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isNonBlankString(value.unitId)) return false;
  if (!isWholeNumber(value.pathwayId)) return false;
  if (!isWholeNumber(value.sequenceLevel)) return false;
  if (
    getSequence(value.pathwayId as number, value.sequenceLevel as number) === undefined
  ) {
    return false;
  }
  if (!(CHARACTERISTIC_FORMS as readonly unknown[]).includes(value.form)) return false;
  return isValidCharacteristicOriginShape(value.origin);
}

function isValidItemShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.description !== "string") return false;
  if (!(ITEM_CATEGORIES as readonly unknown[]).includes(value.category)) return false;
  if (value.consumable !== undefined && typeof value.consumable !== "boolean") {
    return false;
  }
  if (
    value.characteristic !== undefined &&
    !isValidCharacteristicMetadataShape(value.characteristic)
  ) {
    return false;
  }
  return true;
}

/** A combat surface: canon-resolvable pathway when present, plausible rung. */
export function isValidCombatProfileShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isWholeNumber(value.sequenceLevel) || value.sequenceLevel > 9) return false;
  if (typeof value.isBeyonder !== "boolean") return false;
  if (
    value.pathwayId !== undefined &&
    getPathway(value.pathwayId as number) === undefined
  ) {
    return false;
  }
  if (value.knownAbilities !== undefined && !isStringArray(value.knownAbilities)) {
    return false;
  }
  if (value.loot !== undefined) {
    if (!Array.isArray(value.loot) || !value.loot.every(isValidItemShape)) return false;
  }
  return true;
}

/**
 * A `known` ownership stack must name a REAL canon rung and a whole positive
 * count. Deliberately strict: the pre-#227 ledger coerced a fractional quantity
 * upward (`Math.max(1, Math.floor(q))`, so 0.5 became a free characteristic).
 * Nothing here rounds — a malformed stack is refused.
 */
function isValidOwnershipStack(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isWholeNumber(value.pathwayId)) return false;
  if (!isWholeNumber(value.sequenceLevel)) return false;
  if (!isWholeNumber(value.quantity) || value.quantity === 0) return false;
  // The rung must exist in canon (`getSequence` covers Seq 9–1; a Sequence 0
  // deity has no rung entry, and no recoverable characteristic name either).
  return (
    getSequence(value.pathwayId as number, value.sequenceLevel as number) !== undefined
  );
}

/**
 * Two stacks naming the SAME pathway + rung would be two answers to one question:
 * `characteristicUnitId(deathId, pathwayId, sequenceLevel, ordinal)` carries no
 * stack index, so per-stack ordinals would mint one unit id for two different
 * characteristics — the opposite of the exact-identity guarantee. A duplicate is a
 * malformed stack list (the count belongs in `quantity`), so it is refused, not merged.
 */
function hasDuplicateRung(stacks: readonly unknown[]): boolean {
  const seen = new Set<string>();
  for (const stack of stacks) {
    const { pathwayId, sequenceLevel } = stack as {
      pathwayId: number;
      sequenceLevel: number;
    };
    const key = `${pathwayId}:${sequenceLevel}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export function isValidCharacteristicOwnershipShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.status === "known-none") return true;
  if (value.status === "known") {
    return (
      Array.isArray(value.stacks) &&
      value.stacks.length > 0 &&
      value.stacks.every(isValidOwnershipStack) &&
      !hasDuplicateRung(value.stacks)
    );
  }
  if (value.status === "unknown") {
    return (
      value.reason === "legacy" ||
      value.reason === "narrative-only" ||
      value.reason === "unverified-source"
    );
  }
  return false;
}

export function isValidMechanicalProfileSnapshotShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isValidCombatProfileShape(value.combatProfile)) return false;
  if (!isValidCharacteristicOwnershipShape(value.characteristicOwnership)) return false;
  if (!Array.isArray(value.harvestableMaterials)) return false;
  return value.harvestableMaterials.every(isValidItemShape);
}

function isValidProvenanceShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case "curated":
      return isNonBlankString(value.catalogId);
    case "generated":
      return (
        isNonBlankString(value.recipeId) &&
        isWholeNumber(value.generatorVersion) &&
        isNonBlankString(value.generationId) &&
        isNonBlankString(value.seed)
      );
    case "hunt":
      return isNonBlankString(value.huntId);
    case "trusted-script":
      return isNonBlankString(value.scriptId);
    default:
      return false;
  }
}

function isValidProfileStateShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.status === "unknown") return value.profileRevision === 0;
  if (value.status !== "known") return false;
  return (
    isNonBlankString(value.profileId) &&
    isWholeNumber(value.profileVersion) &&
    isWholeNumber(value.profileRevision) &&
    (value.profileRevision as number) > 0 &&
    isValidMechanicalProfileSnapshotShape(value.snapshot) &&
    isValidProvenanceShape(value.provenance)
  );
}

function isValidProtectionShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isNonBlankString(value.protectionId) &&
    value.effect === "blocks-death" &&
    typeof value.reason === "string" &&
    isNonBlankString(value.appliedByEventId)
  );
}

function isValidSourceShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case "player":
      return true;
    case "canon":
    case "bestiary-instance":
    case "legacy":
      return isNonBlankString(value.sourceId);
    case "hunt":
      return isNonBlankString(value.huntId);
    case "story":
      return isNonBlankString(value.introductionId);
    default:
      return false;
  }
}

function isValidEntityRecordShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isNonBlankString(value.entityId)) return false;
  if (typeof value.displayName !== "string") return false;
  if (!isStringArray(value.aliases)) return false;
  if (!(ENTITY_KINDS as readonly unknown[]).includes(value.kind)) return false;
  if (!(LIFE_STATES as readonly unknown[]).includes(value.lifeState)) return false;
  if (value.canonRef !== undefined && !isNonBlankString(value.canonRef)) return false;
  if (!isValidProfileStateShape(value.mechanicalProfile)) return false;
  if (!Array.isArray(value.protections)) return false;
  if (!value.protections.every(isValidProtectionShape)) return false;
  if (!isWholeNumber(value.introducedAtTurn)) return false;
  return isValidSourceShape(value.source);
}

/**
 * Strict shape check for a session's `entityRegistry` (empty is valid). Beyond
 * per-record shape it enforces the three whole-registry invariants a save must
 * never violate: **no duplicate entity ids** (two records claiming one identity),
 * **no dangling presence** (an on-screen id with no record), and **no repeated
 * presence** (one actor listed on-screen twice, which would double them in the
 * `presentEntityNames` projection). Each would let a mechanical lookup or the
 * scene cast silently disagree with the registry, so a save carrying one is
 * rejected rather than repaired.
 */
export function isValidEntityRegistryShape(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== ENTITY_REGISTRY_SCHEMA_VERSION) return false;
  if (!Array.isArray(value.entities)) return false;
  if (!value.entities.every(isValidEntityRecordShape)) return false;
  if (!isStringArray(value.presentEntityIds)) return false;

  const ids = new Set<string>();
  for (const entity of value.entities as AuthoritativeEntityRecord[]) {
    if (ids.has(entity.entityId)) return false;
    ids.add(entity.entityId);
  }
  const present = value.presentEntityIds as string[];
  if (new Set(present).size !== present.length) return false;
  return present.every((id) => ids.has(id));
}

// --- registration -----------------------------------------------------------

export interface RegisterEntityInput {
  entityId: EntityId;
  displayName: string;
  aliases?: string[];
  kind: EntityKind;
  canonRef?: string;
  introducedAtTurn: number;
  source: EntitySource;
  /** Death blocks that exist from the outset (a warded canon figure). */
  protections?: EntityProtection[];
}

export type RegisterEntityResult =
  | {
      outcome: "registered" | "already-registered";
      registry: EntityRegistryState;
      entity: AuthoritativeEntityRecord;
    }
  | { outcome: "invalid"; registry: EntityRegistryState; reason: string };

/**
 * Register an actor's identity. A profile is deliberately NOT part of this: an
 * entity begins `unknown` and becomes known only through a trusted assignment, so
 * a story-introduced NPC can exist (and be referenced, rostered, fought) without
 * ever implying it carries a characteristic.
 *
 * Re-registering the same id is an idempotent no-op (`already-registered`) rather
 * than an overwrite — replaying a turn cannot rewrite who someone is.
 */
export function registerEntity(
  registry: EntityRegistryState,
  input: RegisterEntityInput,
): RegisterEntityResult {
  const existing = findEntity(registry, input.entityId);
  if (existing) {
    return { outcome: "already-registered", registry, entity: existing };
  }

  const entity: AuthoritativeEntityRecord = {
    entityId: input.entityId,
    displayName: input.displayName,
    aliases: input.aliases ? [...input.aliases] : [],
    kind: input.kind,
    lifeState: "alive",
    ...(input.canonRef !== undefined ? { canonRef: input.canonRef } : {}),
    mechanicalProfile: unknownProfileState(),
    protections: input.protections ? [...input.protections] : [],
    introducedAtTurn: input.introducedAtTurn,
    source: input.source,
  };
  if (!isValidEntityRecordShape(entity)) {
    return { outcome: "invalid", registry, reason: "malformed-entity" };
  }

  return {
    outcome: "registered",
    registry: { ...registry, entities: [...registry.entities, entity] },
    entity,
  };
}

/** O(n) lookup by exact id — the only identity a mechanical caller may use. */
export function findEntity(
  registry: EntityRegistryState,
  entityId: EntityId,
): AuthoritativeEntityRecord | undefined {
  return registry.entities.find((entity) => entity.entityId === entityId);
}

export type NameResolution =
  | { status: "resolved"; entity: AuthoritativeEntityRecord }
  | { status: "not-found" }
  | { status: "ambiguous"; candidates: AuthoritativeEntityRecord[] };

/**
 * Resolve a display name or alias for DISPLAY and MIGRATION only. Names are not
 * unique (two Beyonders may both be "Gawain"; aliases overlap by design), so this
 * can answer `ambiguous` — and when it does, the caller must fail closed rather
 * than pick. No mechanical mutation accepts a name for exactly this reason.
 */
export function resolveEntityByName(
  registry: EntityRegistryState,
  surface: string,
): NameResolution {
  const normalized = normalizeIdentitySurface(surface);
  if (normalized.length === 0) return { status: "not-found" };

  const candidates = registry.entities.filter(
    (entity) =>
      normalizeIdentitySurface(entity.displayName) === normalized ||
      entity.aliases.some((alias) => normalizeIdentitySurface(alias) === normalized),
  );
  if (candidates.length === 0) return { status: "not-found" };
  if (candidates.length > 1) return { status: "ambiguous", candidates };
  return { status: "resolved", entity: candidates[0] };
}

/**
 * The names of the entities currently on-screen — the projection
 * `GameState.npcsPresent` becomes in the next phase. The player's own record is
 * excluded (the player is never a present NPC — the doppelganger rule that
 * `stripSelfFromNpcs` enforces today).
 */
export function presentEntityNames(registry: EntityRegistryState): string[] {
  return registry.presentEntityIds
    .map((id) => findEntity(registry, id))
    .filter(
      (entity): entity is AuthoritativeEntityRecord =>
        entity !== undefined && entity.kind !== "player",
    )
    .map((entity) => entity.displayName);
}

// --- profile assignment -----------------------------------------------------

/**
 * A trusted profile assignment. Every variant's mechanics come from the engine or
 * the committed catalogue — there is deliberately no variant that accepts raw
 * pathway / Sequence / quantity / ownership fields from an AI response.
 */
export type ProfileAssignment =
  | { kind: "curated"; catalogId: string; combatProfile: CombatProfile }
  | {
      kind: "generated";
      recipeId: GeneratorRecipeId;
      /** Engine-owned per-save seed material; never player- or AI-supplied. */
      sessionSeed: string;
      combatProfile: CombatProfile;
      entityKind: EntityKind;
    }
  | { kind: "hunt"; huntId: string; snapshot: MechanicalProfileSnapshot }
  | { kind: "trusted-script"; scriptId: string; snapshot: MechanicalProfileSnapshot };

export type AssignProfileOutcome =
  | "assigned"
  | "duplicate"
  | "conflict"
  | "not-found"
  | "unknown-catalog-entry"
  | "unknown-recipe"
  | "invalid-profile";

export interface AssignProfileResult {
  outcome: AssignProfileOutcome;
  registry: EntityRegistryState;
  entity?: AuthoritativeEntityRecord;
  provenance?: MechanicalProfileProvenance;
}

/**
 * Derive ownership for a generic engine-framed encounter (recipe
 * `beyonder-encounter/v1`). The rule is explicit and versioned rather than
 * inferred at drop time:
 *
 * - a `mundane` actor owns nothing (`known-none`);
 * - an engine-derived Beyonder standing on a REAL canon rung owns exactly one
 *   characteristic of that pathway and rung;
 * - anything else stays `unknown` — a creature or spirit with no canon pathway is
 *   not assumed to carry one ("most of them didn't", ch. 1263), and unknown
 *   precipitates nothing.
 *
 * The inputs are engine-owned (the encounter's own derived combat profile and the
 * save's seed), which is what separates this from the defect it replaces: the old
 * code read `isBeyonder`/`pathwayId` off an enemy AT THE MOMENT OF DEATH with no
 * record; this records a versioned, seeded, persisted profile up front.
 */
function generatedOwnership(
  combatProfile: CombatProfile,
  entityKind: EntityKind,
): CharacteristicOwnership {
  if (entityKind === "mundane") return { status: "known-none" };
  if (
    combatProfile.isBeyonder &&
    combatProfile.pathwayId !== undefined &&
    getSequence(combatProfile.pathwayId, combatProfile.sequenceLevel) !== undefined
  ) {
    return {
      status: "known",
      stacks: [
        {
          pathwayId: combatProfile.pathwayId,
          sequenceLevel: combatProfile.sequenceLevel,
          quantity: 1,
        },
      ],
    };
  }
  return { status: "unknown", reason: "unverified-source" };
}

function copyCharacteristicMetadata(
  metadata: CharacteristicItemMetadata,
): CharacteristicItemMetadata {
  return { ...metadata, origin: { ...metadata.origin } };
}

/** A copy that OMITS absent optionals rather than setting them to `undefined`. */
function copyItem(item: Item): Item {
  return {
    name: item.name,
    description: item.description,
    category: item.category,
    ...(item.consumable !== undefined ? { consumable: item.consumable } : {}),
    ...(item.characteristic !== undefined
      ? { characteristic: copyCharacteristicMetadata(item.characteristic) }
      : {}),
  };
}

function copyCombatProfile(profile: CombatProfile): CombatProfile {
  return {
    sequenceLevel: profile.sequenceLevel,
    isBeyonder: profile.isBeyonder,
    ...(profile.pathwayId !== undefined ? { pathwayId: profile.pathwayId } : {}),
    ...(profile.knownAbilities !== undefined
      ? { knownAbilities: [...profile.knownAbilities] }
      : {}),
    ...(profile.loot !== undefined ? { loot: profile.loot.map(copyItem) } : {}),
  };
}

function copyOwnership(ownership: CharacteristicOwnership): CharacteristicOwnership {
  return ownership.status === "known"
    ? { status: "known", stacks: ownership.stacks.map((stack) => ({ ...stack })) }
    : { ...ownership };
}

/**
 * The snapshot actually persisted. Two jobs, both required by the "a profile is
 * trusted or absent" invariant:
 *
 * 1. **Own the data.** Nothing is shared with the caller's assignment or with the
 *    committed `CURATED_ENTITY_PROFILES` const. Storing those objects by reference
 *    would let a later mutation of either silently rewrite an existing save's
 *    profile (and, for the catalogue, every other save's in the same process) —
 *    the exact rewrite persisting a snapshot is meant to prevent.
 * 2. **Stay canonicalizable.** Absent optionals are OMITTED, never `undefined`,
 *    because `canonicalize` (the duplicate/conflict equality test below) refuses
 *    `undefined` rather than coercing it.
 */
function copySnapshot(snapshot: MechanicalProfileSnapshot): MechanicalProfileSnapshot {
  return {
    combatProfile: copyCombatProfile(snapshot.combatProfile),
    characteristicOwnership: copyOwnership(snapshot.characteristicOwnership),
    harvestableMaterials: snapshot.harvestableMaterials.map(copyItem),
  };
}

function buildAssignment(
  entityId: EntityId,
  assignment: ProfileAssignment,
):
  | {
      ok: true;
      profileId: string;
      profileVersion: number;
      snapshot: MechanicalProfileSnapshot;
      provenance: MechanicalProfileProvenance;
    }
  | { ok: false; outcome: AssignProfileOutcome } {
  switch (assignment.kind) {
    case "curated": {
      const curated = getCuratedEntityProfile(assignment.catalogId);
      if (!curated) return { ok: false, outcome: "unknown-catalog-entry" };
      return {
        ok: true,
        profileId: curated.catalogId,
        profileVersion: curated.profileVersion,
        snapshot: {
          combatProfile: assignment.combatProfile,
          characteristicOwnership: curated.characteristicOwnership,
          harvestableMaterials: curated.harvestableMaterials,
        },
        provenance: { kind: "curated", catalogId: curated.catalogId },
      };
    }
    case "generated": {
      if (!(GENERATOR_RECIPES as readonly string[]).includes(assignment.recipeId)) {
        return { ok: false, outcome: "unknown-recipe" };
      }
      const snapshot: MechanicalProfileSnapshot = {
        combatProfile: assignment.combatProfile,
        characteristicOwnership: generatedOwnership(
          assignment.combatProfile,
          assignment.entityKind,
        ),
        harvestableMaterials: [],
      };
      // The seed must cover EVERY input the recipe's output depends on, or the
      // recorded provenance cannot reproduce — or even distinguish — that output.
      // `generatedOwnership` reads the entity kind and three combat fields, so all
      // four join the seed; without them two different snapshots (a `mundane`
      // none, a Beyonder's stack) would share one `generationId` and then read as
      // an unexplained conflict.
      const seed = deterministicSeed([
        assignment.sessionSeed,
        entityId,
        assignment.recipeId,
        String(PROFILE_GENERATOR_VERSION),
        assignment.entityKind,
        String(assignment.combatProfile.sequenceLevel),
        String(assignment.combatProfile.isBeyonder),
        String(assignment.combatProfile.pathwayId ?? ""),
      ]);
      return {
        ok: true,
        profileId: `${assignment.recipeId}:${seed}`,
        profileVersion: PROFILE_GENERATOR_VERSION,
        snapshot,
        provenance: {
          kind: "generated",
          recipeId: assignment.recipeId,
          generatorVersion: PROFILE_GENERATOR_VERSION,
          generationId: `gen:${assignment.recipeId}:${seed}`,
          seed,
        },
      };
    }
    case "hunt":
      return {
        ok: true,
        profileId: `hunt:${assignment.huntId}`,
        profileVersion: 1,
        snapshot: assignment.snapshot,
        provenance: { kind: "hunt", huntId: assignment.huntId },
      };
    case "trusted-script":
      return {
        ok: true,
        profileId: `script:${assignment.scriptId}`,
        profileVersion: 1,
        snapshot: assignment.snapshot,
        provenance: { kind: "trusted-script", scriptId: assignment.scriptId },
      };
  }
}

/**
 * Assign an entity's mechanical profile — the ONE moment ownership is established.
 *
 * - `unknown` → `known` succeeds once (revision 1).
 * - Re-assigning the SAME profile (equal id, version, snapshot, and provenance) is
 *   a `duplicate` no-op, so a replayed turn is harmless.
 * - Assigning a DIFFERENT profile to an already-known entity is a `conflict` and
 *   mutates nothing: what a foe owned cannot be revised after the fact.
 * - A malformed snapshot (unreal rung, fractional or zero quantity, bad item) is
 *   refused outright rather than clamped.
 *
 * Resolving a DEAD entity's ownership is allowed and useful — it lets a previously
 * unknown carrier's death gain units later — but it never grants inventory or
 * ledger credit; that is a separate trusted recovery step.
 */
export function assignMechanicalProfile(
  registry: EntityRegistryState,
  entityId: EntityId,
  assignment: ProfileAssignment,
): AssignProfileResult {
  const entity = findEntity(registry, entityId);
  if (!entity) return { outcome: "not-found", registry };

  const built = buildAssignment(entityId, assignment);
  if (!built.ok) return { outcome: built.outcome, registry };

  if (!isValidMechanicalProfileSnapshotShape(built.snapshot)) {
    return { outcome: "invalid-profile", registry };
  }
  // Validated, so `copySnapshot` can only see well-formed data: take ownership of
  // it before anything is persisted or compared (see `copySnapshot`).
  const snapshot = copySnapshot(built.snapshot);

  const current = entity.mechanicalProfile;
  if (current.status === "known") {
    // Compared by CANONICAL form, not `JSON.stringify`: a mechanically identical
    // re-assignment whose object keys happen to be built in a different order (a
    // second call site, a rehydrated snapshot) must replay as a `duplicate` no-op,
    // not be misread as a `conflict` that refuses the assignment outright.
    const same =
      current.profileId === built.profileId &&
      current.profileVersion === built.profileVersion &&
      canonicalize(current.snapshot) === canonicalize(snapshot) &&
      canonicalize(current.provenance) === canonicalize(built.provenance);
    return same
      ? { outcome: "duplicate", registry, entity, provenance: current.provenance }
      : { outcome: "conflict", registry, entity };
  }

  const next: AuthoritativeEntityRecord = {
    ...entity,
    mechanicalProfile: {
      status: "known",
      profileId: built.profileId,
      profileVersion: built.profileVersion,
      profileRevision: current.profileRevision + 1,
      snapshot,
      provenance: built.provenance,
    },
  };
  return {
    outcome: "assigned",
    registry: {
      ...registry,
      entities: registry.entities.map((e) => (e.entityId === entityId ? next : e)),
    },
    entity: next,
    provenance: built.provenance,
  };
}

/** The entity's ownership as established, or `unknown` while it has no profile. */
export function characteristicOwnershipFor(
  entity: AuthoritativeEntityRecord,
): CharacteristicOwnership {
  return entity.mechanicalProfile.status === "known"
    ? entity.mechanicalProfile.snapshot.characteristicOwnership
    : { status: "unknown", reason: "unverified-source" };
}

/** Every curated profile's catalogue id — the authoring surface for tests/tools. */
export function curatedProfileCatalogIds(): string[] {
  return CURATED_ENTITY_PROFILES.map((profile) => profile.catalogId);
}
