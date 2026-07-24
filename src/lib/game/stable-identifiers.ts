import { sha1 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

import type { CharacteristicUnitId } from "@/lib/types/rules";
import type { EntityId, JournalProjectionKind } from "@/lib/types/entities";

// ---------------------------------------------------------------------------
// Stable, deterministic identifiers (issue #227).
//
// Every identity the death/precipitation system relies on is DERIVED, never
// randomly minted: the same encounter, hunt, turn, or death always names the same
// entity, application, unit, and journal row. That is what makes the whole chain
// replay-safe — a re-resolved fight cannot invent a second death, a retried
// journal flush cannot duplicate a row, and a crash mid-apply resolves to the
// same ids on reload.
//
// Grammar: colon-delimited segments (`canon:<ref>`, `encounter:<id>:enemy`, …).
// Structural segments therefore may not contain a colon, and no segment may be
// blank — an ambiguous id is refused (`InvalidIdentifierError`) rather than
// silently producing a colliding one. Free-form surfaces (display names) are
// never interpolated raw; they are normalized and DIGESTED first.
//
// Pure + deterministic (no randomness, no clock). Design doc:
// `docs/entity-death-design.md`.
// ---------------------------------------------------------------------------

/** Thrown when an id component is blank or would break the id grammar. */
export class InvalidIdentifierError extends Error {
  constructor(label: string, reason: string) {
    super(`Invalid identifier component "${label}": ${reason}`);
    this.name = "InvalidIdentifierError";
  }
}

/** Validate one structural id segment: non-blank and colon-free. */
function segment(value: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidIdentifierError(label, "must be a non-blank string");
  }
  if (value.includes(":")) {
    throw new InvalidIdentifierError(label, 'must not contain ":"');
  }
  return value;
}

/**
 * Validate an id that is itself already composite (an entity id, an application
 * id, an event id) and so legitimately contains colons. Only blankness is
 * refused. Safe against cross-form collisions because every composite value comes
 * from a builder here whose own fixed prefix (`canon:`, `combat:`, `event:`, …)
 * disambiguates the concatenation; these ids are opaque keys and are never parsed.
 */
function composite(value: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidIdentifierError(label, "must be a non-blank string");
  }
  return value;
}

/** Validate a whole-number id segment (turn numbers, ordinals, sequences). */
function ordinal(value: number, label: string): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new InvalidIdentifierError(label, "must be a non-negative integer");
  }
  return String(value);
}

/**
 * Fold a free-form surface (a display name from a legacy save, a canon key) into
 * a short, id-safe digest. Length-prefixed before hashing so no two different
 * surfaces can be confused, and truncated to 16 hex chars — 64 bits of collision
 * space, which is ample for one save's actor list and keeps ids readable.
 */
function surfaceDigest(surface: string): string {
  const normalized = normalizeIdentitySurface(surface);
  if (normalized.length === 0) {
    throw new InvalidIdentifierError("surface", "must not be blank once normalized");
  }
  return bytesToHex(sha256(utf8ToBytes(`${normalized.length}:${normalized}`))).slice(
    0,
    16,
  );
}

/**
 * A short deterministic digest of an ordered list of parts — the seed material an
 * engine-owned generator records so its output is reproducible and auditable. Each
 * part is length-prefixed before hashing, so `["ab","c"]` and `["a","bc"]` can
 * never collide. Truncated to 16 hex chars, like `surfaceDigest`.
 */
export function deterministicSeed(parts: readonly string[]): string {
  const material = parts.map((part) => `${part.length}:${part}`).join("|");
  return bytesToHex(sha256(utf8ToBytes(material))).slice(0, 16);
}

/**
 * The comparison form of a name/alias: trimmed, whitespace-collapsed, lowercased.
 * Used for legacy-identity digests and for name RESOLUTION (which may answer
 * `ambiguous` — a name is never accepted by a mechanical API).
 */
export function normalizeIdentitySurface(surface: string): string {
  return surface.trim().replace(/\s+/g, " ").toLowerCase();
}

// --- entity ids -------------------------------------------------------------

/**
 * The player's entity id is the existing `GameState.characterId` — the one
 * identity the game already had, so no migration invents a second one.
 */
export function playerEntityId(characterId: string): EntityId {
  return segment(characterId, "characterId");
}

/** A canonical figure: one identity per curated canon reference, per save. */
export function canonEntityId(canonRef: string): EntityId {
  return `canon:${segment(canonRef, "canonRef")}`;
}

/** The individual opponent instance of one encounter (never the bestiary template). */
export function encounterEnemyEntityId(encounterId: string): EntityId {
  return `encounter:${segment(encounterId, "encounterId")}:enemy`;
}

/** A hunt's quarry — the entity whose death the hunt is waiting on. */
export function huntQuarryEntityId(huntId: string): EntityId {
  return `hunt:${segment(huntId, "huntId")}:quarry`;
}

/** An actor the story introduced on a given turn (identity only; profile unknown). */
export function storyEntityId(
  sessionId: string,
  turnNumber: number,
  introIndex: number,
): EntityId {
  return (
    `entity:${segment(sessionId, "sessionId")}` +
    `:turn:${ordinal(turnNumber, "turnNumber")}` +
    `:intro:${ordinal(introIndex, "introIndex")}`
  );
}

/**
 * An opaque record for a name-keyed actor recovered from a legacy save. Derived
 * from the session, the normalized surface, and a stable occurrence index, so two
 * same-named legacy actors stay SEPARATE records (migration never merges them).
 */
export function legacyEntityId(
  sessionId: string,
  surface: string,
  occurrence: number,
): EntityId {
  return (
    `legacy:${segment(sessionId, "sessionId")}` +
    `:${surfaceDigest(surface)}` +
    `:${ordinal(occurrence, "occurrence")}`
  );
}

