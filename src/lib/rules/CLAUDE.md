@../../../docs/rules/testing.md

# Rules Engine

Game logic implementing the Lord of the Mysteries Beyonder power system. Reference lore: `docs/lotm-lore-summary.md`.

## Structure

- `pathways.ts` — Pathway and sequence definitions (abilities, ingredients, rituals). ~1,240 lines of game data.
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

4 pathways implemented (Fool, Visionary, Sun, Death), sequences 9-5 only. 18 more pathways and higher sequences (4-0) are planned.

## Conventions

- All validation functions return `ValidationResult` with a `valid` boolean and `violations` array — never throw.
- Pathway data is read-only. Never mutate the pathway/sequence definitions at runtime.
- When adding new pathways, follow the existing structure in `pathways.ts` and add corresponding test cases.
