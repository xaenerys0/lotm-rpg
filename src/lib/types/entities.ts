import type {
  BeyonderCharacteristic,
  CharacteristicItemMetadata,
  CharacteristicUnitId,
  Item,
} from "./rules";

/**
 * Authoritative entity, death, and characteristic-unit types (issue #227).
 *
 * The Law of Beyonder Characteristics Indestructibility must fire on ANY
 * authorized death of a characteristic-bearing entity — not only on a combat
 * `"victory"` over an enemy flagged `isBeyonder`. Widening that trigger safely
 * needs contracts the engine never had: one identity/life-state authority, a
 * TRUSTED statement of what an entity owns, a canon mortality gate, exact
 * characteristic identity, and replay-safe application receipts.
 *
 * These are those contracts. Pure data — no methods or side effects (see
 * `src/lib/types/CLAUDE.md`). The engine that enforces them lives in
 * `@/lib/game/entities.ts` / `entity-death.ts`; the curated catalogue in
 * `@/lib/lore/entity-profiles.ts`. Design doc: `docs/entity-death-design.md`.
 *
 * Two rules run through every type here:
 *
 * 1. **Fail closed.** Ambiguity never authorizes a reward. A missing mortality
 *    policy means PROTECTED; unknown ownership means NO drop. Corpus grounds
 *    this — "Some evil spirits had Beyonder characteristics, but most of them
 *    didn't" (Book 1, ch. 1263) — so a supernatural category, a pathway
 *    resemblance, or narrator prose can never establish ownership.
 * 2. **The AI never supplies mechanics.** No shape here is accepted from an AI
 *    response. Profiles come from the curated catalogue or an engine-owned
 *    versioned generator; deaths come from authorized commands.
 */

// ---------------------------------------------------------------------------
// Entity identity and life state
// ---------------------------------------------------------------------------

/**
 * A stable actor identity. Built only by the deterministic builders in
 * `@/lib/game/stable-identifiers.ts` — never a display name, and never the
 * random, AI-influenced Codex id (which merges on alias match and so cannot be
 * an identity authority).
 */
export type EntityId = string;

export type EntityLifeState = "alive" | "dead" | "transformed";

/**
 * What an actor IS. Distinct from what it OWNS: a `mystical-creature` is not
 * assumed to carry a characteristic, and a `mundane` actor is explicitly stated
 * to carry none.
 */
export type EntityKind =
  | "player"
  | "person"
  | "mystical-creature"
  | "evil-spirit"
  | "construct"
  | "mundane"
  | "unknown";

/** Where an entity's identity came from — the provenance of the ID itself. */
export type EntitySource =
  | { kind: "player" }
  | { kind: "canon"; sourceId: string }
  | { kind: "bestiary-instance"; sourceId: string }
  | { kind: "hunt"; huntId: string }
  | { kind: "story"; introductionId: string }
  | { kind: "legacy"; sourceId: string };

/**
 * A block on an entity's death that exists in the fiction (a protective relic, a
 * patron's shielding, a plot-critical guard). Removal is its own trusted event —
 * there is deliberately no generic bypass flag.
 */
export interface EntityProtection {
  protectionId: string;
  effect: "blocks-death";
  reason: string;
  /** The domain event that applied it, so removal is auditable. */
  appliedByEventId: string;
}

/**
 * The registry record for one actor. The sole authority for who exists and
 * whether they are alive; roster, presence, society, person-Codex, and combat
 * records reference it by `entityId` rather than carrying their own identity.
 */
export interface AuthoritativeEntityRecord {
  entityId: EntityId;
  displayName: string;
  /**
   * Alternate names the fiction uses. Deliberately NOT required to be unique —
   * name resolution may answer `ambiguous`, and no mechanical API accepts a name.
   */
  aliases: string[];
  kind: EntityKind;
  lifeState: EntityLifeState;
  /** Curated canon reference (`@/lib/lore` preset / catalogue id), when canonical. */
  canonRef?: string;
  mechanicalProfile: EntityMechanicalProfileState;
  protections: EntityProtection[];
  introducedAtTurn: number;
  source: EntitySource;
}

export interface EntityRegistryState {
  schemaVersion: 1;
  entities: AuthoritativeEntityRecord[];
  /** Who is on-screen now — the projection `GameState.npcsPresent` is derived from. */
  presentEntityIds: EntityId[];
}

