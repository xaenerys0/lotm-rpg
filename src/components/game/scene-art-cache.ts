// IndexedDB cache for generated scene art (issue #20). Images are data URLs
// of ~1-3 MB — far past localStorage budgets — so they live in their own
// object store, keyed by `sceneArtKey(sessionId, turnNumber)`. A moment is
// generated once and replayed from cache forever after (journal included).
// Kept in the components layer like the other storage glue.

const DB_NAME = "lotm-rpg-scene-art";
const STORE = "images";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

export async function getCachedArt(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      request.onsuccess = () =>
        resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function putCachedArt(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Cache unavailable — the image simply regenerates next time.
  }
}
