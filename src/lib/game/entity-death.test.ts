import { describe, expect, it } from "vitest";

import type {
  CanonMortalityPolicy,
  EntityProtection,
  EntityRegistryState,
} from "@/lib/types/entities";

import { authorizeEntityDeath, isLethalSelectionEligible } from "./entity-death";
import { emptyEntityRegistry, registerEntity } from "./entities";
import { canonEntityId, encounterEnemyEntityId } from "./stable-identifiers";

const WARD: EntityProtection = {
  protectionId: "ward-1",
  effect: "blocks-death",
  reason: "A patron shields them.",
  appliedByEventId: "event:script:ward:0",
};

const ROSAGO_POLICY: CanonMortalityPolicy = {
  kind: "mortal-after",
  policyId: "mortality-rosago",
  version: 1,
  minCanonPosition: 248,
  activeEpochs: [5],
  allowedSources: ["combat", "trusted-script", "player-failure"],
};

function registryWith(
  options: {
    canonRef?: string;
    lifeState?: "alive" | "dead" | "transformed";
    protections?: EntityProtection[];
    entityId?: string;
  } = {},
): EntityRegistryState {
  const entityId = options.entityId ?? canonEntityId("rosago");
  const result = registerEntity(emptyEntityRegistry(), {
    entityId,
    displayName: "Rosago",
    kind: "person",
    ...(options.canonRef !== undefined ? { canonRef: options.canonRef } : {}),
    introducedAtTurn: 0,
    source: { kind: "canon", sourceId: "backlund-rosago" },
    ...(options.protections ? { protections: options.protections } : {}),
  });
  if (result.outcome === "invalid") throw new Error(result.reason);
  return {
    ...result.registry,
    entities: result.registry.entities.map((entity) =>
      options.lifeState ? { ...entity, lifeState: options.lifeState } : entity,
    ),
  };
}

/** A policy lookup that only knows Rosago — everything else is unauthored. */
const policyFor = (canonRef: string): CanonMortalityPolicy | undefined =>
  canonRef === "backlund-rosago" ? ROSAGO_POLICY : undefined;

const base = {
  entityId: canonEntityId("rosago"),
  source: "combat" as const,
  canonPosition: 250,
  epoch: 5,
  policyFor,
};

describe("authorizeEntityDeath — identity and liveness", () => {
  it("refuses an entity the registry has never heard of", () => {
    const decision = authorizeEntityDeath({ ...base, registry: emptyEntityRegistry() });
    expect(decision).toEqual({
      status: "blocked",
      evaluatedCanonPosition: 250,
      reason: "unknown-entity",
    });
  });

  it("refuses a second death for an already-dead or transformed entity", () => {
    for (const lifeState of ["dead", "transformed"] as const) {
      const decision = authorizeEntityDeath({
        ...base,
        registry: registryWith({ canonRef: "backlund-rosago", lifeState }),
      });
      expect(decision.status).toBe("blocked");
      expect(decision.reason).toBe("not-alive");
    }
  });
});

describe("authorizeEntityDeath — ordinary actors", () => {
  it("allows an ordinary actor's death without any policy", () => {
    const decision = authorizeEntityDeath({
      ...base,
      entityId: encounterEnemyEntityId("enc-1"),
      registry: registryWith({ entityId: encounterEnemyEntityId("enc-1") }),
    });
    expect(decision).toEqual({ status: "allowed", evaluatedCanonPosition: 250 });
  });

  it("allows an ordinary actor's death from ANY command source", () => {
    for (const source of [
      "combat",
      "trusted-script",
      "player-failure",
      "narrative-intent",
    ] as const) {
      const decision = authorizeEntityDeath({
        ...base,
        source,
        entityId: encounterEnemyEntityId("enc-1"),
        registry: registryWith({ entityId: encounterEnemyEntityId("enc-1") }),
      });
      expect(decision.status, source).toBe("allowed");
    }
  });

  it("still refuses an ordinary actor under an active death block", () => {
    const decision = authorizeEntityDeath({
      ...base,
      entityId: encounterEnemyEntityId("enc-1"),
      registry: registryWith({
        entityId: encounterEnemyEntityId("enc-1"),
        protections: [WARD],
      }),
    });
    expect(decision.reason).toBe("protected-by-effect");
  });
});

