import type { AccessFlag, GameState, MemoryState, SessionFact } from "@/lib/ai";
import {
  addSessionFact,
  createMemoryState,
  getEmbeddingModel,
  APPROVED_EMBEDDING_MODELS,
  DEFAULT_EMBEDDING_MODEL_ID,
} from "@/lib/ai";
import { isValidActingMethodStateShape } from "./acting-method";
import { isValidAnchorStateShape } from "./anchors";
import { createDigestionState } from "./digestion";
import { isValidCustomLocationsShape, registerCustomLocation } from "./location";
import { cityIdFromLocation, isValidAccessFlagsShape } from "./travel";
import { isValidHuntsShape } from "./hunt";
import { isValidRitualStateShape } from "./ritual";
import { isValidIdentityStateShape } from "./identity";
import { isValidProfileStateShape } from "./profile";
import { joinRoster, isValidTrackedNpcStateShape } from "./tracked-npcs";
import {
  isValidSocietyShape,
  migrateSocietyState,
  seedSocietyMembership,
  type SocietyState,
} from "./society";
import { DEFAULT_EPOCH_ID, getEpoch } from "@/lib/lore/epochs";
import type { StartScenario } from "@/lib/lore/start-scenarios";
import { archetypeGrounding, type StartArchetype } from "@/lib/lore/start-archetypes";
import type { GameSession, GameSessionSummary, GamePhase } from "./types";

const VALID_PHASES: GamePhase[] = [
  "idle",
  "situation",
  "choices",
  "resolution",
  "consequences",
  "error",
];

/** Where a fresh save starts on the shared canon timeline (chapter 1). */
export const DEFAULT_CANON_POSITION = 1;

export interface CreateSessionOptions {
  /** Approved embedding model to lock for this save (character creation). */
  embeddingModelId?: string;
  /** Starting canon-timeline position (e.g. a later-epoch start). */
  canonPosition?: number;
}

