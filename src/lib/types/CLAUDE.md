# Type Definitions

- `rules.ts` — Game rules types (pathways, sequences, characteristics, validation results). Source of truth for the rules engine API surface.
- `database.ts` — Supabase schema types (`Database` interface). Currently defines the `profiles` table.

## Conventions

- Keep types in sync with the database schema. When adding migrations, update `database.ts` to match.
- Rules types are pure data — no methods or side effects.
- Use `LawType` union for tagging validation violations by which cosmic law was broken.
