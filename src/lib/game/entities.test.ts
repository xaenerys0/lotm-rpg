import { describe, expect, it } from "vitest";

import { createMemoryState } from "@/lib/ai";
import { CANON_PLAYABLE_CHARACTERS } from "@/lib/lore/canon-characters";
import { getCuratedEntityProfile } from "@/lib/lore/entity-profiles";
import type {
  AuthoritativeEntityRecord,
  CombatProfile,
  EntityRegistryState,
  MechanicalProfileSnapshot,
} from "@/lib/types/entities";

import {
  ENTITY_REGISTRY_SCHEMA_VERSION,
  PROFILE_GENERATOR_VERSION,
  assignMechanicalProfile,
  characteristicOwnershipFor,
  curatedProfileCatalogIds,
  emptyEntityRegistry,
  findEntity,
  isValidCharacteristicOwnershipShape,
  isValidCombatProfileShape,
  isValidEntityRegistryShape,
  isValidMechanicalProfileSnapshotShape,
  presentEntityNames,
  registerEntity,
  resolveEntityByName,
  resolveEntityRegistry,
  unknownProfileState,
} from "./entities";
import { createCanonCharacterSession } from "./canon-takeover";
import {
  createDefaultGameState,
  createSession,
  deserializeSession,
  serializeSession,
} from "./session";
import {
  canonEntityId,
  encounterEnemyEntityId,
  playerEntityId,
  storyEntityId,
} from "./stable-identifiers";
import type { GameSession } from "./types";

const BEYONDER_COMBAT: CombatProfile = {
  sequenceLevel: 6,
  isBeyonder: true,
  pathwayId: 21,
  knownAbilities: ["Superhuman scent-tracking"],
};

function withEntity(
  registry: EntityRegistryState,
  id: string,
  displayName: string,
  overrides: Partial<AuthoritativeEntityRecord> = {},
): EntityRegistryState {
  const result = registerEntity(registry, {
    entityId: id,
    displayName,
    kind: "person",
    introducedAtTurn: 0,
    source: { kind: "story", introductionId: `intro-${id}` },
  });
  if (result.outcome === "invalid") throw new Error(result.reason);
  return {
    ...result.registry,
    entities: result.registry.entities.map((entity) =>
      entity.entityId === id ? { ...entity, ...overrides } : entity,
    ),
  };
}

function makeSession(): GameSession {
  const gameState = createDefaultGameState(1, "char-1", "Klein", "A seer.");
  return createSession(gameState, "session-1");
}

describe("registry lifecycle", () => {
  it("starts empty and resolves an absent registry to a fresh one", () => {
    expect(emptyEntityRegistry()).toEqual({
      schemaVersion: ENTITY_REGISTRY_SCHEMA_VERSION,
      entities: [],
      presentEntityIds: [],
    });
    const session = { ...makeSession(), entityRegistry: undefined };
    expect(resolveEntityRegistry(session).entities).toEqual([]);
  });

  it("registers an actor as alive with an unknown profile", () => {
    const result = registerEntity(emptyEntityRegistry(), {
      entityId: canonEntityId("rosago"),
      displayName: "Rosago",
      aliases: ["the Marionettist assassin"],
      kind: "person",
      canonRef: "backlund-rosago",
      introducedAtTurn: 4,
      source: { kind: "canon", sourceId: "backlund-rosago" },
    });
    expect(result.outcome).toBe("registered");
    if (result.outcome === "invalid") throw new Error("unreachable");
    expect(result.entity.lifeState).toBe("alive");
    expect(result.entity.mechanicalProfile).toEqual(unknownProfileState());
    expect(result.entity.protections).toEqual([]);
    expect(isValidEntityRegistryShape(result.registry)).toBe(true);
  });

  it("is idempotent — re-registering an id cannot rewrite who someone is", () => {
    const first = registerEntity(emptyEntityRegistry(), {
      entityId: "encounter:enc-1:enemy",
      displayName: "a haunting evil spirit",
      kind: "evil-spirit",
      introducedAtTurn: 1,
      source: { kind: "bestiary-instance", sourceId: "tingen-evil-spirit" },
    });
    if (first.outcome === "invalid") throw new Error("unreachable");
    const second = registerEntity(first.registry, {
      entityId: "encounter:enc-1:enemy",
      displayName: "SOMEONE ELSE",
      kind: "person",
      introducedAtTurn: 9,
      source: { kind: "story", introductionId: "intro-x" },
    });
    expect(second.outcome).toBe("already-registered");
    expect(second.registry.entities).toHaveLength(1);
    expect(second.registry.entities[0].displayName).toBe("a haunting evil spirit");
  });

  it("refuses a malformed registration rather than storing it", () => {
    const result = registerEntity(emptyEntityRegistry(), {
      entityId: "   ",
      displayName: "Blank",
      kind: "person",
      introducedAtTurn: 0,
      source: { kind: "player" },
    });
    expect(result.outcome).toBe("invalid");
    expect(result.registry.entities).toHaveLength(0);
  });

  it("copies aliases and protections so the caller cannot mutate the record", () => {
    const aliases = ["Dwayne Dantès"];
    const protections = [
      {
        protectionId: "ward-1",
        effect: "blocks-death" as const,
        reason: "A patron's shielding.",
        appliedByEventId: "event:script:ward:0",
      },
    ];
    const result = registerEntity(emptyEntityRegistry(), {
      entityId: "canon:klein",
      displayName: "Klein Moretti",
      aliases,
      kind: "person",
      introducedAtTurn: 0,
      source: { kind: "canon", sourceId: "klein-moretti" },
      protections,
    });
    if (result.outcome === "invalid") throw new Error("unreachable");
    aliases.push("mutated");
    protections.pop();
    expect(result.entity.aliases).toEqual(["Dwayne Dantès"]);
    expect(result.entity.protections).toHaveLength(1);
  });

  it("finds by exact id only", () => {
    const registry = withEntity(emptyEntityRegistry(), "canon:rosago", "Rosago");
    expect(findEntity(registry, "canon:rosago")?.displayName).toBe("Rosago");
    expect(findEntity(registry, "Rosago")).toBeUndefined();
    expect(findEntity(registry, "canon:ROSAGO")).toBeUndefined();
  });
});

