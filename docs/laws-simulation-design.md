# Cosmic Laws of Beyonder Characteristics — simulation design (issue #212)

Phase 4 of the advancement/lore-faithfulness roadmap (lead #209). This wires the
canon **Laws of Beyonder Characteristics** from a fully-tested-but-dead validator
suite into live gameplay, and resolves the dead-code status of `laws.ts` /
`validation.ts`.

## Canon basis (`corpus/wiki/` — "Beyonder Laws"; the `Sequence` page)

- **Indestructibility:** "The Beyonder Characteristic can never be destroyed or
  reduced. It's only passed from one carrier to the next." A dead Beyonder
  precipitates a characteristic carrying their mental imprint.
- **Similar Sequence Conservation:** a fixed number of Beyonder Characteristics
  per pathway group — a zero-sum conserved pool (more High-Sequences ⇒ fewer
  Low-Sequences).
- **Convergence:** "High-Sequence items of the same pathway or group intermittently
  and unconsciously draw Low- and Mid-Sequence Beyonders to them… Most of the time,
  it will influence fate."

## The gap this closes

The whole laws/validation layer had **zero gameplay callers** — a tested validator
suite with no live `WorldCharacteristicLedger`. Most concretely, `combat.ts`'s
`computeConsequences` already computed `characteristicsDropped` when a Beyonder was
slain, but `applyCombatResult` **dropped it on the floor**: a slain Beyonder
precipitated nothing recoverable. Indestructibility was modelled in types but never
felt.

## Scope (agreed in planning)

**Faithful-but-light**, single-player — a per-save session sub-state, **not** a
whole-world census (which is heavy and low-value for single-player):

- **Indestructibility (the felt mechanic).** A slain Beyonder (in any fight that
  is not an ingredient hunt) now precipitates a **recoverable `main-ingredient`
  Beyonder Characteristic** into inventory, and the drop is recorded in a light
  per-save `WorldCharacteristicLedger`. The recovered item uses the canon
  role-based name (`"{role} Beyonder Characteristic"`) so it is advancement-usable
  when it matches the character's own pathway + target rung, and artifice-fusible /
  tradeable otherwise. Balanced: a random slain Beyonder is usually a different
  pathway/rung, so it is a meaningful reward, not an advancement shortcut. Hunts are
  untouched — their quarry's characteristic is already granted by `deliverHuntedItem`,
  so precipitation is skipped for a hunt to avoid a double-grant.
- **Convergence (a light narrator beat).** The precipitated characteristics the
  character **still carries** (the ledger intersected with the current inventory)
  bend fate toward the same/neighbouring pathway — surfaced as a `## Convergence`
  narrator directive threaded through `GenerateOptions.convergenceContext`, so
  encounters/rumours/coincidences favour crossing paths with that pathway. Reading
  the ledger-∩-inventory rather than the raw ledger keeps the beat honest: once a
  characteristic is drunk to advance, traded, or crafted away it leaves inventory
  and stops steering fate, so the accounting can never drift into a permanently-on
  beat. Dropped when nothing is attracted.
- **Conservation** is **not** wired — a per-pathway-group fixed pool is the heavy
  whole-world model the light scope deliberately avoids. (If ever pursued it would
  be a follow-up, keyed on `@/lib/rules` `PATHWAY_GROUPS`.)

## Where it lives

`src/lib/game/characteristic-ledger.ts` (pure, tested) is the single home for the
new logic — `game-loop.tsx` is a `.tsx` shell that only wires it. The ledger is
`GameSession.characteristicLedger?: WorldCharacteristicLedger`, an optional,
strictly-validated sub-state (`isValidCharacteristicLedgerShape`) preserved on the
deserialize `...s` spread and never seeded — the `hunts` / `ritualState` pattern.
**No DB migration** — it serializes inside the `game_sessions.data` JSONB blob.

Wiring points:

- `game-loop.tsx` `handleCombatResult` → precipitation on a non-hunt Beyonder kill
  (mint items + `recordPrecipitation` + a memory fact + a journal beat).
- `game-loop.tsx` `buildAICallParams` → `convergenceNarratorContext` threaded into
  every `generate()` call, rendered as the `## Convergence` block in `prompts.ts`.

## Resolving the dead validators — wire what fits, retire the rest

- **Wired** (kept in `laws.ts`, now with live callers):
  - `validateConvergence` → the Convergence beat (`convergenceFor`).
  - `validateCharacteristicTransfer` → the Indestructibility guard on
    `recordPrecipitation` (a death-drop is a well-formed transfer from the fallen
    carrier; a non-positive quantity is refused).
- **Retired** (deleted, with rationale):
  - `validateIndestructibility` — a **whole-world weight census**. The light
    recoverable-pool model grows as characteristics precipitate into it, which a
    total-weight-conservation check would wrongly flag as "created". It cannot be
    satisfied by a per-save pool, so it does not fit the chosen scope.
  - `validateConservation` — only enforced "no sequence-skipping", which
    `@/lib/game/advancement.ts` already guarantees (advancement always steps one rung).
  - `validatePrerequisites` — duplicated the ingredient/ritual gate already owned by
    `@/lib/game/potion-preparation.ts` + `advancement.ts`.
  - `src/lib/rules/validation.ts` (`validateAdvancement` / `validateTransfer`) —
    `validateAdvancement` composed only retired checks; `validateTransfer` was a thin
    delegate. The file was deleted; the barrel and `rules.test.ts` were pruned to the
    two retained validators.

The `LawType` union still carries `"conservation"` / `"prerequisite"` for
completeness, but no function emits them; `"indestructibility"` /
`"convergence"` are the live tags.
