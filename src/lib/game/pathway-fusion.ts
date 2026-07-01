import {
  getCumulativeAbilities,
  getCumulativeAbilityGroups,
  getPathway,
  type CumulativeAbility,
  type SequenceAbilityGroup,
} from "@/lib/rules";
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
// Canon: a switch is an advancement along a new line — the Beyonder keeps ALL of
// their previous pathway's powers "fused together with the powers provided by
// their current, new pathway potion … a certain level of mutation." But they join
// the new pathway partway down and never digested its weaker rungs, so "missing
// characteristic of lower sequence will lead to lost of some of the corresponding
// abilities."
//
// Two derivations combine:
// - The CURRENT pathway kit, CAPPED to the rungs the character legitimately holds
//   (`heldCumulativeAbilities` — `sourceLevel <= currentJoinSequence`), so the
//   weaker rungs skipped by joining partway down are absent (the canon loss).
// - The frozen retained kit of every prior pathway (`fusedRetainedAbilities`),
//   tagged `(fused)` — the mutation flavour, mirroring the `(enhanced)` suffix.
//
// Dedup: the current pathway wins; among priors the most-recent switch wins. A
// save that has never switched has no cap and no retained kit, so every helper
// returns the base kit unchanged (byte-identical to before).
//
// Pure. The narrator prompt, combat, and the character sheet all route through
// these helpers.

/** The `(fused)` mutation tag, analogous to the `(enhanced)` suffix. */
const FUSED_TAG = "(fused)";

/** The weakest (highest-numbered) rung — the "no cap" sentinel for an unswitched save. */
const UNCAPPED_SEQUENCE = 9;

/** Strip a trailing display suffix so names dedup on their bare form. */
function bareName(name: string): string {
  return name.replace(/\s*\((?:enhanced|fused)\)$/, "");
}

/**
 * The highest rung of the CURRENT pathway the character legitimately holds. After
 * a switch they joined the current pathway one rung below where they left the last
 * one (`lastSwitch.atSequence - 1`), so any current-pathway ability sourced at a
 * WEAKER (higher-numbered) rung was never digested. `9` (no cap) for a save that
 * never switched. Pure.
 */
export function currentJoinSequence(session: GameSession): number {
  const switches = session.pathwayLineage?.switches ?? [];
  if (switches.length === 0) return UNCAPPED_SEQUENCE;
  return switches[switches.length - 1].atSequence - 1;
}

/**
 * The current pathway's cumulative abilities capped to the rungs actually held
 * (`sourceLevel <= currentJoinSequence`) — the weaker rungs skipped by joining a
 * pathway partway down are dropped (the canon switch loss). Identical to the plain
 * cumulative kit for a save that never switched. Pure.
 */
export function heldCumulativeAbilities(session: GameSession): CumulativeAbility[] {
  const cap = currentJoinSequence(session);
  return getCumulativeAbilities(
    session.gameState.pathwayId,
    session.gameState.sequenceLevel,
  ).filter((ability) => ability.sourceLevel <= cap);
}

/**
 * The current pathway's ability groups (per originating rung) the character sheet
 * renders, capped to the rungs actually held. Identical to the plain grouped kit
 * for a save that never switched. Above the sequences (apex) the cap is NOT
 * applied — matching `fusedAbilityNames`/`fusedCombatKit`, so the sheet and the
 * prompt/combat never disagree for a switched-then-ascended character. Pure.
 */
export function heldAbilityGroups(session: GameSession): SequenceAbilityGroup[] {
  const groups = getCumulativeAbilityGroups(
    session.gameState.pathwayId,
    session.gameState.sequenceLevel,
  );
  if (session.gameState.sequenceLevel <= 0) return groups;
  const cap = currentJoinSequence(session);
  return groups.filter((group) => group.level <= cap);
}

/**
 * The character's full ability NAME list: the current pathway's apex-aware kit
 * (with `(enhanced)` intact) followed by the deduped abilities retained from every
 * prior switch, each tagged `(fused)`. Consumed by the narrator prompt and the
 * combat ability-name derivation. Returns the base list unchanged when the
 * character has never switched. Pure.
 */
export function fusedAbilityNames(session: GameSession): string[] {
  // Below the apex the base is the join-capped current kit (so a switched
  // character lacks the new pathway's weaker rungs); at the apex the True-God /
  // Pillar overlays stand (a rare switch-then-ascend edge left uncapped).
  const abilities =
    session.gameState.sequenceLevel <= 0
      ? sequenceAbilities(session.gameState.pathwayId, session.gameState.sequenceLevel)
          .abilities
      : heldCumulativeAbilities(session).map((a) =>
          a.enhanced ? `${a.name} (enhanced)` : a.name,
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
  // Below the apex, cap the base kit to the rungs actually held (the switch loss);
  // at the apex fall back to the plain kit (a rare switch-then-ascend edge).
  const base =
    session.gameState.sequenceLevel <= 0
      ? combatKitFor(session.gameState.pathwayId, session.gameState.sequenceLevel)
      : heldCumulativeAbilities(session).map((a) =>
          combatAbilityFrom(a, session.gameState.pathwayId),
        );
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