describe("name resolution (display + migration only)", () => {
  it("resolves a unique display name or alias, case- and space-insensitively", () => {
    const registry = withEntity(emptyEntityRegistry(), "canon:rosago", "Rosago", {
      aliases: ["the Marionettist assassin"],
    });
    expect(resolveEntityByName(registry, "  ROSAGO ")).toEqual({
      status: "resolved",
      entity: registry.entities[0],
    });
    expect(resolveEntityByName(registry, "the   marionettist assassin").status).toBe(
      "resolved",
    );
  });

  it("answers not-found for an unknown or blank surface", () => {
    const registry = withEntity(emptyEntityRegistry(), "canon:rosago", "Rosago");
    expect(resolveEntityByName(registry, "Meursault")).toEqual({ status: "not-found" });
    expect(resolveEntityByName(registry, "   ")).toEqual({ status: "not-found" });
  });

  it("answers ambiguous for duplicate names — never picks one", () => {
    let registry = withEntity(emptyEntityRegistry(), "legacy:s1:aaa:0", "Gawain");
    registry = withEntity(registry, "legacy:s1:aaa:1", "Gawain");
    const resolution = resolveEntityByName(registry, "gawain");
    expect(resolution.status).toBe("ambiguous");
    if (resolution.status !== "ambiguous") throw new Error("unreachable");
    expect(resolution.candidates).toHaveLength(2);
  });

  it("answers ambiguous when an alias overlaps another entity's name", () => {
    let registry = withEntity(emptyEntityRegistry(), "canon:klein", "Sherlock Moriarty");
    registry = withEntity(registry, "canon:other", "A Cherwood detective", {
      aliases: ["Sherlock Moriarty"],
    });
    expect(resolveEntityByName(registry, "Sherlock Moriarty").status).toBe("ambiguous");
  });
});

describe("presence projection", () => {
  it("lists present entities by display name, excluding the player", () => {
    let registry = withEntity(emptyEntityRegistry(), "char-1", "Klein", {
      kind: "player",
    });
    registry = withEntity(registry, "canon:rosago", "Rosago");
    registry = { ...registry, presentEntityIds: ["char-1", "canon:rosago"] };
    expect(presentEntityNames(registry)).toEqual(["Rosago"]);
  });

  it("is empty with nobody on screen", () => {
    expect(presentEntityNames(emptyEntityRegistry())).toEqual([]);
  });
});

