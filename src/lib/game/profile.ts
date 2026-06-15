// ---------------------------------------------------------------------------
// True-self profile (issue: character-info storage)
// ---------------------------------------------------------------------------
//
// A mutable, D&D-style record of who the character actually IS — distinct from
// the persona/disguise system in `identity.ts`. The character's chosen NAME is
// NOT stored here: it mirrors `GameState.characterName` (the single source of
// truth the narrator prompt, journal, and showcase already read). Everything
// else that can evolve over a chronicle lives here: gender, pronouns, current
// appearance, epithet, age, distinguishing marks, demeanor/allure trait tags,
// a player-authored notes log, and a history of former names.
//
// The stable `GameState.characterId` is the canonical "same soul" anchor — it
// never changes, so NPC reputation (keyed to it, never to the name) carries
// over across a rename automatically.
//
// Recognition gap: the INVERSE of identity exposure. When the true self changes
// drastically, people who knew the old you do NOT automatically connect this
// new appearance to the same person until you reveal yourself or one of them
// deduces it. Modelled with a parallel awareness pool on `ProfileState`, never
// by reaching into the identity functions (no duplication — a dual structure on
// a different state slice).
//
// All functions are pure and synchronous; the React layer owns storage.

import type { GameState } from "@/lib/ai/types";

export interface DemeanorTrait {
  id: string;
  /** e.g. "heightened allure", "intimidating", "frail". */
  label: string;
}

export interface ProfileNote {
  id: string;
  /** Player-authored; NEVER fed into prompt assembly (mirrors journal annotations). */
  text: string;
  at: number;
}

export interface TrueSelfProfile {
  gender?: string;
  pronouns?: string; // free text, e.g. "she/her"
  appearance?: string; // current physical description (replaces prior on transformation)
  epithet?: string; // title/epithet, e.g. "the Witch of Backlund"
  age?: string; // free text — in-world ages can be vague / near-immortal
  marks?: string; // distinguishing features
  demeanor: DemeanorTrait[];
  notes: ProfileNote[];
  /** History of names the character has shed; for "formerly <name>" framing. */
  formerNames: string[];
}

export interface RecognitionGap {
  /** NPCs who knew the prior self and have NOT yet re-recognized this person. */
  pendingNpcs: string[];
  /** The name they knew the character by before the drastic change. */
  priorName: string;
  openedAt: number;
}

export interface ProfileState {
  profile: TrueSelfProfile;
  /** Open gap from the most recent drastic change; null when everyone recognizes you. */
  recognition: RecognitionGap | null;
}

/** The scalar profile fields the AI may propose changing in a turn. */
export type SelfChangeField =
  | "name"
  | "appearance"
  | "gender"
  | "pronouns"
  | "epithet"
  | "age"
  | "marks";

export const SELF_CHANGE_FIELDS: readonly SelfChangeField[] = [
  "name",
  "appearance",
  "gender",
  "pronouns",
  "epithet",
  "age",
  "marks",
] as const;

export interface SelfChangeProposal {
  field: SelfChangeField;
  value: string;
  reason?: string;
}

/** Edits to the structured profile fields (never the name — rename is separate). */
export type ProfileEdits = Partial<{
  gender: string;
  pronouns: string;
  appearance: string;
  epithet: string;
  age: string;
  marks: string;
  demeanor: DemeanorTrait[];
}>;

// --- construction ------------------------------------------------------------

export function createProfileState(): ProfileState {
  return {
    profile: { demeanor: [], notes: [], formerNames: [] },
    recognition: null,
  };
}

/**
 * Resolve a session's profile, seeding an empty one for legacy saves. There is
 * no structured data to migrate from `GameState` (the name lives there and the
 * background is its own field), so this is the lazy `?? createProfileState()`
 * boundary every caller uses — mirrors `identityState ?? createIdentityState()`.
 */
export function resolveProfileState(state?: ProfileState | null): ProfileState {
  return state ?? createProfileState();
}

// --- editing -----------------------------------------------------------------

const SCALAR_EDIT_FIELDS = [
  "gender",
  "pronouns",
  "appearance",
  "epithet",
  "age",
  "marks",
] as const;

/**
 * Merge structured field edits. Blank strings clear the field (undefined);
 * `demeanor` replaces the trait list wholesale. Pure — returns new state.
 */