describe("authorizeEntityDeath — canonical figures", () => {
  it("allows the death at exactly the curated threshold and after it", () => {
    for (const canonPosition of [248, 249, 1000]) {
      const decision = authorizeEntityDeath({
        ...base,
        canonPosition,
        registry: registryWith({ canonRef: "backlund-rosago" }),
      });
      expect(decision).toEqual({
        status: "allowed",
        policyId: "mortality-rosago",
        policyVersion: 1,
        evaluatedCanonPosition: canonPosition,
      });
    }
  });

  it("refuses the death one position early — canon cannot be pre-empted", () => {
    const decision = authorizeEntityDeath({
      ...base,
      canonPosition: 247,
      registry: registryWith({ canonRef: "backlund-rosago" }),
    });
    expect(decision).toEqual({
      status: "blocked",
      policyId: "mortality-rosago",
      policyVersion: 1,
      evaluatedCanonPosition: 247,
      reason: "too-early",
    });
  });

  it("refuses a canonical death with NO authored policy (fail closed)", () => {
    const decision = authorizeEntityDeath({
      ...base,
      registry: registryWith({ canonRef: "canon-figure-with-no-policy" }),
    });
    expect(decision.reason).toBe("no-policy");
    expect(decision.policyId).toBeUndefined();
  });

  it("refuses a deliberately protected figure, recording the policy", () => {
    const decision = authorizeEntityDeath({
      ...base,
      registry: registryWith({ canonRef: "protected-figure" }),
      policyFor: () => ({
        kind: "protected",
        policyId: "mortality-protected",
        version: 2,
        reason: "Plot-critical until the arc resolves.",
      }),
    });
    expect(decision).toEqual({
      status: "blocked",
      policyId: "mortality-protected",
      policyVersion: 2,
      evaluatedCanonPosition: 250,
      reason: "policy-protected",
    });
  });

  it("refuses a death in an era the figure does not inhabit", () => {
    const decision = authorizeEntityDeath({
      ...base,
      epoch: 4,
      registry: registryWith({ canonRef: "backlund-rosago" }),
    });
    expect(decision.reason).toBe("wrong-epoch");
    expect(decision.policyId).toBe("mortality-rosago");
  });

  it("refuses narrator intent, and allows the engine-owned sources", () => {
    const registry = registryWith({ canonRef: "backlund-rosago" });
    expect(
      authorizeEntityDeath({ ...base, registry, source: "narrative-intent" }).reason,
    ).toBe("source-not-allowed");
    for (const source of ["combat", "trusted-script", "player-failure"] as const) {
      expect(authorizeEntityDeath({ ...base, registry, source }).status, source).toBe(
        "allowed",
      );
    }
  });

  it("lets an active death block outrank an otherwise-permitting policy", () => {
    const decision = authorizeEntityDeath({
      ...base,
      registry: registryWith({ canonRef: "backlund-rosago", protections: [WARD] }),
    });
    expect(decision.reason).toBe("protected-by-effect");
  });

  it("uses the committed catalogue when no lookup is injected", () => {
    const registry = registryWith({ canonRef: "backlund-rosago" });
    // Rosago's real policy (introduced ch. 248) comes from `entity-profiles.ts`.
    expect(
      authorizeEntityDeath({
        registry,
        entityId: canonEntityId("rosago"),
        source: "combat",
        canonPosition: 250,
        epoch: 5,
      }).status,
    ).toBe("allowed");
    expect(
      authorizeEntityDeath({
        registry,
        entityId: canonEntityId("rosago"),
        source: "combat",
        canonPosition: 10,
        epoch: 5,
      }).reason,
    ).toBe("too-early");
  });
});

describe("isLethalSelectionEligible", () => {
  it("excludes anything that could not be killed here", () => {
    expect(
      isLethalSelectionEligible({
        ...base,
        registry: registryWith({ canonRef: "backlund-rosago" }),
      }),
    ).toBe(true);
    // Too early…
    expect(
      isLethalSelectionEligible({
        ...base,
        canonPosition: 10,
        registry: registryWith({ canonRef: "backlund-rosago" }),
      }),
    ).toBe(false);
    // …no policy…
    expect(
      isLethalSelectionEligible({
        ...base,
        registry: registryWith({ canonRef: "unauthored" }),
      }),
    ).toBe(false);
    // …warded…
    expect(
      isLethalSelectionEligible({
        ...base,
        registry: registryWith({ canonRef: "backlund-rosago", protections: [WARD] }),
      }),
    ).toBe(false);
    // …or already dead.
    expect(
      isLethalSelectionEligible({
        ...base,
        registry: registryWith({ canonRef: "backlund-rosago", lifeState: "dead" }),
      }),
    ).toBe(false);
  });

  it("includes an ordinary unprotected actor", () => {
    expect(
      isLethalSelectionEligible({
        ...base,
        entityId: encounterEnemyEntityId("enc-1"),
        registry: registryWith({ entityId: encounterEnemyEntityId("enc-1") }),
      }),
    ).toBe(true);
  });
});