// --- application, death, and unit ids ---------------------------------------

/** One combat encounter resolves at most once. */
export function combatApplicationId(encounterId: string): string {
  return `combat:${segment(encounterId, "encounterId")}`;
}

/** One structured intent within one turn applies at most once. */
export function turnApplicationId(
  sessionId: string,
  turnNumber: number,
  intentIndex: number,
): string {
  return (
    `turn:${segment(sessionId, "sessionId")}` +
    `:${ordinal(turnNumber, "turnNumber")}` +
    `:${ordinal(intentIndex, "intentIndex")}`
  );
}

/**
 * One profile assignment per entity + revision. `profileId` is COMPOSITE, not a
 * structural segment: `assignMechanicalProfile` mints prefixed ids for three of
 * the four provenance kinds (`beyonder-encounter/v1:<seed>`, `hunt:<huntId>`,
 * `script:<scriptId>`), so refusing colons here would reject every non-curated
 * profile outright.
 */
export function profileApplicationId(
  entityId: EntityId,
  profileId: string,
  revision: number,
): string {
  return (
    `profile:${composite(entityId, "entityId")}` +
    `:${composite(profileId, "profileId")}` +
    `:${ordinal(revision, "revision")}`
  );
}

/** One death per (application, entity) — a re-run cannot create a second. */
export function deathEventId(applicationId: string, entityId: EntityId): string {
  return (
    `death:${composite(applicationId, "applicationId")}` +
    `:${composite(entityId, "entityId")}`
  );
}

/**
 * One precipitated characteristic unit. Ordinal-indexed within its death so a
 * carrier holding three of the same stack yields three distinct, stable ids —
 * and the same ids on every replay of that death.
 */
export function characteristicUnitId(
  deathId: string,
  pathwayId: number,
  sequenceLevel: number,
  unitOrdinal: number,
): CharacteristicUnitId {
  return (
    `unit:${composite(deathId, "deathEventId")}` +
    `:p${ordinal(pathwayId, "pathwayId")}` +
    `:s${ordinal(sequenceLevel, "sequenceLevel")}` +
    `:${ordinal(unitOrdinal, "unitOrdinal")}`
  );
}

/**
 * The unit id given to a characteristic ITEM recovered from a legacy save, whose
 * originating death was never recorded. Keyed by the canonical pathway/sequence
 * the item's name resolved to plus its inventory occurrence, so identical copies
 * get distinct stable ids.
 */
export function legacyCharacteristicUnitId(
  sessionId: string,
  canonicalKey: string,
  itemOrdinal: number,
): CharacteristicUnitId {
  return (
    `legacy-characteristic:${segment(sessionId, "sessionId")}` +
    `:${segment(canonicalKey, "canonicalKey")}` +
    `:${ordinal(itemOrdinal, "itemOrdinal")}`
  );
}

/** A domain event's id: stable within its application and emission order. */
export function domainEventId(
  applicationId: string,
  kind: string,
  eventOrdinal: number,
): string {
  return (
    `event:${composite(applicationId, "applicationId")}` +
    `:${segment(kind, "kind")}` +
    `:${ordinal(eventOrdinal, "eventOrdinal")}`
  );
}

// --- UUIDv5 (journal row identity) -----------------------------------------

/** RFC 4122 URL namespace — the namespace event-derived journal ids live under. */
export const UUID_URL_NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidToBytes(uuid: string): Uint8Array {
  if (!UUID_PATTERN.test(uuid)) {
    throw new InvalidIdentifierError("namespace", "must be a UUID");
  }
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function formatUuid(bytes: Uint8Array): string {
  const hex = bytesToHex(bytes.subarray(0, 16));
  return (
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}` +
    `-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  );
}

/**
 * RFC 4122 name-based UUID **version 5** (SHA-1). Synchronous and browser-safe
 * (`@noble/hashes`) — Web Crypto's digest is async, and the engine must stay pure.
 * Deterministic: the same namespace + name always yields the same UUID, which is
 * what lets a journal row be re-derived and UPSERTED instead of appended twice.
 */
export function uuidV5(namespace: string, name: string): string {
  const nsBytes = uuidToBytes(namespace);
  const nameBytes = utf8ToBytes(name);
  const input = new Uint8Array(nsBytes.length + nameBytes.length);
  input.set(nsBytes, 0);
  input.set(nameBytes, nsBytes.length);

  const hash = sha1(input);
  const uuid = hash.slice(0, 16);
  // Version 5 in the high nibble of octet 6; RFC 4122 variant in octet 8.
  uuid[6] = (uuid[6] & 0x0f) | 0x50;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;
  return formatUuid(uuid);
}

/** The stable name a journal projection hashes into its row id. */
export function journalEntryName(
  projectionKind: JournalProjectionKind,
  rootEventId: string,
): string {
  return (
    "https://github.com/xaenerys0/lotm-rpg/journal-entry/v1/" +
    `${segment(projectionKind, "projectionKind")}/${composite(rootEventId, "rootEventId")}`
  );
}

/**
 * The deterministic `JournalEntry.id` for an event-derived entry. The existing
 * `journal_entries.id` column is already a UUID primary key that remote sync
 * upserts on (`onConflict: "id"`), so deriving the id needs **no DB migration**:
 * re-deriving it after a crash writes the same row.
 */
export function journalEntryId(
  projectionKind: JournalProjectionKind,
  rootEventId: string,
): string {
  return uuidV5(UUID_URL_NAMESPACE, journalEntryName(projectionKind, rootEventId));
}
