@../../../docs/rules/testing.md

# Game Loop Engine

Pure-function game loop state machine and world state management. The engine handles phase transitions, world state mutations, and session persistence. AI calls and UI rendering are handled by components in `src/components/game/`.

## Structure

- `types.ts` — Game loop type definitions: phases, actions, session, pillars, transition maps.
- `state-machine.ts` — Pure reducer: `transition(session, action)` produces the next session state. Phase transitions validated against `VALID_TRANSITIONS`. `InvalidTransitionError` for illegal transitions.
- `world-state.ts` — World state mutation: `applyResolution()` orchestrates sanity, location, inventory, digestion, and memory updates from a validated AI response. Only AI-mutable fields (`location`, `activeQuests`, `npcsPresent`) are applied from `worldStateChanges`; pathway/sequence/maxSanity are rules-engine-only. `applyDigestion()` advances/reverses potion digestion from the AI's acting evaluation. A normal turn also calls `tickInjuries()` (from `combat.ts`) so combat injuries heal over play.
- `combat.ts` — Combat engine (issue #10). Pure, deterministic functions for hybrid combat: a mechanical **preparation** phase, an AI-narrated **exchange** of mid-fight decision points, and a **resolution**. `scorePreparation()` rates preparation 0-1 (capped per dimension; `AMBUSH_PREP_CAP` for ambushes); `computeSequenceGap()`, `computePathwayMatchup()` (Beyonder-vs-mundane edge, God-Almighty-vs-Eternal-Darkness opposition, kindred groups, same-pathway penalty), and `computeInjuryPenalty()` feed `computeBaseAdvantage()` together with a single injected `randomFactor`. `createEncounter()` → `applyPreparation()` → `chooseOption()` (×2-3) → `resolveEncounter()` walk the `CombatEncounter` mini state machine; `generateDecisionPoints()` builds pathway-flavoured options whose context-aware modifiers reward knowing your enemy and holding an edge. `resolveOutcome()` maps the final advantage + tactics to `victory`/`defeat`/`escape`/`stalemate`; `computeConsequences()` produces injuries, sanity drain (via `sanityDelta`), items gained/lost, and dropped characteristics. `applyCombatResult()` writes the result to `GameState` (sanity, inventory, `injuries`); `tickInjuries()` heals injuries each turn. **Design principle: preparation helps but never decides** — clever mid-fight choices can overturn a poor start and a single random factor keeps no fight certain. The AI layer only narrates (instruction `"combat"`).
- `digestion.ts` — Acting Method digestion engine (issue #8). Pure functions mapping the AI's acting `alignment` score (0-1) to 0-100 digestion progress for the current potion: `computeProgressDelta()`, `applyDigestionProgress()`, `createDigestionState()`, `isDigestionComplete()`, and deterministic in-world `digestionFeedback()`. In-character acting (alignment ≥ 0.5) advances digestion; contradictory acting (< 0.35) reverses it; non-contradictory acting always yields at least `MIN_PROGRESS_PER_SESSION` (anti-stagnation guardrail).
- `session.ts` — Session lifecycle: `createSession()`, `createDefaultGameState()` (seeds a fresh `digestion` state), serialization/deserialization with shape validation (`isValidDigestionShape()`; digestion is seeded on deserialize for legacy sessions saved without it). Pure functions — no localStorage dependency. Accepts optional `initialMemory` to pre-populate memory (used for prologue facts). RAG fields (issue #63): `GameSession.canonPosition` (the player's shared-timeline position feeding the retrieval timeline gate; starts at `DEFAULT_CANON_POSITION`, advanced only forward via `advanceCanonPosition()` — monotonic) and `GameSession.embeddingModelId` (the embedding model **locked at character creation** — validated against `APPROVED_EMBEDDING_MODELS`, no mid-save switching; deserialize rejects unapproved locks and seeds defaults for legacy saves).
- `sanity.ts` — Sanity/madness engine (issue #9). Re-exports the tier classifier from `@/lib/ai` (the single source of truth, since `GameState` and the prompt assembly live there) and builds the game-facing concerns on top: `SANITY_EFFECTS` (per-tier UI-effect profiles — CSS class, distortion intensity, and which narrative degradations are active) consumed by the React layer via `sanityEffects()`; `sanityDelta(event)` mapping a `SanityEvent` (ability-use, horror-encounter scaled to sequence gap, advancement, outer-deity, acting-success, rest, human-connection, routine, acting-neglect) to a deterministic sanity delta (engine-owned, not AI); and loss-of-control evaluation at zero sanity — `isLossOfControl(state)` and `evaluateLossOfControl(ctx)` returning `setback | transformation | fatal` (higher sequences fail more catastrophically; `highRisk` escalates one step). Ready to integrate with the death/failure system (issue #12). The caller applies deltas via `applySanityImpact` (world-state.ts), which clamps to `[0, maxSanity]`.
- `preferences.ts` — Player display preferences (issue #9). `GamePreferences` (currently just `sanityMeterVisible`, default `false`), `DEFAULT_PREFERENCES`, strict shape validation, and pure `serializePreferences`/`deserializePreferences`/`mergePreferences` (fall back to defaults on missing/invalid data). localStorage access lives in the React layer (`PREFERENCES_KEY`).
- `prologue.ts` — Prologue engine: 4 static narrative scenes, pathway affinity scoring, recommendation algorithm, and `createPrologueMemory()` to seed session facts from character creation choices. Also the **live, deterministic decision path** for the AI prologue (issue #53), generic over any number of pathways (never assumes 4): `tallyAffinities(weightMaps)` sums per-pathway affinity weights across the player's picked choices; `rankPathways(tally)` sorts into descending `PathwayScore[]` (ties break by ascending id); `selectTopCandidates(tally, {count=3, min=2})` returns the ranked candidate ids for the finale (top `count`, all ties at the cutoff, with a `min` floor); `dominantAffinity(map)` is the argmax pathway id of a single affinity map. The engine — not the LLM — decides the candidate set; the player picks the final potion. `recommendPathway` is de-biased: with no affinity signal it returns `pathwayId: 0` (none) rather than defaulting to Seer/pathway 1. Exported via `index.ts`.
- `index.ts` — Public exports.
- `game-loop.test.ts` — Comprehensive game loop test suite.
- `combat.test.ts` — Combat engine unit tests (preparation scoring, matchup, base advantage, decision points, outcome resolution, consequences, injury recovery, and end-to-end acceptance scenarios).
- `digestion.test.ts` — Digestion engine unit tests.
- `prologue.test.ts` — Prologue data integrity and scoring tests.
- `sanity.test.ts` — Sanity engine unit tests (tier boundaries, effect profiles, drain/recovery deltas, loss-of-control severity).
- `preferences.test.ts` — Preferences validation and (de)serialization tests.

## Game Loop Phases

```
idle → situation → choices → resolution → consequences → situation (loop)
any active phase → error (on failure)
error → situation (retry) | idle (abandon)
```

## Key Design Decisions

- **Pure state machine.** `transition()` is a pure function — no side effects, no async. The UI orchestrates AI calls and storage.
- **Separation of concerns.** Phase transitions and world state mutations are independent operations composed by the caller.
- **AI-mutable field allowlist.** Only `location`, `activeQuests`, `npcsPresent` can be changed via AI `worldStateChanges`. Pathway, sequence, and max sanity are rules-engine-only.
- **Session serialization is pure.** `serializeSession`/`deserializeSession` operate on strings. localStorage access is in the UI layer.

## Conventions

- All functions are pure and synchronous (except AI calls in UI).
- Test patterns follow `src/lib/rules/rules.test.ts`.
- Session shape validation is strict — unknown JSON is rejected rather than coerced.
