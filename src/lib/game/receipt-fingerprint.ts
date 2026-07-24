import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

import type {
  AppliedApplicationReceipt,
  ApplicationKind,
  ReceiptFingerprint,
  ReceiptFingerprintSchema,
} from "@/lib/types/entities";

// ---------------------------------------------------------------------------
// Canonical mechanical fingerprints (issue #227).
//
// An application (a resolved fight, a turn's intents, a profile registration, an
// inventory transfer) must be applicable EXACTLY ONCE. The guard is a fingerprint
// of the normalized MECHANICAL plan: re-running the same application replays as a
// no-op, while a plan that differs mechanically under an already-used application
// id is a hard conflict that mutates nothing.
//
// For that to hold, the digest must be stable against everything meaningless and
// sensitive to everything meaningful:
//
// - **Stable**: object property order, presentation-only array order, and every
//   presentation field (prose, descriptions, display names, labels, wall-clock)
//   are excluded — the last by CONSTRUCTION, since plan builders never put them in.
//   Re-narrating a fight therefore replays equal.
// - **Sensitive**: a changed unit id, quantity, fate, custody, control verdict,
//   hunt link, policy, or profile revision changes the digest.
//
// Canonicalization is RFC 8785 (JSON Canonicalization Scheme): keys sorted by
// UTF-16 code unit, no whitespace, ECMAScript number formatting. Anything that
// cannot be canonicalized unambiguously — `undefined`, `NaN`, `Infinity`, a
// function, a symbol, a bigint, a Date/Map/Set/class instance — is REFUSED rather
// than coerced, so a malformed plan can never hash to a plausible-looking digest.
//
// Hashing is synchronous SHA-256 (`@noble/hashes`): Web Crypto's digest is async
// and the engine must stay pure. Pure + deterministic. Design doc:
// `docs/entity-death-design.md`.
// ---------------------------------------------------------------------------

/** A value that can appear in a canonicalizable mechanical plan. */
export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

/** Thrown when a plan contains a value RFC 8785 cannot canonicalize unambiguously. */
export class NonCanonicalizableValueError extends Error {
  constructor(path: string, reason: string) {
    super(`Cannot canonicalize value at ${path}: ${reason}`);
    this.name = "NonCanonicalizableValueError";
  }
}

const SUPPORTED_SCHEMAS: readonly ReceiptFingerprintSchema[] = [
  "combat-mechanics/v1",
  "turn-mechanics/v1",
  "profile-registration/v1",
  "inventory-transfer/v1",
  "legacy-reconciliation/v1",
];

/**
 * The one schema each application kind's plan is fingerprinted under. The pairing
 * is 1:1 by construction, so it is stated once here rather than left to each call
 * site: a receipt whose kind and schema disagree describes a plan nobody can
 * compare (a combat plan hashed as a turn plan would "match" a turn receipt), and
 * `matchReceipt` refuses it. `"legacy-reconciliation/v1"` has no kind on purpose —
 * it fingerprints a `LegacyCombatReconciliation`, which is not an application.
 */
const SCHEMA_BY_KIND: Readonly<Record<ApplicationKind, ReceiptFingerprintSchema>> = {
  combat: "combat-mechanics/v1",
  turn: "turn-mechanics/v1",
  "profile-registration": "profile-registration/v1",
  "inventory-transfer": "inventory-transfer/v1",
};

/** The fingerprint schema an application of `kind` must be hashed under. */
export function fingerprintSchemaForKind(
  kind: ApplicationKind,
): ReceiptFingerprintSchema {
  return SCHEMA_BY_KIND[kind];
}

/**
 * Whether a fingerprint schema is one this build understands. An unknown schema
 * (a save written by a future build) is REJECTED by the receipt logic rather than
 * reinterpreted under current rules.
 */
export function isSupportedFingerprintSchema(
  schema: unknown,
): schema is ReceiptFingerprintSchema {
  return (
    typeof schema === "string" &&
    (SUPPORTED_SCHEMAS as readonly string[]).includes(schema)
  );
}

/**
 * Whether an object is a plain field bag (an object literal or a null-prototype
 * one) rather than a class instance / Date / Map / Set, which have no unambiguous
 * JSON form. Callers have already excluded `null` and arrays.
 */
