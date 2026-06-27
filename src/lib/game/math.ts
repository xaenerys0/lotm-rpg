// Small numeric helpers shared across the game engine. Kept dependency-free and
// pure so any engine module (combat, sanity, digestion, anchors, …) can reuse
// them without re-declaring the same one-liners.

/** Constrain `value` to the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to 4 decimals to keep advantage/potency maths free of float noise. */
export function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
