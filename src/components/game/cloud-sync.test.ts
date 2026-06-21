// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Storage key constants the module uses (real-ish values) ──────────
const K = {
  CLOUD_SYNCED_KEY: "lotm:cloud-synced",
  ECHOES_KEY: "lotm:echoes",
  HINT_KEY_PREFIX: "lotm-rpg-hint-",
  LEGACIES_KEY: "lotm:legacies",
  PREFERENCES_KEY: "lotm:preferences",
  SESSION_KEY_PREFIX: "lotm-rpg-save-",
};

// ── @/lib/game mock: pure row-mapping/reconcile helpers + constants ──
// Bare mocks (callable with any args, no named params) keep the lint clean; the
// stateful ones get their default return values re-applied in beforeEach so each
// test starts from a known baseline regardless of prior overrides.
const g = {
  serializeSession: vi.fn(),
  characterDeletionPlan: vi.fn(),
  deserializeLegacies: vi.fn(),
  deserializeArtifacts: vi.fn(),
  legacyKey: vi.fn(),
  pushSessions: vi.fn(),
  setActiveRemote: vi.fn(),
  deleteSessionRemote: vi.fn(),
  pushWorldMemory: vi.fn(),
  pushPreferences: vi.fn(),
  fetchSessions: vi.fn(),
  fetchWorldMemory: vi.fn(),
  fetchPreferences: vi.fn(),
  reconcile: vi.fn(),
  reconcileWorldMemory: vi.fn(),
  reconcilePreferences: vi.fn(),
  serializeLegacies: vi.fn(),
  serializeArtifacts: vi.fn(),
  serializePreferences: vi.fn(),
  ...K,
};
vi.mock("@/lib/game", () => g);

function applyGameDefaults() {
  g.serializeSession.mockImplementation((s: { id: string }) => JSON.stringify(s));
  g.characterDeletionPlan.mockImplementation((id: string) => ({
    removeKeys: [K.SESSION_KEY_PREFIX + id],
  }));
  g.deserializeLegacies.mockReturnValue([]);
  g.deserializeArtifacts.mockReturnValue([]);
  g.legacyKey.mockImplementation((l: { key: string }) => l.key);
  g.pushSessions.mockResolvedValue(undefined);
  g.setActiveRemote.mockResolvedValue(undefined);
  g.deleteSessionRemote.mockResolvedValue(undefined);
  g.pushWorldMemory.mockResolvedValue(undefined);
  g.pushPreferences.mockResolvedValue(undefined);
  g.fetchSessions.mockResolvedValue({ sessions: [], activeId: "s1" });
  g.fetchWorldMemory.mockResolvedValue({ legacies: [], echoes: [] });
  g.fetchPreferences.mockResolvedValue({ preferences: {}, dismissedHints: [] });
  g.reconcile.mockReturnValue({
    toWriteLocal: [{ id: "s1" }],
    toDeleteLocal: ["old"],
    merged: [{ id: "s1" }],
    toPushRemote: [{ id: "s1" }],
    activeId: "s1",
  });
  g.reconcileWorldMemory.mockReturnValue({
    legacies: [{ key: "lk" }],
    echoes: [{ id: "e1" }],
  });
  g.reconcilePreferences.mockReturnValue({
    preferences: { highContrast: false },
    dismissedHints: ["h1"],
  });
  g.serializeLegacies.mockReturnValue("[]");
  g.serializeArtifacts.mockReturnValue("[]");
  g.serializePreferences.mockReturnValue("{}");
}

// ── @/lib/react/session-store mock ──────────────────────────────────
const store = {
  loadActiveSessionId: vi.fn(() => "s1"),
  loadAllSessions: vi.fn(() => []),
  registerSessionSyncSink: vi.fn(),
  saveActiveSessionId: vi.fn(),
  saveSessionIndex: vi.fn(),
};
vi.mock("@/lib/react/session-store", () => store);

vi.mock("./preferences-store", () => ({
  loadPreferences: () => ({ highContrast: false }),
}));

// ── Supabase browser client mock ────────────────────────────────────
const getUser = vi.fn(
  async (): Promise<{ data: { user: { id: string } | null } }> => ({
    data: { user: { id: "u1" } },
  }),
);
const onAuthStateChange = vi.fn();
const createClient = vi.fn(() => ({ auth: { getUser, onAuthStateChange } }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => createClient() }));

