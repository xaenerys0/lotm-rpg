@../../../docs/rules/testing.md

# Game Loop Engine

Pure-function game loop state machine and world state management. The engine handles phase transitions, world state mutations, and session persistence. AI calls and UI rendering are handled by components in `src/components/game/`.

## Structure

- `types.ts` — Game loop type definitions: phases, actions, session, pillars, transition maps.
- `state-machine.ts` — Pure reducer: `transition(session, action)` produces the next session state. Phase transitions validated against `VALID_TRANSITIONS`. `InvalidTransitionError` for illegal transitions.
- `world-state.ts` — World state mutation: `applyResolution()` orchestrates sanity, location, inventory, digestion, and memory updates from a validated AI response. Only AI-mutable fields (`location`, `activeQuests`, `npcsPresent`) are applied from `worldStateChanges`; pathway/sequence/maxSanity are rules-engine-only. `applyDigestion()` advances/reverses potion digestion from the AI's acting evaluation.
- `digestion.ts` — Acting Method digestion engine (issue #8). Pure functions mapping the AI's acting `alignment` score (0-1) to 0-100 digestion progress for the current potion: `computeProgressDelta()`, `applyDigestionProgress()`, `createDigestionState()`, `isDigestionComplete()`, and deterministic in-world `digestionFeedback()`. In-character acting (alignment ≥ 0.5) advances digestion; contradictory acting (< 0.35) reverses it; non-contradictory acting always yields at least `MIN_PROGRESS_PER_SESSION` (anti-stagnation guardrail).
- `session.ts` — Session lifecycle: `createSession()`, `createDefaultGameState()` (seeds a fresh `digestion` state), serialization/deserialization with shape validation (`isValidDigestionShape()`; digestion is seeded on deserialize for legacy sessions saved without it). Pure functions — no localStorage dependency. Accepts optional `initialMemory` to pre-populate memory (used for prologue facts).
- `prologue.ts` — Prologue engine: 4 narrative scenes, pathway affinity scoring, recommendation algorithm, and `createPrologueMemory()` to seed session facts from character creation choices. Exported via `index.ts`.
- `index.ts` — Public exports.
- `game-loop.test.ts` — Comprehensive game loop test suite.
- `digestion.test.ts` — Digestion engine unit tests.
- `prologue.test.ts` — Prologue data integrity and scoring tests.

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
