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

A switch is an **advancement taken along a different line**: instead of drinking
your own pathway's NEXT potion you drink a neighbouring pathway's NEXT potion,
climbing one rung AND changing pathways in a single step ("the powers gained from
the new pathway will depend on the set of characteristic that is used to
advance"). Two flavors:

- **Neighboring switch** (adjacent pathway, same Above-the-Sequence group): the
  safe canon path — the character advances into the new pathway, keeps their
  earned old-pathway powers fused in with a "mutation" tag, and plays on.
- **Unrelated switch** (any non-adjacent pathway): _poison._ Possible but with
  severe, corpus-faithful consequences — very low odds, a heavy sanity hit, and a
  forced high-risk loss-of-control on failure. Survivable-but-exceptional
  (Roselle Gustav is the precedent).

### Switch model — advance into the neighbour

On a successful switch (from current Seq `N`):

- `gameState.pathwayId` **becomes the new pathway** and `gameState.sequenceLevel`
  **decrements to `N-1`** — a switch is an advancement, so future climbs continue
  on the new pathway with **zero changes to `advancement.ts`**.
- The switch potion is the **new pathway's Seq `N-1` recipe** (its next rung).
- The pathway left behind is appended to `pathwayLineage.switches` with
  `atSequence = N` (the rung left) and a **frozen snapshot of the FULL old-pathway
  kit** — canon: "keep all of their powers from the previous Pathway."

**Eligibility (neighbouring) is gated on the TARGET rung**: `N-1 <=
switchUnlockSequence` (Seq 4 general, Seq 3 for the Mysteries group) — the first
allowed switch lands you at Seq 4 (Seq 3 for Mysteries). Advancing into the Saint
tier also requires anchors, exactly like a normal climb.

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

Canon: a successful switch **keeps ALL of the old pathway's powers** ("keep all of
their powers from the previous Pathway"), but the loss — _"missing characteristic
of lower sequence will lead to lost of some of the corresponding abilities"_ —
lands on the **NEW** pathway: you join it partway down (at Seq `N-1`) and never
digested its **weaker** (higher-numbered) rungs.

- **Retained (frozen, old pathway):** `getCumulativeAbilities(A, N)` — the whole
  kit the character held on the old pathway, unfiltered.
- **Held (current, new pathway):** capped at the **join sequence** — the rung the
  character joined the current pathway at (`lastSwitch.atSequence - 1`). Any
  current-pathway ability sourced at a weaker rung (`sourceLevel > join`) was
  never digested and is absent:
  `getCumulativeAbilities(current, level).filter(a => a.sourceLevel <= join)`.

`currentJoinSequence` / `heldCumulativeAbilities` / `heldAbilityGroups`
(`pathway-fusion.ts`) implement the cap; a save that never switched has join `9`
(no cap), so behaviour is byte-identical to before. As the character advances
further on the new pathway they accrue its deeper rungs normally, but the weaker
rungs skipped by joining partway down stay missing — the canon loss.

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
  group (getGroupForPathway === "mysteries"), else `4` — the TARGET-rung threshold.
- `switchTargetSequence(session)` → `sequenceLevel - 1` (a switch advances a rung).
- `switchRelation(currentPathwayId, targetPathwayId)` → `"neighboring"` when
  `areNeighboringPathways` holds, else `"unrelated"`.
- `switchRequirements(session, targetPathwayId)` → a checklist analogous to
  `advancementRequirements`. Hard gates:
  - target is a real pathway, different from the current one;
  - a climbable rung (`isAdvanceableSequence`, Seq 9–2 — apex cannot switch);
  - the current potion is fully digested;
  - the target pathway's **next-rung** (`switchTargetSequence`) potion is carried
    (cross-pathway potion, see below);
  - **anchors** when the target rung is Saint tier (`anchorsRelevant`) — a switch
    into Saint needs them exactly like a normal climb;
  - a sanity floor (reuse `ADVANCEMENT_SANITY_RATIO`);
  - **for a neighboring target only**, `switchTargetSequence <= switchUnlockSequence`
    (the canon Seq-4 / Mysteries-Seq-3 threshold on the TARGET rung — the first
    allowed switch lands you there). An unrelated target is allowed at any non-apex
    sequence (the poison gamble); no threshold gate.
- `pathwaySwitchSuccessChance(session, targetPathwayId)`:
  - **neighboring:** strong, steadied by sanity (clamp ~0.4–0.9) — the safe path.
  - **unrelated:** capped low and heavily sanity-dependent (clamp ~0.05–0.4) —
    the Roselle survivable-outlier; the low-odds success IS the "half-mad best
    case."
- `attemptPathwaySwitch(session, targetPathwayId, random?, now?)` →
  `{ outcome: "switched", session, newSequenceLevel, … }` |
  `{ outcome: "lost-control", verdict }`. On success:
  - set `gameState.pathwayId = target` AND `sequenceLevel = switchTargetSequence`
    (advance one rung);
  - append a `PathwaySwitch` (`atSequence` = the rung LEFT) with the frozen FULL
    old-pathway kit;
  - re-seed digestion via `createDigestionState(target, targetSeq)`;
  - consume the target pathway's next-rung potion (`removeItemsByName`);
  - clear stale `ritualState` / `formulaPursuit` / old-pathway `hunts`;
  - drain sanity — `sanityDelta({type:"advancement"})` for neighboring, plus
    `sanityDelta({type:"outer-deity"})` for the unrelated poison;
  - seed memory facts (the mutation / half-mad framing).
    On failure route through
    `evaluateFailure({cause:"loss-of-control", sequenceLevel, highRisk})`, where
    **`highRisk` is forced true for an unrelated switch** — poison escalates the
    death ladder one step, deadlier than the safe neighbouring advance.

## Cross-pathway potion acquisition

`crossPathwayPotionPlan(session, targetPathwayId)` / `purchaseCrossPathwayPotionItem`
gather the TARGET pathway's **next-rung** recipe (`targetSequence(sequenceLevel)` —
a switch advances a rung), reusing the same `acquisitionCost` / `grantItem`
machinery and the formula gate (`isFormula`). Purchase-only at a
`CROSS_PATHWAY_COST_PREMIUM` (a foreign line's reagents come through trade — a
documented compression, see below).

## Ripple

- **Narrator prompt** (`game-loop.tsx` `buildAICallParams`): swap the ability
  list to `fusedAbilityNames(session)`; `acting` stays current-rung.
- **Combat** (`game-loop.tsx` `createEncounter` path): swap `combatKitFor` to
  `fusedCombatKit(session)`. Optional: a small neighboring-pathway affinity nudge
  in `computePathwayMatchup` (`combat.ts`).
- **Character sheet** (`character-sheet.tsx`): own-pathway groups from the
  join-capped `heldAbilityGroups` + a "Fused Pathways" section
  (`retainedAbilityGroups`); the status bar shows the new pathway + advanced rung
  via the existing `sequenceLabel`.
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
- **Post-switch hygiene.** The rung advances one step (a switch IS an
  advancement); digestion re-seeds for the new pathway+rung; old-pathway
  ritual/formula/hunts are cleared.
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
