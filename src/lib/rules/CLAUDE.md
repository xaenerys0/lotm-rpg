@../../../docs/rules/testing.md

# Rules Engine

Game logic implementing the Lord of the Mysteries Beyonder power system. Reference lore: `docs/lotm-lore-summary.md`.

## Structure

- `pathways.ts` — Pathway and sequence definitions (abilities, ingredients, rituals) for all 9 playable pathways. Large block of game data.
- `groups.ts` — Pathway group clustering (mysteries, god-almighty, eternal-darkness) and neighbor relationships.
- `laws.ts` — Three cosmic laws: indestructibility (conservation of total characteristic weight), conservation (sequential advancement only), convergence (same/neighboring pathway attraction).
- `validation.ts` — High-level validation API: `validateAdvancement()` and `validateTransfer()`.
- `index.ts` — Public exports.
- `rules.test.ts` — Comprehensive test suite (8 describe blocks, ~55 test cases).

## Key Types (from `@/lib/types/rules`)

- `Pathway`, `Sequence`, `Ability`, `Item`, `Ritual`
- `BeyonderCharacteristic` — `{ pathwayId, sequenceLevel, quantity }`
- `AdvancementAttempt`, `CharacteristicTransfer`, `WorldCharacteristicLedger`
- `ValidationResult` with `Violation[]` (each tagged by `LawType`)

## Current Scope

9 pathways implemented, sequences **9 down to 1** (issue #25 added the demigod
tiers Seq 4-1: Saint → Angel → King of Angels):

- **Mysteries** (Sefirah Castle): Fool (1), Door (7), Error (8)
- **God Almighty** (Chaos Sea): Visionary (2), Sun (3), Tyrant (6), Hanged Man (9)
- **Eternal Darkness** (River of Eternal Darkness): Death (4), Darkness (5)

Classification scales with sequence: Low (9-8), Mid (7-5), High (4-3, Saint),
Demigod (2-1, Angel/King of Angels). Every Seq < 9 carries an `advancementRitual`;
the Seq 4-1 rituals are canon-flavoured ceremonies (anchors, mythical-form
resistance). Seq 4-1 names are canon-verified against the Fandom dump — e.g.
Fool: Bizarro Sorcerer / Scholar of Yore / Miracle Invoker / Attendant of
Mysteries.

Sequence 0 (True God) and 13 more pathways are still planned. The not-yet-
implemented White Tower (God Almighty) and Twilight Giant (Eternal Darkness)
belong to the groups above per canon but are not yet in
`PATHWAY_GROUPS.pathwayIds`. The Anchors system (issues #35, #25) — required for
Beyonders at Seq ≤ 2 — lives in `@/lib/game/anchors` with its design in
`docs/anchors-design.md`.

## Conventions

- All validation functions return `ValidationResult` with a `valid` boolean and `violations` array — never throw.
- Pathway data is read-only. Never mutate the pathway/sequence definitions at runtime.
- When adding new pathways, follow the existing structure in `pathways.ts` and add corresponding test cases.