function isPlainObject(value: object): value is Record<string, unknown> {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Validate and normalize one node: rejects the unrepresentable, folds `-0` to `0`
 * (the two are indistinguishable in JSON but not in JS), and leaves strings
 * byte-for-byte alone.
 */
function normalize(value: unknown, path: string): CanonicalJsonValue {
  if (value === null) return null;

  const type = typeof value;
  if (type === "boolean" || type === "string") {
    return value as boolean | string;
  }
  if (type === "number") {
    const num = value as number;
    if (!Number.isFinite(num)) {
      throw new NonCanonicalizableValueError(path, `non-finite number (${String(num)})`);
    }
    // `-0` serializes as `0`; normalize so the two can never disagree upstream.
    return num === 0 ? 0 : num;
  }
  if (type === "undefined") {
    throw new NonCanonicalizableValueError(
      path,
      "undefined is not representable — use null explicitly",
    );
  }
  if (type === "function" || type === "symbol" || type === "bigint") {
    throw new NonCanonicalizableValueError(path, `${type} is not representable`);
  }

  if (Array.isArray(value)) {
    // Indexed rather than `.map`, which SKIPS holes: a sparse array's holes must
    // reach `normalize` as `undefined` and be refused, not serialize as `[,1]`.
    const elements: CanonicalJsonValue[] = [];
    for (let index = 0; index < value.length; index++) {
      elements.push(normalize(value[index], `${path}[${index}]`));
    }
    return elements;
  }
  // Everything left is a non-null, non-array object.
  const object = value as object;
  if (isPlainObject(object)) {
    const normalized: { [key: string]: CanonicalJsonValue } = {};
    for (const key of Object.keys(object)) {
      normalized[key] = normalize(object[key], `${path}.${key}`);
    }
    return normalized;
  }
  throw new NonCanonicalizableValueError(
    path,
    "only plain objects, arrays, strings, finite numbers, booleans, and null are representable",
  );
}

function serialize(value: CanonicalJsonValue): string {
  if (value === null || typeof value !== "object") {
    // `JSON.stringify` already gives RFC 8785 exactly what it asks for on
    // primitives: ECMAScript number-to-string, and RFC 8259 minimal string
    // escaping (so a non-ASCII character stays literal).
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(serialize).join(",")}]`;
  }
  // Sort by UTF-16 code unit — the default string comparison — per RFC 8785 §3.2.3.
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${serialize(value[key])}`).join(",")}}`;
}

/**
 * The RFC 8785 canonical JSON form of a mechanical plan. Property order in the
 * INPUT is irrelevant; two plans that differ only in key order canonicalize
 * identically.
 */
export function canonicalize(value: unknown, path = "$"): string {
  return serialize(normalize(value, path));
}

/**
 * Order a set-like array canonically: canonicalize each element, sort by that
 * canonical string, and PRESERVE duplicates. Injuries, lost-item refs, loot, and
 * additional trusted deaths are multisets — the order they happen to be collected
 * in is presentation, but how MANY of each there are is mechanics.
 *
 * Sequences whose order affects mechanics (a turn's transaction intents) must NOT
 * go through here — they keep their array order.
 */
export function canonicalMultiset<T>(values: readonly T[], path = "$"): T[] {
  const keyed = values.map((element, index) => ({
    element,
    key: canonicalize(element, `${path}[${index}]`),
  }));
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return keyed.map((entry) => entry.element);
}

/**
 * Fingerprint a normalized mechanical application plan. Rejects an unsupported
 * schema up front — hashing a plan under a schema this build cannot reason about
 * would produce a receipt no one can safely compare against.
 */
export function fingerprintPlan(
  schema: ReceiptFingerprintSchema,
  plan: unknown,
): ReceiptFingerprint {
  if (!isSupportedFingerprintSchema(schema)) {
    throw new NonCanonicalizableValueError("$.schema", `unsupported schema "${schema}"`);
  }
  const canonical = canonicalize(plan);
  return {
    schema,
    algorithm: "sha256-rfc8785",
    digest: bytesToHex(sha256(utf8ToBytes(canonical))),
  };
}

/** Whether two fingerprints are the same claim about the same mechanics. */
export function fingerprintsEqual(a: ReceiptFingerprint, b: ReceiptFingerprint): boolean {
  return a.schema === b.schema && a.algorithm === b.algorithm && a.digest === b.digest;
}

/**
 * What an incoming application means against the stored receipts:
 *
 * - `new` — never applied; proceed.
 * - `duplicate` — same id, kind, and fingerprint; a no-op replay (zero new
 *   mechanics, events, or timestamps).
 * - `conflict` — the id was used for DIFFERENT mechanics (or a kind/schema this
 *   build cannot compare). Reject before any mutation; never merge.
 *
 * A candidate whose own kind and schema disagree is a `conflict` too: the plan was
 * hashed under the wrong schema, so an equal digest would prove nothing.
 */
export type ReceiptMatch = "new" | "duplicate" | "conflict";

export function matchReceipt(
  receipts: readonly AppliedApplicationReceipt[],
  candidate: {
    applicationId: string;
    kind: ApplicationKind;
    fingerprint: ReceiptFingerprint;
  },
): ReceiptMatch {
  if (candidate.fingerprint.schema !== SCHEMA_BY_KIND[candidate.kind]) return "conflict";
  const existing = receipts.find((r) => r.applicationId === candidate.applicationId);
  if (!existing) return "new";
  if (!isSupportedFingerprintSchema(existing.fingerprint.schema)) return "conflict";
  if (existing.kind !== candidate.kind) return "conflict";
  return fingerprintsEqual(existing.fingerprint, candidate.fingerprint)
    ? "duplicate"
    : "conflict";
}