describe("registry shape validation", () => {
  const valid = withEntity(emptyEntityRegistry(), "canon:rosago", "Rosago");

  it("accepts an empty and a populated registry", () => {
    expect(isValidEntityRegistryShape(emptyEntityRegistry())).toBe(true);
    expect(isValidEntityRegistryShape(valid)).toBe(true);
    expect(
      isValidEntityRegistryShape({ ...valid, presentEntityIds: ["canon:rosago"] }),
    ).toBe(true);
  });

  it("rejects a non-object, a wrong schema version, or bad collections", () => {
    expect(isValidEntityRegistryShape(null)).toBe(false);
    expect(isValidEntityRegistryShape([])).toBe(false);
    expect(isValidEntityRegistryShape("registry")).toBe(false);
    expect(isValidEntityRegistryShape({ ...valid, schemaVersion: 2 })).toBe(false);
    expect(isValidEntityRegistryShape({ ...valid, entities: {} })).toBe(false);
    expect(isValidEntityRegistryShape({ ...valid, presentEntityIds: [1] })).toBe(false);
  });

  it("rejects duplicate entity ids — one identity, one record", () => {
    expect(
      isValidEntityRegistryShape({
        ...valid,
        entities: [valid.entities[0], { ...valid.entities[0] }],
      }),
    ).toBe(false);
  });

  it("rejects repeated presence — one actor cannot be on screen twice", () => {
    const registry = withEntity(emptyEntityRegistry(), "canon:a", "A");
    expect(
      isValidEntityRegistryShape({
        ...registry,
        presentEntityIds: ["canon:a", "canon:a"],
      }),
    ).toBe(false);
    expect(
      isValidEntityRegistryShape({ ...registry, presentEntityIds: ["canon:a"] }),
    ).toBe(true);
  });

  it("rejects dangling presence — an on-screen id with no record", () => {
    expect(
      isValidEntityRegistryShape({ ...valid, presentEntityIds: ["canon:ghost"] }),
    ).toBe(false);
  });

  it("rejects a malformed entity record field by field", () => {
    const base = valid.entities[0];
    const bad: unknown[] = [
      { ...base, entityId: "" },
      { ...base, displayName: 1 },
      { ...base, aliases: "nope" },
      { ...base, aliases: [1] },
      { ...base, kind: "deity" },
      { ...base, lifeState: "undead" },
      { ...base, canonRef: "" },
      { ...base, introducedAtTurn: -1 },
      { ...base, introducedAtTurn: 1.5 },
      { ...base, protections: {} },
      { ...base, protections: [{ protectionId: "p", effect: "blocks-fate" }] },
      { ...base, source: { kind: "unknown-source" } },
      { ...base, source: { kind: "canon" } },
      { ...base, source: { kind: "hunt" } },
      { ...base, source: { kind: "story" } },
      { ...base, source: null },
      { ...base, mechanicalProfile: { status: "unknown", profileRevision: 1 } },
      { ...base, mechanicalProfile: { status: "half-known" } },
      "not-an-object",
    ];
    for (const entity of bad) {
      expect(isValidEntityRegistryShape({ ...valid, entities: [entity] })).toBe(false);
    }
  });

  it("accepts every legitimate profile provenance and rejects a malformed one", () => {
    const base = valid.entities[0];
    const snapshot: MechanicalProfileSnapshot = {
      combatProfile: BEYONDER_COMBAT,
      characteristicOwnership: { status: "known-none" },
      harvestableMaterials: [],
    };
    const known = (provenance: unknown) => ({
      ...base,
      mechanicalProfile: {
        status: "known",
        profileId: "p1",
        profileVersion: 1,
        profileRevision: 1,
        snapshot,
        provenance,
      },
    });
    const good = [
      { kind: "curated", catalogId: "profile-devil-dog" },
      {
        kind: "generated",
        recipeId: "beyonder-encounter/v1",
        generatorVersion: 1,
        generationId: "gen:x",
        seed: "abc",
      },
      { kind: "hunt", huntId: "hunt-1" },
      { kind: "trusted-script", scriptId: "script-1" },
    ];
    for (const provenance of good) {
      expect(
        isValidEntityRegistryShape({ ...valid, entities: [known(provenance)] }),
        JSON.stringify(provenance),
      ).toBe(true);
    }
    const bad = [
      null,
      { kind: "ai-said-so" },
      { kind: "curated" },
      { kind: "curated", catalogId: "  " },
      { kind: "generated", recipeId: "r", generatorVersion: 1, generationId: "g" },
      {
        kind: "generated",
        recipeId: "r",
        generatorVersion: -1,
        generationId: "g",
        seed: "s",
      },
      { kind: "hunt" },
      { kind: "trusted-script" },
    ];
    for (const provenance of bad) {
      expect(
        isValidEntityRegistryShape({ ...valid, entities: [known(provenance)] }),
        JSON.stringify(provenance),
      ).toBe(false);
    }
  });

  it("rejects a known profile with malformed identity or an unreal snapshot", () => {
    const base = valid.entities[0];
    const snapshot: MechanicalProfileSnapshot = {
      combatProfile: BEYONDER_COMBAT,
      characteristicOwnership: { status: "known-none" },
      harvestableMaterials: [],
    };
    const known = (overrides: Record<string, unknown>) => ({
      ...base,
      mechanicalProfile: {
        status: "known",
        profileId: "p1",
        profileVersion: 1,
        profileRevision: 1,
        snapshot,
        provenance: { kind: "curated", catalogId: "profile-devil-dog" },
        ...overrides,
      },
    });
    const bad = [
      { profileId: "" },
      { profileVersion: 1.5 },
      // A known profile at revision 0 would be indistinguishable from unknown.
      { profileRevision: 0 },
      { profileRevision: -1 },
      { snapshot: { ...snapshot, harvestableMaterials: [{ name: "x" }] } },
      {
        snapshot: {
          ...snapshot,
          characteristicOwnership: {
            status: "known",
            stacks: [{ pathwayId: 1, sequenceLevel: 5, quantity: 0.5 }],
          },
        },
      },
      { snapshot: null },
    ];
    for (const overrides of bad) {
      expect(
        isValidEntityRegistryShape({ ...valid, entities: [known(overrides)] }),
        JSON.stringify(overrides),
      ).toBe(false);
    }
    expect(isValidEntityRegistryShape({ ...valid, entities: [known({})] })).toBe(true);
  });

  it("rejects a non-record item, stack, or protection nested in a record", () => {
    const base = valid.entities[0];
    expect(
      isValidEntityRegistryShape({
        ...valid,
        entities: [{ ...base, protections: ["ward"] }],
      }),
    ).toBe(false);
    expect(
      isValidEntityRegistryShape({
        ...valid,
        entities: [
          {
            ...base,
            mechanicalProfile: {
              status: "known",
              profileId: "p1",
              profileVersion: 1,
              profileRevision: 1,
              snapshot: {
                combatProfile: { sequenceLevel: 9, isBeyonder: true, loot: ["a coin"] },
                characteristicOwnership: { status: "known-none" },
                harvestableMaterials: [],
              },
              provenance: { kind: "hunt", huntId: "h1" },
            },
          },
        ],
      }),
    ).toBe(false);
  });

  it("accepts every legitimate source variant", () => {
    const base = valid.entities[0];
    const sources = [
      { kind: "player" },
      { kind: "canon", sourceId: "x" },
      { kind: "bestiary-instance", sourceId: "x" },
      { kind: "hunt", huntId: "h1" },
      { kind: "story", introductionId: "i1" },
      { kind: "legacy", sourceId: "x" },
    ];
    for (const source of sources) {
      expect(
        isValidEntityRegistryShape({ ...valid, entities: [{ ...base, source }] }),
      ).toBe(true);
    }
  });
});

