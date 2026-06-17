// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import {
  loadActiveSession,
  loadActiveSessionId,
  persistSession,
  saveActiveSessionId,
  saveSessionIndex,
} from "./session-store";
import { createSession, createDefaultGameState, type GameSession } from "@/lib/game";

function makeSession(id: string): GameSession {
  return createSession(createDefaultGameState(1, `char-${id}`), id);
}

// Seed two saves with an explicit index order (newest first).
function seedTwo(): void {
  persistSession(makeSession("a"));
  persistSession(makeSession("b"));
  saveSessionIndex(["b", "a"]);
}

beforeEach(() => {
  localStorage.clear();
});

describe("active-character pointer (active-character sync)", () => {
  it("is null when there are no saves", () => {
    expect(loadActiveSessionId()).toBeNull();
    expect(loadActiveSession()).toBeNull();
  });

  it("falls back to the newest save (first in index) when unset", () => {
    seedTwo();
    expect(loadActiveSessionId()).toBe("b");
    expect(loadActiveSession()?.id).toBe("b");
  });

  it("honours an explicitly selected character", () => {
    seedTwo();
    saveActiveSessionId("a");
    expect(loadActiveSessionId()).toBe("a");
    expect(loadActiveSession()?.id).toBe("a");
  });

  it("self-heals a stale/deleted pointer back to the newest save", () => {
    seedTwo();
    saveActiveSessionId("deleted-id");
    expect(loadActiveSessionId()).toBe("b");
  });

  it("clears the pointer back to the default on null", () => {
    seedTwo();
    saveActiveSessionId("a");
    saveActiveSessionId(null);
    expect(loadActiveSessionId()).toBe("b");
  });

  it("repoints to the next save after the active character is removed from the index", () => {
    seedTwo();
    saveActiveSessionId("b");
    // Simulate deletion: drop "b" from the index (as purgeCharacter does).
    saveSessionIndex(["a"]);
    expect(loadActiveSessionId()).toBe("a");
  });
});
