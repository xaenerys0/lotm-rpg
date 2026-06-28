// ---------------------------------------------------------------------------
// Story-consistency Codex (history-context Codex)
// ---------------------------------------------------------------------------
//
// A durable, queryable registry of the important PEOPLE, PLACES, OBJECTS,
// GROUPS, and open PLOT THREADS a chronicle has established. The narrator's
// per-turn context keeps a running synopsis + recent turns + salience-weighted
// facts, but over 200+ turns a dormant figure or an unresolved promise falls
// out of the trimmed history and the narration starts contradicting earlier
// canon. The Codex is the missing stable index: the AI emits compact DELTAS in
// its structured output (`AIResponse.codexUpdates`), the engine folds them in
// (and auto-touches the entities it knows are present), and each turn a small,
// SCENE-RELEVANT + PIVOTAL subset is pinned into the prompt's `## Established
// Facts` block as canon the narrator must not contradict.
//
// Design: the per-turn prompt cost stays FLAT no matter how large the Codex
// grows — `selectPinnedEntities` hard-caps the pinned subset (`MAX_PINNED`).
// The full Codex is browsable in the character sheet's Codex tab.
//
// This module is PURE (no I/O): CRUD + selection + validation + a one-time
// backfill from a save's existing structured state (so a 200-turn save does not
// start with an empty Codex). It mirrors the `anchors.ts` / `tracked-npcs.ts`
// session-sub-state pattern: optional on `GameSession`, strictly validated,
// preserved on the deserialize `...s` spread.

import type { CodexUpdateInput, GameState, PinnedCodexEntity } from "@/lib/ai";
import type { GameSession } from "./types";

// ─── Types ───────────────────────────────────────────────────────────

export type CodexKind = "person" | "location" | "object" | "group" | "thread";
export type CodexImportance = "pivotal" | "standard";

export interface CodexEntity {
  id: string;
  kind: CodexKind;
  /** Display name — the match key (case-insensitive). */
  name: string;
  /** Concise present-tense state, e.g. "alive; wary ally in Backlund". */
  status: string;
  /** `pivotal` entities are always pinned; `standard` only when scene-relevant. */
  importance: CodexImportance;
  /** Turn the entity was first recorded. */
  firstSeenTurn: number;
  /** Turn the entity was last referenced/updated. */
  lastSeenTurn: number;
  /** Alternate names the narrator may also use for this entity. */
  aliases?: string[];
  /** Optional longer detail for the player-facing Codex view (never pinned). */
  note?: string;
  /** Threads only: the promise/debt/hook has been settled (no longer pinned). */
  resolved?: boolean;
}

export interface CodexState {
  entities: CodexEntity[];
}

export const CODEX_KINDS: readonly CodexKind[] = [
  "person",
  "location",
  "object",
  "group",
  "thread",
];

const CODEX_IMPORTANCES: readonly CodexImportance[] = ["pivotal", "standard"];

// Field length caps — a Codex entry is a terse index line, not prose. Clamping
// here keeps the save bounded and the pinned block cheap.
const NAME_MAX = 80;
const STATUS_MAX = 200;
const NOTE_MAX = 600;
const ALIAS_MAX = 80;
const MAX_ALIASES = 8;

/**
 * Hard ceiling on stored entities, so a very long chronicle can't grow the save
 * unbounded. When exceeded, the lowest-salience entries are evicted (resolved
 * threads and stale `standard` entities first; `pivotal` entities are protected).
 */
export const MAX_CODEX_ENTITIES = 240;

/** Hard cap on the entities pinned into one turn's `## Established Facts` block. */
export const MAX_PINNED_ENTITIES = 12;

// ─── Construction ────────────────────────────────────────────────────

export function emptyCodexState(): CodexState {
  return { entities: [] };
}

/** Lazy `?? emptyCodexState()` boundary (mirrors `resolveTrackedNpcState`). */
export function resolveCodexState(state?: CodexState): CodexState {
  return state ?? emptyCodexState();
}

