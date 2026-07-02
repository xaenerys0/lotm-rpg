import type { SessionFact } from "@/lib/ai";
import { getSequence } from "@/lib/rules";
import type { RitualStep } from "@/lib/types/rules";

import { clamp } from "./math";
import type { GameSession } from "./types";

// ---------------------------------------------------------------------------
// Advancement rituals — begun once, then matured naturally over play
// (issue #209; supersedes the per-step click-counting of issue #99 Part C)
// ---------------------------------------------------------------------------
//
// From Sequence 5 an Advancement Ritual is canon: its purpose is to survive the
// surge of the Beyonder characteristic at the moment of drinking the next potion.
// Canon also says it CAN be forgone — but then "the likelihood of success
// plummets to a dangerous point, with losing control being the most likely
// outcome."
//
// The rite is NOT a list of click-through steps and NOT a fixed number of turns.
// The player BEGINS it once ("Perform the rite"), which the React layer pairs
// with an IMMEDIATE narrated turn so the rite opens in the current scene. From
// then on it MATURES NATURALLY over the turns of normal play (`advanceRitual`,
// wired into the per-turn tick) — there is no set length to wait out. The player
// drinks whenever they judge it ready; advancing on a half-formed rite is
// allowed, and entirely their call.
//
// Progress is the `fidelity` (0..1): each turn closes part of the gap to a fully
// faithful rite, scaled by how favourable the scene is RIGHT THEN
// (`ritualCircumstanceFidelity`) — a private, unhurt, unhunted moment matures it
// quickly; witnesses, wounds, or active pursuers slow it, and real danger stalls
// it. So WHERE and WHEN the rite plays out shapes how far it gets. The stored
// fidelity is folded into the climb odds by `advancement.ts`
// (`advancementSuccessChance`/`advancementHighRisk`); skipping the rite outright
// (never beginning it) reads as fidelity 0.
//
// `RitualState` is a single optional sub-state on the session (mirroring
// `formulaPursuit`): strictly validated, preserved on the deserialize `...s`
// spread, never seeded. No DB migration (it serializes inside the session blob).
//
// Pure + deterministic; the React layer triggers `beginRitual`, runs the rite's
// narrated turn, ticks `advanceRitual` each turn, and persists.

/** An Advancement Ritual the player has begun and is letting mature. */
export interface RitualState {
  /** The pathway whose rite this is. */
  pathwayId: number;
  /** The sequence being advanced INTO (one rung lower than the current one). */
  targetSeq: number;
  /**
   * How far the rite has matured, in [0, 1]. Accrues each turn (scaled by the
   * scene's favourability) toward a fully faithful rite; the climb may be taken
   * at any point, at whatever fidelity has accrued.
   */
  fidelity: number;
  /**
   * The narrator's most recent per-turn read of whether the CURRENT scene meets
   * the rite's required SETTING (issue #220 follow-up) — e.g. the Fool's
   * Marionettist rite demands the open sea and the mermaids' song, so it barely
   * takes hold in a city or the catacombs. Recorded from the drop-not-throw
   * `ritualSettingMet` flag each turn (absent → false, so leaving the setting
   * self-corrects); OR'd with a location-keyword backstop by `ritualSettingSuitable`.
   */
  settingMet?: boolean;
}

/**
 * The core issue-#220 guardrail sentence, shared verbatim by both the advancement
 * (`ritualNarratorContext`) and apex (`ascensionRiteNarratorContext`) narrator
 * blocks so a future rewording can never drift between the two paths.
 */
export const RITE_IN_PROGRESS_GUARD =
  "never narrate the ascension as accomplished, and do not declare the rite " +
  'finished or announce it is "ready".';

/**
 * The shared instruction that lets the FICTION drive a rite to its peak (issue
 * #220 follow-up): when a turn genuinely reaches the rite's culminating moment,
 * the narrator sets `ritualClimax`, and the engine brings the rite to its peak
 * (`climaxRitual`/`climaxAscensionRite`). Shared verbatim by both narrator blocks
 * so the two paths can't drift.
 */
