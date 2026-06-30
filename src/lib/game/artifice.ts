import type { SessionFact } from "@/lib/ai";
import { getPathway } from "@/lib/rules";
import type { ArtifactGrade } from "@/lib/lore";
import type { Item } from "@/lib/types/rules";

import { deriveArtifactDrawback, deriveArtifactEffects } from "./artifact-effects";
import {
  type CustomArtifact,
  craftedArtifactFact,
  mintCustomArtifactItem,
  registerCustomArtifact,
  resolveCustomArtifactState,
} from "./custom-artifacts";
import { removeItemsByName } from "./inventory";
import { adjustFunds, canAfford } from "./marketplace";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Artifice — crafting a Sealed Artifact.
// ---------------------------------------------------------------------------
//
// Canon (corpus-verified): a Sealed Artifact is crafted by a Paragon-pathway
// "Artisan" (Sequence 6) or higher, fusing a Beyonder Characteristic. So a
// Paragon character at Sequence ≤ 6 can SELF-CRAFT; any other character can
// COMMISSION an artisan NPC for a fee. Either way the craft CONSUMES a Beyonder
// Characteristic item (the existing `main-ingredient` reagent) AND charges funds
// (a commission fee, or a materials cost). The artifact's grade is fixed by the
// characteristic's sequence band, and its effects (powers) + drawback are derived
// from the characteristic's pathway + sequence. Pure + deterministic.

/** Paragon — the canon crafting pathway ("Artisan" is its Sequence 6 role). */
export const PARAGON_PATHWAY_ID = 19;

/** A self-crafting Paragon must be at or beyond the Artisan rung (Seq ≤ 6). */
export const ARTISAN_SEQUENCE = 6;

export type CraftMode = "self" | "commission";

export interface CraftCapability {
  /** A Paragon at Seq ≤ 6 may forge an artifact themselves. */
  canSelfCraft: boolean;
  /** Anyone may pay an artisan NPC to forge one. */
  canCommission: boolean;
}

/** The crafting means available to the character right now. Pure. */
export function craftCapability(session: GameSession): CraftCapability {
  const { pathwayId, sequenceLevel } = session.gameState;
  return {
    canSelfCraft: pathwayId === PARAGON_PATHWAY_ID && sequenceLevel <= ARTISAN_SEQUENCE,
    canCommission: true,
  };
}

/** Whether the character can craft an artifact by any means (always true via commission). */
export function canCraftArtifact(session: GameSession): boolean {
  const cap = craftCapability(session);
  return cap.canSelfCraft || cap.canCommission;
}

/**
 * The grade an artifact takes from the source Characteristic's sequence — the
 * user-specified band. A god-tier (Seq 0) characteristic yields NO artifact
 * (canon: a god's death drops characteristics, not an artifact), returning
 * `null`. Pure.
 */
export function gradeForCharacteristicSequence(seq: number): ArtifactGrade | null {
  if (seq >= 7 && seq <= 9) return 3;
  if (seq >= 5 && seq <= 6) return 2;
  if (seq >= 3 && seq <= 4) return 1;
  if (seq >= 1 && seq <= 2) return 0;
  return null; // Seq 0 (god) or out of range — no artifact.
}

const CHARACTERISTIC_NAME_RE = /^Sequence (\d+) (.+) Beyonder Characteristic$/;

/**
 * Parse a Beyonder Characteristic item into its pathway + sequence. Only a true
 * `main-ingredient` "Sequence N <Pathway> Beyonder Characteristic" fuses — a
 * creature-material main ingredient returns `undefined` (canon: an artifact
 * fuses a Characteristic, not a beast part). Pure.
 */
export function parseCharacteristicItem(
  item: Item,
): { pathwayId: number; sequence: number } | undefined {
  if (item.category !== "main-ingredient") return undefined;
  const match = CHARACTERISTIC_NAME_RE.exec(item.name);
  if (!match) return undefined;
  const sequence = Number(match[1]);
  if (!Number.isInteger(sequence)) return undefined;
  const pathwayName = match[2].trim().toLowerCase();
  for (let id = 1; id <= 22; id += 1) {
    if (getPathway(id)?.name.toLowerCase() === pathwayName) {
      return { pathwayId: id, sequence };
    }
  }
  return undefined;
}