// ─── Pure helpers ────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function clampLen(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max).trimEnd();
}

function coerceKind(raw: unknown): CodexKind | null {
  return typeof raw === "string" && (CODEX_KINDS as readonly string[]).includes(raw)
    ? (raw as CodexKind)
    : null;
}

function coerceImportance(raw: unknown): CodexImportance | null {
  return typeof raw === "string" && (CODEX_IMPORTANCES as readonly string[]).includes(raw)
    ? (raw as CodexImportance)
    : null;
}

function cleanAliases(raw: readonly string[] | undefined, exclude: string): string[] {
  if (!raw) return [];
  const excl = normalize(exclude);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of raw) {
    const name = clampLen(String(a), ALIAS_MAX);
    const norm = normalize(name);
    if (name === "" || norm === excl || seen.has(norm)) continue;
    seen.add(norm);
    out.push(name);
    if (out.length >= MAX_ALIASES) break;
  }
  return out;
}

/**
 * Keep score: higher = more worth retaining when the store overflows. Pivotal
 * entities sit far above standard ones; a resolved thread sinks below its peers;
 * recency (lastSeenTurn) breaks the rest. Deterministic.
 */
function salience(e: CodexEntity): number {
  const importance = e.importance === "pivotal" ? 1_000_000 : 0;
  const resolved = e.kind === "thread" && e.resolved ? -500_000 : 0;
  return importance + resolved + e.lastSeenTurn;
}

/** Evict the lowest-salience entities until at most `MAX_CODEX_ENTITIES` remain. */
function evictToCapacity(entities: CodexEntity[]): CodexEntity[] {
  if (entities.length <= MAX_CODEX_ENTITIES) return entities;
  // Rank a copy by salience; keep the top MAX, then restore original order so
  // the store stays stable for display/serialization.
  const keep = new Set(
    [...entities]
      .sort((a, b) => salience(b) - salience(a))
      .slice(0, MAX_CODEX_ENTITIES)
      .map((e) => e.id),
  );
  return entities.filter((e) => keep.has(e.id));
}

function findIndexForUpdate(
  entities: readonly CodexEntity[],
  kind: CodexKind,
  name: string,
  aliasNorms: readonly string[],
): number {
  const norm = normalize(name);
  return entities.findIndex((e) => {
    if (e.kind !== kind) return false;
    if (normalize(e.name) === norm) return true;
    const existingAliases = (e.aliases ?? []).map(normalize);
    if (existingAliases.includes(norm)) return true;
    if (aliasNorms.includes(normalize(e.name))) return true;
    return existingAliases.some((a) => aliasNorms.includes(a));
  });
}

// ─── Apply narrator deltas ───────────────────────────────────────────

/**
 * Fold one narrator delta into the Codex. Validates `kind`/`importance` against
 * the known sets, clamps the string fields, matches an existing entity by
 * name/alias (same kind), and creates one otherwise. A malformed delta (unknown
 * kind, blank name) is dropped — never thrown, exactly like `validateJournalFlag`.
 * Pure; `idFactory` is injectable for deterministic tests.
 */