describe("profile shape validation (fail closed)", () => {
  it("accepts a well-formed combat profile and rejects impossible ones", () => {
    expect(isValidCombatProfileShape(BEYONDER_COMBAT)).toBe(true);
    expect(isValidCombatProfileShape({ sequenceLevel: 9, isBeyonder: false })).toBe(true);
    expect(isValidCombatProfileShape(null)).toBe(false);
    expect(isValidCombatProfileShape({ sequenceLevel: 10, isBeyonder: false })).toBe(
      false,
    );
    expect(isValidCombatProfileShape({ sequenceLevel: -1, isBeyonder: false })).toBe(
      false,
    );
    expect(isValidCombatProfileShape({ sequenceLevel: 5.5, isBeyonder: false })).toBe(
      false,
    );
    expect(isValidCombatProfileShape({ sequenceLevel: 9, isBeyonder: "yes" })).toBe(
      false,
    );
    // A pathway that does not exist in canon.
    expect(
      isValidCombatProfileShape({ sequenceLevel: 9, isBeyonder: true, pathwayId: 99 }),
    ).toBe(false);
    expect(
      isValidCombatProfileShape({
        sequenceLevel: 9,
        isBeyonder: true,
        knownAbilities: [1],
      }),
    ).toBe(false);
    expect(
      isValidCombatProfileShape({ sequenceLevel: 9, isBeyonder: true, loot: [{}] }),
    ).toBe(false);
    expect(
      isValidCombatProfileShape({
        sequenceLevel: 9,
        isBeyonder: true,
        loot: [{ name: "Coin", description: "", category: "mundane" }],
      }),
    ).toBe(true);
    expect(
      isValidCombatProfileShape({
        sequenceLevel: 9,
        isBeyonder: true,
        loot: [{ name: "Coin", description: "", category: "treasure" }],
      }),
    ).toBe(false);
    expect(
      isValidCombatProfileShape({
        sequenceLevel: 9,
        isBeyonder: true,
        loot: [{ name: "Coin", description: "", category: "mundane", consumable: "yes" }],
      }),
    ).toBe(false);
  });

  it("accepts the three ownership shapes", () => {
    expect(isValidCharacteristicOwnershipShape({ status: "known-none" })).toBe(true);
    expect(
      isValidCharacteristicOwnershipShape({
        status: "known",
        stacks: [{ pathwayId: 1, sequenceLevel: 5, quantity: 2 }],
      }),
    ).toBe(true);
    for (const reason of ["legacy", "narrative-only", "unverified-source"]) {
      expect(isValidCharacteristicOwnershipShape({ status: "unknown", reason })).toBe(
        true,
      );
    }
  });

  it("rejects a fractional, zero, negative, or non-finite quantity — no clamping", () => {
    const stack = (quantity: unknown) => ({
      status: "known",
      stacks: [{ pathwayId: 1, sequenceLevel: 5, quantity }],
    });
    // The pre-#227 ledger coerced 0.5 UP to a whole free characteristic.
    expect(isValidCharacteristicOwnershipShape(stack(0.5))).toBe(false);
    expect(isValidCharacteristicOwnershipShape(stack(1.5))).toBe(false);
    expect(isValidCharacteristicOwnershipShape(stack(0))).toBe(false);
    expect(isValidCharacteristicOwnershipShape(stack(-1))).toBe(false);
    expect(isValidCharacteristicOwnershipShape(stack(Number.NaN))).toBe(false);
    expect(isValidCharacteristicOwnershipShape(stack(Number.POSITIVE_INFINITY))).toBe(
      false,
    );
    expect(isValidCharacteristicOwnershipShape(stack("1"))).toBe(false);
  });

  it("rejects a stack that names no real canon rung", () => {
    const badRung = {
      status: "known",
      stacks: [{ pathwayId: 1, sequenceLevel: 0, quantity: 1 }],
    };
    // Sequence 0 has no rung entry (and no recoverable characteristic name).
    expect(isValidCharacteristicOwnershipShape(badRung)).toBe(false);
    expect(
      isValidCharacteristicOwnershipShape({
        status: "known",
        stacks: [{ pathwayId: 99, sequenceLevel: 5, quantity: 1 }],
      }),
    ).toBe(false);
    expect(
      isValidCharacteristicOwnershipShape({
        status: "known",
        stacks: [{ pathwayId: 1, sequenceLevel: 42, quantity: 1 }],
      }),
    ).toBe(false);
  });

  it("rejects two stacks naming the SAME rung — one unit id, one characteristic", () => {
    // `characteristicUnitId` carries no stack index, so duplicate rungs would mint
    // one id for two characteristics. The count belongs in `quantity`.
    expect(
      isValidCharacteristicOwnershipShape({
        status: "known",
        stacks: [
          { pathwayId: 21, sequenceLevel: 6, quantity: 1 },
          { pathwayId: 21, sequenceLevel: 6, quantity: 1 },
        ],
      }),
    ).toBe(false);
    // Distinct rungs (or distinct pathways) are fine.
    expect(
      isValidCharacteristicOwnershipShape({
        status: "known",
        stacks: [
          { pathwayId: 21, sequenceLevel: 6, quantity: 1 },
          { pathwayId: 21, sequenceLevel: 7, quantity: 2 },
          { pathwayId: 1, sequenceLevel: 6, quantity: 1 },
        ],
      }),
    ).toBe(true);
  });

  it("validates a loot/material item's characteristic metadata as strictly as a stack", () => {
    const item = (characteristic: unknown) => ({
      combatProfile: { sequenceLevel: 6, isBeyonder: true, pathwayId: 21 },
      characteristicOwnership: { status: "known-none" },
      harvestableMaterials: [
        {
          name: "Devil Beyonder Characteristic",
          description: "",
          category: "main-ingredient",
          characteristic,
        },
      ],
    });
    expect(
      isValidMechanicalProfileSnapshotShape(
        item({
          unitId: "unit:death:combat:enc-1:encounter:enc-1:enemy:p21:s6:0",
          pathwayId: 21,
          sequenceLevel: 6,
          form: "raw",
          origin: { kind: "death", deathEventId: "death:combat:enc-1:x" },
        }),
      ),
    ).toBe(true);
    for (const bad of [
      null,
      // Blank unit id — the item would have no identity at all.
      {
        unitId: "  ",
        pathwayId: 21,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "death", deathEventId: "d" },
      },
      // A rung canon does not have.
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 0,
        form: "raw",
        origin: { kind: "death", deathEventId: "d" },
      },
      // An unknown pathway.
      {
        unitId: "u",
        pathwayId: 99,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "death", deathEventId: "d" },
      },
      // An unknown form.
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 6,
        form: "sealed",
        origin: { kind: "death", deathEventId: "d" },
      },
      // Every origin arm must carry its own non-blank id, and nothing else passes.
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "death" },
      },
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "legacy-import" },
      },
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "curated-acquisition" },
      },
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "narrative" },
      },
      { unitId: "u", pathwayId: 21, sequenceLevel: 6, form: "raw", origin: "death" },
      // A fractional rung/pathway is refused, never floored.
      {
        unitId: "u",
        pathwayId: 21.5,
        sequenceLevel: 6,
        form: "raw",
        origin: { kind: "death", deathEventId: "d" },
      },
      {
        unitId: "u",
        pathwayId: 21,
        sequenceLevel: 6.5,
        form: "raw",
        origin: { kind: "death", deathEventId: "d" },
      },
    ]) {
      expect(isValidMechanicalProfileSnapshotShape(item(bad)), JSON.stringify(bad)).toBe(
        false,
      );
    }
    // The other two legitimate origins and the fused form pass.
    for (const origin of [
      { kind: "legacy-import", migrationId: "migration-1" },
      { kind: "curated-acquisition", acquisitionId: "acq-1" },
    ]) {
      expect(
        isValidMechanicalProfileSnapshotShape(
          item({
            unitId: "u",
            pathwayId: 21,
            sequenceLevel: 6,
            form: "fused-mystical",
            origin,
          }),
        ),
      ).toBe(true);
    }
  });

  it("rejects malformed ownership envelopes", () => {
    expect(isValidCharacteristicOwnershipShape(null)).toBe(false);
    expect(isValidCharacteristicOwnershipShape({ status: "maybe" })).toBe(false);
    expect(isValidCharacteristicOwnershipShape({ status: "known", stacks: [] })).toBe(
      false,
    );
    expect(isValidCharacteristicOwnershipShape({ status: "known", stacks: "x" })).toBe(
      false,
    );
    expect(isValidCharacteristicOwnershipShape({ status: "known", stacks: [null] })).toBe(
      false,
    );
    expect(
      isValidCharacteristicOwnershipShape({ status: "unknown", reason: "vibes" }),
    ).toBe(false);
  });

  it("validates the whole snapshot", () => {
    const snapshot: MechanicalProfileSnapshot = {
      combatProfile: BEYONDER_COMBAT,
      characteristicOwnership: { status: "known-none" },
      harvestableMaterials: [],
    };
    expect(isValidMechanicalProfileSnapshotShape(snapshot)).toBe(true);
    expect(isValidMechanicalProfileSnapshotShape(null)).toBe(false);
    expect(
      isValidMechanicalProfileSnapshotShape({ ...snapshot, combatProfile: {} }),
    ).toBe(false);
    expect(
      isValidMechanicalProfileSnapshotShape({
        ...snapshot,
        characteristicOwnership: { status: "nope" },
      }),
    ).toBe(false);
    expect(
      isValidMechanicalProfileSnapshotShape({ ...snapshot, harvestableMaterials: {} }),
    ).toBe(false);
    expect(
      isValidMechanicalProfileSnapshotShape({
        ...snapshot,
        harvestableMaterials: [{ name: "Gland" }],
      }),
    ).toBe(false);
  });
});

