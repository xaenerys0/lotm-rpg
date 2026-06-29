# Story-consistency Codex (history-context Codex)

A durable, queryable registry of the important **people, places, objects, groups, and
open plot threads** a chronicle has established — the missing stable index that keeps the
narrator self-consistent across very long stories (200+ turns), and a browsable Codex tab
on the character sheet.

## The problem

Turns are unbounded. The per-turn prompt keeps three memory tiers (see
`docs/rag-per-turn-budget.md` and `src/lib/ai/memory.ts`):

- the last 3–8 turns verbatim,
- a FIFO window of one-line bullets,
- a durable, narrator-maintained **running summary** (`## Story So Far`),
- plus an engine **ground-truth anchor** (`## Ground Truth`) pinning the current location
  and present NPCs.

Over hundreds of turns a figure introduced long ago, or an unresolved promise/debt, falls
out of the trimmed history. The running summary is terse and prose-shaped, so it can't be
relied on as a precise per-entity record — and the narration begins to contradict earlier
canon (a dead NPC reappears, a sworn vow is forgotten, a location's state resets).

We deliberately **do not grow the per-turn token budget** to fix this. Instead the engine
and the AI maintain a Codex and pin only a small, scene-relevant subset each turn.

## Data model

`CodexState { entities: CodexEntity[] }` rides inside `GameSession` (the
`game_sessions.data` JSONB blob) — optional, strictly validated, preserved on the
deserialize `...s` spread, exactly like `anchorState`/`trackedNpcState`. **No DB
migration.**

```ts
type CodexKind = "person" | "location" | "object" | "group" | "thread";
interface CodexEntity {
  id: string;
  kind: CodexKind;
  name: string; // the match key (case-insensitive)
  status: string; // concise present-tense state
  importance: "pivotal" | "standard";
  firstSeenTurn: number;
  lastSeenTurn: number;
  aliases?: string[];
  note?: string; // player-facing detail (never pinned)
  resolved?: boolean; // threads only — the obligation is settled
}
```

Field lengths are clamped (`NAME_MAX`/`STATUS_MAX`/`NOTE_MAX`) and the store is capped at
`MAX_CODEX_ENTITIES` (240) with salience-weighted eviction (pivotal protected; resolved
threads and stale `standard` entities evicted first), so a long save stays bounded.

The pure engine is `src/lib/game/codex.ts`; tests in `codex.test.ts`.

## Capture (AI structured output)

The narrator emits compact **deltas** in its existing JSON response —
`AIResponse.codexUpdates` (`src/lib/ai/types.ts`) — only when an entity is introduced or
materially changes. This keeps the added **output** cost small and bounded:

- `parseAIResponse` (`src/lib/ai/validation.ts`) carries the field through loosely (count
  capped at `MAX_CODEX_UPDATES` = 6, string coercion, malformed items dropped) — the same
  drop-not-throw boundary pattern as `journalEntry`.
- `applyCodexUpdates` (`codex.ts`) is the single **real** validation point: it whitelists
  `kind`/`importance`, clamps lengths, matches an existing entity by name/alias (same
  kind), and creates one otherwise.
- The `## Codex` section of the system prompt (`buildSystemPrompt`) instructs the narrator
  on when/how to emit deltas.

## Apply per turn

In the game loop's `applyAndCommitTurn` (`src/components/game/game-loop.tsx`), after every
other state mutation, `recordCodexTurn`:

1. folds the narrator's `codexUpdates` into `session.codexState`, then
2. **engine auto-touches** the entities the engine knows are present (current location +
   `npcsPresent`) — bumping their `lastSeenTurn` even if the narrator forgot to re-flag
   them, so a recurring figure never looks stale. Auto-touch never _creates_ entities (no
   fabricating an entry for every passer-by).

## Pinned ground-truth (the budget-critical piece)

Each turn `selectPinnedEntities` chooses the entities to pin: **every `pivotal` entity**
(the durable cast and driving threads) **plus** any `standard` entity named in the current
location, present NPCs, or active quests. The result is deduped, ordered (pivotal first,
then most-recently-seen), and **hard-capped at `MAX_PINNED_ENTITIES` (12)** — so the
per-turn cost is flat no matter how large the Codex grows.

`pinnedEntitiesForPrompt` maps them into the AI-layer `PinnedCodexEntity` structural type
(declared in `src/lib/ai/types.ts`, like `RetrievedLoreChunk`, so the AI layer never
imports the game layer). `buildHistoryPrompt` renders them in a compact
`## Established Facts (canon — do not contradict)` block, pinned right beside the existing
`## Ground Truth` anchor at the top of the history layer. The narrator is told to treat
these as authoritative. This is a passive **pinned index** — there is no separate, more
expensive reconciliation LLM pass.

## Backward compatibility (pre-existing saves)

A save that predates the feature has no `codexState`. On deserialize, `seedCodexFromSession`
**backfills** it from the structured state the save already carries — present NPCs and
location, the tracked-NPC roster (companions + pursuers, seeded as pivotal followers),
consecrated anchors, the secret society, and custom locations — PLUS the running summary's
`Goals:`/`Threads:` lines as thread entities, and it files a collective-named present NPC
("…Sect") as a `group` not a `person`. Nothing is fabricated: every seed is real
established data the player can already see elsewhere, so a 200-turn chronicle resumes with
a populated Codex rather than a blank one. A freshly created session seeds an empty Codex,
so saves round-trip cleanly.

**The limit of the heuristic.** The backfill reads only what is _structured_ in the session
blob. The bulk of a long chronicle's entities (people, objects, groups) live in PROSE — the
journal's 70+ entries, the running summary, the session facts — which a heuristic can't
reliably categorize. So for a deep history, the backfill is a baseline, not the whole answer.

## Rebuild from history (AI)

The opt-in deep path: a **"Rebuild from history"** action on the Codex tab runs ONE BYOK LLM
pass over the chronicle and REPLACES the Codex with a clean, categorized, de-duplicated
extraction. `codexRebuildDigest(session, journal)` (pure, `codex.ts`) assembles the digest
(character, running summary, journal beats with present NPCs, recorded facts);
`buildCodexRebuildPrompt`/`parseCodexRebuild` (pure, `src/lib/ai/codex-rebuild.ts`) build the
archivist prompt and forgivingly parse the result; `generateCodexRebuild` (`client.ts`,
premium model, low temperature) is the network shell. The parsed `CodexUpdateInput[]` is
folded into a fresh `codexState` via `applyCodexUpdates`, which consolidates variants by
name/alias. This is also the **consolidation** answer — the model merges "The Stagnation
Entity"/"Stagnation Entity" and collapses location sprawl, listing variants as `aliases`.

## Manual curation

The Codex tab is also an editor. An **Add entry** form (`applyCodexUpdate`) lets the player
add anything the AI rebuild missed — the deterministic fallback for a borderline secondary
character (e.g. an escorted companion the model keeps cutting). Per entity: **pin/unpin**
(`setCodexImportance`), **edit** name/status (`updateCodexEntity`, clamped + validated),
**merge** a duplicate into another same-kind entry (`mergeCodexEntities` — the kept entry
gains the dropped name + aliases, the earliest `firstSeenTurn`, the latest `lastSeenTurn`),
and **forget** (`removeCodexEntity`). All are pure ops in `codex.ts`; the component commits
each via `onUpdate`. (LLM extraction is best-effort and can miss a minor named entity even
with recall-tuned prompting; manual add/edit makes the Codex authoritative-by-player.)

## Player-facing Codex tab

The redesigned, tabbed character sheet (`src/components/game/character-sheet.tsx`) adds a
**Codex** tab (`codex-section.tsx`) — a browser+editor over the same registry that grounds
the narrator: grouped by kind, with a text search, kind-filter chips, a "show settled
threads" toggle, importance badges, status, and last-seen turn; plus the per-entity
curation controls (pin/edit/merge/forget) and the "Rebuild from history" action above.
The pure filter (`filterCodexEntities`) and curation ops live in `codex.ts` (tested); the
component is the shell, verified via the axe suite and an e2e spec.