export function applyProfileEdits(
  state: ProfileState,
  edits: ProfileEdits,
): ProfileState {
  const profile: TrueSelfProfile = { ...state.profile };
  for (const key of SCALAR_EDIT_FIELDS) {
    const value = edits[key];
    if (value === undefined) continue;
    const trimmed = value.trim();
    if (trimmed === "") {
      delete profile[key];
    } else {
      profile[key] = trimmed;
    }
  }
  if (edits.demeanor !== undefined) {
    profile.demeanor = edits.demeanor.map((t) => ({ id: t.id, label: t.label.trim() }));
  }
  return { ...state, profile };
}

/**
 * Rename the true self. The old name (from `gameState.characterName`) is pushed
 * onto `formerNames`; the new name is written back to `GameState` so the
 * narrator/journal/showcase stay in sync. Reputation is untouched — it is keyed
 * to `characterId`, never the name. Returns BOTH updated slices.
 */
export function renameTrueSelf(
  state: ProfileState,
  gameState: GameState,
  newName: string,
): { profileState: ProfileState; gameState: GameState } {
  const name = newName.trim();
  if (name === "") {
    throw new Error("A name cannot be empty.");
  }
  const oldName = gameState.characterName?.trim();
  const formerNames =
    oldName && oldName.toLowerCase() !== name.toLowerCase()
      ? [...state.profile.formerNames, oldName]
      : state.profile.formerNames;
  return {
    profileState: { ...state, profile: { ...state.profile, formerNames } },
    gameState: { ...gameState, characterName: name },
  };
}

export interface ProfileChange {
  /** New chosen name (triggers a rename). */
  name?: string;
  /** Structured field edits. */
  edits?: ProfileEdits;
}

export interface ApplyProfileChangeOptions {
  /** Open a recognition gap from the NPCs who knew the prior self. */
  createGap?: boolean;
  /** NPCs present / known to seed the gap pool. */
  npcsPresent?: readonly string[];
  now?: number;
}

/**
 * The high-level edit path used by the sheet editor, the in-turn confirm, and
 * the ritual scene: optionally rename, apply field edits, and optionally open a
 * recognition gap (the caller decides via the hybrid pre-tick + override).
 */
export function applyProfileChange(
  state: ProfileState,
  gameState: GameState,
  change: ProfileChange,
  options: ApplyProfileChangeOptions = {},
): { profileState: ProfileState; gameState: GameState } {
  const priorName = gameState.characterName?.trim() ?? "";
  let profileState = state;
  let nextGameState = gameState;

  if (change.name !== undefined) {
    const renamed = renameTrueSelf(profileState, nextGameState, change.name);
    profileState = renamed.profileState;
    nextGameState = renamed.gameState;
  }
  if (change.edits) {
    profileState = applyProfileEdits(profileState, change.edits);
  }
  if (options.createGap) {
    profileState = openRecognitionGap(
      profileState,
      options.npcsPresent ?? [],
      priorName,
      options.now,
    );
  }
  return { profileState, gameState: nextGameState };
}

/**
 * Map a single AI-proposed scalar change to a `ProfileChange`. `name` becomes a
 * rename; everything else becomes a structured edit.
 */
export function proposalToChange(proposal: SelfChangeProposal): ProfileChange {
  if (proposal.field === "name") {
    return { name: proposal.value };
  }
  return { edits: { [proposal.field]: proposal.value } };
}

// --- the "drastic change" hybrid pre-tick ------------------------------------

function demeanorKey(traits: DemeanorTrait[]): string {
  return traits
    .map((t) => t.label.trim().toLowerCase())
    .sort()
    .join("|");
}

export interface DrasticChangeContext {
  /** True when the character has Faceless/Dream-Stealer flawless capability. */
  flawlessCapable: boolean;
}

/**
 * The hybrid rule that pre-ticks the recognition-gap checkbox: a change is
 * drastic when the gender changed, the demeanor/allure tags changed, OR the
 * character has flawless-transformation capability (their permanent remakes are
 * inherently total). A plain rename is NOT drastic. The player can always
 * override the resulting checkbox.
 */