export function createSession(
  gameState: GameState,
  id: string = crypto.randomUUID(),
  now: number = Date.now(),
  initialMemory?: MemoryState,
  options: CreateSessionOptions = {},
): GameSession {
  // Validates against the approved list — locking an unknown model would
  // orphan the save from every pre-embedded map.
  const embeddingModelId = getEmbeddingModel(
    options.embeddingModelId ?? DEFAULT_EMBEDDING_MODEL_ID,
  ).id;
  return {
    id,
    gameState,
    memory: initialMemory ?? createMemoryState(),
    turnCount: 0,
    canonPosition: options.canonPosition ?? DEFAULT_CANON_POSITION,
    embeddingModelId,
    phase: "idle",
    currentNarrative: null,
    currentChoices: null,
    selectedChoiceId: null,
    lastResolution: null,
    activePillar: null,
    errorMessage: null,
    errorCode: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * The per-city awareness flag(s) a Forsaken-Land origin earns for the city they
 * start in (issue #133): a City-of-Silver native knows only Silver, a Moon City
 * native only Moon, so each is gated from the other. Returns `[]` for any other
 * (or unresolved) start city — the dream-world passage is granted separately.
 */
function originCityFlags(startCity: string | undefined): AccessFlag[] {
  if (startCity === "silver-city") return ["silver-city-passage"];
  if (startCity === "moon-city") return ["moon-city-passage"];
  return [];
}

export function createDefaultGameState(
  pathwayId: number,
  characterId: string = crypto.randomUUID(),
  characterName?: string,
  characterBackground?: string,
  epoch?: number,
  prologueRecap?: string,
  startScenario?: StartScenario,
  archetype?: StartArchetype,
): GameState {
  // Varied story openings: a chosen start scenario sets the (randomly varied)
  // starting location; a chosen start ARCHETYPE (issue #131) takes precedence —
  // it carries its own location + opening beat (the character begins embedded in
  // an existing circle). Absent both, fall back to the epoch's default location.
  const location =
    archetype?.location ?? startScenario?.location ?? getEpoch(epoch).startingLocation;
  const openingBeat = archetype?.openingBeat ?? startScenario?.openingBeat;
  // Relationship grounding (issue #131) lives in the DURABLE, never-trimmed
  // background layer (issue #92's insight), not in trimmable session facts alone:
  // the archetype's grounding line is folded into the character background so the
  // narrator keeps the social tie in view for the whole chronicle.
  const grounding = archetype ? archetypeGrounding(archetype) : undefined;
  const background = [characterBackground?.trim(), grounding]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
  // Access-gated continent ORIGIN (world build-out 3, issue #132): a character
  // who BEGINS in the Forsaken Land (chosen via an origin scenario or origin
  // archetype) holds the dream-world passage from the start, so they can move
  // within their home continent. A central start grants nothing.
  const origin = archetype?.origin ?? startScenario?.origin;
  // Seed the tracked current city when the start location names a known one
  // (issue #101), so the map opens on the right city's atlas.
  const startCity = cityIdFromLocation(location);
  // A Forsaken-Land origin holds the dream-world passage PLUS their own city's
  // awareness flag (issue #133) — Silver natives know only Silver, Moon natives
  // only Moon (the two were mutually unaware), so each is gated from the other.
  // A central start grants nothing.
  const accessFlags =
    origin === "forsaken-land"
      ? (["dream-world-passage", ...originCityFlags(startCity)] as AccessFlag[])
      : undefined;
  return {
    characterId,
    pathwayId,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    location,
    ...(startCity ? { currentCity: startCity } : {}),
    ...(epoch !== undefined && epoch !== DEFAULT_EPOCH_ID ? { epoch } : {}),
    ...(accessFlags ? { accessFlags } : {}),
    activeQuests: [],
    npcsPresent: [],
    digestion: createDigestionState(pathwayId, 9),
    ...(characterName ? { characterName } : {}),
    ...(background ? { characterBackground: background } : {}),
    // Durable prologue recap (the prologue → story bridge) — kept in the
    // never-trimmed game-state layer so the narrator never loses the thread.
    ...(prologueRecap ? { prologueRecap } : {}),
    // The first-turn opening beat for the chosen start (consumed only at turn 0).
    ...(openingBeat ? { openingBeat } : {}),
  };
}

/**
 * Apply a start archetype's GameSession-level seeds (issue #131) AFTER the
 * session exists: the tracked-NPC roster (known allies who travel at the
 * character's side — `joinRoster`), an optional pre-membership society, and the
 * relationship grounding facts (recorded in memory so the narrator can weave the
 * tie in from turn 0). The durable background grounding is set separately in
 * `createDefaultGameState`. A plain location start passes no archetype and the
 * session is returned untouched. Pure; returns a NEW `GameSession`.
 */
export function seedArchetype(
  session: GameSession,
  archetype: StartArchetype,
  now: number = Date.now(),
): GameSession {
  let next = session;

  // Known associates who travel with the character (companions, not pursuers).
  for (const name of archetype.seeds.trackedAllies ?? []) {
    next = joinRoster(next, { name, disposition: "ally", follows: true }, now);
  }

  // Optional pre-membership in an existing organization's circle.
  if (archetype.seeds.society) {
    next = {
      ...next,
      societyState: seedSocietyMembership(archetype.seeds.society.orgSlug),
      updatedAt: now,
    };
  }

  // Relationship grounding facts, recorded in memory (supplementing the durable
  // background line) so the narrator has the tie in its fact list from turn 0.
  for (const description of archetype.seeds.facts ?? []) {
    const fact: SessionFact = { type: "event", description, turnNumber: 0 };
    next = { ...next, memory: addSessionFact(next.memory, fact), updatedAt: now };
  }

  return next;
}

export function sessionToSummary(session: GameSession): GameSessionSummary {
  return {
    id: session.id,
    turnCount: session.turnCount,
    phase: session.phase,
    location: session.gameState.location,
    pathwayId: session.gameState.pathwayId,
    sequenceLevel: session.gameState.sequenceLevel,
    updatedAt: session.updatedAt,
    ...(session.gameState.characterName
      ? { characterName: session.gameState.characterName }
      : {}),
  };
}

export function serializeSession(session: GameSession): string {
  return JSON.stringify(session);
}

export function deserializeSession(json: string): GameSession | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isValidSessionShape(parsed)) {
    return null;
  }

  const s = parsed as Record<string, unknown>;
  const gs = s.gameState as Record<string, unknown>;
  // Backfill the engine-tracked current city (issue #101) for legacy saves that
  // predate it: resolve it from the location's leading word so the map's
  // per-city atlas opens on the right city instead of reverting to Tingen. A
  // bare-district location that names no city is left unresolved (self-heals as
  // soon as the location next names a known city). An existing value is kept.
  // Nullish check (not `=== undefined`) so a save carrying `currentCity: null`
  // — `isValidSessionShape` does not validate the field — is also backfilled.
  const backfilledCity =
    gs.currentCity == null && typeof gs.location === "string"
      ? cityIdFromLocation(gs.location)
      : undefined;
  const gameStateBase = {
    ...gs,
    // Seed digestion for sessions saved before the Acting Method mechanic.
    digestion:
      gs.digestion ??
      createDigestionState(gs.pathwayId as number, gs.sequenceLevel as number),
    ...(backfilledCity ? { currentCity: backfilledCity } : {}),
  } as unknown as GameState;
  // Register the venue the save is currently sitting at (Backlund location sync):
  // a legacy/older save parked at a narrator-named, off-map place gets it filed
  // under its city on load, so the map pins it immediately instead of waiting for
  // the next location change. Pure + idempotent; a no-op for a bare city, a known
  // district, or an unresolvable city.
  const gameState = registerCustomLocation(gameStateBase, gameStateBase.epoch);
  return {
    ...s,
    gameState,
    errorCode: s.errorCode ?? null,
    // Seed the RAG fields for sessions saved before issue #63: the timeline
    // starts at canon position 1 and the lock falls back to the default model.
    canonPosition: (s.canonPosition as number | undefined) ?? DEFAULT_CANON_POSITION,
    embeddingModelId:
      (s.embeddingModelId as string | undefined) ?? DEFAULT_EMBEDDING_MODEL_ID,
    // Convert legacy society members (which stored arc/hint prose) to the
    // id-based shape so member descriptions are re-derived from current copy.
    ...(s.societyState !== undefined
      ? { societyState: migrateSocietyState(s.societyState as SocietyState) }
      : {}),
  } as GameSession;
}

/**
 * Advance the player's shared-timeline position (issue #63). Monotonic: the
 * timeline gate's guarantee depends on the position never moving backward, so
 * regressions are ignored rather than applied.
 */
export function advanceCanonPosition(
  session: GameSession,
  position: number,
  now: number = Date.now(),
): GameSession {
  if (!Number.isFinite(position) || position <= session.canonPosition) {
    return session;
  }
  return { ...session, canonPosition: position, updatedAt: now };
}

export function isValidDigestionShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  const d = obj as Record<string, unknown>;
  if (!Number.isFinite(d.pathwayId)) return false;
  if (!Number.isFinite(d.sequenceLevel)) return false;
  if (!Number.isFinite(d.progress)) return false;
  if ((d.progress as number) < 0 || (d.progress as number) > 100) return false;
  if (typeof d.complete !== "boolean") return false;
  return true;
}