export const RITE_CLIMAX_INSTRUCTION =
  "If THIS turn the rite genuinely reaches its culminating moment — the chosen " +
  "hour or omen has come, the materials are laid, and the character is " +
  'undisturbed — set "ritualClimax": true in your response (otherwise omit it); ' +
  "the game will then bring the rite to its peak.";

/** Fraction of the remaining gap to a faithful rite closed per ideal turn. */
export const RITUAL_PROGRESS_RATE = 0.3;
/**
 * At/above this fidelity the rite counts as fully matured (avoids endless churn)
 * AND has reached its PEAK — the "complete", safest moment to drink (issue #220
 * follow-up: `ritualReady`). The peak is reached either by full turn-accrual or
 * when the narrator marks the fiction's culminating moment (`climaxRitual`); the
 * UI reads it to show a clear "ready" nudge instead of an endless sub-100% meter.
 */
export const RITUAL_FIDELITY_CAP = 0.99;

/** Fidelity progress lost to performing the rite with witnesses (a crowd) near. */
export const RITUAL_WITNESS_PENALTY = 0.3;
/** Fidelity progress lost to performing the rite while wounded (in/after a fight). */
export const RITUAL_WOUNDED_PENALTY = 0.4;
/** Fidelity progress lost to performing the rite while actively hunted. */
export const RITUAL_HUNTED_PENALTY = 0.4;
/**
 * The hard CEILING on how far the rite can mature while the character is NOT in
 * its required setting (issue #220 follow-up). Canon: the advancement ritual's
 * conditions are not decorative — Klein "had to consume the potion while listening
 * to the Mermaids' singing so he wouldn't lose himself … and turn into a puppet",
 * travelling to the Sonia Sea for it. So a rite performed in the wrong place barely
 * takes hold: fidelity is pinned near zero regardless of privacy, which flows
 * through `advancementSuccessChance`/`advancementHighRisk` into canon danger. It is
 * a heavy penalty, NOT a hard gate — drinking anyway is always allowed (canon: "it
 * is possible to advance without the ritual … although this is quite unlikely").
 */
export const RITUAL_WRONG_SETTING_CEILING = 0.1;

/**
 * The natural SETTINGS a rite's condition prose can demand, matched by WHOLE WORD
 * in BOTH the condition text and the scene's location string (the keyword backstop
 * half of the hybrid detection). Deliberately CONSERVATIVE — only words that
 * unambiguously name a natural place, because a false positive (gating a rite that
 * canon never bound to a place — many rites use "altar"/"ancient"/"buried"
 * metaphorically or for an OBJECT) applies a wrong penalty, whereas a false
 * negative just leaves the rite ungated and lets the narrator flag decide. So the
 * list omits ambiguous words (ancient/altar/peak/wild/wood/tide/…) and there is no
 * catch-all "ruins" group; the whole-word match (not substring) also keeps "sea"
 * from hitting "disease" and lets a location like "Sea of Ruins" match. Corpus:
 * the Fool's Marionettist rite is at the open sea amid the mermaids' song; a Death
 * rite by an underground river. Ordered so the first match wins.
 */
interface RitualSetting {
  id: string;
  /** Whole-word, case-insensitive match over any of the setting's keywords. */
  regex: RegExp;
}

function buildSetting(id: string, keywords: readonly string[]): RitualSetting {
  return { id, regex: new RegExp(`\\b(?:${keywords.join("|")})\\b`, "i") };
}

const RITUAL_SETTINGS: readonly RitualSetting[] = [
  buildSetting("the open sea", [
    "sea",
    "seas",
    "ocean",
    "oceans",
    "mermaid",
    "mermaids",
    "siren",
    "sirens",
    "undersea",
  ]),
  buildSetting("underground", [
    "underground",
    "catacomb",
    "catacombs",
    "cavern",
    "caverns",
    "cave",
    "caves",
    "crypt",
    "crypts",
    "tunnel",
    "tunnels",
    "sewer",
    "sewers",
  ]),
  buildSetting("the high mountains", [
    "mountain",
    "mountains",
    "summit",
    "summits",
    "glacier",
    "glaciers",
  ]),
  buildSetting("the deep wilderness", [
    "forest",
    "forests",
    "jungle",
    "jungles",
    "swamp",
    "swamps",
    "marsh",
    "marshes",
  ]),
  buildSetting("a storm", ["storm", "storms", "tempest", "tempests"]),
];

