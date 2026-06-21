// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCachedArt, putCachedArt } from "./scene-art-cache";

// jsdom ships no IndexedDB, so install a minimal fake covering exactly the
// surface scene-art-cache uses (open → upgrade → store get/put). `failMode`
// lets a test drive the onerror branches the module guards.
type FailMode = "none" | "open" | "get" | "tx";
let failMode: FailMode = "none";
let storeExists = false;
let openErrorNull = false;
const data = new Map<string, unknown>();

function fakeIndexedDB() {
  const db = {
    objectStoreNames: { contains: (n: string) => n === "images" && storeExists },
    createObjectStore: () => {
      storeExists = true;
      return {};
    },
    transaction: () => {
      const tx: Record<string, unknown> = { oncomplete: null, onerror: null };
      tx.objectStore = () => ({
        get: (key: string) => {
          const req: Record<string, unknown> = { result: undefined, error: null };
          queueMicrotask(() => {
            if (failMode === "get") return (req.onerror as () => void)?.();
            req.result = data.get(key);
            (req.onsuccess as () => void)?.();
          });
          return req;
        },
        put: (value: unknown, key: string) => {
          queueMicrotask(() => {
            if (failMode === "tx") return (tx.onerror as () => void)?.();
            data.set(key, value);
            (tx.oncomplete as () => void)?.();
          });
          return {};
        },
      });
      return tx;
    },
  };
  return {
    open: () => {
      const req: Record<string, unknown> = {
        result: db,
        error: openErrorNull ? null : new Error("idb"),
      };
      queueMicrotask(() => {
        if (failMode === "open") return (req.onerror as () => void)?.();
        (req.onupgradeneeded as () => void)?.();
        (req.onsuccess as () => void)?.();
      });
      return req;
    },
  };
}

beforeEach(() => {
  failMode = "none";
  storeExists = false;
  openErrorNull = false;
  data.clear();
  vi.stubGlobal("indexedDB", fakeIndexedDB());
});
afterEach(() => vi.unstubAllGlobals());

describe("scene-art-cache", () => {
  it("round-trips a data URL through the store", async () => {
    await putCachedArt("s:1", "data:image/png;base64,AAA");
    expect(await getCachedArt("s:1")).toBe("data:image/png;base64,AAA");
  });

  it("returns null for a missing key", async () => {
    expect(await getCachedArt("absent")).toBeNull();
  });

  it("returns null when a non-string is stored", async () => {
    data.set("weird", 42);
    expect(await getCachedArt("weird")).toBeNull();
  });

  it("resolves null when IndexedDB cannot be opened", async () => {
    failMode = "open";
    expect(await getCachedArt("s:1")).toBeNull();
  });

  it("resolves null when the open error carries no Error object", async () => {
    failMode = "open";
    openErrorNull = true;
    expect(await getCachedArt("s:1")).toBeNull();
  });

  it("resolves null when the read request errors", async () => {
    failMode = "get";
    expect(await getCachedArt("s:1")).toBeNull();
  });

  it("swallows a failed write transaction", async () => {
    failMode = "tx";
    await expect(putCachedArt("s:1", "data:...")).resolves.toBeUndefined();
  });

  it("swallows a put when IndexedDB cannot be opened", async () => {
    failMode = "open";
    await expect(putCachedArt("s:1", "data:...")).resolves.toBeUndefined();
  });

  it("returns null when indexedDB is entirely unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(await getCachedArt("s:1")).toBeNull();
  });
});
