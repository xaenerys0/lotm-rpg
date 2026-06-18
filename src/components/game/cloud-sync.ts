"use client";

import { useSyncExternalStore } from "react";

import {
  characterDeletionPlan,
  deleteSessionRemote,
  deserializeArtifacts,
  deserializeLegacies,
  fetchPreferences,
  fetchSessions,
  fetchWorldMemory,
  legacyKey,
  pushPreferences,
  pushSessions,
  pushWorldMemory,
  reconcile,
  reconcilePreferences,
  reconcileWorldMemory,
  serializeArtifacts,
  serializeLegacies,
  serializePreferences,
  serializeSession,
  setActiveRemote,
  CLOUD_SYNCED_KEY,
  ECHOES_KEY,
  HINT_KEY_PREFIX,
  LEGACIES_KEY,
  PREFERENCES_KEY,
  SESSION_KEY_PREFIX,
  type CharacterLegacy,
  type GameSession,
  type PreferencesSyncClient,
  type SessionSyncClient,
  type TimelineArtifact,
  type WorldMemorySyncClient,
} from "@/lib/game";
import {
  loadActiveSessionId,
  loadAllSessions,
  registerSessionSyncSink,
  saveActiveSessionId,
  saveSessionIndex,
} from "@/lib/react/session-store";
import { createClient } from "@/lib/supabase/client";

import { loadPreferences } from "./preferences-store";

// ---------------------------------------------------------------------------
// Cross-device cloud sync — the networking shell (cross-device sync)
// ---------------------------------------------------------------------------
//
// The pure decisions (row mapping, last-write-wins reconcile) live in
// `@/lib/game` under the coverage mandate; this thin browser-only shell wires
// them to the Supabase client and localStorage. Everything is best-effort: a
// signed-out / offline player simply keeps playing against localStorage, the
// long-standing source of truth, and nothing here ever throws into a render.
//
// On entry `hydrate()` reconciles the local cache with the cloud (the
// authoritative copy) and writes both directions; thereafter the session-store
// SINK mirrors every save and active-character switch, and the world-memory /
// preferences pushers mirror those writes. See `cloud-sync-registrar.tsx`.

type AnyClient = ReturnType<typeof createClient>;

interface SyncContext {
  client: AnyClient;
  userId: string;
}

let context: SyncContext | null = null;
let contextPromise: Promise<SyncContext | null> | null = null;

/** Resolve (once) the browser client + signed-in user id, or null when absent. */
async function ensureContext(): Promise<SyncContext | null> {
  if (context) return context;
  if (!contextPromise) {
    contextPromise = (async () => {
      try {
        const client = createClient();
        const { data } = await client.auth.getUser();
        if (!data.user) return null;
        context = { client, userId: data.user.id };
        return context;
      } catch {
        return null;
      }
    })();
  }
  return contextPromise;
}

/** Forget the cached identity (on sign-out / account switch) so it re-resolves. */
function resetContext(): void {
  context = null;
  contextPromise = null;
}

// ── Cross-device sync ledger (the save ids / world-memory keys seen in cloud) ─
interface SyncLedger {
  sessions: Set<string>;
  legacyKeys: Set<string>;
  echoIds: Set<string>;
}

function readLedger(): SyncLedger {
  try {
    const raw = localStorage.getItem(CLOUD_SYNCED_KEY);
    const o = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
    const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
    return {
      sessions: new Set(arr(o.sessions)),
      legacyKeys: new Set(arr(o.legacyKeys)),
      echoIds: new Set(arr(o.echoIds)),
    };
  } catch {
    return { sessions: new Set(), legacyKeys: new Set(), echoIds: new Set() };
  }
}

function writeLedger(ledger: SyncLedger): void {
  try {
    localStorage.setItem(
      CLOUD_SYNCED_KEY,
      JSON.stringify({
        sessions: [...ledger.sessions],
        legacyKeys: [...ledger.legacyKeys],
        echoIds: [...ledger.echoIds],
      }),
    );
  } catch {
    // Storage unavailable — the ledger is best-effort.
  }
}

// ── Reactive hydration status (drives the load-before-play gate) ─────
type CloudStatus = "idle" | "hydrating" | "synced";
let status: CloudStatus = "idle";
const statusListeners = new Set<() => void>();

function setStatus(next: CloudStatus): void {
  status = next;
  for (const listener of statusListeners) listener();
}