/** The first setting whose whole-word keyword appears in `text`, or null. */
function matchSetting(text: string): RitualSetting | null {
  return RITUAL_SETTINGS.find((s) => s.regex.test(text)) ?? null;
}

/**
 * The setting the rite for `targetSeq` demands, derived from its CONDITION steps
 * (issue #220 follow-up). `null` when the rung's rite names no place-specific
 * condition (then it is ungated). Private object form; `ritualRequiredSetting`
 * exposes the id and `ritualSettingSuitable` reuses the compiled regex.
 */
function requiredSetting(session: GameSession, targetSeq: number): RitualSetting | null {
  const conditions = ritualStepsFor(session, targetSeq).filter(
    (s) => s.kind === "condition",
  );
  if (conditions.length === 0) return null;
  return matchSetting(conditions.map((c) => c.text).join(" "));
}

/**
 * The id of the setting the rite for `targetSeq` demands — e.g. "amidst the singing
 * of mermaids" → "the open sea". `null` when the rite names no place (ungated — it
 * may be borne out anywhere). Pure.
 */
export function ritualRequiredSetting(
  session: GameSession,
  targetSeq: number,
): string | null {
  return requiredSetting(session, targetSeq)?.id ?? null;
}

/**
 * Whether the CURRENT scene suits the rite for `targetSeq` (issue #220 follow-up).
 * `true` when the rung's rite names no place-specific setting (ungated), OR the
 * narrator has confirmed it this turn (`ritualState.settingMet`), OR the location
 * string names the required setting (the keyword backstop) — the hybrid
 * narrator-primary + keyword detection. Pure. Drives both the maturation ceiling
 * and the UI's "wrong setting" warning.
 */
export function ritualSettingSuitable(session: GameSession, targetSeq: number): boolean {
  const setting = requiredSetting(session, targetSeq);
  if (!setting) return true;
  const state = session.ritualState;
  if (state && state.targetSeq === targetSeq && state.settingMet) return true;
  return setting.regex.test(session.gameState.location);
}

/**
 * The ordered steps of the rite for `targetSeq`: the corpus-tagged `steps`
 * (materials + lived conditions) when present, else the hand-authored fallback
 * `requirements` treated as conditions, else empty (the target has no rite).
 * Used to surface the rite's canon materials/conditions in the UI — never a
 * clickable list.
 */
export function ritualStepsFor(session: GameSession, targetSeq: number): RitualStep[] {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  if (!ritual) return [];
  if (ritual.steps && ritual.steps.length > 0) return [...ritual.steps];
  // Hand-authored fallback rituals carry only flat `requirements` prose, which
  // describe lived conditions (the place/hour/observance), not tangible items.
  return ritual.requirements.map((text) => ({ kind: "condition", text }));
}

/**
 * How favourable the CURRENT scene is for the rite, in [0, 1]. A private, unhurt,
 * unhunted moment is ideal (1.0); each adverse circumstance — witnesses present
 * (a crowd), open wounds (mid-/post-fight), or active pursuers (being hunted) —
 * lowers it, and enough danger stalls the rite entirely (0). This is the
 * "isolated vs crowd vs battle" signal that shapes how fast the rite matures each
 * turn, so the player can seek the right moment. Pure.
 */
export function ritualCircumstanceFidelity(session: GameSession): number {
  const { npcsPresent, injuries } = session.gameState;
  const roster = session.trackedNpcState?.roster ?? [];
  const pursuers = roster.filter((npc) => npc.disposition === "hostile" && npc.follows);
  // A deliberate ceremony attended only by the character's OWN circle is not
  // "witnessed" — a chosen rite among trusted allies keeps its secrecy, so only
  // strangers/onlookers who are NOT tracked allies slow it (issue #220 follow-up).
  // Match present names against the ally roster, case-insensitively.
  const allyNames = new Set(
    roster
      .filter((npc) => npc.disposition === "ally")
      .map((npc) => npc.name.toLowerCase()),
  );
  const witnesses = (npcsPresent ?? []).filter((n) => !allyNames.has(n.toLowerCase()));
  let fidelity = 1;
  if ((injuries?.length ?? 0) > 0) fidelity -= RITUAL_WOUNDED_PENALTY;
  if (pursuers.length > 0) fidelity -= RITUAL_HUNTED_PENALTY;
  if (witnesses.length > 0) fidelity -= RITUAL_WITNESS_PENALTY;
  return clamp(fidelity, 0, 1);
}

