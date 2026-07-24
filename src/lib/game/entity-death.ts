import { canonMortalityPolicy } from "@/lib/lore/entity-profiles";
import type {
  AuthoritativeEntityRecord,
  CanonMortalityPolicy,
  EntityDeathCommandSource,
  EntityDeathDecision,
  EntityId,
  EntityRegistryState,
} from "@/lib/types/entities";

import { findEntity } from "./entities";

// ---------------------------------------------------------------------------
// Death authorization (issue #227).
//
// The gate every death — combat, narrated, scripted, or the player's own — must
// pass BEFORE any state changes. It exists because "may this die?" and "did this
// die?" were the same question before, which let a canon figure be killed in a
// chronicle that had not yet met them.
//
// The policy is deliberately conservative:
//
// - An ORDINARY actor dies unless something in the fiction is actively blocking it.
// - A CANONICAL figure needs a curated policy (`@/lib/lore/entity-profiles.ts`).
//   Missing, malformed, wrong epoch, too early, or a disallowed command source all
//   mean BLOCKED. Alternative history is welcome after a figure is introduced;
//   erasing them before they appear is not.
// - `"narrative-intent"` — the narrator's structured death claim — is not among the
//   sources the curated canon policies allow. Prose may describe a canon death;
//   only an engine-owned command may apply one.
//
// The verdict is DATA (`EntityDeathDecision`), recorded on the application plan and
// emitted as a domain event, so a blocked death is auditable rather than silent.
// Applying the death (`applyEntityDeath`) lands in the next phase; this module only
// decides.
//
// Pure + deterministic. Design doc: `docs/entity-death-design.md`.
// ---------------------------------------------------------------------------

/** Why a death was refused. Exhaustive and stable — the UI and journal quote it. */
export type DeathBlockReason =
  | "unknown-entity"
  | "not-alive"
  | "protected-by-effect"
  | "no-policy"
  | "policy-protected"
  | "wrong-epoch"
  | "too-early"
  | "source-not-allowed";

export interface AuthorizeEntityDeathInput {
  registry: EntityRegistryState;
  entityId: EntityId;
  /** Who is ordering the death. */
  source: EntityDeathCommandSource;
  /** The chronicle's position on the canon timeline (`GameSession.canonPosition`). */
  canonPosition: number;
  /** The character's era (`GameState.epoch`). */
  epoch: number;
  /**
   * Curated-policy lookup seam. Defaults to the committed catalogue; injected in
   * tests and by any trusted tool that needs to reason about a hypothetical.
   */
  policyFor?: (canonRef: string) => CanonMortalityPolicy | undefined;
}

function blocked(reason: DeathBlockReason, canonPosition: number): EntityDeathDecision {
  return { status: "blocked", evaluatedCanonPosition: canonPosition, reason };
}

function activeProtection(entity: AuthoritativeEntityRecord): boolean {
  return entity.protections.some((protection) => protection.effect === "blocks-death");
}

/**
 * Decide whether `entityId` may die now. Never mutates; returns the verdict to
 * record. Order of checks is significant only for which reason is reported — every
 * failing check blocks.
 */
export function authorizeEntityDeath(
  input: AuthorizeEntityDeathInput,
): EntityDeathDecision {
  const { registry, entityId, source, canonPosition, epoch } = input;
  const policyFor = input.policyFor ?? canonMortalityPolicy;

  const entity = findEntity(registry, entityId);
  if (!entity) return blocked("unknown-entity", canonPosition);
  // Only the living die. A second command for an already-dead entity is refused
  // here, which is what stops a replay from creating a second death record.
  if (entity.lifeState !== "alive") return blocked("not-alive", canonPosition);

  // An in-fiction death block outranks everything, canonical or not.
  if (activeProtection(entity)) return blocked("protected-by-effect", canonPosition);

  // An ordinary (non-canonical) actor needs no policy.
  if (entity.canonRef === undefined) {
    return { status: "allowed", evaluatedCanonPosition: canonPosition };
  }

  const policy = policyFor(entity.canonRef);
  // Fail closed: no authored policy means protected. There are hundreds of canon
  // figures and only a handful of authored policies, so silence must mean "no".
  if (!policy) return blocked("no-policy", canonPosition);
  if (policy.kind === "protected") {
    return {
      status: "blocked",
      policyId: policy.policyId,
      policyVersion: policy.version,
      evaluatedCanonPosition: canonPosition,
      reason: "policy-protected",
    };
  }

  const decisionBase = {
    policyId: policy.policyId,
    policyVersion: policy.version,
    evaluatedCanonPosition: canonPosition,
  };

  // A figure is only killable in the era they actually inhabit.
  if (!policy.activeEpochs.includes(epoch)) {
    return { ...decisionBase, status: "blocked", reason: "wrong-epoch" };
  }
  // Before the chronicle has reached their introduction, they cannot be erased.
  // Negated `>=` rather than `<` so a non-finite position fails CLOSED: `NaN < n`
  // is false, which would have waved an unusable timeline straight through.
  if (!(canonPosition >= policy.minCanonPosition)) {
    return { ...decisionBase, status: "blocked", reason: "too-early" };
  }
  // Narrator intent is not an allowlisted source for a canon figure.
  if (!policy.allowedSources.includes(source)) {
    return { ...decisionBase, status: "blocked", reason: "source-not-allowed" };
  }

  return { ...decisionBase, status: "allowed" };
}

/**
 * Whether an entity may be picked as a LETHAL target at all — the pre-filter for
 * random/automatic opponent selection, so a protected canon figure is never even
 * offered as a kill. Same rules as `authorizeEntityDeath`, minus the command
 * source (which is not known at selection time).
 */
export function isLethalSelectionEligible(
  input: Omit<AuthorizeEntityDeathInput, "source">,
): boolean {
  const decision = authorizeEntityDeath({
    ...input,
    // Probe with an always-allowlisted engine source: selection asks "could this
    // ever be killed here", not "may this narrator kill it".
    source: "combat",
  });
  return decision.status === "allowed";
}
