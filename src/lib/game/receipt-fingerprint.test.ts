import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import type { AppliedApplicationReceipt, ReceiptFingerprint } from "@/lib/types/entities";

import {
  NonCanonicalizableValueError,
  canonicalMultiset,
  canonicalize,
  fingerprintPlan,
  fingerprintSchemaForKind,
  fingerprintsEqual,
  isSupportedFingerprintSchema,
  matchReceipt,
} from "./receipt-fingerprint";

/** An independent SHA-256 oracle (Node's own), so the digest is not self-proved. */
function referenceDigest(canonical: string): string {
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

describe("canonicalize — RFC 8785 form", () => {
  it("sorts object keys by UTF-16 code unit, not by locale", () => {
    // Locale-aware collation would order these "1, a, ä, B, Z"; code-unit
    // ordering — what RFC 8785 mandates — puts uppercase before lowercase.
    const canonical = canonicalize({ ä: 5, a: 4, Z: 3, B: 2, "1": 1 });
    expect(canonical).toBe('{"1":1,"B":2,"Z":3,"a":4,"ä":5}');
  });

  it("emits no whitespace and sorts nested objects too", () => {
    expect(canonicalize({ b: { d: 1, c: [3, { f: 1, e: 2 }] }, a: true })).toBe(
      '{"a":true,"b":{"c":[3,{"e":2,"f":1}],"d":1}}',
    );
  });

  it("is insensitive to input property order at every depth", () => {
    const first = canonicalize({
      outcome: "victory",
      entity: { entityId: "canon:rosago", mechanicalProfileRevision: 1 },
      injuries: [{ id: "i1", severity: "major" }],
    });
    const second = canonicalize({
      injuries: [{ severity: "major", id: "i1" }],
      entity: { mechanicalProfileRevision: 1, entityId: "canon:rosago" },
      outcome: "victory",
    });
    expect(first).toBe(second);
  });

  it("preserves array order (a sequence is mechanics, not presentation)", () => {
    expect(canonicalize([1, 2, 3])).not.toBe(canonicalize([3, 2, 1]));
  });

  it("formats numbers as ECMAScript does", () => {
    expect(canonicalize({ n: 1 })).toBe('{"n":1}');
    expect(canonicalize({ n: 1.0 })).toBe('{"n":1}');
    expect(canonicalize({ n: 0.1 })).toBe('{"n":0.1}');
    expect(canonicalize({ n: -5 })).toBe('{"n":-5}');
    expect(canonicalize({ n: 1e21 })).toBe('{"n":1e+21}');
    expect(canonicalize({ n: 1e-7 })).toBe('{"n":1e-7}');
    expect(canonicalize({ n: Number.MAX_SAFE_INTEGER })).toBe('{"n":9007199254740991}');
  });

  it("normalizes -0 to 0 so the two can never disagree", () => {
    expect(canonicalize({ n: -0 })).toBe('{"n":0}');
    expect(canonicalize(-0)).toBe(canonicalize(0));
  });

  it("retains strings exactly, escaping only what JSON must", () => {
    expect(canonicalize("ö 😂 דּ")).toBe('"ö 😂 דּ"');
    expect(canonicalize("tab\there")).toBe('"tab\\there"');
    expect(canonicalize('quote"and\\slash')).toBe('"quote\\"and\\\\slash"');
    expect(canonicalize("\u0000")).toBe('"\\u0000"');
  });

  it("handles the primitive and empty container edge cases", () => {
    expect(canonicalize(null)).toBe("null");
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize([])).toBe("[]");
    expect(canonicalize({})).toBe("{}");
  });
});

