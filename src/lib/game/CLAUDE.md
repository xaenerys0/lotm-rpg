@../../../docs/rules/testing.md

# Game Loop Engine

Pure-function game loop state machine and world state management. The engine handles phase transitions, world state mutations, and session persistence. AI calls and UI rendering are handled by components in `src/components/game/`.

## Structure

- `types.ts` — Game loop type definitions: phases, actions, session, pillars, transition maps.
- `state-machine.ts` — Pure reducer: `transition(session, action)` produces the next session state. Phase transitions validated against `VALID_TRANSITIONS`. `InvalidTransitionError` for illegal transitions.
- `world-state.ts` — World state mutation: `applyResolution()` orchestrates sanity, location, inventory, and memory updates from a validated AI response. Only AI-mutable fields (`location`, `activeQuests`, `npcsPresent`) are applied from `worldStateChanges`; pathway/sequence/maxSanity are rules-engine-only.
- `session.ts` — Session lifecycle: `createSession()`, `createDefaultGameState()`, serialization/deserialization with shape validation. Pure functions — no localStorage dependency.
- `index.ts` — Public exports.
- `game-loop.test.ts` — Comprehensive test suite.

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