/**
 * How favourable the scene is for the ADVANCEMENT rite toward `targetSeq`, in
 * [0, 1] — the privacy/safety signal (`ritualCircumstanceFidelity`) AND the
 * required-SETTING gate (issue #220 follow-up): in the wrong place the rite barely
 * takes hold, so the value is capped at `RITUAL_WRONG_SETTING_CEILING` however
 * private the moment. This is the advancement rite's own scene signal (the apex
 * ascension keeps the plain circumstance signal — its settings are handled
 * separately), so the setting gate never leaks onto the endgame rite. Pure.
 */
export function ritualSceneFidelity(session: GameSession, targetSeq: number): number {
  const circumstance = ritualCircumstanceFidelity(session);
  return ritualSettingSuitable(session, targetSeq)
    ? circumstance
    : Math.min(circumstance, RITUAL_WRONG_SETTING_CEILING);
}

/** Close part of the remaining gap to a faithful rite, scaled by the scene. */
function accrueFidelity(current: number, circumstance: number): number {
  return clamp(current + (1 - current) * RITUAL_PROGRESS_RATE * circumstance, 0, 1);
}

/**
 * Record the narrator's per-turn read of whether the scene meets the rite's
 * required setting (issue #220 follow-up) onto the rite under way, so this turn's
 * maturation and the UI warning reflect it. A no-op when no rite is under way.
 * Called each turn BEFORE `advanceRitual` so the tick sees the fresh signal; the
 * absent flag records `false`, so leaving the setting self-corrects. Pure.
 */
export function recordRitualSetting(
  session: GameSession,
  settingMet: boolean,
  now: number = Date.now(),
): GameSession {
  const state = session.ritualState;
  if (!state) return session;
  if ((state.settingMet ?? false) === settingMet) return session;
  return { ...session, ritualState: { ...state, settingMet }, updatedAt: now };
}

/**
 * The canonical `activeQuests` string for a rite under way — one source of truth
 * so the label added on begin matches the one removed on the climb (the narrator
 * sees this entry and keeps weaving the maturing rite into the scene).
 */
export function ritualQuestLabel(targetSeq: number): string {
  return `Let the Advancement Ritual for the Sequence ${targetSeq} ascent mature`;
}

function withQuestLabel(quests: string[], label: string): string[] {
  return quests.includes(label) ? quests : [...quests, label];
}

function withoutQuestLabel(quests: string[], label: string): string[] {
  return quests.filter((q) => q !== label);
}

/**
 * Begin the rite for `targetSeq` — the single "Perform the rite" trigger. Seeds
 * the rite with a first turn of progress (scaled by the current scene), adds the
 * AI-visible quest label, and records the act so the narrator opens it in
 * context. Idempotent once a rite for this target is under way (does not reset
 * accrued progress). The React layer pairs this with an immediate narrated turn.
 * Pure.
 */
export function beginRitual(
  session: GameSession,
  targetSeq: number,
  now: number = Date.now(),
): GameSession {
  const existing = session.ritualState;
  if (existing && existing.targetSeq === targetSeq) return session;

  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  const fidelity = accrueFidelity(0, ritualSceneFidelity(session, targetSeq));
  const label = ritualQuestLabel(targetSeq);
  // Re-targeting (a stale rite for a different rung) — drop its label first so a
  // superseded quest can't linger in `activeQuests`.
  const quests = existing
    ? withoutQuestLabel(
        session.gameState.activeQuests,
        ritualQuestLabel(existing.targetSeq),
      )
    : session.gameState.activeQuests;

  const fact: SessionFact = {
    type: "event",
    description: ritual
      ? `Began the Advancement Ritual to ascend to Sequence ${targetSeq}: ${ritual.description}`
      : `Began the Advancement Ritual to ascend to Sequence ${targetSeq}.`,
    turnNumber: session.turnCount,
  };

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(quests, label),
    },
    ritualState: { pathwayId: session.gameState.pathwayId, targetSeq, fidelity },
    memory: {
      ...session.memory,
      sessionFacts: [...session.memory.sessionFacts, fact],
    },
    updatedAt: now,
  };
}

