"use client";

import { useRef, useSyncExternalStore } from "react";

import {
  deserializeSession,
  serializeSession,
  type GameSession,
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

/** Persist the session index (newest first). Best-effort. */
export function saveSessionIndex(ids: readonly string[]): void {
  try {
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — caller's in-memory state still updates.
  }
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

/** Load the most-recently-updated saved session (first in the index), or `null`. */
export function loadActiveSession(): GameSession | null {
  const [first] = loadSessionIndex();
  return first ? loadSessionById(first) : null;
}

/** Load every saved session that still deserializes, in index order. */
export function loadAllSessions(): GameSession[] {
  return loadSessionIndex()
    .map(loadSessionById)
    .filter((session): session is GameSession => session !== null);
}

/** Persist one session to localStorage. Best-effort (storage may be full). */
export function persistSession(session: GameSession): void {
  try {
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
  } catch {
    // Storage unavailable — in-memory state still updates.
  }
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