const INJURY_SEVERITIES = ["minor", "major", "grievous"];

export function isValidInjuriesShape(obj: unknown): boolean {
  if (!Array.isArray(obj)) return false;
  return obj.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    const injury = entry as Record<string, unknown>;
    if (typeof injury.id !== "string" || injury.id.length === 0) return false;
    if (typeof injury.description !== "string") return false;
    if (!INJURY_SEVERITIES.includes(injury.severity as string)) return false;
    if (!Number.isFinite(injury.recoveryTurns)) return false;
    return true;
  });
}

export function isValidSessionShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }

  const s = obj as Record<string, unknown>;

  if (typeof s.id !== "string" || s.id.length === 0) return false;
  if (!Number.isFinite(s.turnCount) || (s.turnCount as number) < 0) return false;
  if (typeof s.phase !== "string" || !VALID_PHASES.includes(s.phase as GamePhase))
    return false;
  if (!Number.isFinite(s.createdAt)) return false;
  if (!Number.isFinite(s.updatedAt)) return false;

  if (typeof s.gameState !== "object" || s.gameState === null) return false;
  const gs = s.gameState as Record<string, unknown>;
  if (typeof gs.characterId !== "string") return false;
  if (!Number.isFinite(gs.pathwayId)) return false;
  if (!Number.isFinite(gs.sequenceLevel)) return false;
  if (!Number.isFinite(gs.sanity)) return false;
  if (!Number.isFinite(gs.maxSanity) || (gs.maxSanity as number) <= 0) return false;
  if (typeof gs.location !== "string") return false;
  if (!Array.isArray(gs.inventory)) return false;
  if (!Array.isArray(gs.activeQuests)) return false;
  if (!Array.isArray(gs.npcsPresent)) return false;
  // Digestion is optional (older sessions predate it) but must be well-shaped
  // when present; it is seeded with a default on deserialize if missing.
  if (gs.digestion !== undefined && !isValidDigestionShape(gs.digestion)) return false;
  // Injuries are optional (older sessions predate combat) but must be
  // well-shaped when present; absent simply means no active injuries.
  if (gs.injuries !== undefined && !isValidInjuriesShape(gs.injuries)) return false;
  // Custom locations (Backlund location sync) are optional but strict when
  // present; absent means the character never visited an off-map venue. They
  // ride the deserialize `...gs` spread (no seeding).
  if (
    gs.customLocations !== undefined &&
    !isValidCustomLocationsShape(gs.customLocations)
  ) {
    return false;
  }
  // Capability flags (issue #130) are optional but strict when present; absent
  // means the character holds none. They ride the deserialize `...gs` spread (no
  // seeding), exactly like customLocations.
  if (gs.accessFlags !== undefined && !isValidAccessFlagsShape(gs.accessFlags)) {
    return false;
  }
  // Canon-character takeover marker (issue #92) is optional but, when present,
  // must be a non-empty string id; it rides the deserialize `...gs` spread (no
  // seeding), exactly like the other optional game-state fields.
  if (
    gs.canonCharacterId !== undefined &&
    (typeof gs.canonCharacterId !== "string" || gs.canonCharacterId.length === 0)
  ) {
    return false;
  }

  // RAG fields (issue #63) are optional (older sessions predate them) but
  // must be valid when present: a finite positive position, and a model id on
  // the approved list (an unknown lock would orphan the save from every map).
  if (s.canonPosition !== undefined) {
    if (!Number.isFinite(s.canonPosition) || (s.canonPosition as number) < 0) {
      return false;
    }
  }
  if (s.embeddingModelId !== undefined) {
    if (!APPROVED_EMBEDDING_MODELS.some((m) => m.id === s.embeddingModelId)) {
      return false;
    }
  }

  // Identity state (issue #22) is optional but strict when present.
  if (s.identityState !== undefined && !isValidIdentityStateShape(s.identityState)) {
    return false;
  }

  // Society state (issue #32) is optional but strict when present.
  if (s.societyState !== undefined && !isValidSocietyShape(s.societyState)) {
    return false;
  }

  // Anchor state (issues #35, #25) is optional but strict when present.
  if (s.anchorState !== undefined && !isValidAnchorStateShape(s.anchorState)) {
    return false;
  }

  // True-self profile (character-info storage) is optional but strict when
  // present — lazily seeded for legacy saves, exactly like identityState.
  if (s.profileState !== undefined && !isValidProfileStateShape(s.profileState)) {
    return false;
  }

  // Acting-method discovery (issue #95) is optional but strict when present —
  // lazily resolved for legacy saves; preserved on the deserialize `...s` spread.
  if (
    s.actingMethodState !== undefined &&
    !isValidActingMethodStateShape(s.actingMethodState)
  ) {
    return false;
  }

  // Hunt quests are optional but strict when present — they ride the deserialize
  // `...s` spread (no seeding); absent simply means no active hunts.
  if (s.hunts !== undefined && !isValidHuntsShape(s.hunts)) {
    return false;
  }

  // Advancement ritual in progress (issue #99 Part C) is optional but strict
  // when present — it rides the deserialize `...s` spread (no seeding); absent
  // means no rite under way.
  if (s.ritualState !== undefined && !isValidRitualStateShape(s.ritualState)) {
    return false;
  }

  // Tracked-NPC roster (issue #101) is optional but strict when present — it
  // rides the deserialize `...s` spread (no seeding); absent means no roster.
  if (
    s.trackedNpcState !== undefined &&
    !isValidTrackedNpcStateShape(s.trackedNpcState)
  ) {
    return false;
  }

  // The transient engine-turn action text is optional but, when present, must be
  // a string or null (a mid-`consequences` engine turn can be persisted with it
  // set; it is consumed as the turn record's player action on the next continue).
  if (
    s.pendingPlayerAction !== undefined &&
    s.pendingPlayerAction !== null &&
    typeof s.pendingPlayerAction !== "string"
  ) {
    return false;
  }

  // The matching transient engine-turn kind (issue #171) is optional but, when
  // present, must be one of the known kinds or null. Rides the `...s` spread.
  if (
    s.pendingTurnKind !== undefined &&
    s.pendingTurnKind !== null &&
    s.pendingTurnKind !== "combat" &&
    s.pendingTurnKind !== "advancement"
  ) {
    return false;
  }

  // The permadeath marker (issue #12) is optional but strict when present.
  if (s.ended !== undefined) {
    if (typeof s.ended !== "object" || s.ended === null) return false;
    const ended = s.ended as Record<string, unknown>;
    if (ended.fate !== "transformed" && ended.fate !== "dead") return false;
    if (typeof ended.scene !== "string") return false;
    if (!Number.isFinite(ended.at)) return false;
  }

  if (typeof s.memory !== "object" || s.memory === null) return false;
  const mem = s.memory as Record<string, unknown>;
  if (!Array.isArray(mem.immediateTurns)) return false;
  if (!Array.isArray(mem.recentSummaries)) return false;
  if (!Array.isArray(mem.sessionFacts)) return false;
  // The durable running summary is optional (older saves predate it) but must
  // be a string when present.
  if (mem.runningSummary !== undefined && typeof mem.runningSummary !== "string") {
    return false;
  }

  return true;
}