/**
 * Mature the rite under way by one turn of play — the per-turn tick (wired
 * alongside `advanceFormulaPursuit`). Closes part of the remaining gap to a
 * faithful rite, scaled by the scene's favourability that turn, and keeps the
 * quest label in sync. A no-op when no rite is under way or it has already fully
 * matured (so a long chronicle does not churn). Pure.
 */
export function advanceRitual(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const state = session.ritualState;
  if (!state) return session;

  const label = ritualQuestLabel(state.targetSeq);
  const labelled = session.gameState.activeQuests.includes(label);
  const fidelity = accrueFidelity(
    state.fidelity,
    ritualSceneFidelity(session, state.targetSeq),
  );

  // Nothing to commit when the rite is already labelled AND this turn changed
  // nothing — either it has fully matured (past the cap) or the scene is so
  // hostile it cannot progress at all (circumstance 0). Avoids per-turn churn.
  if (
    labelled &&
    (state.fidelity >= RITUAL_FIDELITY_CAP || fidelity === state.fidelity)
  ) {
    return session;
  }

  return {
    ...session,
    gameState: {
      ...session.gameState,
      activeQuests: withQuestLabel(session.gameState.activeQuests, label),
    },
    ritualState: { ...state, fidelity },
    updatedAt: now,
  };
}

/**
 * How faithfully the rite for `targetSeq` has matured, in [0, 1]. `1` when the
 * rung needs no rite. `0` when no rite was begun for this target (i.e. the player
 * forwent it). Otherwise the accrued fidelity. Drives the climb-odds penalty in
 * `advancement.ts`.
 */
export function ritualFidelity(session: GameSession, targetSeq: number): number {
  const ritual = getSequence(session.gameState.pathwayId, targetSeq)?.advancementRitual;
  if (!ritual) return 1;
  const state = session.ritualState;
  if (!state || state.targetSeq !== targetSeq) return 0;
  return clamp(state.fidelity, 0, 1);
}

/**
 * Whether a rite for `targetSeq` is under way (begun, maturing). False when the
 * player has not begun one for this target. The UI shows the maturing-progress
 * surface when true, the "Perform the rite" trigger when false.
 */
export function ritualInProgress(session: GameSession, targetSeq: number): boolean {
  const state = session.ritualState;
  return state !== undefined && state.targetSeq === targetSeq;
}

/**
 * Whether the rite for `targetSeq` has reached its PEAK — fully formed, the
 * safest moment to make the climb (issue #220 follow-up). Backs the "the rite has
 * reached its peak" nudge; the climb itself is still always the player's call.
 */
export function ritualReady(session: GameSession, targetSeq: number): boolean {
  return (
    ritualInProgress(session, targetSeq) &&
    ritualFidelity(session, targetSeq) >= RITUAL_FIDELITY_CAP
  );
}

/**
 * Bring the rite under way straight to its peak — the fiction has reached the
 * rite's culminating moment (the narrator's `ritualClimax` flag: the chosen hour
 * or omen has come, the materials are laid, the character is undisturbed). So
 * "wait until the full-moon zenith" actually resolves when the narrator plays
 * that beat, rather than only accruing over idle turns. A no-op when no rite is
 * under way or it is already at the cap. Pure.
 */
export function climaxRitual(
  session: GameSession,
  now: number = Date.now(),
): GameSession {
  const state = session.ritualState;
  if (!state || state.fidelity >= RITUAL_FIDELITY_CAP) return session;
  return {
    ...session,
    ritualState: { ...state, fidelity: RITUAL_FIDELITY_CAP },
    updatedAt: now,
  };
}

