import { describe, expect, it, vi } from "vitest";

import { createDefaultGameState, createSession } from "./session";
import {
  deleteSessionRemote,
  fetchSessions,
  pushSessions,
  reconcile,
  setActiveRemote,
  toSessionRow,
  type SessionSyncClient,
} from "./session-sync";
import type { GameSession } from "./types";

function makeSession(id: string, updatedAt: number): GameSession {
  const session = createSession(createDefaultGameState(1, `char-${id}`), id, updatedAt);
  return { ...session, updatedAt };
}

type Err = { message: string } | null;

/** A configurable mock of the structural SessionSyncClient that records calls. */
function mockClient(
  opts: {
    upsertError?: Err;
    deleteError?: Err;
    selectData?: { data: unknown }[] | null;
    selectError?: Err;
    rpcError?: Err;
  } = {},
) {
  const calls = {
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    rpc: vi.fn(),
  };
  const client: SessionSyncClient = {
    from() {
      return {
        upsert(rows, options) {
          calls.upsert(rows, options);
          return Promise.resolve({ error: opts.upsertError ?? null });
        },
        delete() {
          calls.delete();
          return {
            eq(column, value) {
              calls.eq(column, value);
              return Promise.resolve({ error: opts.deleteError ?? null });
            },
          };
        },
        select(columns) {
          calls.select(columns);
          return Promise.resolve({
            data: (opts.selectData ?? null) as { data: never }[] | null,
            error: opts.selectError ?? null,
          });
        },
      };
    },
    rpc(fn, args) {
      calls.rpc(fn, args);
      return Promise.resolve({ error: opts.rpcError ?? null });
    },
  };
  return { client, calls };
}

describe("toSessionRow", () => {
  it("maps a session onto its row, marking the active one", () => {
    const session = makeSession("a", 5000);
    const row = toSessionRow(session, "user-1", true);
    expect(row.id).toBe("a");
    expect(row.user_id).toBe("user-1");
    expect(row.is_active).toBe(true);
    expect(row.updated_at).toBe(new Date(5000).toISOString());
    expect((row.data as { id: string }).id).toBe("a");
  });

  it("marks a non-active session inactive", () => {
    expect(toSessionRow(makeSession("a", 1), "u", false).is_active).toBe(false);
  });
});

describe("pushSessions", () => {
  it("no-ops on an empty list (no network call)", async () => {
    const { client, calls } = mockClient();
    await pushSessions(client, "u", []);
    expect(calls.upsert).not.toHaveBeenCalled();
  });

  it("upserts rows and flags the active id", async () => {
    const { client, calls } = mockClient();
    await pushSessions(client, "u", [makeSession("a", 1), makeSession("b", 2)], "b");
    const [rows, options] = calls.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "id" });
    expect(rows.map((r: { is_active: boolean }) => r.is_active)).toEqual([false, true]);
  });

  it("throws when the upsert errors", async () => {
    const { client } = mockClient({ upsertError: { message: "boom" } });
    await expect(pushSessions(client, "u", [makeSession("a", 1)])).rejects.toThrow(
      /Session sync failed: boom/,
    );
  });
});

describe("deleteSessionRemote", () => {
  it("deletes by id", async () => {
    const { client, calls } = mockClient();
    await deleteSessionRemote(client, "a");
    expect(calls.eq).toHaveBeenCalledWith("id", "a");
  });

  it("throws when the delete errors", async () => {
    const { client } = mockClient({ deleteError: { message: "no" } });
    await expect(deleteSessionRemote(client, "a")).rejects.toThrow(
      /Session delete failed: no/,
    );
  });
});

describe("setActiveRemote", () => {
  it("calls the set_active_session RPC", async () => {
    const { client, calls } = mockClient();
    await setActiveRemote(client, "a");
    expect(calls.rpc).toHaveBeenCalledWith("set_active_session", { p_id: "a" });
  });

  it("throws when the RPC errors", async () => {
    const { client } = mockClient({ rpcError: { message: "denied" } });
    await expect(setActiveRemote(client, "a")).rejects.toThrow(
      /Active session sync failed: denied/,
    );
  });
});

describe("fetchSessions", () => {
  it("returns [] when there is no data", async () => {
    const { client } = mockClient({ selectData: null });
    expect(await fetchSessions(client)).toEqual([]);
  });

  it("deserializes valid rows and drops malformed ones", async () => {
    const valid = JSON.parse(JSON.stringify(makeSession("a", 1)));
    const { client } = mockClient({
      selectData: [{ data: valid }, { data: { not: "a session" } }],
    });
    const sessions = await fetchSessions(client);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("a");
  });

  it("throws when the select errors", async () => {
    const { client } = mockClient({ selectError: { message: "bad" } });
    await expect(fetchSessions(client)).rejects.toThrow(/Session fetch failed: bad/);
  });
});

describe("reconcile", () => {
  it("pushes a local-only save and writes a remote-only save", () => {
    const local = [makeSession("local", 10)];
    const remote = [makeSession("remote", 20)];
    const r = reconcile(local, remote, null);
    expect(r.toPushRemote.map((s) => s.id)).toEqual(["local"]);
    expect(r.toWriteLocal.map((s) => s.id)).toEqual(["remote"]);
    // merged is newest-first.
    expect(r.merged.map((s) => s.id)).toEqual(["remote", "local"]);
  });

  it("keeps the newer copy when a save exists on both sides", () => {
    const localNewer = reconcile([makeSession("x", 30)], [makeSession("x", 10)], null);
    expect(localNewer.toPushRemote.map((s) => s.id)).toEqual(["x"]);
    expect(localNewer.toWriteLocal).toEqual([]);

    const remoteNewer = reconcile([makeSession("x", 10)], [makeSession("x", 30)], null);
    expect(remoteNewer.toWriteLocal.map((s) => s.id)).toEqual(["x"]);
    expect(remoteNewer.toPushRemote).toEqual([]);
  });

  it("treats a tie as a no-op (cloud copy kept)", () => {
    const r = reconcile([makeSession("x", 5)], [makeSession("x", 5)], null);
    expect(r.toPushRemote).toEqual([]);
    expect(r.toWriteLocal).toEqual([]);
    expect(r.merged.map((s) => s.id)).toEqual(["x"]);
  });

  it("adopts the cloud active id when it names an existing save", () => {
    const r = reconcile([], [makeSession("x", 1)], "x");
    expect(r.activeId).toBe("x");
  });

  it("ignores a cloud active id that names no known save", () => {
    const r = reconcile([], [makeSession("x", 1)], "ghost");
    expect(r.activeId).toBeNull();
  });
});