// Fees in pence, grade-scaled (Grade 0 is the costliest). A commission costs
// more than self-crafting (you pay the artisan's labour and silence).
export const SELF_CRAFT_MATERIALS_COST_BY_GRADE: Record<ArtifactGrade, number> = {
  3: 80,
  2: 250,
  1: 800,
  0: 2500,
};

export const COMMISSION_FEE_BY_GRADE: Record<ArtifactGrade, number> = {
  3: 300,
  2: 1000,
  1: 3000,
  0: 9000,
};

/** The funds a craft costs for a mode + grade. Pure. */
export function craftFee(mode: CraftMode, grade: ArtifactGrade): number {
  return mode === "commission"
    ? COMMISSION_FEE_BY_GRADE[grade]
    : SELF_CRAFT_MATERIALS_COST_BY_GRADE[grade];
}

export interface CraftArtifactInput {
  /** The exact name of the Beyonder Characteristic item to fuse (and consume). */
  characteristicItemName: string;
  mode: CraftMode;
  /** Player-chosen artifact name. */
  name: string;
  /** Optional player free-text flavour. */
  flavor?: string;
}

export type CraftOutcome =
  | "crafted"
  | "no-capability"
  | "missing-characteristic"
  | "god-tier-forbidden"
  | "invalid-name"
  | "unaffordable"
  | "at-capacity";

export interface CraftResult {
  outcome: CraftOutcome;
  session?: GameSession;
  item?: Item;
  artifact?: CustomArtifact;
  fee?: number;
}

/**
 * Forge a Sealed Artifact. Validates the means (self-craft needs Paragon Seq ≤ 6;
 * commission is always available), finds + parses the Characteristic to fuse,
 * derives the grade from its sequence (rejecting a god-tier one), checks the
 * name and the fee, then CONSUMES the Characteristic, debits the fee, derives the
 * effects + drawback, registers the artifact, mints the carried item, and seeds a
 * memory fact. Pure + deterministic (injected `now`). Order of checks is
 * capability → characteristic → grade → name → funds → capacity, so nothing is
 * consumed when the craft is refused.
 */
export function craftArtifact(
  session: GameSession,
  input: CraftArtifactInput,
  now: number = Date.now(),
): CraftResult {
  const capability = craftCapability(session);
  if (input.mode === "self" && !capability.canSelfCraft) {
    return { outcome: "no-capability" };
  }

  const characteristic = session.gameState.inventory.find(
    (i) => i.name === input.characteristicItemName,
  );
  const parsed = characteristic ? parseCharacteristicItem(characteristic) : undefined;
  if (!characteristic || !parsed) return { outcome: "missing-characteristic" };

  const grade = gradeForCharacteristicSequence(parsed.sequence);
  if (grade === null) return { outcome: "god-tier-forbidden" };

  if (input.name.trim().length === 0) return { outcome: "invalid-name" };

  const fee = craftFee(input.mode, grade);
  if (!canAfford(session.gameState, fee)) return { outcome: "unaffordable", fee };

  const registry = resolveCustomArtifactState(session.customArtifactState);
  const effects = deriveArtifactEffects(parsed.pathwayId, parsed.sequence, grade);
  const drawback = deriveArtifactDrawback(parsed.pathwayId, grade);
  const registration = registerCustomArtifact(
    registry,
    {
      name: input.name,
      grade,
      sourcePathwayId: parsed.pathwayId,
      sourceSequence: parsed.sequence,
      effects,
      drawback,
      flavor: input.flavor,
      ownerName: session.gameState.characterName,
    },
    session.turnCount,
  );
  if (registration.outcome !== "registered") {
    return {
      outcome: registration.outcome === "at-capacity" ? "at-capacity" : "invalid-name",
    };
  }
  const artifact = registration.artifact!;
  const item = mintCustomArtifactItem(artifact);

  // Consume the Characteristic, debit the fee, deliver the artifact.
  const withoutCharacteristic = {
    ...session.gameState,
    inventory: removeItemsByName(session.gameState.inventory, [characteristic]),
  };
  const debited = adjustFunds(withoutCharacteristic, -fee);
  const gameState = { ...debited, inventory: [...debited.inventory, item] };

  const fact: SessionFact = craftedArtifactFact(artifact, session.turnCount);

  return {
    outcome: "crafted",
    item,
    artifact,
    fee,
    session: {
      ...session,
      gameState,
      customArtifactState: registration.state,
      memory: {
        ...session.memory,
        sessionFacts: [...session.memory.sessionFacts, fact],
      },
      updatedAt: now,
    },
  };
}