describe("assignMechanicalProfile", () => {
  const registryWithFoe = () =>
    withEntity(emptyEntityRegistry(), encounterEnemyEntityId("enc-7"), "the Devil Dog", {
      canonRef: "backlund-devil-dog",
      kind: "mystical-creature",
    });

  it("assigns a curated profile once, at revision 1, with its provenance", () => {
    const result = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      { kind: "curated", catalogId: "profile-devil-dog", combatProfile: BEYONDER_COMBAT },
    );
    expect(result.outcome).toBe("assigned");
    const profile = result.entity?.mechanicalProfile;
    if (profile?.status !== "known") throw new Error("expected a known profile");
    expect(profile.profileRevision).toBe(1);
    expect(profile.profileId).toBe("profile-devil-dog");
    expect(profile.provenance).toEqual({
      kind: "curated",
      catalogId: "profile-devil-dog",
    });
    // The curated ownership wins; the combat rung does not decide it.
    expect(profile.snapshot.characteristicOwnership).toEqual({
      status: "known",
      stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 1 }],
    });
    expect(isValidEntityRegistryShape(result.registry)).toBe(true);
  });

  it("treats an identical re-assignment as a duplicate no-op", () => {
    const assignment = {
      kind: "curated" as const,
      catalogId: "profile-devil-dog",
      combatProfile: BEYONDER_COMBAT,
    };
    const first = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      assignment,
    );
    const second = assignMechanicalProfile(
      first.registry,
      encounterEnemyEntityId("enc-7"),
      assignment,
    );
    expect(second.outcome).toBe("duplicate");
    expect(second.registry).toEqual(first.registry);
  });

  it("replays as a duplicate even when the snapshot's keys were built in another order", () => {
    // The persisted snapshot is compared by CANONICAL form: property order is
    // presentation, so a second call site (or a rehydrated plan) must not read as a
    // conflict that refuses the assignment.
    const snapshot: MechanicalProfileSnapshot = {
      combatProfile: { sequenceLevel: 8, isBeyonder: false },
      characteristicOwnership: { status: "known-none" },
      harvestableMaterials: [],
    };
    const first = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      { kind: "trusted-script", scriptId: "script-1", snapshot },
    );
    expect(first.outcome).toBe("assigned");
    const reordered = assignMechanicalProfile(
      first.registry,
      encounterEnemyEntityId("enc-7"),
      {
        kind: "trusted-script",
        scriptId: "script-1",
        snapshot: {
          harvestableMaterials: [],
          characteristicOwnership: { status: "known-none" },
          combatProfile: { isBeyonder: false, sequenceLevel: 8 },
        },
      },
    );
    expect(reordered.outcome).toBe("duplicate");
  });

  it("owns the persisted snapshot — a later caller mutation cannot rewrite it", () => {
    const snapshot: MechanicalProfileSnapshot = {
      combatProfile: {
        sequenceLevel: 6,
        isBeyonder: true,
        pathwayId: 21,
        knownAbilities: ["Savage predation"],
        loot: [{ name: "a torn collar", description: "", category: "mundane" }],
      },
      characteristicOwnership: {
        status: "known",
        stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 1 }],
      },
      harvestableMaterials: [
        { name: "Devil Dog fang", description: "", category: "main-ingredient" },
      ],
    };
    const result = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      { kind: "hunt", huntId: "hunt-3", snapshot },
    );
    const profile = result.entity?.mechanicalProfile;
    if (profile?.status !== "known") throw new Error("expected a known profile");
    // Mutate every nested collection the caller still holds a reference to.
    snapshot.combatProfile.sequenceLevel = 1;
    snapshot.combatProfile.knownAbilities!.push("Fabricated");
    snapshot.combatProfile.loot!.length = 0;
    if (snapshot.characteristicOwnership.status === "known") {
      snapshot.characteristicOwnership.stacks[0].quantity = 99;
    }
    snapshot.harvestableMaterials.length = 0;
    expect(profile.snapshot.combatProfile.sequenceLevel).toBe(6);
    expect(profile.snapshot.combatProfile.knownAbilities).toEqual(["Savage predation"]);
    expect(profile.snapshot.combatProfile.loot).toHaveLength(1);
    expect(profile.snapshot.characteristicOwnership).toEqual({
      status: "known",
      stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 1 }],
    });
    expect(profile.snapshot.harvestableMaterials).toHaveLength(1);
  });

  it("never lets a curated assignment alias the committed catalogue", () => {
    const result = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      { kind: "curated", catalogId: "profile-devil-dog", combatProfile: BEYONDER_COMBAT },
    );
    const profile = result.entity?.mechanicalProfile;
    if (profile?.status !== "known") throw new Error("expected a known profile");
    const catalogued = getCuratedEntityProfile("profile-devil-dog")!;
    expect(profile.snapshot.characteristicOwnership).not.toBe(
      catalogued.characteristicOwnership,
    );
    if (
      profile.snapshot.characteristicOwnership.status !== "known" ||
      catalogued.characteristicOwnership.status !== "known"
    ) {
      throw new Error("expected known ownership");
    }
    expect(profile.snapshot.characteristicOwnership.stacks[0]).not.toBe(
      catalogued.characteristicOwnership.stacks[0],
    );
    // …and the combat profile is not the caller's object either.
    expect(profile.snapshot.combatProfile).not.toBe(BEYONDER_COMBAT);
  });

  it("rejects a DIFFERENT profile for an already-known entity", () => {
    const first = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      { kind: "curated", catalogId: "profile-devil-dog", combatProfile: BEYONDER_COMBAT },
    );
    const conflicting = assignMechanicalProfile(
      first.registry,
      encounterEnemyEntityId("enc-7"),
      { kind: "curated", catalogId: "profile-rosago", combatProfile: BEYONDER_COMBAT },
    );
    expect(conflicting.outcome).toBe("conflict");
    expect(conflicting.registry).toEqual(first.registry);

    // Even the same catalogue entry with different combat mechanics conflicts.
    const sameIdDifferentMechanics = assignMechanicalProfile(
      first.registry,
      encounterEnemyEntityId("enc-7"),
      {
        kind: "curated",
        catalogId: "profile-devil-dog",
        combatProfile: { ...BEYONDER_COMBAT, sequenceLevel: 7 },
      },
    );
    expect(sameIdDifferentMechanics.outcome).toBe("conflict");
  });

  it("refuses an unknown entity, catalogue entry, or recipe", () => {
    expect(
      assignMechanicalProfile(emptyEntityRegistry(), "canon:ghost", {
        kind: "curated",
        catalogId: "profile-devil-dog",
        combatProfile: BEYONDER_COMBAT,
      }).outcome,
    ).toBe("not-found");
    expect(
      assignMechanicalProfile(registryWithFoe(), encounterEnemyEntityId("enc-7"), {
        kind: "curated",
        catalogId: "profile-nobody",
        combatProfile: BEYONDER_COMBAT,
      }).outcome,
    ).toBe("unknown-catalog-entry");
    expect(
      assignMechanicalProfile(registryWithFoe(), encounterEnemyEntityId("enc-7"), {
        kind: "generated",
        recipeId: "beyonder-encounter/v2" as "beyonder-encounter/v1",
        sessionSeed: "seed",
        combatProfile: BEYONDER_COMBAT,
        entityKind: "mystical-creature",
      }).outcome,
    ).toBe("unknown-recipe");
  });

  it("refuses a trusted snapshot that is itself malformed", () => {
    const result = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      {
        kind: "trusted-script",
        scriptId: "script-1",
        snapshot: {
          combatProfile: BEYONDER_COMBAT,
          characteristicOwnership: {
            status: "known",
            // Fractional quantity — refused, never rounded.
            stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 0.5 }],
          },
          harvestableMaterials: [],
        },
      },
    );
    expect(result.outcome).toBe("invalid-profile");
    expect(result.registry.entities[0].mechanicalProfile.status).toBe("unknown");
  });

  it("accepts hunt- and script-sourced snapshots with their provenance", () => {
    const snapshot: MechanicalProfileSnapshot = {
      combatProfile: { sequenceLevel: 8, isBeyonder: false },
      characteristicOwnership: { status: "known-none" },
      harvestableMaterials: [
        { name: "Fire Salamander gland", description: "", category: "main-ingredient" },
      ],
    };
    const hunt = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      {
        kind: "hunt",
        huntId: "hunt-3",
        snapshot,
      },
    );
    expect(hunt.outcome).toBe("assigned");
    expect(hunt.provenance).toEqual({ kind: "hunt", huntId: "hunt-3" });

    const script = assignMechanicalProfile(
      registryWithFoe(),
      encounterEnemyEntityId("enc-7"),
      { kind: "trusted-script", scriptId: "script-1", snapshot },
    );
    expect(script.outcome).toBe("assigned");
    expect(script.provenance).toEqual({ kind: "trusted-script", scriptId: "script-1" });
  });

  it("can resolve a DEAD entity's ownership without granting anything", () => {
    const dead = withEntity(
      emptyEntityRegistry(),
      encounterEnemyEntityId("enc-9"),
      "an unknown Beyonder",
      { lifeState: "dead" },
    );
    const result = assignMechanicalProfile(dead, encounterEnemyEntityId("enc-9"), {
      kind: "curated",
      catalogId: "profile-meursault",
      combatProfile: { sequenceLevel: 9, isBeyonder: true, pathwayId: 14 },
    });
    expect(result.outcome).toBe("assigned");
    expect(result.entity?.lifeState).toBe("dead");
  });
});

