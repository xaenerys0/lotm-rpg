import { describe, expect, it, vi } from "vitest";

import type { CharacterLegacy } from "./death";
import type { TimelineArtifact } from "./echoes";
import {
  fetchWorldMemory,
  pushWorldMemory,
  reconcileWorldMemory,
  type WorldMemory,
  type WorldMemorySyncClient,
} from "./world-memory-sync";

function legacy(characterId: string, timestamp: number): CharacterLegacy {
  return {
    characterId,
    pathwayId: 1,
    sequenceLevel: 9,
    fate: "dead",
    role: "legend",
    location: "Tingen",
    turnCount: 3,
    epitaph: "Fell to the fog.",
    timestamp,
  };
}

function echo(id: string): TimelineArtifact {
  return {
    id,
    name: `Relic ${id}`,
    description: "A humming trinket.",
    originEpoch: 5,
    originCharacter: "Klein",
    originFate: "dead",
    createdAt: 1,
  };
}

type Err = { message: string } | null;

function mockClient(
  opts: {
    upsertError?: Err;
    selectData?: { legacies: unknown; echoes: unknown }[] | null;
    selectError?: Err;
  } = {},
) {
  const calls = { upsert: vi.fn(), select: vi.fn() };
  const client: WorldMemorySyncClient = {
    from() {
      return {
        upsert(rows, options) {
          calls.upsert(rows, options);
          return Promise.resolve({ error: opts.upsertError ?? null });
        },
        select(columns) {
          calls.select(columns);
          return Promise.resolve({
            data: (opts.selectData ?? null) as
              | { legacies: never; echoes: never }[]
              | null,
            error: opts.selectError ?? null,
          });
        },
      };
    },
  };
  return { client, calls };
}

describe("pushWorldMemory", () => {
  it("upserts one row keyed on user_id", async () => {
    const { client, calls } = mockClient();
    await pushWorldMemory(client, "u", {
      legacies: [legacy("a", 1)],
      echoes: [echo("e")],
    });
    const [rows, options] = calls.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "user_id" });
    expect(rows[0].user_id).toBe("u");
    expect(rows[0].legacies).toHaveLength(1);
    expect(rows[0].echoes).toHaveLength(1);
  });

  it("throws when the upsert errors", async () => {
    const { client } = mockClient({ upsertError: { message: "boom" } });
    await expect(
      pushWorldMemory(client, "u", { legacies: [], echoes: [] }),
    ).rejects.toThrow(/World-memory sync failed: boom/);
  });
});

describe("fetchWorldMemory", () => {
  it("returns empty memory when there is no row", async () => {
    const { client } = mockClient({ selectData: null });
    expect(await fetchWorldMemory(client)).toEqual({ legacies: [], echoes: [] });
  });

  it("parses stored legacies and echoes", async () => {
    const { client } = mockClient({
      selectData: [{ legacies: [legacy("a", 1)], echoes: [echo("e")] }],
    });
    const memory = await fetchWorldMemory(client);
    expect(memory.legacies.map((l) => l.characterId)).toEqual(["a"]);
    expect(memory.echoes.map((e) => e.id)).toEqual(["e"]);
  });

  it("defaults a malformed half to empty", async () => {
    const { client } = mockClient({
      selectData: [{ legacies: "not an array", echoes: [echo("e")] }],
    });
    const memory = await fetchWorldMemory(client);
    expect(memory.legacies).toEqual([]);
    expect(memory.echoes).toHaveLength(1);
  });

  it("throws when the select errors", async () => {
    const { client } = mockClient({ selectError: { message: "bad" } });
    await expect(fetchWorldMemory(client)).rejects.toThrow(
      /World-memory fetch failed: bad/,
    );
  });
});

describe("reconcileWorldMemory", () => {
  it("unions legacies by character+timestamp and echoes by id", () => {
    const local: WorldMemory = { legacies: [legacy("a", 1)], echoes: [echo("e1")] };
    const remote: WorldMemory = {
      legacies: [legacy("a", 1), legacy("b", 2)],
      echoes: [echo("e1"), echo("e2")],
    };
    const merged = reconcileWorldMemory(local, remote);
    expect(merged.legacies.map((l) => l.characterId).sort()).toEqual(["a", "b"]);
    expect(merged.echoes.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
  });

  it("keeps same-character legacies that fell at different times distinct", () => {
    const merged = reconcileWorldMemory(
      { legacies: [legacy("a", 1)], echoes: [] },
      { legacies: [legacy("a", 2)], echoes: [] },
    );
    expect(merged.legacies).toHaveLength(2);
  });

  it("prefers the local copy of a colliding key", () => {
    const localL = { ...legacy("a", 1), epitaph: "local" };
    const remoteL = { ...legacy("a", 1), epitaph: "remote" };
    const merged = reconcileWorldMemory(
      { legacies: [localL], echoes: [] },
      { legacies: [remoteL], echoes: [] },
    );
    expect(merged.legacies[0].epitaph).toBe("local");
  });
});
