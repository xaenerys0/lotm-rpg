# Type Definitions

- `rules.ts` — Game rules types (pathways, sequences, characteristics, validation results). Source of truth for the rules engine API surface. `Item.category` has four kinds: the three advancement-ladder reagents (`main-ingredient`, `supplementary-ingredient`, `potion-formula`) plus `mundane` for ordinary loot (issue #90) — the AI item-discovery path may only mint `mundane`; the reagent kinds are rules-engine-only. Every exhaustive `Record<Item["category"], …>` (marketplace `PRICE_GUIDANCE`, character-sheet labels/glyphs) must cover all four.
- `combat.ts` — Combat system types (issue #10): `Enemy`, `CombatPreparationInput`, `PreparationQuality`, `PathwayMatchup`, `DecisionPoint`/`DecisionOption`, `CombatOutcome`, `Injury`, `CombatResult`, and the serializable `CombatEncounter` state (with an optional `huntTarget` — the potion-preparation hunt objective from issue #84, carried on the persisted encounter so a mid-hunt reload still grants the Characteristic on victory). Imports `Item`/`BeyonderCharacteristic` from `rules.ts`; `GameState.injuries` (in `@/lib/ai`) references `Injury` from here. The deterministic engine lives in `@/lib/game/combat.ts`.
- `database.ts` — Supabase schema types (`Database` interface). Defines `profiles`, `lore_entries`, `source_chunks`, and `chunk_embeddings` tables; the `match_source_chunks` RPC under `Functions`; plus `LoreCategoryEnum` and `SourceChunkSourceEnum`. pgvector columns serialize as `string` (see `chunk_embeddings.embedding`). `source_chunks.epoch` (nullable smallint, character epoch isolation) and the matching `match_source_chunks` `p_epoch` arg + `epoch` return column gate the corpus by epoch (migration `20260614000000`).

## Conventions

- Keep types in sync with the database schema. When adding migrations, update `database.ts` to match.
- Rules types are pure data — no methods or side effects.
- Use `LawType` union for tagging validation violations by which cosmic law was broken.