function subscribeStatus(cb: () => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

/**
 * The cloud-sync status, reactively. "hydrating" until the first reconcile
 * settles, so a screen can gate play on a fresh cloud pull and avoid a stale
 * local save clobbering a newer cloud one (SSR-safe: "idle" on the server).
 */
export function useCloudSyncStatus(): CloudStatus {
  return useSyncExternalStore(
    subscribeStatus,
    () => status,
    () => "idle" as const,
  );
}

// ── Local helpers (write without re-triggering the sink) ────────────
function writeSessionLocal(session: GameSession): void {
  try {
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
  } catch {
    // Storage unavailable — nothing to cache.
  }
}

/** Remove every local trace of a save deleted on another device (delete parity). */
function removeSessionLocal(id: string): void {
  try {
    for (const key of characterDeletionPlan(id, []).removeKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable.
  }
}

function readLocalLegacies(): CharacterLegacy[] {
  try {
    return deserializeLegacies(localStorage.getItem(LEGACIES_KEY) ?? "[]") ?? [];
  } catch {
    return [];
  }
}

function readLocalEchoes(): TimelineArtifact[] {
  try {
    return deserializeArtifacts(localStorage.getItem(ECHOES_KEY) ?? "[]") ?? [];
  } catch {
    return [];
  }
}

function readDismissedHints(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(HINT_KEY_PREFIX) && localStorage.getItem(key) === "1") {
        ids.push(key.slice(HINT_KEY_PREFIX.length));
      }
    }
  } catch {
    // Storage unavailable.
  }
  return ids;
}

// ── Best-effort pushers (the session-store sink + call-site mirrors) ─
function persistToCloud(session: GameSession): void {
  void (async () => {
    try {
      const ctx = await ensureContext();
      if (!ctx) return;
      await pushSessions(
        ctx.client as unknown as SessionSyncClient,
        ctx.userId,
        [session],
        loadActiveSessionId(),
      );
      // Record that this id now lives in the cloud, so a later remote delete is
      // recognized (not resurrected) by the next reconcile.
      const ledger = readLedger();
      if (!ledger.sessions.has(session.id)) {
        ledger.sessions.add(session.id);
        writeLedger(ledger);
      }
    } catch {
      // Offline / unreachable — localStorage already has the save.
    }
  })();
}

function setActiveToCloud(id: string | null): void {
  if (!id) return;
  void (async () => {
    try {
      const ctx = await ensureContext();
      if (!ctx) return;
      await setActiveRemote(ctx.client as unknown as SessionSyncClient, id);
    } catch {
      // Best-effort — the local pointer already moved.
    }
  })();
}

/** Best-effort delete of one cloud save (character removal, deletion parity). */
export function deleteSessionFromCloud(sessionId: string): void {
  // The save is gone locally; drop it from the ledger immediately so reconcile
  // won't treat it as "deleted elsewhere" and re-delete (a no-op) nor resurrect.
  const ledger = readLedger();
  if (ledger.sessions.delete(sessionId)) writeLedger(ledger);
  void (async () => {
    try {
      const ctx = await ensureContext();
      if (!ctx) return;
      await deleteSessionRemote(ctx.client as unknown as SessionSyncClient, sessionId);
    } catch {
      // Network/permission failure — the local save is already gone.
    }
  })();
}

/** Best-effort mirror of the current local world memory (legacies + echoes). */
export function pushWorldMemoryToCloud(): void {
  void (async () => {
    try {
      const ctx = await ensureContext();
      if (!ctx) return;
      const legacies = readLocalLegacies();
      const echoes = readLocalEchoes();
      await pushWorldMemory(ctx.client as unknown as WorldMemorySyncClient, ctx.userId, {
        legacies,
        echoes,
      });
      // The cloud now holds exactly these keys; record them so a removal here
      // (e.g. a full-timeline restart) propagates instead of being resurrected.
      const ledger = readLedger();
      ledger.legacyKeys = new Set(legacies.map(legacyKey));
      ledger.echoIds = new Set(echoes.map((e) => e.id));
      writeLedger(ledger);
    } catch {
      // Best-effort.
    }
  })();
}

/** Best-effort mirror of the current local preferences + hint dismissals. */
export function pushPreferencesToCloud(): void {
  void (async () => {
    try {
      const ctx = await ensureContext();
      if (!ctx) return;
      await pushPreferences(ctx.client as unknown as PreferencesSyncClient, ctx.userId, {
        preferences: loadPreferences(),
        dismissedHints: readDismissedHints(),
      });
    } catch {
      // Best-effort.
    }
  })();
}

