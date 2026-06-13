import { describe, expect, it } from "vitest";

import { characterDeletionPlan } from "./character-admin";
import {
  COMBAT_KEY_PREFIX,
  JOURNAL_KEY_PREFIX,
  SESSION_KEY_PREFIX,
  USAGE_KEY_PREFIX,
} from "./constants";

describe("characterDeletionPlan", () => {
  it("lists every per-session localStorage key to remove", () => {
    const { removeKeys } = characterDeletionPlan("abc", ["abc"]);
    expect(removeKeys).toEqual([
      SESSION_KEY_PREFIX + "abc",
      JOURNAL_KEY_PREFIX + "abc",
      COMBAT_KEY_PREFIX + "abc",
      USAGE_KEY_PREFIX + "abc",
    ]);
  });

  it("removes only the target id from the session index, preserving order", () => {
    const { nextIndex } = characterDeletionPlan("b", ["a", "b", "c"]);
    expect(nextIndex).toEqual(["a", "c"]);
  });

  it("is a no-op on the index when the id is absent", () => {
    const { nextIndex } = characterDeletionPlan("z", ["a", "b"]);
    expect(nextIndex).toEqual(["a", "b"]);
  });

  it("removes all occurrences of a duplicated id", () => {
    const { nextIndex } = characterDeletionPlan("dup", ["dup", "keep", "dup"]);
    expect(nextIndex).toEqual(["keep"]);
  });

  it("does not mutate the input index", () => {
    const index = ["a", "b"];
    characterDeletionPlan("a", index);
    expect(index).toEqual(["a", "b"]);
  });
});
