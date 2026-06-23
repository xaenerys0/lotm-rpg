import { describe, expect, it, vi } from "vitest";

import { DEFAULT_PREFERENCES } from "./preferences";
import {
  fetchPreferences,
  pushPreferences,
  reconcilePreferences,
  type PreferencesSyncClient,
  type SyncedPreferences,
} from "./preferences-sync";

type Err = { message: string } | null;

function mockClient(
  opts: {
    upsertError?: Err;
    selectData?: { preferences: unknown; dismissed_hints: unknown }[] | null;
    selectError?: Err;
  } = {},
) {
  const calls = { upsert: vi.fn(), select: vi.fn() };
  const client: PreferencesSyncClient = {
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
              | { preferences: never; dismissed_hints: never }[]
              | null,
            error: opts.selectError ?? null,
          });
        },
      };
    },
  };
  return { client, calls };
}

const synced = (over: Partial<SyncedPreferences> = {}): SyncedPreferences => ({
  preferences: { ...DEFAULT_PREFERENCES },
  dismissedHints: [],
  ...over,
});

describe("pushPreferences", () => {
  it("upserts one row keyed on user_id", async () => {
    const { client, calls } = mockClient();
    await pushPreferences(client, "u", synced({ dismissedHints: ["journal"] }));
    const [rows, options] = calls.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "user_id" });
    expect(rows[0].user_id).toBe("u");
    expect(rows[0].dismissed_hints).toEqual(["journal"]);
  });

  it("throws when the upsert errors", async () => {
    const { client } = mockClient({ upsertError: { message: "boom" } });
    await expect(pushPreferences(client, "u", synced())).rejects.toThrow(
      /Preferences sync failed: boom/,
    );
  });
});

describe("fetchPreferences", () => {
  it("returns defaults when there is no row", async () => {
    const { client } = mockClient({ selectData: null });
    const result = await fetchPreferences(client);
    expect(result.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(result.dismissedHints).toEqual([]);
  });

  it("hardens a partial stored payload over the defaults", async () => {
    const { client } = mockClient({
      selectData: [{ preferences: { highContrast: true }, dismissed_hints: ["map"] }],
    });
    const result = await fetchPreferences(client);
    expect(result.preferences.highContrast).toBe(true);
    expect(result.preferences.movementGateEnabled).toBe(true); // default kept
    expect(result.dismissedHints).toEqual(["map"]);
  });

  it("preserves a stored narrativeVerbosity and defaults an invalid one (verbosity preset)", async () => {
    const ok = mockClient({
      selectData: [
        { preferences: { narrativeVerbosity: "concise" }, dismissed_hints: [] },
      ],
    });
    expect((await fetchPreferences(ok.client)).preferences.narrativeVerbosity).toBe(
      "concise",
    );
    const bad = mockClient({
      selectData: [
        { preferences: { narrativeVerbosity: "verbose" }, dismissed_hints: [] },
      ],
    });
    expect((await fetchPreferences(bad.client)).preferences.narrativeVerbosity).toBe(
      "standard",
    );
  });

  it("defaults a null preferences payload and a non-array hint list", async () => {
    const { client } = mockClient({
      selectData: [{ preferences: null, dismissed_hints: "oops" }],
    });
    const result = await fetchPreferences(client);
    expect(result.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(result.dismissedHints).toEqual([]);
  });

  it("throws when the select errors", async () => {
    const { client } = mockClient({ selectError: { message: "bad" } });
    await expect(fetchPreferences(client)).rejects.toThrow(
      /Preferences fetch failed: bad/,
    );
  });
});

describe("reconcilePreferences", () => {
  it("lets the cloud preference win and unions dismissed hints", () => {
    const local = synced({
      preferences: { ...DEFAULT_PREFERENCES, highContrast: true },
      dismissedHints: ["journal"],
    });
    const remote = synced({
      preferences: { ...DEFAULT_PREFERENCES, highContrast: false, sceneArtEnabled: true },
      dismissedHints: ["map"],
    });
    const merged = reconcilePreferences(local, remote);
    expect(merged.preferences.highContrast).toBe(false); // remote wins
    expect(merged.preferences.sceneArtEnabled).toBe(true);
    expect(merged.dismissedHints.sort()).toEqual(["journal", "map"]);
  });

  it("lets the cloud narrativeVerbosity win (verbosity preset)", () => {
    const local = synced({
      preferences: { ...DEFAULT_PREFERENCES, narrativeVerbosity: "rich" },
    });
    const remote = synced({
      preferences: { ...DEFAULT_PREFERENCES, narrativeVerbosity: "concise" },
    });
    expect(reconcilePreferences(local, remote).preferences.narrativeVerbosity).toBe(
      "concise",
    );
  });

  it("de-duplicates hints dismissed on both devices", () => {
    const merged = reconcilePreferences(
      synced({ dismissedHints: ["journal", "map"] }),
      synced({ dismissedHints: ["map"] }),
    );
    expect(merged.dismissedHints.sort()).toEqual(["journal", "map"]);
  });
});