// ── Hydration: pull, reconcile, write both directions ───────────────
async function doHydrate(): Promise<void> {
  setStatus("hydrating");
  try {
    const ctx = await ensureContext();
    if (!ctx) return;
    const sessionClient = ctx.client as unknown as SessionSyncClient;
    const ledger = readLedger();

    const [fetched, remoteMemory, remotePrefs] = await Promise.all([
      fetchSessions(sessionClient),
      fetchWorldMemory(ctx.client as unknown as WorldMemorySyncClient),
      fetchPreferences(ctx.client as unknown as PreferencesSyncClient),
    ]);

    // Sessions: cloud-wins copies land locally, genuinely-new local saves push,
    // and saves deleted on another device (synced-but-now-absent) are removed.
    const merged = reconcile(
      loadAllSessions(),
      fetched.sessions,
      fetched.activeId,
      ledger.sessions,
    );
    for (const session of merged.toWriteLocal) writeSessionLocal(session);
    for (const id of merged.toDeleteLocal) removeSessionLocal(id);
    saveSessionIndex(merged.merged.map((s) => s.id));
    if (merged.toPushRemote.length > 0) {
      await pushSessions(
        sessionClient,
        ctx.userId,
        merged.toPushRemote,
        fetched.activeId,
      );
    }
    // Adopt the cloud's active character when it names a survivor; otherwise
    // keep (and establish in the cloud) the local pointer, self-healed against
    // the merged index. Writing it fires the sink → set_active RPC.
    saveActiveSessionId(merged.activeId ?? loadActiveSessionId());
    // The cloud now holds exactly the merged set.
    ledger.sessions = new Set(merged.merged.map((s) => s.id));

    // World memory: union the additions, drop entries removed on another device.
    const mergedMemory = reconcileWorldMemory(
      { legacies: readLocalLegacies(), echoes: readLocalEchoes() },
      remoteMemory,
      { legacyKeys: ledger.legacyKeys, echoIds: ledger.echoIds },
    );
    try {
      localStorage.setItem(LEGACIES_KEY, serializeLegacies(mergedMemory.legacies));
      localStorage.setItem(ECHOES_KEY, serializeArtifacts(mergedMemory.echoes));
    } catch {
      // Storage unavailable.
    }
    await pushWorldMemory(
      ctx.client as unknown as WorldMemorySyncClient,
      ctx.userId,
      mergedMemory,
    );
    ledger.legacyKeys = new Set(mergedMemory.legacies.map(legacyKey));
    ledger.echoIds = new Set(mergedMemory.echoes.map((e) => e.id));

    // Preferences + hint dismissals: cloud preference wins, hints union. Write
    // locally WITHOUT savePreferences (its cloud-push side-effect would race the
    // single explicit push below with a pre-merge hint set).
    const mergedPrefs = reconcilePreferences(
      { preferences: loadPreferences(), dismissedHints: readDismissedHints() },
      remotePrefs,
    );
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        serializePreferences(mergedPrefs.preferences),
      );
      for (const hintId of mergedPrefs.dismissedHints) {
        localStorage.setItem(HINT_KEY_PREFIX + hintId, "1");
      }
    } catch {
      // Storage unavailable.
    }
    await pushPreferences(
      ctx.client as unknown as PreferencesSyncClient,
      ctx.userId,
      mergedPrefs,
    );

    writeLedger(ledger);
  } catch {
    // Any failure leaves localStorage intact — the player keeps playing.
  } finally {
    setStatus("synced");
  }
}

// Dedupe concurrent hydrate calls (the initial mount + an auth-change trigger)
// so two passes never interleave their ledger read-modify-writes.
let hydrateInFlight: Promise<void> | null = null;

function hydrate(): Promise<void> {
  if (!hydrateInFlight) {
    hydrateInFlight = doHydrate().finally(() => {
      hydrateInFlight = null;
    });
  }
  return hydrateInFlight;
}

let started = false;

/**
 * Begin cross-device sync: register the session-store sink (so every save and
 * active-character switch mirrors to the cloud), watch for auth changes (so an
 * account switch in the same tab re-syncs under the new identity instead of the
 * cached one), and run the initial hydrate. Idempotent.
 */
export function startCloudSync(): void {
  if (started) return;
  started = true;
  registerSessionSyncSink({ persist: persistToCloud, setActive: setActiveToCloud });
  try {
    createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Drop the cached identity; pushers no-op until a user signs back in.
        resetContext();
      } else if (event === "SIGNED_IN") {
        // A (possibly different) user signed in — re-resolve and re-hydrate.
        resetContext();
        void hydrate();
      }
    });
  } catch {
    // Auth listener unavailable — the initial hydrate below still runs.
  }
  void hydrate();
}