// ---------------------------------------------------------------------------
// Mechanical profiles — the trusted statement of what an entity can do and own
// ---------------------------------------------------------------------------

/**
 * The opaque combat surface of an entity. `isBeyonder` / `pathwayId` stay useful
 * for combat math and the intel dossier, but they NEVER authorize a
 * characteristic drop — that is `characteristicOwnership`'s job alone.
 */
export interface CombatProfile {
  /** 9 weakest … 0 strongest. Mundane foes use 9. */
  sequenceLevel: number;
  isBeyonder: boolean;
  pathwayId?: number;
  knownAbilities?: string[];
  loot?: Item[];
}

/**
 * Whether an entity owns Beyonder Characteristics, stated explicitly. `unknown`
 * is the fail-closed default: it precipitates nothing and can be resolved later
 * by a trusted profile registration.
 */
export type CharacteristicOwnership =
  | { status: "known-none" }
  | { status: "known"; stacks: BeyonderCharacteristic[] }
  | {
      status: "unknown";
      reason: "legacy" | "narrative-only" | "unverified-source";
    };

/** Materials an entity's remains yield (a creature-material hunt's quarry). */
export interface MechanicalProfileSnapshot {
  combatProfile: CombatProfile;
  characteristicOwnership: CharacteristicOwnership;
  harvestableMaterials: Item[];
}

/** How a profile was established. An AI response is never a provenance. */
export type MechanicalProfileProvenance =
  | { kind: "curated"; catalogId: string }
  | {
      kind: "generated";
      recipeId: string;
      generatorVersion: number;
      generationId: string;
      seed: string;
    }
  | { kind: "hunt"; huntId: string }
  | { kind: "trusted-script"; scriptId: string };

/**
 * An entity's profile state. The validated `snapshot` is PERSISTED, so a later
 * catalogue or generator change can never silently rewrite an existing save.
 * `unknown` → `known` is allowed once; an equal re-assignment is a no-op and a
 * differing one is rejected (`profileRevision` makes the conflict detectable).
 */
export type EntityMechanicalProfileState =
  | { status: "unknown"; profileRevision: 0 }
  | {
      status: "known";
      profileId: string;
      profileVersion: number;
      profileRevision: number;
      snapshot: MechanicalProfileSnapshot;
      provenance: MechanicalProfileProvenance;
    };

// ---------------------------------------------------------------------------
// Canon mortality
// ---------------------------------------------------------------------------

/**
 * Who ordered a death. `"narrative-intent"` (the narrator's structured claim) is
 * deliberately NOT allowlisted by the curated canon policies — prose may describe
 * a death, but only an engine-owned command can apply one to a canon figure.
 */
export type EntityDeathCommandSource =
  | "combat"
  | "trusted-script"
  | "player-failure"
  | "narrative-intent";

/**
 * A canon figure's mortality policy. `mortal-after` opens divergence from the
 * figure's curated introduction position onward (an alternative history may kill
 * Klein's contemporaries once the story has met them) while preventing a death
 * before they ever appear. A missing or malformed policy resolves to protected.
 */
export type CanonMortalityPolicy =
  | {
      kind: "mortal-after";
      policyId: string;
      version: number;
      /** Curated canon position (chapter index) the figure becomes killable at. */
      minCanonPosition: number;
      activeEpochs: number[];
      allowedSources: EntityDeathCommandSource[];
    }
  | {
      kind: "protected";
      policyId: string;
      version: number;
      reason: string;
    };

