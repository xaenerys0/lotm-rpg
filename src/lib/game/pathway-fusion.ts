import { getPathway } from "@/lib/rules";
import type { CombatAbility } from "@/lib/types/combat";

import { sequenceAbilities } from "./apotheosis";
import { combatAbilityFrom, combatKitFor } from "./combat-abilities";
import {
  fusedRetainedAbilities,
  type PathwaySwitch,
  type RetainedAbility,
} from "./pathway-lineage";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Pathway fusion (issue #211) — combining the current pathway's kit with the
// abilities kept from every pathway switched away from.
// ---------------------------------------------------------------------------
//
// Canon: a successful switch keeps the previous pathway's powers "fused together
// with the powers provided by their current, new pathway potion … a certain level
// of mutation, creating unique and bizarre powers." The current pathway's kit is
// the apex-aware `sequenceAbilities`/`combatKitFor` primitive (unchanged); fusion
// layers the frozen retained abilities on top, tagged `(fused)` — the mutation
// flavour, mirroring the existing `(enhanced)` suffix.
//
// Dedup: the current pathway wins; among priors the most-recent switch wins
// (`fusedRetainedAbilities`). A save that has never switched carries no lineage,
// so every helper here returns the base kit unchanged (byte-identical to before).
//
// Pure. The two engine call sites (the narrator prompt and combat) swap their
// base derivation for the fused one; the character sheet renders the retained
// groups.

/** The `(fused)` mutation tag, analogous to the `(enhanced)` suffix. */
const FUSED_TAG = "(fused)";

/** Strip a trailing display suffix so names dedup on their bare form. */
function bareName(name: string): string {
  return name.replace(/\s*\((?:enhanced|fused)\)$/, "");
}

/**
 * The character's full ability NAME list: the current pathway's apex-aware kit
 * (with `(enhanced)` intact) followed by the deduped abilities retained from every
 * prior switch, each tagged `(fused)`. Consumed by the narrator prompt and the
 * combat ability-name derivation. Returns the base list unchanged when the
 * character has never switched. Pure.
 */
export function fusedAbilityNames(session: GameSession): string[] {
  const { abilities } = sequenceAbilities(
    session.gameState.pathwayId,
    session.gameState.sequenceLevel,
  );
  const retained = fusedRetainedAbilities(session.pathwayLineage);
  if (retained.length === 0) return abilities;

  const seen = new Set(abilities.map(bareName));
  const fused: string[] = [];
  for (const ability of retained) {
    if (seen.has(ability.name)) continue;
    seen.add(ability.name);
    fused.push(`${ability.name} ${FUSED_TAG}`);
  }
  return [...abilities, ...fused];
}

/**
 * The character's full combat kit: the current pathway's `combatKitFor` plus the
 * retained abilities of every prior switch built into combat abilities
 * (`combatAbilityFrom`, reusing the real role+depth scaling), deduped against the
 * base kit by name. Returns the base kit unchanged when the character has never
 * switched. Pure.
 */
export function fusedCombatKit(session: GameSession): CombatAbility[] {
  const base = combatKitFor(session.gameState.pathwayId, session.gameState.sequenceLevel);
  const retained = fusedRetainedAbilities(session.pathwayLineage);
  if (retained.length === 0) return base;

  const seen = new Set(base.map((ability) => ability.name));
  const fused: CombatAbility[] = [];
  for (const ability of retained) {
    if (seen.has(ability.name)) continue;
    seen.add(ability.name);
    const built = combatAbilityFrom(
      {
        name: ability.name,
        description: ability.description,
        sourceLevel: ability.sourceLevel,
      },
      ability.sourceLevel,
    );
    // Give fused abilities their OWN id namespace so a `kit-<pathwayId>-<slug>`
    // base id can never collide with a fused one (a retained ability's rung could
    // numerically equal the current pathway id). Retained names are already
    // deduped, so `fused-` ids are unique amongst themselves too.
    fused.push({ ...built, id: `fused-${built.id}` });
  }
  return [...base, ...fused];
}

/** A switched-away pathway's retained abilities, grouped for the character sheet. */
export interface RetainedAbilityGroup {
  fromPathwayId: number;
  fromPathwayName: string;
  atSequence: number;
  kind: PathwaySwitch["kind"];
  abilities: RetainedAbility[];
}

/**
 * The retained-ability groups the character sheet renders — one per switch,
 * newest first, each naming the pathway left behind and how (neighbouring vs the
 * unrelated poison). Empty when the character has never switched. Pure.
 */
export function retainedAbilityGroups(session: GameSession): RetainedAbilityGroup[] {
  const switches = session.pathwayLineage?.switches ?? [];
  return switches
    .map((entry) => ({
      fromPathwayId: entry.fromPathwayId,
      fromPathwayName:
        getPathway(entry.fromPathwayId)?.name ?? `Pathway ${entry.fromPathwayId}`,
      atSequence: entry.atSequence,
      kind: entry.kind,
      abilities: entry.retained,
    }))
    .reverse();
}
