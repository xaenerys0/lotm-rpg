# Pathway Switching & Cross-Pathway Ability Mixing — Design

Status: research + implementation-ready design (issue #211, Phase 3 of the
advancement/lore-faithfulness roadmap led by #209).

Phase 1 (#209) made Seq ≤5 advancement rituals corpus-faithful; Phase 2 (#210)
surfaced the Pillar/True-God family kits. Phase 3 adds the largest missing canon
system: a Beyonder **switching pathways** and playing a **fused** character whose
powers combine both pathways.

## Canon grounding

Verified against `corpus/wiki/lordofthemystery_pages_current.xml` (Git LFS):

- **Law of Similar Sequence Beyonder Characteristics Conservation** (Beyonders
  page): _"High-Sequence Beyonders can exchange pathways with similar pathways
  starting at Sequence 4. The only exception is for the pathways of the Lord of
  Mysteries group, which can only be exchanged starting at Sequence 3."_ And:
  after death a Beyonder who exchanged pathways releases the digested
  characteristics of BOTH pathways — _"even if the pathways are non-adjacent
  (Roselle's death released Mystery Pryer and Savant alongside Black Emperor)."_
- **Switching Pathways** (Pathways page): _"Usually, for a Beyonder, drinking
  potions of a different Pathway is akin to taking poison, where the best outcome
  is a half-mad state. However … at High Sequence, a Beyonder can switch to a
  Neighboring/Adjacent Pathway in the same Above the Sequence group without the
  danger of losing control, or the accumulation of madness. In theory, it's also
  possible to switch at a lower Sequence, but the risk of losing control is much
  higher."_
- _"If a Beyonder successfully switches pathways, they keep all of their powers
  from the previous Pathway … fused together with the powers provided by their
  current, new pathway potion. It creates a certain level of mutation, creating
  unique and bizarre powers."_
- _"When switching pathways, the powers gained … depends on the set of
  characteristic that is used to advance. Missing characteristic of lower
  sequence will lead to lost of some of the corresponding abilities."_
- _"Under usual circumstances, sticking to a single pathway until the end was
  generally the better choice than switching to a neighboring pathway"_ — the
  narrator's/UI flavor for why this is a deliberate, weighty choice.

## Game design

### Concept

A digested Beyonder at the canon threshold may drink a **different pathway's**
potion of their current Sequence instead of climbing their own. Two flavors:

- **Neighboring switch** (adjacent pathway, same Above-the-Sequence group): the
  safe canon path — the character adopts the new pathway, keeps their earned
  powers fused in with a "mutation" tag, and plays on.
- **Unrelated switch** (any non-adjacent pathway): _poison._ Possible but with
  severe, corpus-faithful consequences — very low odds, a heavy sanity hit, and a
  forced high-risk loss-of-control on failure. Survivable-but-exceptional
  (Roselle Gustav is the precedent).

### Switch model — new pathway becomes primary

On a successful switch:

- `gameState.pathwayId` **becomes the new pathway** — future advancement climbs
  it with **zero changes to `advancement.ts`** (which already keys off a single
  `pathwayId`).
- `gameState.sequenceLevel` is **unchanged** (you switch at the rung you stand
  on; you do not advance).
- The pathway left behind is appended to `pathwayLineage.switches`, carrying a
  **frozen snapshot** of the abilities retained from it.

This matches canon ("you now walk the new pathway, keeping old powers") and keeps
the ability math cheap and drift-proof.

### Data model — `pathwayLineage` session sub-state

New file `src/lib/game/pathway-lineage.ts`, following the `ritual.ts` /
`formula-pursuit.ts` pattern exactly: an optional sub-state on `GameSession`,
strictly validated when present, preserved on the deserialize `...s` spread,
**never seeded**, **no DB migration** (it serializes inside the session jsonb
blob).

```ts
export interface RetainedAbility {
  name: string;
  description: string;
  type: "passive" | "active";
  sourceLevel: number; // the rung of the prior pathway it was earned at
}

export interface PathwaySwitch {
  fromPathwayId: number; // the pathway left behind
  atSequence: number; // the rung the switch happened at
  kind: "neighboring" | "unrelated";
  switchTurn: number;
  retained: RetainedAbility[]; // FROZEN post-loss snapshot — see below
}

export interface PathwayLineageState {
  switches: PathwaySwitch[]; // oldest → newest
}
```

**Why freeze `retained`.** The alternative — recomputing a prior pathway's kit at
render time — asks "which rungs of pathway A did I climb?" at a level the
character no longer occupies. Freezing the post-loss ability set at switch time
makes fusion a cheap concatenation, stable across renders, and correct across any
number of switches.

### The ability-loss rule (deterministic)

When switching at rung `S` from pathway `A`, the character has climbed `A` from
Seq 9 down to `S`, so their earned abilities are
`getCumulativeAbilities(A, S)` (sourceLevels `S..9`). Canon: _"Missing
characteristic of lower sequence will lead to lost of some of the corresponding
abilities."_ We model that as:

```
retained = getCumulativeAbilities(A, S).filter(a => a.sourceLevel > S)
```

i.e. **drop the abilities sourced at the switch rung `S` itself, keep the
shallower rungs already digested.** The Seq-`S` characteristic is the deepest one
the character stops carrying forward, so its abilities are the "corresponding
abilities" lost. This is a pure filter with no randomness — the retained set is
identical every time it is computed, and it is frozen once into the switch entry.
It is non-empty at both canon gates (Seq 4 / Mysteries Seq 3 always have higher,
shallower rungs to retain).

### Fusion derivation

`sequenceAbilities(pathwayId, level)` (`apotheosis.ts`) is THE single
ability/acting derivation the narrator prompt (`game-loop.tsx`) and combat share;
`combatKitFor(pathwayId, sequenceLevel)` (`combat-abilities.ts`) is the combat
kit. Both stay the **current-pathway primitives** (apex True-God/Pillar overlays
untouched). Fusion layers on top as a superset:

- `fusedAbilityNames(session)` = base names (current pathway, apex-aware,
  `(enhanced)` intact) followed by the deduped retained abilities of every prior
  switch, each tagged **`(fused)`** — the "mutation" flavor, mirroring the
  existing `(enhanced)` suffix.
- **Dedup:** the current pathway wins; among priors the most-recent switch wins
  (reverse iteration), mirroring the issue-#210 `familyAbilityNames`
  first-winner precedent.
- **Multi-switch:** each entry carries its own frozen `retained`, so N switches
  concatenate with no recomputation.
- `fusedCombatKit(session)` reuses a `combatAbilityFrom(ability, pathwayId)`
  helper extracted from `combatKitFor` so fused abilities get the real
  role+depth scaling; a name-lookup miss (a later data rename) falls back to a
  `utility` role with the stored name — never throws.

Because both existing call sites already route through the one derivation, the
narrator prompt and combat both get fusion for free; the character sheet renders
a dedicated fused-abilities group with a "mutation" badge.

## Switch engine — `src/lib/game/pathway-switch.ts`

Mirrors `advancement.ts` (pure + deterministic under injected randomness):

- `switchUnlockSequence(pathwayId)` → `3` when the pathway is in the Mysteries
  group (getGroupForPathway === "mysteries"), else `4`.
- `switchRelation(currentPathwayId, targetPathwayId)` → `"neighboring"` when
  `areNeighboringPathways` holds, else `"unrelated"`.
- `switchEligibility(session, targetPathwayId)` → a checklist analogous to
  `advancementRequirements`. Hard gates:
  - target is a real pathway, different from the current one;
  - not at/above the apex (Seq ≤ 1 / 0 / -1 blocked);
  - the current potion is fully digested;
  - the target pathway's Seq-`sequenceLevel` potion is carried (cross-pathway
    potion, see below);
  - a sanity floor (reuse `ADVANCEMENT_SANITY_RATIO`);
  - **for a neighboring target only**, `sequenceLevel <= switchUnlockSequence`
    (the canon Seq-4 / Mysteries-Seq-3 threshold — enforced exactly).
    An unrelated target is allowed at any non-apex sequence (the poison gamble); it
    carries no threshold gate because it is dangerous at every rung.
- `pathwaySwitchSuccessChance(session, targetPathwayId)`:
  - **neighboring:** strong, steadied by sanity (clamp ~0.4–0.9) — the safe path.
  - **unrelated:** capped low and heavily sanity-dependent (clamp ~0.05–0.4) —
    the Roselle survivable-outlier; the low-odds success IS the "half-mad best
    case."
- `attemptPathwaySwitch(session, targetPathwayId, random?, now?)` →
  `{ outcome: "switched", session, … }` | `{ outcome: "lost-control", verdict }`.
  On success:
  - set `gameState.pathwayId = target`, keep `sequenceLevel`;
  - append a `PathwaySwitch` with the frozen `retained` snapshot (the loss rule
    above) of the OUTGOING pathway;
  - re-seed digestion via `createDigestionState(target, sequenceLevel)`;
  - consume the cross-pathway potion's ingredients (`removeItemsByName`);
  - clear stale `ritualState` / `formulaPursuit` / old-pathway `hunts` (they
    target the old pathway's next rung);
  - drain sanity — `sanityDelta({type:"advancement"})` for neighboring, plus
    `sanityDelta({type:"outer-deity"})` for the unrelated poison;
  - seed memory facts (the mutation / half-mad framing).
    On failure route through
    `evaluateFailure({cause:"loss-of-control", sequenceLevel, highRisk})`, where
    **`highRisk` is forced true for an unrelated switch** — poison escalates the
    death ladder one step, so it is deadlier at the same rung.

## Cross-pathway potion acquisition

`potion-preparation.ts` currently assumes the next rung of the OWN pathway
(`targetSequence(sequenceLevel)`). Add a variant keyed to an explicit
`(pathwayId, sequence)` — `crossPathwayPotionPlan(session, targetPathwayId)` and a
matching purchase/deliver path — reusing the same `acquisitionMethodsFor` /
`acquisitionCost` / `grantItem` machinery and the formula gate (`isFormula`), so
gathering a different pathway's current-Sequence potion follows the same buy/hunt
economy.

## Ripple

- **Narrator prompt** (`game-loop.tsx` `buildAICallParams`): swap the ability
  list to `fusedAbilityNames(session)`; `acting` stays current-rung.
- **Combat** (`game-loop.tsx` `createEncounter` path): swap `combatKitFor` to
  `fusedCombatKit(session)`. Optional: a small neighboring-pathway affinity nudge
  in `computePathwayMatchup` (`combat.ts`).
- **Character sheet** (`character-sheet.tsx`): a fused-abilities group + a "fused
  pathway / mutation" badge naming the prior pathway(s); the status bar keeps the
  current rung + new pathway via the existing `sequenceLabel`.
- **Switch panel** (`game-loop.tsx`, in the climb cluster beside
  `AdvancementPanel`/`RitualPerformancePanel`): a `PathwaySwitchPanel` that lists
  eligible neighboring pathways, offers the cross-pathway potion prep, and gates
  an unrelated attempt behind an explicit "this is poison" two-step confirm.
  Routed through `ENGINE_RESOLUTION` like advancement.
- **Admin** (`admin-tools.ts` `buildAdminCharacter`): a switch-ready / already-
  fused option so the flow and sheet are viewable at `/dev/admin`.

## Edge cases & risks

- **Apex blocked.** Seq ≤ 1 / 0 / -1 cannot switch — sidesteps the Seq-0
  digestion reseed and the Pillar family aggregation. Fusion only ever _appends_
  to the apex overlays, never rewrites them.
- **Legacy saves.** Absent `pathwayLineage` → `fusedAbilityNames` early-returns
  the base kit, byte-identical to today. Strict validation only when present; no
  migration.
- **`acquired-powers`** stays orthogonal — appended after fused abilities exactly
  as today.
- **Post-switch hygiene.** Digestion re-seeds; old-pathway ritual/formula/hunts
  are cleared; no free advancement (the rung is unchanged).
- **`fusedCombatKit` guard.** A name-resolution miss falls back to `utility` +
  the stored name; never throws.

## Deliberate compressions (corpus deviations, flagged)

- Corpus allows a neighboring switch at a _lower_ Sequence (above the threshold)
  "but the risk of losing control is much higher." We instead **hard-gate the
  neighboring switch to the canon safe threshold** (Seq ≤4 / Mysteries ≤3) and
  route the "possible but dangerous" appetite through the always-available
  **unrelated** (poison) path. This keeps the eligibility rule crisp and matches
  the issue's acceptance criterion ("thresholds enforced") while still offering a
  high-risk switch at any rung.
- The novel's "hidden ritual conditions for a higher-Sequence cross-pathway jump"
  are compressed into the success-chance / high-risk model rather than modeled as
  distinct ritual steps.

## Sub-systems touched

New: `pathway-lineage.ts`, `pathway-switch.ts` (+ colocated tests).
Modified: `types.ts`, `session.ts`, `index.ts`, `potion-preparation.ts`,
`apotheosis.ts`, `combat-abilities.ts`, `combat.ts` (optional), `admin-tools.ts`,
`components/game/game-loop.tsx`, `components/game/character-sheet.tsx`.
Delivered in one PR; all Pre-Commit gates (tests, 95% coverage, typecheck, lint,
format, scoped `CLAUDE.md`, e2e) green.
