# Type Definitions

- `rules.ts` — Game rules types (pathways, sequences, characteristics, validation results). Source of truth for the rules engine API surface.
- `combat.ts` — Combat system types (issue #10): `Enemy`, `CombatPreparationInput`, `PreparationQuality`, `PathwayMatchup`, `DecisionPoint`/`DecisionOption`, `CombatOutcome`, `Injury`, `CombatResult`, and the serializable `CombatEncounter` state. Imports `Item`/`BeyonderCharacteristic` from `rules.ts`; `GameState.injuries` (in `@/lib/ai`) references `Injury` from here. The deterministic engine lives in `@/lib/game/combat.ts`.
- `database.ts` — Supabase schema types (`Database` interface). Defines `profiles`, `lore_entries`, `source_chunks`, and `chunk_embeddings` tables; the `match_source_chunks` RPC under `Functions`; plus `LoreCategoryEnum` and `SourceChunkSourceEnum`. pgvector columns serialize as `string` (see `chunk_embeddings.embedding`).

## Conventions

- Keep types in sync with the database schema. When adding migrations, update `database.ts` to match.
- Rules types are pure data — no methods or side effects.
- Use `LawType` union for tagging validation violations by which cosmic law was broken.