describe("canonicalize — fail closed", () => {
  it("refuses undefined anywhere, rather than dropping the field", () => {
    expect(() => canonicalize(undefined)).toThrow(NonCanonicalizableValueError);
    expect(() => canonicalize({ a: undefined })).toThrow(/\$\.a/);
    expect(() => canonicalize([1, undefined])).toThrow(/\$\[1\]/);
  });

  it("refuses non-finite numbers", () => {
    expect(() => canonicalize({ n: Number.NaN })).toThrow(/non-finite/);
    expect(() => canonicalize({ n: Number.POSITIVE_INFINITY })).toThrow(/non-finite/);
    expect(() => canonicalize({ n: Number.NEGATIVE_INFINITY })).toThrow(/non-finite/);
  });

  it("refuses values with no unambiguous JSON form", () => {
    expect(() => canonicalize({ f: () => 1 })).toThrow(/function/);
    expect(() => canonicalize({ s: Symbol("s") })).toThrow(/symbol/);
    expect(() => canonicalize({ b: BigInt(1) })).toThrow(/bigint/);
    expect(() => canonicalize({ d: new Date(0) })).toThrow(/plain objects/);
    expect(() => canonicalize({ m: new Map() })).toThrow(/plain objects/);
    expect(() => canonicalize({ s: new Set() })).toThrow(/plain objects/);
    class Plan {
      value = 1;
    }
    expect(() => canonicalize(new Plan())).toThrow(/plain objects/);
  });

  it("accepts a null-prototype object (a plain bag of fields)", () => {
    const bare = Object.assign(Object.create(null), { b: 2, a: 1 });
    expect(canonicalize(bare)).toBe('{"a":1,"b":2}');
  });

  it("refuses a sparse array's holes rather than emitting invalid JSON", () => {
    const sparse: unknown[] = [];
    sparse[2] = 1;
    expect(() => canonicalize(sparse)).toThrow(/\$\[0\]/);
    expect(() => canonicalize({ injuries: sparse })).toThrow(
      NonCanonicalizableValueError,
    );
  });

  it("names the exact path that failed", () => {
    expect(() =>
      canonicalize({ loot: [{ characteristic: { unitId: undefined } }] }),
    ).toThrow(/\$\.loot\[0\]\.characteristic\.unitId/);
  });
});