/**
 * The binding `## Ritual in Progress` narrator block (threaded via
 * `GenerateOptions.ritualContext` → `prompts.ts`), or `null` when no advancement
 * rite is under way. Tells the narrator that beginning/performing the rite is NOT
 * the advancement itself: the character remains their current role and has not
 * ascended — portray the rite forming and the surge building, never a completed
 * becoming, which only the engine-committed climb may narrate (issue #220). Pure.
 */
export function ritualNarratorContext(session: GameSession): string | null {
  const state = session.ritualState;
  if (!state) return null;

  const { pathwayId, sequenceLevel } = session.gameState;
  // Only surface the rite the character can actually be performing now — a stale
  // rite for a rung they are no longer one below is inert (never fed to advancement).
  if (state.targetSeq !== sequenceLevel - 1) return null;

  const targetRole =
    getSequence(pathwayId, state.targetSeq)?.name ?? `Sequence ${state.targetSeq}`;
  const currentRole =
    getSequence(pathwayId, sequenceLevel)?.name ?? `Sequence ${sequenceLevel}`;

  // The rite's place-specific conditions (issue #220 follow-up): a rite demanding a
  // particular setting — the Fool's Marionettist rite the open sea and the mermaids'
  // song — barely forms elsewhere, so tell the narrator to lead the character toward
  // that setting and to signal (`ritualSettingMet`) when the scene genuinely fits.
  // Only when a place-specific setting was actually DETECTED (the mechanical gate is
  // on), so a placeless rite is never told to find a "setting" its conditions don't
  // name.
  const detectedSetting = ritualRequiredSetting(session, state.targetSeq);
  const conditions = ritualStepsFor(session, state.targetSeq)
    .filter((s) => s.kind === "condition")
    .map((s) => s.text);
  const settingLine =
    detectedSetting !== null && conditions.length > 0
      ? ` This rite can only truly take hold in its proper setting (${detectedSetting}): ${conditions.join(
          "; ",
        )}. If THIS turn's scene genuinely satisfies that setting, set ` +
        `"ritualSettingMet": true in your response (otherwise omit it); until the ` +
        `character reaches it the rite barely forms, so lead them toward that place ` +
        `rather than portraying the rite maturing where it cannot.`
      : "";

  return (
    `An Advancement Ritual toward Sequence ${state.targetSeq}, ${targetRole}, is ` +
    `under way. This rite is the protective scaffolding a Beyonder performs to ` +
    `survive the surge of the new Beyonder characteristic at the moment of drinking ` +
    `the next potion — it is NOT the advancement itself, and beginning or performing ` +
    `it does NOT make the character that role. The character REMAINS ${currentRole} ` +
    `and has NOT ascended, become ${targetRole}, or gained its powers. Portray the ` +
    `rite taking shape and the coming characteristic's pressure building — the strain, ` +
    `the danger, the threshold drawing nearer — but ${RITE_IN_PROGRESS_GUARD} ` +
    `Whether the character truly becomes ${targetRole} is decided only later, when ` +
    `they drink the potion and the game commits the change.${settingLine} ` +
    `${RITE_CLIMAX_INSTRUCTION}`
  );
}

/** Drop any rite under way (consumed on a successful climb, or abandoned). */
export function clearRitual(session: GameSession, now: number = Date.now()): GameSession {
  const state = session.ritualState;
  if (state === undefined) return session;
  const label = ritualQuestLabel(state.targetSeq);
  return {
    ...session,
    ritualState: undefined,
    gameState: {
      ...session.gameState,
      activeQuests: withoutQuestLabel(session.gameState.activeQuests, label),
    },
    updatedAt: now,
  };
}

export function isValidRitualStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;
  if (!Number.isFinite(s.pathwayId)) return false;
  if (!Number.isFinite(s.targetSeq)) return false;
  if (
    !Number.isFinite(s.fidelity) ||
    (s.fidelity as number) < 0 ||
    (s.fidelity as number) > 1
  ) {
    return false;
  }
  // The setting-met flag is optional (older saves predate it) but strict when
  // present — a boolean. Rides the deserialize `...s` spread; absent means the
  // narrator has not yet confirmed the scene, so the keyword backstop decides.
  if (s.settingMet !== undefined && typeof s.settingMet !== "boolean") return false;
  return true;
}