export function applyCodexUpdate(
  state: CodexState,
  update: CodexUpdateInput,
  turn: number,
  idFactory: () => string = () => crypto.randomUUID(),
): CodexState {
  const kind = coerceKind(update.kind);
  if (!kind) return state;
  const name = clampLen(update.name ?? "", NAME_MAX);
  if (name === "") return state;

  const aliases = cleanAliases(update.aliases, name);
  const aliasNorms = aliases.map(normalize);
  const importance = coerceImportance(update.importance);
  const status =
    typeof update.status === "string" ? clampLen(update.status, STATUS_MAX) : undefined;
  const note =
    typeof update.note === "string" && update.note.trim() !== ""
      ? clampLen(update.note, NOTE_MAX)
      : undefined;

  const idx = findIndexForUpdate(state.entities, kind, name, aliasNorms);

  if (idx === -1) {
    const entity: CodexEntity = {
      id: idFactory(),
      kind,
      name,
      status: status ?? "",
      importance: importance ?? "standard",
      firstSeenTurn: turn,
      lastSeenTurn: turn,
      ...(aliases.length > 0 ? { aliases } : {}),
      ...(note ? { note } : {}),
      ...(update.resolved === true ? { resolved: true } : {}),
    };
    return { entities: evictToCapacity([...state.entities, entity]) };
  }

  const existing = state.entities[idx];
  const mergedAliases = cleanAliases([...(existing.aliases ?? []), ...aliases], name);
  const updated: CodexEntity = {
    ...existing,
    // Only overwrite status when the delta carried a non-blank one.
    ...(status !== undefined && status !== "" ? { status } : {}),
    ...(importance ? { importance } : {}),
    ...(note ? { note } : {}),
    ...(update.resolved === true ? { resolved: true } : {}),
    ...(mergedAliases.length > 0 ? { aliases: mergedAliases } : {}),
    lastSeenTurn: Math.max(existing.lastSeenTurn, turn),
  };
  const entities = [...state.entities];
  entities[idx] = updated;
  return { entities };
}

/** Fold a batch of narrator deltas in order. */
export function applyCodexUpdates(
  state: CodexState,
  updates: readonly CodexUpdateInput[] = [],
  turn: number,
  idFactory: () => string = () => crypto.randomUUID(),
): CodexState {
  return updates.reduce((acc, u) => applyCodexUpdate(acc, u, turn, idFactory), state);
}

/**
 * Bump `lastSeenTurn` for any existing entity whose name/alias matches one of
 * `names` — the engine's ground-truth refresh from `npcsPresent`/`location`, so
 * an entity the narrator forgot to re-flag does not look stale or fall out of
 * the relevance window. Never CREATES an entity (no fabricating an entry for
 * every transient passer-by — only the AI's recorded entities are refreshed).
 */
export function touchCodexEntities(
  state: CodexState,
  names: readonly string[],
  turn: number,
): CodexState {
  const targets = names.map(normalize).filter((n) => n !== "");
  if (targets.length === 0) return state;
  let changed = false;
  const entities = state.entities.map((e) => {
    if (e.lastSeenTurn >= turn) return e;
    const norms = [e.name, ...(e.aliases ?? [])].map(normalize);
    const hit = targets.some((t) => norms.some((n) => n === t || t.includes(n)));
    if (!hit) return e;
    changed = true;
    return { ...e, lastSeenTurn: turn };
  });
  return changed ? { entities } : state;
}

/**
 * The per-turn Codex update the game loop applies: fold the narrator's deltas,
 * then auto-touch the entities the engine knows are present this turn (current
 * location + present NPCs). Returns a new `CodexState`.
 */
export function recordCodexTurn(
  state: CodexState,
  updates: readonly CodexUpdateInput[] = [],
  gameState: Pick<GameState, "location" | "npcsPresent">,
  turn: number,
  idFactory: () => string = () => crypto.randomUUID(),
): CodexState {
  const applied = applyCodexUpdates(state, updates, turn, idFactory);
  return touchCodexEntities(
    applied,
    [gameState.location, ...gameState.npcsPresent],
    turn,
  );
}

// ─── Player-facing CRUD + browsing (the Codex tab uses these) ────────

/** Remove an entity by id (pure; unknown ids are a no-op). */
export function removeCodexEntity(state: CodexState, id: string): CodexState {
  return { entities: state.entities.filter((e) => e.id !== id) };
}

export interface CodexFilter {
  /** Restrict to one kind; `"all"`/absent keeps every kind. */
  kind?: CodexKind | "all";
  /** Case-insensitive match over name, status, and aliases. */
  text?: string;
  /** Include settled threads (default: false — they read as done). */
  includeResolved?: boolean;
}

/**
 * Filter + sort the Codex for the player-facing tab (the durable mirror of
 * `selectPinnedEntities`, but for browsing rather than the prompt). Sorted
 * pivotal-first, then most-recently-seen, then by name. Pure (mirrors
 * `filterJournal`).
 */