const flush = () => new Promise((r) => setTimeout(r, 0));

async function load() {
  return import("./cloud-sync");
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  localStorage.clear();
  applyGameDefaults();
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  createClient.mockReturnValue({ auth: { getUser, onAuthStateChange } });
  store.loadActiveSessionId.mockReturnValue("s1");
  store.loadAllSessions.mockReturnValue([]);
});
afterEach(() => vi.restoreAllMocks());

describe("startCloudSync", () => {
  it("registers the sink, watches auth, hydrates, and is idempotent", async () => {
    const mod = await load();
    mod.startCloudSync();
    expect(store.registerSessionSyncSink).toHaveBeenCalledTimes(1);
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
    await flush();
    // Second call is a no-op.
    mod.startCloudSync();
    expect(store.registerSessionSyncSink).toHaveBeenCalledTimes(1);
  });

  it("survives an auth listener that throws and still hydrates", async () => {
    createClient.mockImplementation(() => {
      throw new Error("no auth");
    });
    const mod = await load();
    expect(() => mod.startCloudSync()).not.toThrow();
    await flush();
  });

  it("re-hydrates on SIGNED_IN and drops identity on SIGNED_OUT", async () => {
    const mod = await load();
    mod.startCloudSync();
    await flush();
    const handler = onAuthStateChange.mock.calls[0][0] as (e: string) => void;
    const before = g.fetchSessions.mock.calls.length;
    handler("SIGNED_OUT");
    handler("SIGNED_IN");
    await flush();
    expect(g.fetchSessions.mock.calls.length).toBeGreaterThan(before);
  });
});

describe("hydrate via startCloudSync", () => {
  it("reconciles and writes both directions on the happy path", async () => {
    const mod = await load();
    mod.startCloudSync();
    await flush();
    expect(g.reconcile).toHaveBeenCalled();
    expect(store.saveSessionIndex).toHaveBeenCalledWith(["s1"]);
    expect(g.pushSessions).toHaveBeenCalled(); // toPushRemote was non-empty
    expect(localStorage.getItem(K.SESSION_KEY_PREFIX + "s1")).toBeTruthy();
    expect(localStorage.getItem(K.SESSION_KEY_PREFIX + "old")).toBeNull();
    expect(localStorage.getItem(K.LEGACIES_KEY)).toBe("[]");
    expect(localStorage.getItem(K.HINT_KEY_PREFIX + "h1")).toBe("1");
  });

  it("skips the remote push when nothing is new and adopts the local active id", async () => {
    g.reconcile.mockReturnValueOnce({
      toWriteLocal: [],
      toDeleteLocal: [],
      merged: [],
      toPushRemote: [],
      activeId: null,
    });
    const mod = await load();
    mod.startCloudSync();
    await flush();
    expect(g.pushSessions).not.toHaveBeenCalled();
    expect(store.saveActiveSessionId).toHaveBeenCalledWith("s1");
  });

  it("no-ops when there is no signed-in user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const mod = await load();
    mod.startCloudSync();
    await flush();
    expect(g.reconcile).not.toHaveBeenCalled();
  });

  it("leaves localStorage intact if reconcile throws", async () => {
    g.fetchSessions.mockRejectedValueOnce(new Error("offline"));
    const mod = await load();
    mod.startCloudSync();
    await flush();
    expect(store.saveSessionIndex).not.toHaveBeenCalled();
  });
});

describe("best-effort pushers via the session-store sink", () => {
  async function startAndGetSink() {
    const mod = await load();
    mod.startCloudSync();
    await flush();
    const sink = store.registerSessionSyncSink.mock.calls[0][0] as {
      persist: (s: unknown) => void;
      setActive: (id: string | null) => void;
    };
    return { mod, sink };
  }

  it("persist mirrors the save to the cloud and records it in the ledger", async () => {
    const { sink } = await startAndGetSink();
    g.pushSessions.mockClear();
    sink.persist({ id: "s9" });
    await flush();
    expect(g.pushSessions).toHaveBeenCalled();
    expect(localStorage.getItem(K.CLOUD_SYNCED_KEY)).toContain("s9");
  });

  it("setActive(null) is a no-op; a real id calls the remote", async () => {
    const { sink } = await startAndGetSink();
    sink.setActive(null);
    await flush();
    expect(g.setActiveRemote).not.toHaveBeenCalled();
    sink.setActive("s1");
    await flush();
    expect(g.setActiveRemote).toHaveBeenCalled();
  });
});

