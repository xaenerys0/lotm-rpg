"use client";

import { useRef, useSyncExternalStore } from "react";

import {
  deserializeSession,
  serializeSession,
  sessionToSummary,
  type GameSession,
  type GameSessionSummary,
  ACTIVE_SESSION_KEY,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
} from "@/lib/game";

import { noopSubscribe } from "./index";

// Client-only localStorage glue for game sessions, shared by the game panels so
// each one stops re-implementing the same read/cache/persist boilerplate. The
// engine in `@/lib/game` stays pure (no localStorage); this is the UI-layer
// adapter that pairs the pure (de)serializers with the browser store. Every read
// is defensive — a missing/corrupt entry yields the empty/null fallback rather
// than throwing into a render.
//
// **Active character (active-character sync):** a single persisted pointer
// (`ACTIVE_SESSION_KEY`) decides which character EVERY page shows. It is set when
// a character is played/continued or explicitly chosen (the sidebar / character
// switcher), and resolved by `loadActiveSessionId` (self-healing: a stale/deleted
// pointer falls back to the newest save). Mutations and switches are broadcast on
// a same-tab event so the reactive hooks (`useActiveSession`,
// `useSessionSummaries`, `useActiveSessionId`) re-render live, not just on
// navigation — replacing the old "first-in-index, read once" guesswork.

/** Fired on any session add/remove/switch/persist so the reactive hooks re-read. */
const SESSIONS_EVENT = "lotm:sessions-changed";

function emitSessionsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSIONS_EVENT));
  }
}

/** Subscribe to session-store changes (same-tab events + cross-tab `storage`). */
export function subscribeSessions(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSIONS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSIONS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** The ordered list of saved session ids (newest first); `[]` if none/unreadable. */
export function loadSessionIndex(): string[] {
  try {
    const raw = localStorage.getItem(SESSION_INDEX_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** Persist the session index (newest first). Best-effort; broadcasts a change. */
export function saveSessionIndex(ids: readonly string[]): void {
  try {
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — caller's in-memory state still updates.
  }
  emitSessionsChanged();
}

/** Load one saved session by id, or `null` if missing/corrupt. */
export function loadSessionById(id: string): GameSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY_PREFIX + id);
    return raw ? deserializeSession(raw) : null;
  } catch {
    return null;
  }
}

/** Load every saved session that still deserializes, in index order. */
export function loadAllSessions(): GameSession[] {
  return loadSessionIndex()
    .map(loadSessionById)
    .filter((session): session is GameSession => session !== null);
}

/**
 * The active character's id — the single pointer every page reads. Honours the
 * stored pointer when it still names an existing save; otherwise self-heals to
 * the newest save (first in the index). `null` only when there are no saves.
 */
export function loadActiveSessionId(): string | null {
  const index = loadSessionIndex();
  if (index.length === 0) return null;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    stored = null;
  }
  return stored && index.includes(stored) ? stored : index[0];
}

/** Set (or clear, with `null`) the active character; broadcasts the switch. */
export function saveActiveSessionId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
    else localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // Storage unavailable — in-memory subscribers still update via the event.
  }
  emitSessionsChanged();
}

/** Load the active character's full session, or `null` if there are no saves. */
export function loadActiveSession(): GameSession | null {
  const id = loadActiveSessionId();
  return id ? loadSessionById(id) : null;
}

/** Persist one session to localStorage. Best-effort; broadcasts a change. */
export function persistSession(session: GameSession): void {
  try {
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
  } catch {
    // Storage unavailable — in-memory state still updates.
  }
  emitSessionsChanged();
}

// ── Reactive snapshots ──────────────────────────────────────────────
// `useSyncExternalStore` requires the snapshot to be referentially stable
// between renders when nothing changed, so each snapshot is memoised against a
// cheap key (the serialized active save / the index signature) and only recomputed
// when that key changes.

let activeSnapshot: { key: string; session: GameSession | null } | null = null;

function readActiveSession(): GameSession | null {
  if (typeof window === "undefined") return null;
  const id = loadActiveSessionId();
  let raw: string | null = null;
  if (id) {
    try {
      raw = localStorage.getItem(SESSION_KEY_PREFIX + id);
    } catch {
      raw = null;
    }
  }
  const key = `${id ?? ""}|${raw ?? ""}`;
  if (!activeSnapshot || activeSnapshot.key !== key) {
    activeSnapshot = { key, session: raw ? deserializeSession(raw) : null };
  }
  return activeSnapshot.session;
}

/**
 * The active character's session, reactively. Re-renders when the player switches
 * character OR edits the active save anywhere (both broadcast a change), and is
 * SSR-safe (server snapshot is `null`, hydrated on the client).
 */
export function useActiveSession(): GameSession | null {
  return useSyncExternalStore(subscribeSessions, readActiveSession, () => null);
}

/** The active character's id, reactively (primitive, SSR-safe). */
export function useActiveSessionId(): string | null {
  return useSyncExternalStore(subscribeSessions, loadActiveSessionId, () => null);
}

const EMPTY_SUMMARIES: GameSessionSummary[] = [];
let summariesSnapshot: { sig: string; list: GameSessionSummary[] } | null = null;

function readSummaries(): GameSessionSummary[] {
  if (typeof window === "undefined") return EMPTY_SUMMARIES;
  const index = loadSessionIndex();
  const sig = index.join(",");
  if (!summariesSnapshot || summariesSnapshot.sig !== sig) {
    summariesSnapshot = { sig, list: loadAllSessions().map(sessionToSummary) };
  }
  return summariesSnapshot.list;
}

/**
 * Lightweight summaries of every saved character, reactively — for the character
 * switcher. Recomputed when a save is added/removed (the index signature
 * changes); a mid-play rename refreshes on the next navigation.
 */
export function useSessionSummaries(): GameSessionSummary[] {
  return useSyncExternalStore(subscribeSessions, readSummaries, () => EMPTY_SUMMARIES);
}

/** True once mounted on the client — to distinguish "loading" from "empty". */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Read a client-only value once (SSR-safe) and cache it for the component's
 * lifetime — the shared form of the `useRef` + `useSyncExternalStore(noopSubscribe,
 * …)` snapshot pattern the panels repeated. `load` runs only on the client, once;
 * `serverFallback` is the server/initial snapshot. The cached reference is stable
 * across renders, as `useSyncExternalStore` requires.
 */
export function useStoredValue<T>(load: () => T, serverFallback: T): T {
  const cacheRef = useRef<{ value: T } | null>(null);
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      if (cacheRef.current === null) cacheRef.current = { value: load() };
      return cacheRef.current.value;
    },
    () => serverFallback,
  );
}
