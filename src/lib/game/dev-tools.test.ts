import { afterEach, describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";

import { advancementRequirements, isAdvanceableSequence } from "./advancement";
import {
  TEST_CHARACTER_ID,
  createTestCharacter,
  devToolsEnabled,
  isUndeletableCharacter,
} from "./dev-tools";

describe("devToolsEnabled", () => {
  const original = process.env.NEXT_PUBLIC_DEV_TOOLS;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_DEV_TOOLS;
    else process.env.NEXT_PUBLIC_DEV_TOOLS = original;
  });

  it("is off when the flag is unset", () => {
    delete process.env.NEXT_PUBLIC_DEV_TOOLS;
    expect(devToolsEnabled()).toBe(false);
  });

  it("treats explicit falsey strings as off", () => {
    for (const v of ["", "0", "false", "off", " OFF "]) {
      process.env.NEXT_PUBLIC_DEV_TOOLS = v;
      expect(devToolsEnabled()).toBe(false);
    }
  });

  it("is on for a real truthy value", () => {
    for (const v of ["1", "true", "yes", "on"]) {
      process.env.NEXT_PUBLIC_DEV_TOOLS = v;
      expect(devToolsEnabled()).toBe(true);
    }
  });
});

describe("isUndeletableCharacter", () => {
  it("protects only the fixed test-character id", () => {
    expect(isUndeletableCharacter(TEST_CHARACTER_ID)).toBe(true);
    expect(isUndeletableCharacter("some-other-id")).toBe(false);
  });
});

describe("createTestCharacter", () => {
  it("uses the fixed id so re-seeding is idempotent", () => {
    const a = createTestCharacter(1, 1000);
    const b = createTestCharacter(1, 2000);
    expect(a.id).toBe(TEST_CHARACTER_ID);
    expect(b.id).toBe(TEST_CHARACTER_ID);
  });

  it("seeds a Sequence 9 character with a fully-digested potion and the acting method", () => {
    const session = createTestCharacter(1, 1000);
    expect(session.gameState.sequenceLevel).toBe(9);
    expect(isAdvanceableSequence(session.gameState.sequenceLevel)).toBe(true);
    expect(session.gameState.digestion?.complete).toBe(true);
    expect(session.gameState.sanity).toBe(100);
    expect(session.gameState.funds).toBeGreaterThan(0);
    expect(session.actingMethodState?.knowsMethod).toBe(true);
  });

  it("carries exactly the next potion's prerequisite ingredients", () => {
    const session = createTestCharacter(1, 1000);
    const expected = getSequence(1, 8)?.prerequisiteItems ?? [];
    expect(session.gameState.inventory).toEqual(expected);
    // A fresh copy, not a reference into the canon data.
    expect(session.gameState.inventory).not.toBe(expected);
  });

  it("satisfies every advancement requirement out of the box", () => {
    const session = createTestCharacter(1, 1000);
    for (const req of advancementRequirements(session)) {
      expect(req.met).toBe(true);
    }
  });

  it("falls back to an empty inventory when the target sequence is unknown", () => {
    // An unknown pathway has no Sequence 8 data — the ingredient seed degrades
    // gracefully rather than throwing.
    const session = createTestCharacter(99999, 1000);
    expect(session.gameState.inventory).toEqual([]);
  });
});