describe("the versioned deterministic generator", () => {
  const generated = (
    combatProfile: CombatProfile,
    entityKind: Parameters<typeof assignMechanicalProfile>[2] extends never
      ? never
      : "mundane" | "mystical-creature" | "person" | "evil-spirit",
    seed = "session-seed",
  ) =>
    assignMechanicalProfile(
      withEntity(emptyEntityRegistry(), storyEntityId("s1", 3, 0), "a stranger"),
      storyEntityId("s1", 3, 0),
      {
        kind: "generated",
        recipeId: "beyonder-encounter/v1",
        sessionSeed: seed,
        combatProfile,
        entityKind,
      },
    );

  it("gives an engine-derived Beyonder exactly one characteristic of its own rung", () => {
    const result = generated(BEYONDER_COMBAT, "person");
    expect(result.outcome).toBe("assigned");
    const profile = result.entity?.mechanicalProfile;
    if (profile?.status !== "known") throw new Error("expected a known profile");
    expect(profile.snapshot.characteristicOwnership).toEqual({
      status: "known",
      stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 1 }],
    });
    expect(profile.provenance).toMatchObject({
      kind: "generated",
      recipeId: "beyonder-encounter/v1",
      generatorVersion: PROFILE_GENERATOR_VERSION,
    });
  });

  it("gives a mundane actor an explicit none", () => {
    const result = generated({ sequenceLevel: 9, isBeyonder: false }, "mundane");
    const profile = result.entity?.mechanicalProfile;
    if (profile?.status !== "known") throw new Error("expected a known profile");
    expect(profile.snapshot.characteristicOwnership).toEqual({ status: "known-none" });
  });

  it("leaves a creature or spirit with no canon pathway UNKNOWN, not none", () => {
    // Corpus: "Some evil spirits had Beyonder characteristics, but most of them
    // didn't" — so absence of a pathway is not proof of absence of a characteristic.
    for (const combat of [
      { sequenceLevel: 8, isBeyonder: true },
      { sequenceLevel: 8, isBeyonder: false, pathwayId: 21 },
      // A Beyonder standing on a rung that does not exist in canon.
      { sequenceLevel: 0, isBeyonder: true, pathwayId: 21 },
    ] satisfies CombatProfile[]) {
      const result = generated(combat, "evil-spirit");
      const profile = result.entity?.mechanicalProfile;
      if (profile?.status !== "known") throw new Error("expected a known profile");
      expect(profile.snapshot.characteristicOwnership).toEqual({
        status: "unknown",
        reason: "unverified-source",
      });
    }
  });

  it("seeds on every input the recipe's output depends on", () => {
    // Two different generated snapshots must never share a generation id: the seed
    // is what makes the recorded provenance reproducible and auditable.
    const asMundane = generated({ sequenceLevel: 9, isBeyonder: false }, "mundane");
    const asSpirit = generated({ sequenceLevel: 9, isBeyonder: false }, "evil-spirit");
    const beyonder = generated(BEYONDER_COMBAT, "person");
    const seeds = [asMundane, asSpirit, beyonder].map((result) => {
      const profile = result.entity?.mechanicalProfile;
      if (profile?.status !== "known") throw new Error("expected a known profile");
      if (profile.provenance.kind !== "generated") throw new Error("expected generated");
      return profile.provenance.seed;
    });
    expect(new Set(seeds).size).toBe(3);
  });

  it("is deterministic in its seed and distinct per save", () => {
    const first = generated(BEYONDER_COMBAT, "person");
    const again = generated(BEYONDER_COMBAT, "person");
    const otherSave = generated(BEYONDER_COMBAT, "person", "another-seed");
    if (
      first.entity?.mechanicalProfile.status !== "known" ||
      again.entity?.mechanicalProfile.status !== "known" ||
      otherSave.entity?.mechanicalProfile.status !== "known"
    ) {
      throw new Error("expected known profiles");
    }
    expect(again.entity.mechanicalProfile.provenance).toEqual(
      first.entity.mechanicalProfile.provenance,
    );
    expect(otherSave.entity.mechanicalProfile.provenance).not.toEqual(
      first.entity.mechanicalProfile.provenance,
    );
  });
});

