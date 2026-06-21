// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadActiveSessionId = vi.fn(() => "s2");
const loadSessionIndex = vi.fn(() => ["s1", "s2"]);
const saveActiveSessionId = vi.fn();
const saveSessionIndex = vi.fn();
vi.mock("@/lib/react/session-store", () => ({
  loadActiveSessionId: () => loadActiveSessionId(),
  loadSessionIndex: () => loadSessionIndex(),
  saveActiveSessionId: (id: string | null) => saveActiveSessionId(id),
  saveSessionIndex: (idx: string[]) => saveSessionIndex(idx),
}));

const characterDeletionPlan = vi.fn();
const deleteSessionEntriesRemote = vi.fn();
vi.mock("@/lib/game", () => ({
  characterDeletionPlan: (id: string, idx: string[]) => characterDeletionPlan(id, idx),
  deleteSessionEntriesRemote: (client: unknown, id: string) =>
    deleteSessionEntriesRemote(client, id),
}));

const createClient = vi.fn(() => ({ tag: "client" }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => createClient() }));

const deleteSessionFromCloud = vi.fn();
vi.mock("./cloud-sync", () => ({
  deleteSessionFromCloud: (id: string) => deleteSessionFromCloud(id),
}));

import { purgeCharacter } from "./character-actions";

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("lotm-rpg-save-s1", "x");
  localStorage.setItem("lotm-rpg-journal-s1", "y");
  vi.clearAllMocks();
  loadActiveSessionId.mockReturnValue("s2");
  loadSessionIndex.mockReturnValue(["s1", "s2"]);
  characterDeletionPlan.mockReturnValue({
    removeKeys: ["lotm-rpg-save-s1", "lotm-rpg-journal-s1"],
    nextIndex: ["s2"],
  });
  createClient.mockReturnValue({ tag: "client" });
});
afterEach(() => vi.restoreAllMocks());

describe("purgeCharacter", () => {
  it("wipes local keys, saves the trimmed index, and reconciles the active pointer", async () => {
    const next = purgeCharacter("s1");
    expect(next).toEqual(["s2"]);
    expect(localStorage.getItem("lotm-rpg-save-s1")).toBeNull();
    expect(localStorage.getItem("lotm-rpg-journal-s1")).toBeNull();
    expect(saveSessionIndex).toHaveBeenCalledWith(["s2"]);
    expect(saveActiveSessionId).toHaveBeenCalledWith("s2");
    await flush();
  });

  it("deletes the cloud save and the durable journal rows", async () => {
    purgeCharacter("s1");
    expect(deleteSessionFromCloud).toHaveBeenCalledWith("s1");
    await flush();
    expect(deleteSessionEntriesRemote).toHaveBeenCalledWith({ tag: "client" }, "s1");
  });

  it("still returns the trimmed index when local storage writes throw", async () => {
    vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const next = purgeCharacter("s1");
    expect(next).toEqual(["s2"]);
    expect(deleteSessionFromCloud).toHaveBeenCalledWith("s1");
    await flush();
  });

  it("is non-fatal when the remote journal delete fails", async () => {
    createClient.mockImplementation(() => {
      throw new Error("offline");
    });
    expect(() => purgeCharacter("s1")).not.toThrow();
    await flush();
    expect(deleteSessionEntriesRemote).not.toHaveBeenCalled();
  });
});