export function isDrasticChange(
  prev: TrueSelfProfile,
  next: TrueSelfProfile,
  context: DrasticChangeContext,
): boolean {
  if (context.flawlessCapable) return true;
  const prevGender = (prev.gender ?? "").trim().toLowerCase();
  const nextGender = (next.gender ?? "").trim().toLowerCase();
  if (prevGender !== nextGender) return true;
  return demeanorKey(prev.demeanor) !== demeanorKey(next.demeanor);
}

// --- recognition gap (inverse of identity exposure) --------------------------

export function openRecognitionGap(
  state: ProfileState,
  npcsKnowing: readonly string[],
  priorName: string,
  now: number = Date.now(),
): ProfileState {
  const pendingNpcs = Array.from(new Set(npcsKnowing.filter((n) => n.trim() !== "")));
  if (pendingNpcs.length === 0) {
    // No one around to be fooled — nothing to gate.
    return { ...state, recognition: null };
  }
  return {
    ...state,
    recognition: { pendingNpcs, priorName, openedAt: now },
  };
}

function settleGap(state: ProfileState, remaining: string[]): ProfileState {
  if (!state.recognition) return state;
  if (remaining.length === 0) {
    return { ...state, recognition: null };
  }
  return { ...state, recognition: { ...state.recognition, pendingNpcs: remaining } };
}

/**
 * Deliberate reveal — the character lets specific NPCs know they are the same
 * person (the inverse of `applyExposure`: it re-links rather than penalizes).
 * Passing no list reveals to everyone (closes the gap entirely).
 */
export function recordRecognition(
  state: ProfileState,
  revealedTo?: readonly string[],
): ProfileState {
  if (!state.recognition) return state;
  if (revealedTo === undefined) {
    return { ...state, recognition: null };
  }
  const reveal = new Set(revealedTo);
  const remaining = state.recognition.pendingNpcs.filter((n) => !reveal.has(n));
  return settleGap(state, remaining);
}

export interface PierceResult {
  state: ProfileState;
  /** NPCs who connected the new face to the old self this turn. */
  pierced: string[];
}

/** Per-turn chance a present NPC deduces the connection (mirror of `checkExposure`). */
export const RECOGNITION_PIERCE_CHANCE = 0.2;

/**
 * A deduction beat: among the present NPCs still in the gap, each may figure out
 * this is the same person. Deterministic under the injected random source.
 */
export function pierceRecognition(
  state: ProfileState,
  npcsPresent: readonly string[],
  random: () => number = Math.random,
): PierceResult {
  if (!state.recognition) return { state, pierced: [] };
  const present = new Set(npcsPresent);
  const pierced: string[] = [];
  const remaining: string[] = [];
  for (const npc of state.recognition.pendingNpcs) {
    if (present.has(npc) && random() < RECOGNITION_PIERCE_CHANCE) {
      pierced.push(npc);
    } else {
      remaining.push(npc);
    }
  }
  return { state: settleGap(state, remaining), pierced };
}

// --- notes log ---------------------------------------------------------------

export function addProfileNote(
  state: ProfileState,
  text: string,
  now: number = Date.now(),
  id: string = crypto.randomUUID(),
): ProfileState {
  const trimmed = text.trim();
  if (trimmed === "") throw new Error("A note cannot be empty.");
  const note: ProfileNote = { id, text: trimmed, at: now };
  return {
    ...state,
    profile: { ...state.profile, notes: [...state.profile.notes, note] },
  };
}

export function editProfileNote(
  state: ProfileState,
  id: string,
  text: string,
): ProfileState {
  const trimmed = text.trim();
  if (trimmed === "") throw new Error("A note cannot be empty.");
  return {
    ...state,
    profile: {
      ...state.profile,
      notes: state.profile.notes.map((n) => (n.id === id ? { ...n, text: trimmed } : n)),
    },
  };
}

export function removeProfileNote(state: ProfileState, id: string): ProfileState {
  return {
    ...state,
    profile: { ...state.profile, notes: state.profile.notes.filter((n) => n.id !== id) },
  };
}

// --- prompt context ----------------------------------------------------------

/**
 * One narrator-facing line of self facts (pronouns, gender, epithet, appearance,
 * demeanor). Unlike `identityPromptContext`, this is GROUND TRUTH — it is who
 * the character really is. Returns null when nothing has been set.
 */
