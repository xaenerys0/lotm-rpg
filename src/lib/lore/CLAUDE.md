@../../../docs/rules/testing.md

# Lore Database

Structured lore data for RAG retrieval by the AI integration layer. Each entry is a semantic chunk (300-800 tokens) representing one logical entity.

## Structure

- `types.ts` — `LoreEntry` and `LoreCategory` type definitions.
- `retrieval.ts` — Runtime retrieval (issue #63): `retrieveChunks(query, options)`
  embeds the query with the save's **locked** embedding model (per-character
  model lock — mismatches throw) and calls the gated `match_source_chunks` RPC.
  The **timeline gate** (`canon_order <= canonPosition`) and **concealment
  gate** are enforced server-side and re-checked client-side as defense in
  depth. `createSupabaseChunkMatcher(client)` wraps a Supabase client into the
  injectable RPC seam; `retrievalChunkIds(chunks)` extracts the ids recorded on
  the turn record (determinism/debuggability); `toPgVector` serializes query
  vectors. The **epoch gate** (`RetrieveChunksOptions.epoch`, character epoch
  isolation) rides into the RPC as `p_epoch` and is re-checked client-side: a
  non-Fifth character never retrieves Fifth-Epoch canon chunks (`null` = no
  limit, eval/operator only). This **extends** the curated `lore_entries`
  injection — curated guardrails are injected first (issue #64); retrieved chunks
  fill the rest.
- `epochs.ts` — Epoch starting points (issues #26/#29): `EPOCHS` (all five — player-safe summary, narrator `toneDirective`, `startingLocation`, `openingBeat`, `dangerModifier`; the Fifth is the baseline for **tone** — empty `toneDirective` — but, like every other epoch, now carries an **awakening `openingBeat`** that continues from the prologue's final potion so the chronicle never opens by abruptly announcing the character's pathway), `getEpoch` (unknown → Fifth), `epochNarrationDirective`, `epochOpeningBeat`. Threaded into prompt assembly as the `## Epoch` system layer (PromptInput.epochContext) and into the first scene's player action. **`passesEpochGate(entryEpoch, characterEpoch)`** — the epoch content gate (character epoch isolation): an **untagged** entry (`epoch` undefined/null) is **universal** and passes for everyone; a **tagged** entry passes only on **exact** epoch equality; an absent character epoch defaults to the Fifth. Mirrors `passesTimelineGate`'s "timeless rows always pass" shape and is the single rule reused by `selection.ts`, `glossary.ts`, `retrieval.ts`, and the SQL `match_source_chunks` RPC — so a non-Fifth character never sees Fifth-Epoch lore, chunks, glossary terms, or map regions (and vice versa).
- `epoch-first.ts` / `epoch-second.ts` / `epoch-third.ts` / `epoch-fourth.ts` — Rich, canon-grounded curated lore for the four pre-Iron-Age epochs (`FIRST_EPOCH_LORE` … `FOURTH_EPOCH_LORE`; grounded in the LOTM wiki/novel — Age of Chaos, Dark Epoch, Cataclysm Epoch, Epoch of the Gods). Each set's `metaphysics`-category entries are the era's **setting overview** (injected by `selectCuratedLore` via `getLoreByEpochSetting`); `location`-category entries surface in the gazetteer/discovery. Every entry is tagged with its `epoch`.
- `gazetteer.ts` — Per-epoch map atlas (character epoch isolation): `gazetteerForEpoch(epoch)` returns the Fifth-Epoch Tingen districts + farther-city travel, or an earlier epoch's static, public region list (travel disabled — the CITIES model is Fifth-Epoch only). Player-safe public knowledge only; the narrator-only curated lore must not bleed in. Consumed by `map-panel.tsx`.
- `glossary.ts` — In-game glossary (issue #14): `GLOSSARY_TERMS` with **progressive disclosure** via `revealAtSequence` (9-8 basics at the start; rituals/organisations ~8-7; demigod concepts at 5; Sefirah-tier mysteries at 4) **and an epoch gate** (character epoch isolation) via an optional `epoch` tag. `glossaryForSequence(level, epoch?)` and `sealedTermCount(level, epoch?)` apply both gates; the sealed count is computed over the **epoch-applicable** universe only, so an other-epoch term's existence is never leaked. Fifth-specific terms (Loen, Tingen, the churches, the Saint honorific) are tagged `epoch: 5`; universal mechanics (Beyonder, Sequence, Pathway, …) stay untagged; each non-Fifth epoch has its own era terms (Ancient Gods, Ancient Sun God, Solomon Empire, …). `getGlossaryTerm(slug)`. Entries are player-safe world-building — no narrator-only lore.
- `tingen.ts` — Tingen City locations and geography.
- `backlund.ts` — Backlund (Loen capital) locations: overview, Empress/Hillston/East boroughs, the Backlund Bridge & Tussock, the capital's Churches (issue #23).
- `trier.ts` — Trier (Intis Republic capital) locations: overview, city walls & quartiers, the Island District & Saint Viève Cathedral, the underground/catacombs, stations & transport, the Church of the Eternal Blazing Sun (issue #23).
- `bayam.ts` — Bayam (Rorsted Archipelago capital) locations: overview, harbour/adventurers' quarter, Cathedral of Waves, streets & cemeteries, the Sea God Kalvetua & native belief (issue #23).
- `narration.ts` — `cityNarrationDirective(location)` (issue #23): one tone sentence per city (Backlund = soot/class/intrigue; Trier = sun-worship/revolutionary ferment; Bayam = salt/colonial trade/island superstition), matched on the location's lowercase first word; `null` for unknown/unmapped cities (incl. the Tingen start). Threaded into prompt assembly via `PromptInput.cityNarration`.
- `fifth-epoch.ts` — Fifth Epoch baseline: politics, technology, social norms (tagged `epoch: 5`).
- `organizations.ts` — Nighthawks, Mandated Punishers, Machinery Hivemind, Psychology Alchemists, Aurora Order.
- `npcs.ts` — Key Tingen NPCs: Dunn Smith, Leonard Mitchell, Old Neil, Daly Simone, Azik Eggers, Klein Moretti, Melissa Moretti, Ince Zangwill.
- `pathway-fool.ts` — Fool pathway lore (Seq 9-5).
- `pathway-visionary.ts` — Visionary pathway lore (Seq 9-5).
- `pathway-sun.ts` — Sun pathway lore (Seq 9-5).
- `pathway-death.ts` — Death pathway lore (Seq 9-5).
- `pathway-darkness.ts` — Darkness pathway lore (Seq 9-5).
- `pathway-tyrant.ts` — Tyrant pathway lore (Seq 9-5).
- `pathway-door.ts` — Door pathway lore (Seq 9-5).
- `pathway-error.ts` — Error pathway lore (Seq 9-5).
- `pathway-hanged-man.ts` — Hanged Man pathway lore (Seq 9-5).
- `pathway-{white-tower,twilight-giant,justiciar,black-emperor,red-priest,demoness,mother,moon,hermit,paragon,wheel-of-fortune,abyss,chained}.ts` — The thirteen additional pathways (issue #28). Each holds a single player-safe **overview** entry (family/group + the canon Seq 9-5 progression); per-sequence lore depth awaits the novel source. The `pathway` field is the lowercased full name with spaces (e.g. `"white tower"`) so `selectCuratedLore` matches it.
- `index.ts` — Re-exports and query helpers (`getLoreByCategory`, `getLoreByPathway`, `getLoreByEpoch`, `getLoreByEpochSetting`, etc.). `getLoreByEpochSetting(epoch)` returns the era's `metaphysics` overview entries (no city/faction) that `selectCuratedLore` injects so a character always carries its own epoch's world context regardless of the prose `startingLocation`.
- `lore.test.ts` — Data integrity tests.

> **Epoch isolation note:** pathways exist in every era, but the curated pathway lore PROSE is written with Fifth-Epoch framing (churches, Nighthawks, gaslight) and is therefore tagged `epoch: 5` — gated out of earlier epochs to avoid crossover. Pathway **mechanics** still reach every epoch through the rules engine (`buildAICallParams` passes abilities/acting from `@/lib/rules`), not this lore. The city/organization/NPC/Fifth-Epoch files are likewise tagged `epoch: 5`; the four `epoch-{first..fourth}.ts` files carry epochs 1-4.

## Database Table

`lore_entries` in Supabase (migration `20260527111842`). Seeded by `20260527113655`; the five additional pathways (Darkness, Tyrant, Door, Error, Hanged Man) are seeded by `20260612170000`; the three additional cities (Backlund, Trier, Bayam) by `20260613020000`; the thirteen remaining pathways (White Tower … Chained, overview entries) by `20260613030000`; the four pre-Iron-Age epochs (First-Fourth) by `20260614010000`.

Metadata columns for filtering: `category`, `pathway`, `epoch`, `city`, `npcs`, `sequences`, `tags`.
`embedding` column (vector 1536) is nullable — populated post-MVP via pgvector.

## Conventions

- One entry per logical concept (one NPC, one location, one sequence).
- Target 300-800 tokens per entry for retrieval precision.
- Slugs are URL-safe unique identifiers: `category-qualifier` pattern.
- TypeScript source is the canonical data; SQL seed is generated from it.
- When adding new lore, add to the appropriate `.ts` file and regenerate the seed migration.
