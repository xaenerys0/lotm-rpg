import type { SessionFact } from "@/lib/ai";
import {
  type ArtifactEffect,
  type ArtifactGrade,
  CRAFTED_CODE_RE,
  sealedArtifactNumberFromItemName,
} from "@/lib/lore";
import type { Item } from "@/lib/types/rules";

import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Custom (player-created) artifact registry.
// ---------------------------------------------------------------------------
//
// A crafted Sealed Artifact has no entry in the static `@/lib/lore`
// catalogue, so its rich descriptor lives here, on the session, keyed by a
// SYNTHETIC catalogue code `C<grade>-<NNN>`. The lightweight carried `Item`
// embeds that code in its name (exactly like `mintArtifactItem`), so every
// name-based helper — `sealedArtifactNumberFromItemName`, `gradeForArtifactItem`
// (which reads the grade straight from the `C<d>-` prefix), the combat
// `availableArtifacts` filter, `artifactBacklash` — keeps working WITHOUT the
// lore layer ever importing this game-layer registry. The effects (the powers)
// are derived from the source Beyonder Characteristic's pathway + sequence by
// `artifice.ts`/`artifact-effects.ts` and stored here so the effect system and
// the character sheet can read them back.
//
// Mirrors the `acquired-powers.ts` sub-state pattern exactly: an optional shape
// on the session, strictly validated, preserved on the deserialize `...s`
// spread, never AI-mutable. Pure + deterministic.

/** One player-crafted artifact's durable descriptor (out of the carried `Item`). */
export interface CustomArtifact {
  /** Synthetic catalogue code "C<grade>-<NNN>" — embedded in the item name. */
  code: string;
  /** Player-chosen display name. */
  name: string;
  /** Danger grade, fixed by the source characteristic's sequence band. */
  grade: ArtifactGrade;
  /** The consumed Beyonder Characteristic's pathway id (1-22). */
  sourcePathwayId: number;
  /** The consumed Beyonder Characteristic's sequence (1-9). */
  sourceSequence: number;
  /** The powers, derived from pathway + sequence. */
  effects: ArtifactEffect[];
  /** The grade-scaled "loss of control" cost (the defining downside). */
  drawback: string;
  /** Optional player free-text flavour. */
  flavor?: string;
  /** Current owner's character name by default (flavour — never required). */
  ownerName?: string;
  /** The turn it was crafted on (for display / journalling). */
  craftedAtTurn: number;
}

/** The session's custom-artifact registry. `nextOrdinal` makes codes unique. */
export interface CustomArtifactState {
  artifacts: CustomArtifact[];
  nextOrdinal: number;
}

/** Hard cap on crafted artifacts a save may carry data for. */
export const MAX_CUSTOM_ARTIFACTS = 24;

/** Length caps for the free-text fields (in step with the rest of the engine). */
export const CUSTOM_ARTIFACT_NAME_CAP = 80;
export const CUSTOM_ARTIFACT_FLAVOR_CAP = 280;
export const CUSTOM_ARTIFACT_OWNER_CAP = 80;

/** An empty registry — the lazily-resolved default for a save with none. */
export function emptyCustomArtifactState(): CustomArtifactState {
  return { artifacts: [], nextOrdinal: 1 };
}

/** Lazy `?? empty` boundary, mirroring `resolveProfileState`/`resolveTrackedNpcState`. */
export function resolveCustomArtifactState(
  state: CustomArtifactState | undefined,
): CustomArtifactState {
  return state ?? emptyCustomArtifactState();
}

/** Allocate the next synthetic code for a grade, e.g. "C3-001". */
export function nextCustomArtifactCode(
  state: CustomArtifactState,
  grade: ArtifactGrade,
): string {
  return `C${grade}-${String(state.nextOrdinal).padStart(3, "0")}`;
}

/**
 * Mint the lightweight carried `Item` for a crafted artifact — the same
 * self-describing shape as `mintArtifactItem`, so the carried item recovers its
 * code (and hence grade) from its name. Sealed Artifacts persist on use
 * (`consumable: false`), so the backlash is their only cost.
 */
export function mintCustomArtifactItem(artifact: CustomArtifact): Item {
  const powers = artifact.effects.map((e) => e.label).join(", ");
  const powerClause = powers.length > 0 ? ` Powers: ${powers}.` : "";
  return {
    name: `Sealed Artifact ${artifact.code} — ${artifact.name}`,
    description: `${artifact.flavor ? `${artifact.flavor} ` : ""}(Grade ${artifact.grade}, crafted.${powerClause} Drawback: ${artifact.drawback})`,
    category: "sealed-artifact",
    consumable: false,
  };
}

/** Look up a crafted artifact by its synthetic code. */
export function findCustomArtifact(
  session: GameSession,
  code: string,
): CustomArtifact | undefined {
  return (session.customArtifactState?.artifacts ?? []).find((a) => a.code === code);
}

/**
 * The crafted artifact a carried `Item` refers to (by the code embedded in its
 * name), or `undefined` for a catalogue/mundane item or one not in the registry.
 */
export function customArtifactForItem(
  item: Item,
  state: CustomArtifactState | undefined,
): CustomArtifact | undefined {
  if (item.category !== "sealed-artifact") return undefined;
  const code = sealedArtifactNumberFromItemName(item.name);
  if (code === undefined || !CRAFTED_CODE_RE.test(code)) return undefined;
  return (state?.artifacts ?? []).find((a) => a.code === code);
}

