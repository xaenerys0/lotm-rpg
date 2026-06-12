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

9 pathways implemented, sequences 9-5 only:

- **Mysteries** (Sefirah Castle): Fool (1), Door (7), Error (8)
- **God Almighty** (Chaos Sea): Visionary (2), Sun (3), Tyrant (6), Hanged Man (9)
- **Eternal Darkness** (River of Eternal Darkness): Death (4), Darkness (5)

13 more pathways and higher sequences (4-0) are planned. The not-yet-implemented
White Tower (God Almighty) and Twilight Giant (Eternal Darkness) belong to the
groups above per canon but are not yet in `PATHWAY_GROUPS.pathwayIds`.

## Conventions

- All validation functions return `ValidationResult` with a `valid` boolean and `violations` array — never throw.
- Pathway data is read-only. Never mutate the pathway/sequence definitions at runtime.
- When adding new pathways, follow the existing structure in `pathways.ts` and add corresponding test cases.
