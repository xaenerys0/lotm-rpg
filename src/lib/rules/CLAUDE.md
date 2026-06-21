@../../../docs/rules/testing.md

# Rules Engine

Game logic implementing the Lord of the Mysteries Beyonder power system. Reference lore: `docs/lotm-lore-summary.md`.

## Structure

- `pathways.ts` — Pathway and sequence definitions (abilities, ingredients, rituals) for all 22 pathways. Large block of game data. At module load `applyCanonAdvancement` overlays the corpus-derived `ADVANCEMENT_RITUALS` (`advancement-canon.ts`) so `ALL_PATHWAYS` reflects canon: an **Advancement Ritual exists only from Sequence 5 onward** — higher rungs (Seq 9-6) carry `advancementRitual: undefined`, Seq 5-1 take the canon ritual text + material list (falling back to the hand-authored placeholder where the corpus lacked one). Then `applyCanonDemigodAbilities` (`demigod-abilities.ts`, issue #120) overlays the corpus-derived **demigod-rung abilities** (Seq 4-1 of pathways 10-22), replacing the old hand-authored placeholders. **Acting requirements are bespoke per rung (issue #95):** every sequence of all 22 pathways carries three sequence-specific acting requirements grounded in that rung's canon sequence name + the corpus-derived abilities — the old generic per-rung template for pathways 10-22 ("Live the role of a {name}, leaning into the pathway of {x}" + one pathway-wide theme) was replaced with role-specific lines that mirror the original nine's style and Saint/Angel tiering. Lookups: `getPathway`/`getSequence` (O(1) by id).
- `demigod-abilities.ts` — Corpus-derived demigod-rung abilities for pathways 10-22 (issue #120, Tier 2). `DEMIGOD_ABILITIES[pathwayId][level]` (levels 4-1 only) condenses the per-sequence "New Abilities" from each pathway's wiki `<Pathway>/Abilities` page; `applyCanonDemigodAbilities(pathways)` overlays them onto `ALL_PATHWAYS` at load (the `applyCanonAdvancement` pattern). The thirteen later pathways' Seq 4-1 abilities were previously "themed but invented" because the engine sourced names from `Module:Sequence/standard` (a name index only); the `/Abilities` subpages do document them. The one rung the wiki leaves blank (Mother Seq 1 "Naturewalker") is a corpus-consistent extrapolation, flagged inline. Lookups: `getPathway`/`getSequence` (O(1) by id). **Abilities are cumulative** — `getCumulativeAbilities(pathwayId, level)` returns every ability from the rungs climbed (current Sequence up through Sequence 9), deduped current-rung-first, each tagged with its `sourceLevel` and an `enhanced` flag (true for earlier, now-strengthened rungs); `getCumulativeAbilityGroups` is the same set grouped by originating rung for display. Acting requirements stay scoped to the current rung (`getSequence`). The game/UI layers consume these via `sequenceAbilities` (`@/lib/game`) and the character sheet.
- `advancement-canon.ts` — **AUTO-GENERATED** (`pnpm rag:advancement-canon`, do not hand-edit). `ADVANCEMENT_RITUALS[pathwayId][level]` (levels 5-1) and `RITUAL_FROM_SEQUENCE`, extracted from the committed wiki dump's `Module:Sequence/standard` (`corpus/wiki/`). The single source of canon Advancement Ritual data.
- `sequence-names-canon.ts` — **AUTO-GENERATED** by the same `pnpm rag:advancement-canon` run (do not hand-edit). `SEQUENCE_NAMES[pathwayId][level]` — the canonical sequence NAME for every rung 9 → 0 of all 22 pathways (the wiki entry key), including the sequel (Circle of Inevitability) rungs the novel never reached. `sequence-names-canon.test.ts` is the permanent **reconciliation** guard: it holds `pathways.ts` (Seq 9-1) and `apotheosis.ts`'s `TRUE_GOD_NAMES`/pathway names (Seq 0) against this map, so curated names can never silently drift from the corpus.
- `pillars.ts` — The four **Pillars** ("Above the Sequence", issue #99 Part B): `Pillar {id, name, title, sefirah, pathwayIds}`, `PILLARS`, `pillarForPathway(id)`/`getPillar(id)`, and `siblingPathwayIds`/`siblingPathwayNames`. Canon data only — the mechanical apex above Seq 0 lives in `@/lib/game/pillars`. The four families (Lord of Mysteries {1,7,8}, God Almighty {2,3,6,9,10}, Eternal Darkness {4,5,11}, Mother Goddess of Depravity {16,17}) map exactly onto the pathways' canon `sefirah`/`group` data; the other nine pathways have no Pillar (`pillarForPathway` → `undefined`) and cap at True God. Eternal Darkness is the real fourth Pillar the Evernight Goddess ascends into (sequel canon).
- `groups.ts` — Pathway group clustering (nine groups partitioning all 22 pathways) and neighbor relationships.
- `laws.ts` — Three cosmic laws: indestructibility (conservation of total characteristic weight), conservation (sequential advancement only), convergence (same/neighboring pathway attraction).
- `validation.ts` — High-level validation API: `validateAdvancement()` and `validateTransfer()`.
- `index.ts` — Public exports.
- `rules.test.ts` — Comprehensive test suite (8 describe blocks, ~55 test cases).
- `sequence-names-canon.test.ts` — Permanent **canon reconciliation** guard (issue #99 Part A): holds `pathways.ts` (Seq 9-1) and `apotheosis.ts`'s `TRUE_GOD_NAMES`/pathway names (Seq 0) against the generated `SEQUENCE_NAMES`, so curated names can never silently drift from the wiki corpus.
- `pillars.test.ts` — Pillar canon-data tests (issue #99 Part B): the four Pillars, the family→pathway mapping (cross-checked against each pathway's `sefirah`), `pillarForPathway`/`getPillar`, and `siblingPathwayIds`/`siblingPathwayNames`.
- `demigod-abilities.test.ts` — Data-integrity tests for the corpus-derived demigod overlay (issue #120): every later pathway (10-22) has non-empty Seq 4-1 abilities, each well-formed; the original nine are untouched; the overlay is actually applied to `ALL_PATHWAYS` at load; and `applyCanonDemigodAbilities` overlays without mutating its input (purely functional, like `applyCanonAdvancement`) while passing unknown pathways through.

## Key Types (from `@/lib/types/rules`)

- `Pathway`, `Sequence`, `Ability`, `Item`, `Ritual`
- `BeyonderCharacteristic` — `{ pathwayId, sequenceLevel, quantity }`
- `AdvancementAttempt`, `CharacteristicTransfer`, `WorldCharacteristicLedger`
- `ValidationResult` with `Violation[]` (each tagged by `LawType`)

## Current Scope

All **22 pathways** are implemented to the **full Seq 9 → 1** (issue #99 Part A
completed the demigod tiers Seq 4-1 for the thirteen pathways that previously
stopped at Seq 5; the original nine reached Seq 1 earlier in #25). **The
sequence NAMES are canon** — generated into `sequence-names-canon.ts` from the
wiki `Module:Sequence/standard` (the sequel/Circle-of-Inevitability rungs the
novel never reached) and held to `pathways.ts` by `sequence-names-canon.test.ts`.
For the thirteen later pathways' Seq 4-1, the names AND the **abilities** are now
corpus-grounded (issue #120): the demigod-rung abilities are overlaid at load
from `demigod-abilities.ts`, condensed from each pathway's wiki `<Pathway>/Abilities`
page (one rung — Mother Seq 1 — the wiki leaves blank is a flagged corpus-consistent
extrapolation). Their **acting requirements are now bespoke per rung** (issue #95) —
sequence-specific lines derived from each rung's canon name + abilities, replacing the
old generic template — and the canon **Advancement Ritual** overlay
(`advancement-canon.ts`) fills any rung the wiki carries.
Sequence 0 (True God) is the apotheosis endgame in `@/lib/game/apotheosis`
(issue #30) — its honorific is in `TRUE_GOD_NAMES` (all 22, issue #99) and the
Above-the-Sequence Pillar apex sits above it (see issue #99 Part B), not stored
as a `Sequence` here.

Nine groups partition all 22 pathways (`PATHWAY_GROUPS`):

- **Mysteries** (Sefirah Castle): Fool (1), Door (7), Error (8)
- **God Almighty** (Chaos Sea): Visionary (2), Sun (3), Tyrant (6), Hanged Man (9), White Tower (10)
- **Eternal Darkness** (River of Eternal Darkness): Death (4), Darkness (5), Twilight Giant (11)
- **Order**: Justiciar (12), Black Emperor (13)
- **Combat**: Red Priest (14), Demoness (15)
- **Life**: Mother (16), Moon (17)
- **Knowledge**: Hermit (18), Paragon (19)
- **Wheel of Fortune**: Wheel of Fortune (20)
- **Abyss**: Abyss (21), Chained (22)

The three canonical god-family groups (Mysteries, God Almighty, Eternal
Darkness) are canon-solid; the six smaller groupings for pathways 12-22 are a
reasonable thematic partition pending novel-source verification — they feed
only the soft kindred-pathway bonus in `computePathwayMatchup`. The
sequence **names** for the new pathways are **verified against the novel text**
(every sampled name appears in the source), and their **abilities** are now
corpus-grounded across Seq 9-1 (Seq 9-5 authored in `pathways.ts`, Seq 4-1
overlaid from `demigod-abilities.ts`, issue #120); their acting
requirements are now bespoke per rung too (issue #95), derived from each rung's
canon name + abilities rather than a generic template. Classification scales with
sequence: Low (9-8), Mid (7-5), High (4-3, Saint), Demigod (2-1,
Angel/King of Angels). The Anchors system (issues #35, #25) — required for
Beyonders at Seq ≤ 2 — lives in `@/lib/game/anchors` with its design in
`docs/anchors-design.md`.

## Conventions

- All validation functions return `ValidationResult` with a `valid` boolean and `violations` array — never throw.
- Pathway data is read-only. Never mutate the pathway/sequence definitions at runtime.
- When adding new pathways, follow the existing structure in `pathways.ts` and add corresponding test cases.