/** The recorded verdict of `authorizeEntityDeath`, kept on the application plan. */
export interface EntityDeathDecision {
  status: "allowed" | "blocked";
  policyId?: string;
  policyVersion?: number;
  evaluatedCanonPosition: number;
  /** Exact fail-closed reason when blocked (`no-policy`, `too-early`, …). */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Death records and exact precipitation units
// ---------------------------------------------------------------------------

/** Why an entity died. Cause never gates precipitation — only authorization does. */
export type EntityDeathCause =
  | "combat"
  | "violence"
  | "loss-of-control"
  | "ritual"
  | "mystical-effect";

/**
 * Who ends up holding the remains. Precipitation is recorded either way; only
 * `player` custody permits recovery into inventory.
 */
export type CustodyDisposition =
  | { holder: "player" }
  | { holder: "faction"; factionName: string }
  | { holder: "none"; reason: "off-screen" | "denied-control" | "unresolved" };

/**
 * One precipitated characteristic, individually identified. The SAME `unitId`
 * becomes the identity of the recovered inventory item — there is no separate
 * item id — so a unit can be recovered, consumed, traded, or lost exactly once.
 */
export interface PrecipitatedCharacteristicUnit {
  unitId: CharacteristicUnitId;
  pathwayId: number;
  sequenceLevel: number;
  recovery: { status: "unrecovered" } | { status: "recovered"; recoveredAtTurn: number };
}

/** Where a death was commanded from. */
export type EntityDeathSource =
  | { kind: "combat"; encounterId: string }
  | { kind: "turn"; turnNumber: number; intentIndex: number }
  | { kind: "scripted"; commandId: string };

/**
 * The idempotent record of one death. Unrecovered precipitation lives HERE (not
 * in the ledger, which stays cumulative player-recovery history), so a
 * characteristic that fell where the player could not reach it is still real and
 * still recoverable later.
 */
export interface EntityDeathRecord {
  schemaVersion: 1;
  deathEventId: string;
  applicationId: string;
  entityId: EntityId;
  source: EntityDeathSource;
  cause: EntityDeathCause;
  onScreen: boolean;
  playerPresent: boolean;
  location: string;
  custody: CustodyDisposition;
  precipitation:
    | { status: "none" }
    | { status: "unresolved"; reason: "ownership-unknown" }
    | { status: "resolved"; units: PrecipitatedCharacteristicUnit[] };
  occurredAtTurn: number;
  occurredAt: number;
}

// ---------------------------------------------------------------------------
// Exact inventory references
// ---------------------------------------------------------------------------

/**
 * How a mechanical operation names an inventory entry. A characteristic is
 * always addressed by its exact `unitId` (two "Marionettist Beyonder
 * Characteristic" items are different objects); plain items keep the existing
 * name matching, disambiguated by occurrence.
 */
export type InventoryItemRef =
  | { kind: "characteristic"; unitId: CharacteristicUnitId }
  | {
      kind: "plain";
      category: Item["category"];
      name: string;
      /** 0-based index among same-name entries, in inventory order. */
      occurrence: number;
    };

/**
 * The mechanical projection of an item for fingerprinting: identity and
 * mechanics only, no prose. `characteristic` carries the unit metadata INCLUDING
 * its `form`, so a raw drop and a fused mystical drop of the same unit hash
 * differently.
 */
export interface MechanicalItemProjection {
  name: string;
  category: Item["category"];
  /** `isConsumable`'s resolved answer, not the optional raw override. */
  consumableResolved: boolean;
  /**
   * Explicitly `null` (never `undefined`) for a non-characteristic item —
   * canonicalization refuses `undefined`, so the projection must state absence.
   */
  characteristic: CharacteristicItemMetadata | null;
}

// ---------------------------------------------------------------------------
// Receipts, legacy reconciliation, and the journal outbox
// ---------------------------------------------------------------------------

/** Versioned fingerprint schemas. An unknown schema is rejected, never guessed at. */
export type ReceiptFingerprintSchema =
  | "combat-mechanics/v1"
  | "turn-mechanics/v1"
  | "profile-registration/v1"
  | "inventory-transfer/v1"
  | "legacy-reconciliation/v1";

/**
 * The canonical fingerprint of a normalized mechanical application plan.
 * Presentation (prose, labels, display names, wall-clock, array display order)
 * is excluded by construction, so re-narrating a fight replays equal while
 * changing a unit, quantity, fate, or custody conflicts.
 */
export interface ReceiptFingerprint {
  schema: ReceiptFingerprintSchema;
  algorithm: "sha256-rfc8785";
  /** Lowercase hexadecimal SHA-256 digest. */
  digest: string;
}

export type ApplicationKind =
  | "combat"
  | "turn"
  | "profile-registration"
  | "inventory-transfer";

/** Proof that an application already ran — the exactly-once guarantee. */
export interface AppliedApplicationReceipt {
  applicationId: string;
  kind: ApplicationKind;
  fingerprint: ReceiptFingerprint;
  eventIds: string[];
  appliedAtTurn: number;
}

/**
 * A resolved pre-#227 combat blob found in storage with no matching receipt.
 * Whether its rewards were applied before the crash is UNKNOWABLE (inventory
 * names, ledger aggregates, and hunt state are not evidence), so the only
 * disposition is to preserve the session and never replay.
 */
export interface LegacyCombatReconciliation {
  encounterId: string;
  legacyFingerprint: ReceiptFingerprint;
  status: "awaiting-acknowledgement" | "acknowledged";
  disposition: "preserve-session-no-replay";
  detectedAtTurn: number;
  reconciliationEventId: string;
}

export type JournalProjectionKind = "combat" | "entity-death" | "chronicle-end";

/**
 * Journal work that has been decided but not yet delivered. Persisted WITH the
 * mechanical session, so a crash between the state write and the journal write
 * replays the same deterministic UUIDv5 row instead of duplicating or losing it.
 */
export interface JournalOutboxRecord {
  rootEventId: string;
  projectionKind: JournalProjectionKind;
  events: GameDomainEvent[];
}

/** Death records, receipts, reconciliations, and the journal outbox for one save. */
export interface WorldEventState {
  schemaVersion: 1;
  deaths: EntityDeathRecord[];
  receipts: AppliedApplicationReceipt[];
  legacyCombatReconciliations: LegacyCombatReconciliation[];
  journalOutbox: JournalOutboxRecord[];
}

// ---------------------------------------------------------------------------
// Domain events — the engine's output contract
// ---------------------------------------------------------------------------

/**
 * Every event carries mechanical payload only. Memory facts, journal entries,
 * the after-action report, and the on-screen aftermath are all FORMATTED from
 * these by adapters — formatted text is never an input, so prose can never
 * become mechanical truth.
 */
interface DomainEventBase {
  id: string;
  applicationId: string;
  occurredAtTurn: number;
}

export type GameDomainEvent =
  | (DomainEventBase & {
      kind: "combat-resolved";
      encounterId: string;
      outcome: string;
      enemyFate: EnemyFate;
    })
  | (DomainEventBase & {
      kind: "entity-death-authorized";
      entityId: EntityId;
      decision: EntityDeathDecision;
    })
  | (DomainEventBase & {
      kind: "entity-died";
      deathEventId: string;
      entityId: EntityId;
      cause: EntityDeathCause;
      onScreen: boolean;
    })
  | (DomainEventBase & {
      kind: "entity-death-rejected";
      entityId: EntityId;
      reason: string;
    })
  | (DomainEventBase & {
      kind: "mechanical-profile-registered";
      entityId: EntityId;
      profileId: string;
      profileRevision: number;
      provenance: MechanicalProfileProvenance;
    })
  | (DomainEventBase & {
      kind: "characteristic-precipitated";
      deathEventId: string;
      unitIds: CharacteristicUnitId[];
    })
  | (DomainEventBase & {
      kind: "characteristic-unrecovered";
      unitIds: CharacteristicUnitId[];
      custody: CustodyDisposition;
    })
  | (DomainEventBase & {
      kind: "characteristic-recovered";
      unitIds: CharacteristicUnitId[];
    })
  | (DomainEventBase & {
      kind: "loot-recovered";
      sourceEventId: string;
      items: MechanicalItemProjection[];
    })
  | (DomainEventBase & {
      kind: "inventory-unit-transferred";
      unitId: CharacteristicUnitId;
      transferApplicationId: string;
    })
  | (DomainEventBase & {
      kind: "hunt-delivered";
      huntId: string;
      unitId?: CharacteristicUnitId;
      material?: MechanicalItemProjection;
      spoils: MechanicalItemProjection[];
    })
  | (DomainEventBase & {
      kind: "hunt-ended-undelivered";
      huntId: string;
      reason: string;
    })
  | (DomainEventBase & {
      kind: "ally-freed";
      entityId: EntityId;
      follows: boolean;
    })
  | (DomainEventBase & {
      kind: "combat-control-failure";
      severity: FailureSeverity;
      outcome: "setback" | "permadeath";
    })
  | (DomainEventBase & {
      kind: "setback-applied";
      failureId: string;
      lostItems: InventoryItemRef[];
    })
  | (DomainEventBase & {
      kind: "chronicle-ended";
      failureId: string;
      severity: FailureSeverity;
    });

/**
 * Mirrors `LossOfControlSeverity` in `@/lib/game/sanity.ts`. Restated here so the
 * type layer never imports from the engine layer (the dependency runs one way).
 */
export type FailureSeverity = "setback" | "transformation" | "fatal";

/**
 * What became of the opponent — the fact `"victory"` was wrongly used as a proxy
 * for. Authorized by the mortality gate, never by the tactical outcome label.
 */
export type EnemyFate = "alive" | "dead" | "captured";
