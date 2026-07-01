import { getCumulativeAbilities } from "@/lib/rules";

import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Pathway lineage — the pathways a Beyonder has switched AWAY from (issue #211)
// ---------------------------------------------------------------------------
//
// Canon (wiki "Switching Pathways" + "Law of Similar Sequence Beyonder
// Characteristics Conservation"): a high-Sequence Beyonder may exchange to a
// neighbouring pathway and, if successful, "keep all of their powers from the
// previous Pathway … fused together with the powers provided by their current,
// new pathway potion. It creates a certain level of mutation." But "missing
// characteristic of lower sequence will lead to lost of some of the
// corresponding abilities."
//
// The switch engine (`pathway-switch.ts`) rewrites `gameState.pathwayId` to the
// NEW pathway (so future advancement climbs it) and records the pathway left
// behind here, WITH a frozen snapshot of the abilities retained from it. Freezing
// the retained set at switch time — rather than recomputing a prior pathway's kit
// at a level the character no longer occupies — makes fusion a cheap, drift-proof
// concatenation that is stable across renders and correct across any number of
// switches.
//
// `PathwayLineageState` is a single optional sub-state on the session (mirroring
// `ritualState`/`acquiredPowers`): strictly validated, preserved on the
// deserialize `...s` spread, never seeded. No DB migration (it serializes inside
// the session blob). Pure.

/** One ability retained (frozen) from a pathway the character switched away from. */
export interface RetainedAbility {
  name: string;
  description: string;
  type: "passive" | "active";
  /** The rung of the prior pathway this ability was earned at. */
  sourceLevel: number;
}

/** A single pathway switch the character has made. */
export interface PathwaySwitch {
  /** The pathway left behind. */
  fromPathwayId: number;
  /** The rung the switch happened at (unchanged by the switch itself). */
  atSequence: number;
  /** Whether the target was an adjacent (safe) or unrelated (poison) pathway. */
  kind: "neighboring" | "unrelated";
  /** The turn the switch was made (for narration / the sheet). */
  switchTurn: number;
  /**
   * The frozen post-loss snapshot of the abilities kept from `fromPathwayId`.
   * Computed once via `retainedAbilitiesFor` and never recomputed.
   */
  retained: RetainedAbility[];
}

/** The ordered history (oldest → newest) of pathways the character left behind. */
export interface PathwayLineageState {
  switches: PathwaySwitch[];
}

/** Whether the character has switched pathways at least once. */
export function hasSwitchedPathways(session: GameSession): boolean {
  return (session.pathwayLineage?.switches.length ?? 0) > 0;
}

/**
 * The abilities retained from `fromPathwayId` when switching away at rung
 * `atSequence`. Canon: a switch keeps the previous pathway's powers, but the
 * "missing characteristic of lower sequence" costs "some of the corresponding
 * abilities." We model that deterministically: the character climbed `A` from
 * Seq 9 down to `atSequence`, so its earned abilities are
 * `getCumulativeAbilities(A, atSequence)`; the ones sourced at the switch rung
 * ITSELF (the deepest characteristic, no longer carried forward) are dropped, and
 * the shallower rungs are kept. Pure — no randomness, identical every call.
 */
export function retainedAbilitiesFor(
  fromPathwayId: number,
  atSequence: number,
): RetainedAbility[] {
  return getCumulativeAbilities(fromPathwayId, atSequence)
    .filter((ability) => ability.sourceLevel > atSequence)
    .map((ability) => ({
      name: ability.name,
      description: ability.description,
      type: ability.type,
      sourceLevel: ability.sourceLevel,
    }));
}

/**
 * Build a `PathwaySwitch` record, freezing the OUTGOING pathway's post-loss
 * ability snapshot (`retainedAbilitiesFor`). The single constructor both the
 * switch engine and the admin builder use, so the record shape can't drift. Pure.
 */
export function makePathwaySwitch(
  fromPathwayId: number,
  atSequence: number,
  kind: PathwaySwitch["kind"],
  switchTurn: number,
): PathwaySwitch {
  return {
    fromPathwayId,
    atSequence,
    kind,
    switchTurn,
    retained: retainedAbilitiesFor(fromPathwayId, atSequence),
  };
}

/**
 * Append a switch to the lineage, returning the new state. The `retained` snapshot
 * is the OUTGOING pathway's post-loss ability set (`retainedAbilitiesFor`). Pure.
 */
export function recordPathwaySwitch(
  existing: PathwayLineageState | undefined,
  entry: PathwaySwitch,
): PathwayLineageState {
  const switches = existing ? existing.switches : [];
  return { switches: [...switches, entry] };
}

/**
 * The deduped abilities retained across every prior switch, most-recent switch
 * winning on a name collision (reverse iteration) — mirroring the issue-#210
 * family-kit first-winner precedent. This is the "old powers" half of the fusion;
 * the current pathway's own kit (and the dedup against it) is applied by the
 * fusion wrapper (`fusedAbilityNames`/`fusedCombatKit`). Pure.
 */
export function fusedRetainedAbilities(
  lineage: PathwayLineageState | undefined,
): RetainedAbility[] {
  if (!lineage) return [];
  const seen = new Set<string>();
  const out: RetainedAbility[] = [];
  for (let i = lineage.switches.length - 1; i >= 0; i--) {
    for (const ability of lineage.switches[i].retained) {
      if (seen.has(ability.name)) continue;
      seen.add(ability.name);
      out.push(ability);
    }
  }
  return out;
}

function isValidRetainedAbility(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const a = obj as Record<string, unknown>;
  if (typeof a.name !== "string" || a.name.length === 0) return false;
  if (typeof a.description !== "string") return false;
  if (a.type !== "passive" && a.type !== "active") return false;
  if (!Number.isFinite(a.sourceLevel)) return false;
  return true;
}

function isValidPathwaySwitch(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Number.isFinite(s.fromPathwayId)) return false;
  if (!Number.isFinite(s.atSequence)) return false;
  if (s.kind !== "neighboring" && s.kind !== "unrelated") return false;
  if (!Number.isFinite(s.switchTurn)) return false;
  if (!Array.isArray(s.retained)) return false;
  return s.retained.every(isValidRetainedAbility);
}

export function isValidPathwayLineageShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Array.isArray(s.switches)) return false;
  return s.switches.every(isValidPathwaySwitch);
}