export function filterCodexEntities(
  state: CodexState,
  filter: CodexFilter = {},
): CodexEntity[] {
  const text = filter.text ? normalize(filter.text) : "";
  return state.entities
    .filter((e) => {
      if (filter.kind && filter.kind !== "all" && e.kind !== filter.kind) return false;
      if (!filter.includeResolved && e.kind === "thread" && e.resolved) return false;
      if (text !== "") {
        const haystack = normalize([e.name, e.status, ...(e.aliases ?? [])].join(" | "));
        if (!haystack.includes(text)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ap = a.importance === "pivotal" ? 1 : 0;
      const bp = b.importance === "pivotal" ? 1 : 0;
      if (ap !== bp) return bp - ap;
      if (b.lastSeenTurn !== a.lastSeenTurn) return b.lastSeenTurn - a.lastSeenTurn;
      return a.name.localeCompare(b.name);
    });
}

// ─── Selection (the budget-critical function) ────────────────────────

function isPinnable(e: CodexEntity, sceneText: string): boolean {
  // A settled thread is no longer an open obligation — never pin it.
  if (e.kind === "thread" && e.resolved) return false;
  // Pivotal entities are always in view (the durable cast / driving threads).
  if (e.importance === "pivotal") return true;
  // Otherwise pin only when the entity is part of THIS scene.
  const norms = [e.name, ...(e.aliases ?? [])].map(normalize).filter((n) => n !== "");
  return norms.some((n) => sceneText.includes(n));
}

/**
 * Choose the entities to pin into this turn's `## Established Facts` block:
 * every `pivotal` entity (the durable cast and driving threads) PLUS any
 * `standard` entity named in the current location, present NPCs, or active
 * quests. Deduped, ordered (pivotal first, then most-recently-seen), and
 * HARD-CAPPED at `MAX_PINNED_ENTITIES` — so the per-turn cost stays flat no
 * matter how large the Codex grows. Deterministic.
 */
export function selectPinnedEntities(
  state: CodexState,
  gameState: Pick<GameState, "location" | "npcsPresent" | "activeQuests">,
): CodexEntity[] {
  const sceneText = normalize(
    [gameState.location, ...gameState.npcsPresent, ...gameState.activeQuests].join(" | "),
  );
  return state.entities
    .filter((e) => isPinnable(e, sceneText))
    .sort((a, b) => {
      const ap = a.importance === "pivotal" ? 1 : 0;
      const bp = b.importance === "pivotal" ? 1 : 0;
      if (ap !== bp) return bp - ap;
      if (b.lastSeenTurn !== a.lastSeenTurn) return b.lastSeenTurn - a.lastSeenTurn;
      return a.name.localeCompare(b.name);
    })
    .slice(0, MAX_PINNED_ENTITIES);
}

function toPinned(e: CodexEntity): PinnedCodexEntity {
  return {
    kind: e.kind,
    name: e.name,
    status: e.status,
    importance: e.importance,
    lastSeenTurn: e.lastSeenTurn,
    ...(e.resolved ? { resolved: true } : {}),
  };
}

/** The pinned subset mapped into the AI-layer structural shape for the prompt. */
export function pinnedEntitiesForPrompt(
  state: CodexState,
  gameState: Pick<GameState, "location" | "npcsPresent" | "activeQuests">,
): PinnedCodexEntity[] {
  return selectPinnedEntities(state, gameState).map(toPinned);
}

// ─── Display grouping (the Codex tab) ────────────────────────────────

/** Count of unresolved entities by kind (badge/summary helper for the UI). */
export function codexCounts(state: CodexState): Record<CodexKind, number> {
  const counts: Record<CodexKind, number> = {
    person: 0,
    location: 0,
    object: 0,
    group: 0,
    thread: 0,
  };
  for (const e of state.entities) {
    if (e.kind === "thread" && e.resolved) continue;
    counts[e.kind] += 1;
  }
  return counts;
}

// ─── Backfill for pre-existing saves ─────────────────────────────────

interface SeedInput {
  kind: CodexKind;
  name: string;
  status: string;
  importance: CodexImportance;
}

/**
 * Build a Codex for a save that predates the feature, from the structured state
 * it ALREADY carries — present NPCs/location, the tracked-NPC roster (companions
 * + pursuers), consecrated anchors, the secret society, and custom locations.
 * Nothing is fabricated: every seed is real established data the player can see
 * elsewhere, so a 200-turn chronicle starts with a populated Codex rather than a
 * blank one. Deterministic; `idFactory` injectable for tests.
 */
export function seedCodexFromSession(
  session: GameSession,
  idFactory: () => string = () => crypto.randomUUID(),
): CodexState {
  const turn = Number.isFinite(session.turnCount) ? session.turnCount : 0;
  const seeds: SeedInput[] = [];
  const gs = session.gameState;

  if (gs.location && gs.location.trim() !== "") {
    seeds.push({
      kind: "location",
      name: gs.location,
      status: "Your current whereabouts.",
      importance: "standard",
    });
  }
  for (const npc of gs.npcsPresent ?? []) {
    seeds.push({
      kind: "person",
      name: npc,
      status: "Present with you when the chronicle resumed.",
      importance: "standard",
    });
  }

  for (const npc of session.trackedNpcState?.roster ?? []) {
    const status =
      npc.disposition === "ally"
        ? "An ally who travels with you."
        : npc.disposition === "hostile"
          ? "A pursuer on your trail."
          : "Known to you.";
    seeds.push({
      kind: "person",
      name: npc.name,
      status,
      // Companions and pursuers are the durable cast — keep them in view.
      importance: npc.follows ? "pivotal" : "standard",
    });
  }

  for (const anchor of session.anchorState?.anchors ?? []) {
    seeds.push({
      kind:
        anchor.kind === "congregation"
          ? "group"
          : anchor.kind === "place"
            ? "location"
            : "object",
      name: anchor.name,
      status: "One of your anchors against the godhood pressure.",
      importance: "pivotal",
    });
  }

  if (session.societyState?.name) {
    seeds.push({
      kind: "group",
      name: session.societyState.name,
      status: "The secret circle you are part of.",
      importance: "pivotal",
    });
  }

  for (const place of session.gameState.customLocations ?? []) {
    seeds.push({
      kind: "location",
      name: place.name,
      status: "A place the story has taken you.",
      importance: "standard",
    });
  }

  // Dedupe by kind+name as we build, honoring the first (most authoritative)
  // status/importance for a given entity.
  let state = emptyCodexState();
  for (const seed of seeds) {
    state = applyCodexUpdate(
      state,
      {
        kind: seed.kind,
        name: seed.name,
        status: seed.status,
        importance: seed.importance,
      },
      turn,
      idFactory,
    );
  }
  return state;
}

// ─── Session-shape validation (mirrors anchors / tracked-npcs) ───────

function isValidCodexEntityShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const e = obj as Record<string, unknown>;
  if (typeof e.id !== "string" || e.id.length === 0) return false;
  if (coerceKind(e.kind) === null) return false;
  if (typeof e.name !== "string" || e.name.length === 0) return false;
  if (typeof e.status !== "string") return false;
  if (coerceImportance(e.importance) === null) return false;
  if (!Number.isFinite(e.firstSeenTurn)) return false;
  if (!Number.isFinite(e.lastSeenTurn)) return false;
  if (e.aliases !== undefined) {
    if (!Array.isArray(e.aliases)) return false;
    if (!e.aliases.every((a) => typeof a === "string")) return false;
  }
  if (e.note !== undefined && typeof e.note !== "string") return false;
  if (e.resolved !== undefined && typeof e.resolved !== "boolean") return false;
  return true;
}

/** Strict shape check for a persisted `CodexState` (mirrors `anchors`). */
export function isValidCodexStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Array.isArray(s.entities)) return false;
  return s.entities.every(isValidCodexEntityShape);
}
