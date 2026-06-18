"use client";

import { useSyncExternalStore } from "react";

import {
  deleteSessionRemote,
  deserializeArtifacts,
  deserializeLegacies,
  fetchPreferences,
  fetchSessions,
  fetchWorldMemory,
  pushPreferences,
  pushSessions,
  pushWorldMemory,
  reconcile,
  reconcilePreferences,
  reconcileWorldMemory,
  serializeArtifacts,
  serializeLegacies,
  serializeSession,
  setActiveRemote,
  ECHOES_KEY,
  HINT_KEY_PREFIX,
  LEGACIES_KEY,
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

import { loadPreferences, savePreferences } from "./preferences-store";

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
      await pushWorldMemory(ctx.client as unknown as WorldMemorySyncClient, ctx.userId, {
        legacies: readLocalLegacies(),
        echoes: readLocalEchoes(),
      });
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
async function hydrate(): Promise<void> {
  setStatus("hydrating");
  try {
    const ctx = await ensureContext();
    if (!ctx) return;
    const sessionClient = ctx.client as unknown as SessionSyncClient;

    // Sessions: reconcile local and cloud, write cloud-wins locally, push
    // local-wins remotely, and adopt the cloud's active pointer when it names a
    // known save (else self-heal the local one).
    const [remoteSessions, remoteMemory, remotePrefs] = await Promise.all([
      fetchSessions(sessionClient),
      fetchWorldMemory(ctx.client as unknown as WorldMemorySyncClient),
      fetchPreferences(ctx.client as unknown as PreferencesSyncClient),
    ]);

    const merged = reconcile(loadAllSessions(), remoteSessions, null);
    // The cloud's active id is the single is_active row; reconcile can't see it
    // (sessions carry no flag), so resolve the pointer separately below.
    for (const session of merged.toWriteLocal) writeSessionLocal(session);
    saveSessionIndex(merged.merged.map((s) => s.id));
    if (merged.toPushRemote.length > 0) {
      await pushSessions(
        sessionClient,
        ctx.userId,
        merged.toPushRemote,
        loadActiveSessionId(),
      );
    }
    // Re-resolve the active pointer against the merged index (self-heals a stale
    // id) and mirror it to the cloud as the single active row.
    const active = loadActiveSessionId();
    saveActiveSessionId(active);

    // World memory: union merge, write both ways.
    const mergedMemory = reconcileWorldMemory(
      { legacies: readLocalLegacies(), echoes: readLocalEchoes() },
      remoteMemory,
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

    // Preferences + hint dismissals: cloud preference wins, hints union.
    const mergedPrefs = reconcilePreferences(
      { preferences: loadPreferences(), dismissedHints: readDismissedHints() },
      remotePrefs,
    );
    savePreferences(mergedPrefs.preferences);
    try {
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
  } catch {
    // Any failure leaves localStorage intact — the player keeps playing.
  } finally {
    setStatus("synced");
  }
}

let started = false;

/**
 * Begin cross-device sync: register the session-store sink (so every save and
 * active-character switch mirrors to the cloud) and run the initial hydrate.
 * Idempotent — safe to call from a mount effect on every game route.
 */
export function startCloudSync(): void {
  if (started) return;
  started = true;
  registerSessionSyncSink({ persist: persistToCloud, setActive: setActiveToCloud });
  void hydrate();
}
