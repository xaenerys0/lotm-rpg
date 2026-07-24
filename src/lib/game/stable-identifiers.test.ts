import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  InvalidIdentifierError,
  UUID_URL_NAMESPACE,
  canonEntityId,
  characteristicUnitId,
  combatApplicationId,
  deathEventId,
  deterministicSeed,
  domainEventId,
  encounterEnemyEntityId,
  huntQuarryEntityId,
  journalEntryId,
  journalEntryName,
  legacyCharacteristicUnitId,
  legacyEntityId,
  normalizeIdentitySurface,
  playerEntityId,
  profileApplicationId,
  storyEntityId,
  turnApplicationId,
  uuidV5,
} from "./stable-identifiers";

/**
 * An INDEPENDENT UUIDv5 oracle built on Node's own SHA-1, so the engine's
 * `@noble/hashes` implementation is proved against something other than itself.
 */
function referenceUuidV5(namespace: string, name: string): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const digest = createHash("sha1")
    .update(Buffer.concat([nsBytes, Buffer.from(name, "utf8")]))
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

const DNS_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("uuidV5", () => {
  it("matches the published RFC 4122 name-based vector", () => {
    // The canonical documented example (Python's uuid5(NAMESPACE_DNS, "python.org")).
    expect(uuidV5(DNS_NAMESPACE, "python.org")).toBe(
      "886313e1-3b8a-5372-9b90-0c9aee199e5d",
    );
  });

  it("agrees with an independent SHA-1 implementation across namespaces and names", () => {
    const cases: [string, string][] = [
      [DNS_NAMESPACE, "python.org"],
      [UUID_URL_NAMESPACE, "https://example.com/"],
      [UUID_URL_NAMESPACE, ""],
      [UUID_URL_NAMESPACE, "unicode: ö 😂 דּ"],
      [UUID_URL_NAMESPACE, "a".repeat(500)],
    ];
    for (const [namespace, name] of cases) {
      expect(uuidV5(namespace, name)).toBe(referenceUuidV5(namespace, name));
    }
  });

  it("stamps version 5 and the RFC 4122 variant", () => {
    const uuid = uuidV5(UUID_URL_NAMESPACE, "version-check");
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("is stable across calls and distinct per name", () => {
    expect(uuidV5(UUID_URL_NAMESPACE, "same")).toBe(uuidV5(UUID_URL_NAMESPACE, "same"));
    expect(uuidV5(UUID_URL_NAMESPACE, "one")).not.toBe(uuidV5(UUID_URL_NAMESPACE, "two"));
    // The namespace is part of the identity, not decoration.
    expect(uuidV5(DNS_NAMESPACE, "same")).not.toBe(uuidV5(UUID_URL_NAMESPACE, "same"));
  });

  it("accepts an uppercase namespace and refuses a malformed one", () => {
    expect(uuidV5(UUID_URL_NAMESPACE.toUpperCase(), "x")).toBe(
      uuidV5(UUID_URL_NAMESPACE, "x"),
    );
    expect(() => uuidV5("not-a-uuid", "x")).toThrow(InvalidIdentifierError);
    expect(() => uuidV5("", "x")).toThrow(InvalidIdentifierError);
  });
});

describe("journal entry identity", () => {
  it("derives the row id from the projection kind and root event id", () => {
    const name = journalEntryName("combat", "event:combat:enc-1:combat-resolved:0");
    expect(name).toBe(
      "https://github.com/xaenerys0/lotm-rpg/journal-entry/v1/combat/" +
        "event:combat:enc-1:combat-resolved:0",
    );
    expect(journalEntryId("combat", "event:combat:enc-1:combat-resolved:0")).toBe(
      uuidV5(UUID_URL_NAMESPACE, name),
    );
  });

  it("is a UUID the existing uuid primary key accepts, and is replay-stable", () => {
    const first = journalEntryId("entity-death", "event:turn:s1:4:0:entity-died:0");
    const second = journalEntryId("entity-death", "event:turn:s1:4:0:entity-died:0");
    expect(first).toBe(second);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("separates projections of the same root event", () => {
    expect(journalEntryId("combat", "event:x")).not.toBe(
      journalEntryId("chronicle-end", "event:x"),
    );
  });

  it("refuses a blank projection kind or root event id", () => {
    expect(() => journalEntryName("combat", "")).toThrow(InvalidIdentifierError);
    expect(() => journalEntryName("" as unknown as "combat", "event:x")).toThrow(
      InvalidIdentifierError,
    );
  });
});

describe("normalizeIdentitySurface", () => {
  it("trims, collapses whitespace, and lowercases", () => {
    expect(normalizeIdentitySurface("  Sirius   ARAPIS \n")).toBe("sirius arapis");
  });

  it("leaves an already-normal surface untouched", () => {
    expect(normalizeIdentitySurface("devil dog")).toBe("devil dog");
  });
});

describe("deterministicSeed", () => {
  it("is stable for the same ordered parts and 16 hex chars long", () => {
    const seed = deterministicSeed(["session-seed", "canon:rosago", "recipe/v1"]);
    expect(seed).toMatch(/^[0-9a-f]{16}$/);
    expect(deterministicSeed(["session-seed", "canon:rosago", "recipe/v1"])).toBe(seed);
  });

  it("distinguishes different parts, order, and split points", () => {
    expect(deterministicSeed(["a", "b"])).not.toBe(deterministicSeed(["b", "a"]));
    // Length-prefixing means a different split can never collide.
    expect(deterministicSeed(["ab", "c"])).not.toBe(deterministicSeed(["a", "bc"]));
    expect(deterministicSeed([])).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("entity ids", () => {
  it("uses the existing character id for the player", () => {
    expect(playerEntityId("char-1")).toBe("char-1");
  });

  it("derives one identity per canon reference, encounter, hunt, and introduction", () => {
    expect(canonEntityId("sirius-arapis")).toBe("canon:sirius-arapis");
    expect(encounterEnemyEntityId("enc-7")).toBe("encounter:enc-7:enemy");
    expect(huntQuarryEntityId("hunt-3")).toBe("hunt:hunt-3:quarry");
    expect(storyEntityId("sess-1", 12, 0)).toBe("entity:sess-1:turn:12:intro:0");
  });

  it("keeps same-named legacy actors separate and surface-insensitive to spacing/case", () => {
    const first = legacyEntityId("sess-1", "The Devil Dog", 0);
    const second = legacyEntityId("sess-1", "the   devil dog", 0);
    const third = legacyEntityId("sess-1", "The Devil Dog", 1);
    expect(first).toBe(second);
    expect(first).not.toBe(third);
    expect(first).toMatch(/^legacy:sess-1:[0-9a-f]{16}:0$/);
  });

  it("keys legacy ids by session, so two saves never share an actor record", () => {
    expect(legacyEntityId("sess-1", "Rosago", 0)).not.toBe(
      legacyEntityId("sess-2", "Rosago", 0),
    );
  });

  it("refuses a surface that normalizes to nothing", () => {
    expect(() => legacyEntityId("sess-1", "   ", 0)).toThrow(InvalidIdentifierError);
  });
});

describe("application, death, and unit ids", () => {
  it("derives one application per encounter, turn intent, and profile revision", () => {
    expect(combatApplicationId("enc-7")).toBe("combat:enc-7");
    expect(turnApplicationId("sess-1", 4, 2)).toBe("turn:sess-1:4:2");
    expect(profileApplicationId("canon:rosago", "profile-rosago", 1)).toBe(
      "profile:canon:rosago:profile-rosago:1",
    );
  });

  it("accepts the prefixed profile ids the generator/hunt/script kinds mint", () => {
    // `assignMechanicalProfile` builds these — a colon-refusing segment check
    // would have thrown for every non-curated provenance.
    for (const profileId of [
      "beyonder-encounter/v1:0123456789abcdef",
      "hunt:hunt-3",
      "script:script-1",
    ]) {
      expect(profileApplicationId("encounter:enc-1:enemy", profileId, 1)).toBe(
        `profile:encounter:enc-1:enemy:${profileId}:1`,
      );
    }
    expect(() => profileApplicationId("encounter:enc-1:enemy", "  ", 1)).toThrow(
      InvalidIdentifierError,
    );
  });

  it("derives one death per application and entity", () => {
    const id = deathEventId("combat:enc-7", "encounter:enc-7:enemy");
    expect(id).toBe("death:combat:enc-7:encounter:enc-7:enemy");
    // Re-resolving the same encounter cannot mint a second death.
    expect(deathEventId("combat:enc-7", "encounter:enc-7:enemy")).toBe(id);
  });

  it("gives every precipitated unit of one death a distinct stable id", () => {
    const death = deathEventId("combat:enc-7", "encounter:enc-7:enemy");
    const first = characteristicUnitId(death, 4, 5, 0);
    const second = characteristicUnitId(death, 4, 5, 1);
    expect(first).toBe(`unit:${death}:p4:s5:0`);
    expect(second).not.toBe(first);
    // Different pathway/rung from the same death are different units too.
    expect(characteristicUnitId(death, 9, 5, 0)).not.toBe(first);
    expect(characteristicUnitId(death, 4, 6, 0)).not.toBe(first);
  });

  it("derives legacy characteristic unit ids per canonical key and occurrence", () => {
    expect(legacyCharacteristicUnitId("sess-1", "p4-s5", 0)).toBe(
      "legacy-characteristic:sess-1:p4-s5:0",
    );
    expect(legacyCharacteristicUnitId("sess-1", "p4-s5", 1)).not.toBe(
      legacyCharacteristicUnitId("sess-1", "p4-s5", 0),
    );
  });

  it("derives event ids from the application, kind, and emission order", () => {
    expect(domainEventId("combat:enc-7", "combat-resolved", 0)).toBe(
      "event:combat:enc-7:combat-resolved:0",
    );
    expect(domainEventId("combat:enc-7", "entity-died", 1)).not.toBe(
      domainEventId("combat:enc-7", "entity-died", 2),
    );
  });
});

describe("identifier validation (fail closed)", () => {
  it("refuses blank structural components", () => {
    expect(() => playerEntityId("")).toThrow(InvalidIdentifierError);
    expect(() => canonEntityId("   ")).toThrow(InvalidIdentifierError);
    expect(() => combatApplicationId("")).toThrow(InvalidIdentifierError);
  });

  it("refuses a component that would break the colon grammar", () => {
    expect(() => encounterEnemyEntityId("enc:7")).toThrow(InvalidIdentifierError);
    expect(() => huntQuarryEntityId("a:b")).toThrow(InvalidIdentifierError);
    expect(() => legacyCharacteristicUnitId("sess-1", "p4:s5", 0)).toThrow(
      InvalidIdentifierError,
    );
  });

  it("refuses non-integer, negative, or unsafe ordinals", () => {
    expect(() => storyEntityId("sess-1", 1.5, 0)).toThrow(InvalidIdentifierError);
    expect(() => storyEntityId("sess-1", -1, 0)).toThrow(InvalidIdentifierError);
    expect(() => turnApplicationId("sess-1", 0, Number.NaN)).toThrow(
      InvalidIdentifierError,
    );
    expect(() =>
      characteristicUnitId("death:x", 4, 5, Number.MAX_SAFE_INTEGER + 2),
    ).toThrow(InvalidIdentifierError);
  });

  it("reports which component was invalid", () => {
    expect(() => storyEntityId("sess-1", 0, -1)).toThrow(/introIndex/);
    expect(() => canonEntityId("")).toThrow(/canonRef/);
  });
});