describe("canonicalMultiset", () => {
  it("orders set-like arrays canonically so collection order cannot matter", () => {
    const a = canonicalMultiset([{ id: "b" }, { id: "a" }, { id: "c" }]);
    const b = canonicalMultiset([{ id: "c" }, { id: "b" }, { id: "a" }]);
    expect(a).toEqual(b);
    expect(a.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps duplicates — multiplicity is mechanics", () => {
    const ordered = canonicalMultiset([{ id: "a" }, { id: "b" }, { id: "a" }]);
    expect(ordered).toHaveLength(3);
    expect(ordered.map((e) => e.id)).toEqual(["a", "a", "b"]);
  });

  it("sorts by canonical form, so key order inside elements is irrelevant", () => {
    const first = canonicalMultiset([
      { severity: "minor", id: "i2" },
      { id: "i1", severity: "major" },
    ]);
    const second = canonicalMultiset([
      { id: "i1", severity: "major" },
      { id: "i2", severity: "minor" },
    ]);
    expect(canonicalize(first)).toBe(canonicalize(second));
  });

  it("propagates a refusal from an element", () => {
    expect(() => canonicalMultiset([{ id: undefined }])).toThrow(
      NonCanonicalizableValueError,
    );
  });

  it("returns an empty array unchanged", () => {
    expect(canonicalMultiset([])).toEqual([]);
  });
});

describe("fingerprintPlan", () => {
  const plan = {
    kind: "combat",
    applicationId: "combat:enc-7",
    encounterId: "enc-7",
    outcome: "victory",
    enemyFate: "dead",
    sanityImpact: -12,
    injuries: [{ id: "i1", severity: "major", recoveryTurns: 4 }],
    custody: { holder: "player" },
    hunt: null,
  };

  it("hashes the canonical form with SHA-256, matching an independent digest", () => {
    const fingerprint = fingerprintPlan("combat-mechanics/v1", plan);
    expect(fingerprint.schema).toBe("combat-mechanics/v1");
    expect(fingerprint.algorithm).toBe("sha256-rfc8785");
    expect(fingerprint.digest).toBe(referenceDigest(canonicalize(plan)));
    expect(fingerprint.digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable across property reordering (presentation is not mechanics)", () => {
    const reordered = {
      hunt: null,
      custody: { holder: "player" },
      injuries: [{ recoveryTurns: 4, severity: "major", id: "i1" }],
      sanityImpact: -12,
      enemyFate: "dead",
      outcome: "victory",
      encounterId: "enc-7",
      applicationId: "combat:enc-7",
      kind: "combat",
    };
    expect(fingerprintPlan("combat-mechanics/v1", reordered).digest).toBe(
      fingerprintPlan("combat-mechanics/v1", plan).digest,
    );
  });

  it("changes when any mechanical field changes", () => {
    const base = fingerprintPlan("combat-mechanics/v1", plan).digest;
    const changes: Record<string, unknown>[] = [
      { ...plan, enemyFate: "alive" },
      { ...plan, outcome: "defeat" },
      { ...plan, sanityImpact: -11 },
      { ...plan, custody: { holder: "none", reason: "denied-control" } },
      { ...plan, injuries: [] },
      { ...plan, injuries: [{ id: "i1", severity: "grievous", recoveryTurns: 4 }] },
      { ...plan, hunt: { huntId: "h1", target: "x", quarryEntityId: "hunt:h1:quarry" } },
    ];
    for (const changed of changes) {
      expect(fingerprintPlan("combat-mechanics/v1", changed).digest).not.toBe(base);
    }
  });

  it("distinguishes a raw drop from a fused mystical drop of the same unit", () => {
    const raw = {
      name: "Marionettist Beyonder Characteristic",
      category: "main-ingredient",
      consumableResolved: true,
      characteristic: {
        unitId: "unit:death:combat:enc-7:encounter:enc-7:enemy:p1:s5:0",
        pathwayId: 1,
        sequenceLevel: 5,
        form: "raw",
        origin: {
          kind: "death",
          deathEventId: "death:combat:enc-7:encounter:enc-7:enemy",
        },
      },
    };
    const fused = {
      ...raw,
      characteristic: { ...raw.characteristic, form: "fused-mystical" },
    };
    expect(
      fingerprintPlan("combat-mechanics/v1", { lootAvailable: [raw] }).digest,
    ).not.toBe(fingerprintPlan("combat-mechanics/v1", { lootAvailable: [fused] }).digest);
  });

  it("separates identical mechanics recorded under different schemas", () => {
    expect(fingerprintPlan("turn-mechanics/v1", plan).schema).toBe("turn-mechanics/v1");
    expect(fingerprintPlan("turn-mechanics/v1", plan).digest).toBe(
      fingerprintPlan("combat-mechanics/v1", plan).digest,
    );
    // The digest is of the plan alone; the schema is compared alongside it.
    expect(
      fingerprintsEqual(
        fingerprintPlan("turn-mechanics/v1", plan),
        fingerprintPlan("combat-mechanics/v1", plan),
      ),
    ).toBe(false);
  });

  it("refuses an unsupported schema instead of guessing", () => {
    expect(() =>
      fingerprintPlan("combat-mechanics/v2" as unknown as "combat-mechanics/v1", plan),
    ).toThrow(/unsupported schema/);
  });

  it("refuses a plan carrying an unrepresentable value", () => {
    expect(() =>
      fingerprintPlan("combat-mechanics/v1", { ...plan, resolvedAt: undefined }),
    ).toThrow(NonCanonicalizableValueError);
  });
});

describe("isSupportedFingerprintSchema", () => {
  it("accepts every schema this build understands", () => {
    for (const schema of [
      "combat-mechanics/v1",
      "turn-mechanics/v1",
      "profile-registration/v1",
      "inventory-transfer/v1",
      "legacy-reconciliation/v1",
    ]) {
      expect(isSupportedFingerprintSchema(schema)).toBe(true);
    }
  });

  it("rejects an unknown or non-string schema", () => {
    expect(isSupportedFingerprintSchema("combat-mechanics/v2")).toBe(false);
    expect(isSupportedFingerprintSchema(undefined)).toBe(false);
    expect(isSupportedFingerprintSchema(1)).toBe(false);
  });
});

describe("matchReceipt", () => {
  const fingerprint = fingerprintPlan("combat-mechanics/v1", { a: 1 });
  const other = fingerprintPlan("combat-mechanics/v1", { a: 2 });
  const receipt: AppliedApplicationReceipt = {
    applicationId: "combat:enc-7",
    kind: "combat",
    fingerprint,
    eventIds: ["event:combat:enc-7:combat-resolved:0"],
    appliedAtTurn: 12,
  };

  it("reports an unseen application as new", () => {
    expect(
      matchReceipt([], { applicationId: "combat:enc-7", kind: "combat", fingerprint }),
    ).toBe("new");
    expect(
      matchReceipt([receipt], {
        applicationId: "combat:enc-9",
        kind: "combat",
        fingerprint,
      }),
    ).toBe("new");
  });

  it("reports an identical re-application as a duplicate no-op", () => {
    expect(
      matchReceipt([receipt], {
        applicationId: "combat:enc-7",
        kind: "combat",
        fingerprint,
      }),
    ).toBe("duplicate");
  });

  it("reports a reused id with different mechanics as a conflict", () => {
    expect(
      matchReceipt([receipt], {
        applicationId: "combat:enc-7",
        kind: "combat",
        fingerprint: other,
      }),
    ).toBe("conflict");
  });

  it("reports a reused id under a different kind as a conflict", () => {
    expect(
      matchReceipt([receipt], {
        applicationId: "combat:enc-7",
        kind: "turn",
        // Correctly paired for its own kind — the CONFLICT is the reused id.
        fingerprint: fingerprintPlan("turn-mechanics/v1", { a: 1 }),
      }),
    ).toBe("conflict");
  });

  it("refuses a candidate whose kind and fingerprint schema disagree", () => {
    // A combat plan hashed as a turn plan: an equal digest would prove nothing, so
    // it can never be read as a duplicate — not even against its own receipt.
    for (const kind of [
      "combat",
      "turn",
      "profile-registration",
      "inventory-transfer",
    ] as const) {
      expect(fingerprintSchemaForKind(kind)).toBe(
        `${kind === "combat" ? "combat-mechanics" : kind === "turn" ? "turn-mechanics" : kind}/v1`,
      );
    }
    expect(
      matchReceipt([receipt], {
        applicationId: "combat:enc-7",
        kind: "turn",
        fingerprint,
      }),
    ).toBe("conflict");
    expect(
      matchReceipt([], {
        applicationId: "combat:enc-7",
        kind: "combat",
        fingerprint: fingerprintPlan("legacy-reconciliation/v1", { a: 1 }),
      }),
    ).toBe("conflict");
  });

  it("reports a stored receipt written under an unknown future schema as a conflict", () => {
    const futureReceipt: AppliedApplicationReceipt = {
      ...receipt,
      fingerprint: {
        ...fingerprint,
        schema: "combat-mechanics/v9" as ReceiptFingerprint["schema"],
      },
    };
    expect(
      matchReceipt([futureReceipt], {
        applicationId: "combat:enc-7",
        kind: "combat",
        fingerprint,
      }),
    ).toBe("conflict");
  });
});

describe("fingerprintsEqual", () => {
  it("compares schema, algorithm, and digest together", () => {
    const a = fingerprintPlan("combat-mechanics/v1", { a: 1 });
    expect(fingerprintsEqual(a, { ...a })).toBe(true);
    expect(fingerprintsEqual(a, { ...a, digest: "0".repeat(64) })).toBe(false);
    expect(fingerprintsEqual(a, { ...a, schema: "turn-mechanics/v1" })).toBe(false);
    expect(
      fingerprintsEqual(a, {
        ...a,
        algorithm: "sha256" as ReceiptFingerprint["algorithm"],
      }),
    ).toBe(false);
  });
});