describe("characteristicOwnershipFor", () => {
  it("reads the assigned ownership, and fails closed while unassigned", () => {
    const registry = withEntity(emptyEntityRegistry(), "canon:rosago", "Rosago", {
      canonRef: "backlund-rosago",
    });
    expect(characteristicOwnershipFor(registry.entities[0])).toEqual({
      status: "unknown",
      reason: "unverified-source",
    });
    const assigned = assignMechanicalProfile(registry, "canon:rosago", {
      kind: "curated",
      catalogId: "profile-rosago",
      combatProfile: { sequenceLevel: 5, isBeyonder: true, pathwayId: 1 },
    });
    expect(characteristicOwnershipFor(assigned.entity!)).toEqual({
      status: "known",
      stacks: [{ pathwayId: 1, sequenceLevel: 5, quantity: 1 }],
    });
  });
});

describe("curatedProfileCatalogIds", () => {
  it("lists the committed catalogue", () => {
    expect(curatedProfileCatalogIds()).toContain("profile-devil-dog");
    expect(curatedProfileCatalogIds()).toHaveLength(6);
  });
});

describe("session integration", () => {
  it("seeds the player's own entity on a new chronicle", () => {
    const session = makeSession();
    const registry = resolveEntityRegistry(session);
    expect(registry.entities).toHaveLength(1);
    const player = registry.entities[0];
    expect(player.entityId).toBe(playerEntityId("char-1"));
    expect(player.kind).toBe("player");
    expect(player.lifeState).toBe("alive");
    expect(player.source).toEqual({ kind: "player" });
    // The player is never one of their own scene NPCs.
    expect(registry.presentEntityIds).toEqual([]);
    expect(presentEntityNames(registry)).toEqual([]);
  });

  it("seeds a canon takeover's aliases so the player can never resolve twice", () => {
    const preset = CANON_PLAYABLE_CHARACTERS.find((p) => p.aliases.length > 0);
    if (!preset) throw new Error("expected a canon preset with aliases");
    const registry = resolveEntityRegistry(
      createCanonCharacterSession(preset, createMemoryState()),
    );
    const player = registry.entities[0];
    expect(player.kind).toBe("player");
    // The canon mortality policy is deliberately NOT attached to the player.
    expect(player.canonRef).toBeUndefined();
    for (const surface of [preset.displayName, ...preset.aliases]) {
      const resolution = resolveEntityByName(registry, surface);
      expect(resolution.status, surface).toBe("resolved");
    }
    // An ordinary chronicle still carries no aliases.
    expect(resolveEntityRegistry(makeSession()).entities[0].aliases).toEqual([]);
  });

  it("round-trips the registry through serialize/deserialize", () => {
    const session = makeSession();
    const withFoe = {
      ...session,
      entityRegistry: assignMechanicalProfile(
        withEntity(
          resolveEntityRegistry(session),
          encounterEnemyEntityId("enc-7"),
          "the Devil Dog",
          { canonRef: "backlund-devil-dog", kind: "mystical-creature" },
        ),
        encounterEnemyEntityId("enc-7"),
        {
          kind: "curated",
          catalogId: "profile-devil-dog",
          combatProfile: BEYONDER_COMBAT,
        },
      ).registry,
    };
    const restored = deserializeSession(serializeSession(withFoe));
    expect(restored).not.toBeNull();
    expect(restored?.entityRegistry).toEqual(withFoe.entityRegistry);
  });

  it("rejects a save whose registry is malformed", () => {
    const session = makeSession();
    const corrupt = JSON.stringify({
      ...session,
      entityRegistry: {
        schemaVersion: 1,
        entities: [{ entityId: "" }],
        presentEntityIds: [],
      },
    });
    expect(deserializeSession(corrupt)).toBeNull();
  });

  it("accepts a legacy save with no registry at all", () => {
    const session = makeSession();
    const legacy = JSON.stringify({ ...session, entityRegistry: undefined });
    const restored = deserializeSession(legacy);
    expect(restored).not.toBeNull();
    expect(restored?.entityRegistry).toBeUndefined();
    expect(resolveEntityRegistry(restored!).entities).toEqual([]);
  });
});
