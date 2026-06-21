import type { SessionFact } from "@/lib/ai";
import { pickRandom } from "@/lib/lore/random";
import type { Item } from "@/lib/types/rules";

import type { CharacterLegacy } from "./death";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Cross-epoch timeline interactions (issue #31)
// ---------------------------------------------------------------------------
//
// When a chronicle ends, it can leave an ARTIFACT — a physical trace minted
// from the fallen character's story. Future playthroughs (any character, any
// epoch) may discover these as timeline echoes: an item with provenance, a
// memory fact the narrator can weave in, and a journal-worthy moment.
//
// Consistency rule (the paradox guard): an artifact only ever surfaces in an
// epoch AT OR AFTER its origin epoch — the past cannot inherit from the
// future. Within the same epoch, artifacts from prior characters are always
// fair game (that is the existing shared-timeline promise). Echoes are
// non-exclusive: an artifact is a resonance, not a unique object, so several
// timelines may each find "the same" trace without contradiction.

export interface TimelineArtifact {
  id: string;
  name: string;
  description: string;
  originEpoch: number;
  originCharacter: string;
  /** What became of its owner — colors the discovery narration. */
  originFate: "transformed" | "dead";
  createdAt: number;
}

/**
 * Mint the artifact a fallen character leaves in the timeline: their most
 * significant carried item when one exists, else their journal itself.
 */
export function mintArtifact(
  session: GameSession,
  legacy: CharacterLegacy,
  now: number = Date.now(),
  id: string = crypto.randomUUID(),
): TimelineArtifact {
  const epoch = session.gameState.epoch ?? 5;
  const name = legacy.characterName ?? "a nameless Beyonder";
  // Formulas outrank ingredients as a signature possession.
  const signature =
    session.gameState.inventory.find((item) => item.category === "potion-formula") ??
    session.gameState.inventory[0];

  if (signature) {
    return {
      id,
      name: signature.name,
      description: `${signature.description} It bears the marks of another age — it belonged to ${name}.`,
      originEpoch: epoch,
      originCharacter: name,
      originFate: legacy.fate,
      createdAt: now,
    };
  }
  return {
    id,
    name: `${name}'s weathered journal`,
    description: `A journal in a stranger's hand, its last entry unfinished. It belonged to ${name}.`,
    originEpoch: epoch,
    originCharacter: name,
    originFate: legacy.fate,
    createdAt: now,
  };
}

/** The paradox guard: only artifacts from this epoch or earlier surface. */
export function discoverableArtifacts(
  artifacts: readonly TimelineArtifact[],
  currentEpoch: number | undefined,
): TimelineArtifact[] {
  const epoch = currentEpoch ?? 5;
  return artifacts.filter((artifact) => artifact.originEpoch <= epoch);
}

/** Turn a discovered artifact into a carried item with provenance intact. */
export function artifactToItem(artifact: TimelineArtifact): Item {
  return {
    name: artifact.name,
    description: artifact.description,
    // A timeline echo is a resonance/keepsake, never an advancement reagent —
    // mundane so it cannot satisfy a prerequisite or be traded as one (issue #90).
    category: "mundane",
  };
}

/**
 * Memory facts for a fresh session: the narrator learns which echoes exist
 * so it can foreshadow them; a carried discovery gets its own concrete fact.
 */
export function echoFacts(
  artifacts: readonly TimelineArtifact[],
  carried: TimelineArtifact | null,
): SessionFact[] {
  const facts: SessionFact[] = artifacts
    .filter((artifact) => artifact.id !== carried?.id)
    .slice(0, 3)
    .map((artifact) => ({
      type: "event" as const,
      description: `Timeline echo: somewhere in this world lies ${artifact.name}, lost when ${artifact.originCharacter} ${
        artifact.originFate === "dead" ? "died" : "was transformed"
      }${artifact.originEpoch !== 5 ? ` in the epoch ${artifact.originEpoch} era` : ""}.`,
      turnNumber: 0,
    }));

  if (carried) {
    facts.push({
      type: "item-change",
      description: `Begins the story carrying ${carried.name} — a trace of ${carried.originCharacter}, from a previous thread of this timeline.`,
      turnNumber: 0,
    });
  }
  return facts;
}

/**
 * Pick at most one artifact a fresh character starts with (deterministic
 * under the injected randomness; roughly half of new chronicles find one).
 */
export function pickStartingEcho(
  artifacts: readonly TimelineArtifact[],
  currentEpoch: number | undefined,
  random: () => number = Math.random,
): TimelineArtifact | null {
  const discoverable = discoverableArtifacts(artifacts, currentEpoch);
  if (discoverable.length === 0 || random() < 0.5) return null;
  return pickRandom(discoverable, random);
}

export function serializeArtifacts(artifacts: readonly TimelineArtifact[]): string {
  return JSON.stringify(artifacts);
}

/** Strict-shape parse; null for anything malformed. */
export function deserializeArtifacts(json: string): TimelineArtifact[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const valid = parsed.every(
    (entry: unknown) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as TimelineArtifact).id === "string" &&
      typeof (entry as TimelineArtifact).name === "string" &&
      Number.isFinite((entry as TimelineArtifact).originEpoch) &&
      ((entry as TimelineArtifact).originFate === "dead" ||
        (entry as TimelineArtifact).originFate === "transformed"),
  );
  return valid ? (parsed as TimelineArtifact[]) : null;
}
