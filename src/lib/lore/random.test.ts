import { describe, it, expect } from "vitest";
import { pickRandom, randomIndex } from "./random";

describe("randomIndex", () => {
  it("maps a random sample to a 0-based index", () => {
    expect(randomIndex(4, () => 0)).toBe(0);
    expect(randomIndex(4, () => 0.25)).toBe(1);
    expect(randomIndex(4, () => 0.5)).toBe(2);
    expect(randomIndex(4, () => 0.99)).toBe(3);
  });

  it("clamps the random()===1 boundary so it never returns `length`", () => {
    // Math.floor(1 * 4) === 4 would index one past the end; the clamp pins it.
    expect(randomIndex(4, () => 1)).toBe(3);
    expect(randomIndex(1, () => 1)).toBe(0);
  });

  it("defaults to Math.random and stays in range", () => {
    for (let i = 0; i < 50; i++) {
      const idx = randomIndex(5);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5);
    }
  });
});

describe("pickRandom", () => {
  const pool = ["a", "b", "c", "d"] as const;

  it("draws the element at the computed index", () => {
    expect(pickRandom(pool, () => 0)).toBe("a");
    expect(pickRandom(pool, () => 0.5)).toBe("c");
    expect(pickRandom(pool, () => 0.99)).toBe("d");
  });

  it("clamps at the random()===1 boundary to the last element", () => {
    expect(pickRandom(pool, () => 1)).toBe("d");
  });

  it("returns the sole element of a single-item array", () => {
    expect(pickRandom(["only"], () => 0.7)).toBe("only");
  });

  it("defaults to Math.random and returns a member of the array", () => {
    for (let i = 0; i < 50; i++) {
      expect(pool).toContain(pickRandom(pool));
    }
  });
});