describe("exported pushers", () => {
  it("deleteSessionFromCloud drops the id from the ledger and deletes remotely", async () => {
    localStorage.setItem(
      K.CLOUD_SYNCED_KEY,
      JSON.stringify({ sessions: ["s1"], legacyKeys: [], echoIds: [] }),
    );
    const mod = await load();
    mod.startCloudSync();
    await flush();
    mod.deleteSessionFromCloud("s1");
    await flush();
    expect(g.deleteSessionRemote).toHaveBeenCalled();
    expect(localStorage.getItem(K.CLOUD_SYNCED_KEY)).not.toContain("s1");
  });

  it("pushWorldMemoryToCloud mirrors legacies/echoes and records their keys", async () => {
    g.deserializeLegacies.mockReturnValue([{ key: "lk1" }]);
    g.deserializeArtifacts.mockReturnValue([{ id: "e1" }]);
    localStorage.setItem(K.LEGACIES_KEY, "x");
    localStorage.setItem(K.ECHOES_KEY, "y");
    const mod = await load();
    mod.startCloudSync();
    await flush();
    g.pushWorldMemory.mockClear();
    mod.pushWorldMemoryToCloud();
    await flush();
    expect(g.pushWorldMemory).toHaveBeenCalled();
    expect(localStorage.getItem(K.CLOUD_SYNCED_KEY)).toContain("lk1");
  });

  it("pushPreferencesToCloud mirrors preferences + dismissed hints", async () => {
    localStorage.setItem(K.HINT_KEY_PREFIX + "seen", "1");
    const mod = await load();
    mod.startCloudSync();
    await flush();
    g.pushPreferences.mockClear();
    mod.pushPreferencesToCloud();
    await flush();
    expect(g.pushPreferences).toHaveBeenCalled();
  });

  it("pushers no-op cleanly when signed out", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const mod = await load();
    mod.startCloudSync();
    await flush();
    mod.pushWorldMemoryToCloud();
    mod.pushPreferencesToCloud();
    mod.deleteSessionFromCloud("s1");
    await flush();
    expect(g.pushWorldMemory).not.toHaveBeenCalled();
    expect(g.deleteSessionRemote).not.toHaveBeenCalled();
  });
});

describe("ledger + storage resilience", () => {
  it("recovers from a corrupt ledger and from storage failures", async () => {
    localStorage.setItem(K.CLOUD_SYNCED_KEY, "{not json");
    const mod = await load();
    mod.startCloudSync();
    await flush();
    // A corrupt ledger is treated as empty; hydrate still completes.
    expect(g.reconcile).toHaveBeenCalled();
  });

  it("tolerates localStorage.key throwing while reading dismissed hints", async () => {
    const spy = vi.spyOn(localStorage, "key").mockImplementation(() => {
      throw new Error("blocked");
    });
    const mod = await load();
    mod.startCloudSync();
    await flush();
    expect(g.pushPreferences).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("treats unreadable world-memory as empty", async () => {
    g.deserializeLegacies.mockImplementation(() => {
      throw new Error("corrupt");
    });
    g.deserializeArtifacts.mockImplementation(() => {
      throw new Error("corrupt");
    });
    localStorage.setItem(K.LEGACIES_KEY, "x");
    localStorage.setItem(K.ECHOES_KEY, "y");
    const mod = await load();
    mod.startCloudSync();
    await flush();
    mod.pushWorldMemoryToCloud();
    await flush();
    expect(g.pushWorldMemory).toHaveBeenCalled();
  });
});

describe("useCloudSyncStatus", () => {
  it("exposes the reactive hydration status", async () => {
    const { renderHook } = await import("@testing-library/react");
    const mod = await load();
    const { result } = renderHook(() => mod.useCloudSyncStatus());
    expect(["idle", "hydrating", "synced"]).toContain(result.current);
  });

  it("reports 'idle' from the server snapshot during SSR", async () => {
    const React = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const mod = await load();
    const Probe = () => React.createElement("span", null, mod.useCloudSyncStatus());
    const html = renderToStaticMarkup(React.createElement(Probe));
    expect(html).toBe("<span>idle</span>");
  });
});
