@../../../docs/rules/testing.md

# Lore Database

Structured lore data for RAG retrieval by the AI integration layer. Each entry is a semantic chunk (300-800 tokens) representing one logical entity.

## Structure

- `types.ts` — `LoreEntry` and `LoreCategory` type definitions.
- `tingen.ts` — Tingen City locations and geography.
- `fifth-epoch.ts` — Fifth Epoch baseline: politics, technology, social norms.
- `organizations.ts` — Nighthawks, Mandated Punishers, Machinery Hivemind, Psychology Alchemists, Aurora Order.
- `npcs.ts` — Key Tingen NPCs: Dunn Smith, Leonard Mitchell, Old Neil, Daly Simone, Azik Eggers, Klein Moretti, Melissa Moretti, Ince Zangwill.
- `pathway-fool.ts` — Fool pathway lore (Seq 9-5).
- `pathway-visionary.ts` — Visionary pathway lore (Seq 9-5).
- `pathway-sun.ts` — Sun pathway lore (Seq 9-5).
- `pathway-death.ts` — Death pathway lore (Seq 9-5).
- `index.ts` — Re-exports and query helpers (`getLoreByCategory`, `getLoreByPathway`, etc.).
- `lore.test.ts` — Data integrity tests.

## Database Table

`lore_entries` in Supabase (migration `20260527111842`). Seeded by `20260527113655`.

Metadata columns for filtering: `category`, `pathway`, `epoch`, `city`, `npcs`, `sequences`, `tags`.
`embedding` column (vector 1536) is nullable — populated post-MVP via pgvector.

## Conventions

- One entry per logical concept (one NPC, one location, one sequence).
- Target 300-800 tokens per entry for retrieval precision.
- Slugs are URL-safe unique identifiers: `category-qualifier` pattern.
- TypeScript source is the canonical data; SQL seed is generated from it.
- When adding new lore, add to the appropriate `.ts` file and regenerate the seed migration.