export interface RegisterCustomArtifactInput {
  name: string;
  grade: ArtifactGrade;
  sourcePathwayId: number;
  sourceSequence: number;
  effects: ArtifactEffect[];
  drawback: string;
  flavor?: string;
  ownerName?: string;
}

export type RegisterCustomArtifactOutcome = "registered" | "at-capacity" | "missing-name";

export interface RegisterCustomArtifactResult {
  outcome: RegisterCustomArtifactOutcome;
  state?: CustomArtifactState;
  artifact?: CustomArtifact;
}

function trimTo(value: string, cap: number): string {
  const trimmed = value.trim();
  return trimmed.length > cap ? trimmed.slice(0, cap) : trimmed;
}

/**
 * REGISTER a freshly-crafted artifact into the state: allocate its code, store
 * the descriptor, bump `nextOrdinal`. Pure — `artifice.ts` composes this with
 * the inventory/funds mutations and the memory fact. Returns the new state and
 * the stored artifact (with its allocated code) so the caller can mint the item.
 */
export function registerCustomArtifact(
  state: CustomArtifactState,
  input: RegisterCustomArtifactInput,
  turnNumber: number,
): RegisterCustomArtifactResult {
  const name = trimTo(input.name ?? "", CUSTOM_ARTIFACT_NAME_CAP);
  if (name.length === 0) return { outcome: "missing-name" };
  if (state.artifacts.length >= MAX_CUSTOM_ARTIFACTS) return { outcome: "at-capacity" };

  const artifact: CustomArtifact = {
    code: nextCustomArtifactCode(state, input.grade),
    name,
    grade: input.grade,
    sourcePathwayId: input.sourcePathwayId,
    sourceSequence: input.sourceSequence,
    effects: input.effects,
    drawback: input.drawback,
    craftedAtTurn: turnNumber,
  };
  const flavor = input.flavor ? trimTo(input.flavor, CUSTOM_ARTIFACT_FLAVOR_CAP) : "";
  if (flavor.length > 0) artifact.flavor = flavor;
  const owner = input.ownerName ? trimTo(input.ownerName, CUSTOM_ARTIFACT_OWNER_CAP) : "";
  if (owner.length > 0) artifact.ownerName = owner;

  return {
    outcome: "registered",
    artifact,
    state: {
      artifacts: [...state.artifacts, artifact],
      nextOrdinal: state.nextOrdinal + 1,
    },
  };
}

/**
 * REMOVE a crafted artifact's descriptor by code (when the carried item leaves
 * the save — traded, fenced, lost). Seeds nothing; the caller owns the item
 * mutation and any fact. A no-op when absent. Pure.
 */
export function forgetCustomArtifact(
  state: CustomArtifactState,
  code: string,
): CustomArtifactState {
  if (!state.artifacts.some((a) => a.code === code)) return state;
  return { ...state, artifacts: state.artifacts.filter((a) => a.code !== code) };
}

/**
 * A memory fact recording a crafted artifact's creation — the narrator should
 * know the relic now exists and what it does.
 */
export function craftedArtifactFact(
  artifact: CustomArtifact,
  turnNumber: number,
): SessionFact {
  const powers = artifact.effects.map((e) => e.label).join(", ");
  return {
    type: "event",
    description: `Crafted the Grade ${artifact.grade} Sealed Artifact "${artifact.name}"${
      powers.length > 0 ? ` — ${powers}` : ""
    }. Its drawback: ${artifact.drawback}`,
    turnNumber,
  };
}

// ── Shape validation (strict, for deserialize) ──────────────────────────────

function isValidEffectShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const e = obj as Record<string, unknown>;
  if (typeof e.label !== "string" || e.label.length === 0) return false;
  if (typeof e.description !== "string") return false;
  if (typeof e.hook !== "string" || e.hook.length === 0) return false;
  if (e.params !== undefined) {
    if (typeof e.params !== "object" || e.params === null || Array.isArray(e.params)) {
      return false;
    }
  }
  return true;
}

const GRADES: readonly number[] = [0, 1, 2, 3];

export function isValidCustomArtifactShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const a = obj as Record<string, unknown>;
  if (typeof a.code !== "string" || !CRAFTED_CODE_RE.test(a.code)) return false;
  if (typeof a.name !== "string" || a.name.length === 0) return false;
  if (typeof a.grade !== "number" || !GRADES.includes(a.grade)) return false;
  if (!Number.isInteger(a.sourcePathwayId)) return false;
  if (!Number.isInteger(a.sourceSequence)) return false;
  if (!Array.isArray(a.effects) || !a.effects.every(isValidEffectShape)) return false;
  if (typeof a.drawback !== "string") return false;
  if (a.flavor !== undefined && typeof a.flavor !== "string") return false;
  if (a.ownerName !== undefined && typeof a.ownerName !== "string") return false;
  if (!Number.isFinite(a.craftedAtTurn)) return false;
  return true;
}

/** Strict shape check for a session's `customArtifactState` (absent is valid elsewhere). */
export function isValidCustomArtifactStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Array.isArray(s.artifacts) || !s.artifacts.every(isValidCustomArtifactShape)) {
    return false;
  }
  if (
    typeof s.nextOrdinal !== "number" ||
    !Number.isInteger(s.nextOrdinal) ||
    s.nextOrdinal < 1
  ) {
    return false;
  }
  return true;
}