export function profilePromptContext(
  state: ProfileState,
  gameState: GameState,
): string | null {
  const p = state.profile;
  const parts: string[] = [];
  if (p.epithet) parts.push(`known as "${p.epithet}"`);
  if (p.gender) parts.push(p.gender);
  if (p.pronouns) parts.push(`pronouns ${p.pronouns}`);
  if (p.age) parts.push(`age ${p.age}`);
  if (p.appearance) parts.push(p.appearance);
  if (p.marks) parts.push(`distinguishing marks: ${p.marks}`);
  if (p.demeanor.length > 0) {
    parts.push(`demeanor: ${p.demeanor.map((t) => t.label).join(", ")}`);
  }
  if (parts.length === 0) return null;
  const name = gameState.characterName ?? "the character";
  return `${name} — ${parts.join("; ")}. Narrate their presence and how others read them accordingly; this is who they truly are.`;
}

/**
 * The recognition-gap line: tell the narrator the listed people see a stranger
 * where the prior name once stood. Returns null when no gap is open. (The game
 * loop suppresses this while a persona is worn — the gap is about the TRUE face.)
 */
export function recognitionPromptContext(state: ProfileState): string | null {
  const gap = state.recognition;
  if (!gap || gap.pendingNpcs.length === 0) return null;
  const who = gap.pendingNpcs.join(", ");
  const prior = gap.priorName ? ` as "${gap.priorName}"` : "";
  return `The character has been drastically transformed. The following people knew them${prior} and do NOT recognise this person as the same individual — narrate them treating the character as a stranger until a reveal or a deduction connects the two: ${who}.`;
}

// --- AI proposal validation --------------------------------------------------

/**
 * The single validation point for the AI's optional `proposedSelfChange` — a
 * malformed proposal is dropped (returns null), never thrown. Mirrors
 * `validateJournalFlag`.
 */
export function validateSelfChangeProposal(raw: unknown): SelfChangeProposal | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!SELF_CHANGE_FIELDS.includes(r.field as SelfChangeField)) return null;
  if (typeof r.value !== "string" || r.value.trim() === "") return null;
  const proposal: SelfChangeProposal = {
    field: r.field as SelfChangeField,
    value: r.value.trim(),
  };
  if (typeof r.reason === "string" && r.reason.trim() !== "") {
    proposal.reason = r.reason.trim();
  }
  return proposal;
}

// --- strict shape validation (for deserialize) -------------------------------

function isValidDemeanor(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  return v.every((t) => {
    if (typeof t !== "object" || t === null) return false;
    const trait = t as Record<string, unknown>;
    return typeof trait.id === "string" && typeof trait.label === "string";
  });
}

function isValidNotes(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  return v.every((n) => {
    if (typeof n !== "object" || n === null) return false;
    const note = n as Record<string, unknown>;
    return (
      typeof note.id === "string" &&
      typeof note.text === "string" &&
      Number.isFinite(note.at)
    );
  });
}

const OPTIONAL_STRING_FIELDS = [
  "gender",
  "pronouns",
  "appearance",
  "epithet",
  "age",
  "marks",
] as const;

export function isValidProfileStateShape(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;

  if (typeof s.profile !== "object" || s.profile === null || Array.isArray(s.profile)) {
    return false;
  }
  const p = s.profile as Record<string, unknown>;
  for (const key of OPTIONAL_STRING_FIELDS) {
    if (p[key] !== undefined && typeof p[key] !== "string") return false;
  }
  if (!isValidDemeanor(p.demeanor)) return false;
  if (!isValidNotes(p.notes)) return false;
  if (
    !Array.isArray(p.formerNames) ||
    !p.formerNames.every((n) => typeof n === "string")
  ) {
    return false;
  }

  if (s.recognition !== null) {
    if (
      typeof s.recognition !== "object" ||
      s.recognition === undefined ||
      Array.isArray(s.recognition)
    ) {
      return false;
    }
    const r = s.recognition as Record<string, unknown>;
    if (typeof r.priorName !== "string") return false;
    if (!Number.isFinite(r.openedAt)) return false;
    if (
      !Array.isArray(r.pendingNpcs) ||
      !r.pendingNpcs.every((n) => typeof n === "string")
    ) {
      return false;
    }
  }

  return true;
}
