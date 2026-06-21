// Shared random-draw helpers (issue #85). The pattern
// `arr[Math.floor(random() * arr.length)]` was re-implemented across the game
// engine (apotheosis/death/echoes/society) and lore (start-scenarios), and only
// the start-scenarios copy carried the boundary clamp the others lacked. These
// are the single, tested draw primitives every caller now shares, so the clamp
// is applied uniformly and the draw can never be subtly wrong in one place.
//
// `random` is an injected source (default `Math.random`) so every consumer stays
// pure and deterministic under test. Both functions take ONE `random()` sample,
// matching the call sites they replace (no change to the random stream's order).
//
// The clamp guards the `random() === 1` boundary: `Math.floor(1 * len) === len`
// would index one past the end. `Math.random()` returns `[0, 1)` so it never
// trips this, but an injected `() => 1` (and the general contract) must stay safe.

/**
 * A uniformly random index into a list of `length` items: `0 .. length - 1`,
 * clamped so an injected `random() === 1` never returns `length`. Callers that
 * need the position itself (e.g. storing a stable catalog index) use this; most
 * use {@link pickRandom} to get the element directly. Precondition: `length >= 1`.
 */
export function randomIndex(length: number, random: () => number = Math.random): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

/**
 * Draw one element uniformly at random from a NON-EMPTY array, clamped at the
 * `random() === 1` boundary (see the module note). The single helper every
 * `arr[Math.floor(random() * arr.length)]` site now shares. Precondition: `arr`
 * is non-empty (every call site guarantees this); on an empty array it returns
 * `undefined` despite the `T` type, like the `pool[idx]!` draw it replaced.
 */
export function pickRandom<T>(arr: readonly T[], random: () => number = Math.random): T {
  return arr[randomIndex(arr.length, random)]!;
}
