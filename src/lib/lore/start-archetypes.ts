// ---------------------------------------------------------------------------
// Start archetypes (world build-out 2, issue #131)
// ---------------------------------------------------------------------------
//
// Beyond simply choosing WHERE a chronicle opens (`start-scenarios.ts`), a
// player may begin already EMBEDDED in a social circle — a curated one ("a
// classmate of Klein at Khoy University", "a junior Tingen Nighthawk under Dunn
// Smith") OR a fully player-authored one (a free-text tie + companions they
// name, including invented characters). An archetype carries the same opening
// prose a scenario does, plus the relationship data the engine needs to seed a
// real starting position: the NPCs the character is tied to, an optional
// organization affiliation, and the concrete seeds applied at creation (tracked
// allies who travel at the character's side, an optional pre-membership society,
// and durable relationship grounding facts).
//
// The curated archetypes are PRESETS, never a ceiling: `buildCustomArchetype`
// turns a player's free-text circle into a normal `StartArchetype`, so a custom
// start flows through the exact same seeding pipeline (no special-casing) and a
// player is never limited to a fixed subset. Curated data is APPEND-ONLY across
// regions; this issue ships the Tingen presets referencing already-available
// Tingen NPCs (`npcs.ts`) and organizations (`organizations.ts`).
//
// Naming note: the NPCs a start ties you to are your **circle** (`circleNpcs`),
// deliberately NOT "anchors" — the Anchors system (`@/lib/game/anchors.ts`) is
// the unrelated high-Sequence stabilising resource and must not be conflated.
//
// Grounding follows the durable-context insight (issue #92): relationship/
// identity context belongs in the never-trimmed game-state layer (the character
// background + initial memory), not in trimmable session facts alone. The
// seeding glue lives in `@/lib/game/session.ts`; this file is pure data + the
// pure prose/lookup/build helpers over it.

import { getEpoch } from "./epochs";
import { NPC_LORE } from "./npcs";

export type ArchetypeRelationship =
  | "classmate"
  | "assistant"
  | "subordinate"
  | "circle-member"
  | "family-friend";

export interface StartArchetype {
  /** Stable, unique id (`<region>-<who>`). */
  id: string;
  /** Player-facing label for the picker ("A classmate of Klein at Khoy University"). */
  label: string;
  /** Epoch this archetype belongs to — gated like every other epoch datum. */
  epoch: number;
  /** Where the character wakes — a `GameState.location` value. */
  location: string;
  /** The nature of the tie to the circle's NPC(s). */
  relationship: ArchetypeRelationship;
  /** Existing NPC names (from `npcs.ts`) this character's circle is built on —
   * the people they are tied to. (NOT to be confused with the Anchors system.) */
  circleNpcs: string[];
  /** Organization slug (from `organizations.ts`) the character is affiliated with. */
  affiliationOrg?: string;
  /** One-line player-safe blurb for the picker. */
  blurb: string;
  /** The first-turn opening beat — continues from the potion, never names the
   * pathway, ends with the narrator's scene+choices cue (the scenario contract). */
  openingBeat: string;
  /** Pathway ids this start thematically SUITS — a picker suggestion only; it
   * never biases anything. */
  pathwayAffinity?: readonly number[];
  /** Marks a Forsaken-Land origin (consumed by issue #3); absent = central. */
  origin?: "forsaken-land";
  /** Concrete seeds applied at character creation (`session.ts`). */
  seeds: {
    /** Names joined to the tracked-NPC roster as known allies who travel along. */
    trackedAllies?: string[];
    /** Optional pre-membership in an organization's society. */
    society?: { orgSlug: string; role: string };
    /** Relationship facts establishing the tie, recorded in initial memory. */
    facts?: string[];
  };
}

/** The standard closing cue every opening beat shares (matches start-scenarios). */
const SCENE_CUE = "Describe the opening scene and give me choices.";

// ── Tingen archetypes — referencing already-available Tingen NPCs/orgs. ──
const TINGEN_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "tingen-klein-classmate",
    label: "A classmate of Klein Moretti at Khoy University",
    epoch: 5,
    location: "Tingen City",
    relationship: "classmate",
    circleNpcs: ["Klein Moretti"],
    blurb:
      "You read history beside Klein Moretti at Khoy University — and now you both keep secrets.",
    openingBeat: `The strange potion still scalds my throat as I cross the fog-dimmed quad of Khoy University, where I read history beside my old classmate Klein Moretti; whatever I have just become, I must keep it from him and from everyone. ${SCENE_CUE}`,
    pathwayAffinity: [1],
    seeds: {
      trackedAllies: ["Klein Moretti"],
      facts: [
        "You studied history alongside Klein Moretti at Khoy University in Tingen; he knows your face and your name.",
      ],
    },
  },
  {
    id: "tingen-junior-nighthawk",
    label: "A junior Nighthawk on the Tingen team",
    epoch: 5,
    location: "Tingen City",
    relationship: "subordinate",
    circleNpcs: ["Dunn Smith", "Leonard Mitchell"],
    affiliationOrg: "nighthawks-tingen-team",
    blurb:
      "The newest recruit of Captain Dunn Smith's Tingen Nighthawks, working out of Blackthorn Security.",
    openingBeat: `The change is still settling into my blood as I report to Blackthorn Security on Zouteland Street, where Captain Dunn Smith's Tingen Nighthawks keep their cover — I am the lowest of them now, and not one of them must learn what I just drank. ${SCENE_CUE}`,
    pathwayAffinity: [4, 5],
    seeds: {
      trackedAllies: ["Leonard Mitchell"],
      society: { orgSlug: "nighthawks-tingen-team", role: "junior operative" },
      facts: [
        "You serve as the most junior member of the Tingen Nighthawks under Captain Dunn Smith, partnered most often with Leonard Mitchell.",
      ],
    },
  },
  {
    id: "tingen-neil-assistant",
    label: "An assistant to Old Neil, the Nighthawks' artificer",
    epoch: 5,
    location: "Tingen City",
    relationship: "assistant",
    circleNpcs: ["Old Neil"],
    affiliationOrg: "nighthawks-tingen-team",
    blurb:
      "You keep Old Neil's workshop of sealed artifacts and ritual materials for the Tingen team.",
    openingBeat: `The vial is still empty in my hand when I let myself into Old Neil's cluttered workshop, the Nighthawks' artifacts watching from their shelves, and I understand that the old artificer's assistant is no longer entirely human. ${SCENE_CUE}`,
    pathwayAffinity: [],
    seeds: {
      trackedAllies: ["Old Neil"],
      facts: [
        "You assist Old Neil, the Tingen Nighthawks' elderly artificer, in his workshop of sealed artifacts and ritual materials; he is your mentor.",
      ],
    },
  },
  {
    id: "tingen-moretti-family-friend",
    label: "A family friend of the Morettis on Iron Cross Street",
    epoch: 5,
    location: "Tingen City",
    relationship: "family-friend",
    circleNpcs: ["Melissa Moretti", "Klein Moretti"],
    blurb:
      "A trusted friend of the Moretti household in the working streets of Tingen's Iron Cross.",
    openingBeat: `The potion's heat fades as I climb the stairs of the Iron Cross Street tenement where the Moretti family lives, a covered dish cooling in my hands, and I wonder how I will hide from Melissa and her brother Klein what I have become. ${SCENE_CUE}`,
    pathwayAffinity: [],
    seeds: {
      trackedAllies: ["Melissa Moretti"],
      facts: [
        "You are a trusted friend of the Moretti family on Iron Cross Street in Tingen — close to Melissa Moretti and her brother Klein.",
      ],
    },
  },
] as const;

// ── Forsaken Land of the Gods — ORIGIN archetypes (issue #132). Begin a native
// of the sealed Eastern Continent. EXCLUDED from the default picker; surfaced
// only behind the explicit "choose an origin" affordance, and seed the
// continent's access flag + currentCity via `createDefaultGameState`. ──
const FORSAKEN_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "forsaken-silver-knight",
    label: "A Silver Knight of the City of Silver",
    epoch: 5,
    location: "Silver City",
    relationship: "circle-member",
    circleNpcs: ["Derrick Berg"],
    origin: "forsaken-land",
    blurb:
      "A sworn defender of the City of Silver's night-watch, raised in the sealed Forsaken Land and its old faith.",
    openingBeat: `The strange potion still burns in me as I stand my watch on the grey-white walls of the City of Silver, the perpetual lightning walking the sky above the dead country beyond — I have guarded this last city all my life, and now I am something it has no rite for. ${SCENE_CUE}`,
    pathwayAffinity: [3],
    seeds: {
      trackedAllies: ["Derrick Berg"],
      facts: [
        "You are a Silver Knight of the City of Silver in the Forsaken Land, sworn to its night-watch and its old faith, and you know Derrick Berg among the City's defenders.",
      ],
    },
  },
] as const;

/** Every start archetype, all regions/epochs (append-only) — including gated
 * ORIGIN archetypes (so `getStartArchetype` resolves them by id). Default
 * selection filters origins out; `forsakenLandArchetypesForEpoch` filters in. */
export const START_ARCHETYPES: readonly StartArchetype[] = [
  ...TINGEN_ARCHETYPES,
  ...FORSAKEN_ARCHETYPES,
];

/**
 * The DEFAULT archetypes available for a character's epoch — ORIGIN archetypes
 * (issue #132) are excluded so the normal picker never offers a start inside an
 * access-gated continent. Resolves the epoch loosely (an unknown/undefined epoch
 * yields the empty list rather than throwing — the picker simply shows no
 * archetypes for an epoch that has none authored yet).
 */
export function startArchetypesForEpoch(epoch: number | undefined): StartArchetype[] {
  const id = epoch ?? 5;
  return START_ARCHETYPES.filter((a) => a.epoch === id && a.origin === undefined);
}

/**
 * The Forsaken-Land ORIGIN archetypes for an epoch (issue #132) — surfaced only
 * behind the explicit "choose an origin" affordance, never the default picker.
 */
export function forsakenLandArchetypesForEpoch(
  epoch: number | undefined,
): StartArchetype[] {
  const id = epoch ?? 5;
  return START_ARCHETYPES.filter((a) => a.epoch === id && a.origin === "forsaken-land");
}

/** Look up a start archetype by id, or `undefined` if none matches. */
export function getStartArchetype(id: string): StartArchetype | undefined {
  return START_ARCHETYPES.find((a) => a.id === id);
}

/**
 * The durable, never-trimmed relationship grounding line for an archetype,
 * folded into `characterBackground` at creation so the narrator keeps the social
 * tie in view for the whole chronicle (issue #92's durable-context insight) —
 * not just in the trimmable session facts.
 */
export function archetypeGrounding(archetype: StartArchetype): string {
  // Lowercase only the leading character so the label reads naturally mid-
  // sentence ("A classmate…" → "a classmate…", "An assistant…" → "an
  // assistant…") — robust to any phrasing, not just a leading "A"/"An" article.
  const label = archetype.label;
  const opener = label.charAt(0).toLowerCase() + label.slice(1);
  return `You begin your chronicle as ${opener}.`;
}

// ---------------------------------------------------------------------------
// Custom (player-authored) circles — creativity is never capped by the presets.
// ---------------------------------------------------------------------------

/** A player-authored starting circle (the "Describe your own circle" path). */
export interface CustomStartCircle {
  /** Free-text tie ("a fence who owes the Tingen Nighthawks"). May be empty. */
  tie: string;
  /** Companions the character starts alongside — canon NPCs OR invented names. */
  companions: string[];
  /** Where the chronicle opens; falls back to the epoch default when absent. */
  location?: string;
}

/**
 * How the player chose to open the chronicle (issue #131). One discriminated
 * value so the location / curated-archetype / custom-circle choices are mutually
 * exclusive by construction — no set of nullable params to keep in sync. Lives
 * here (with `CustomStartCircle`) so every start-flow data type shares one layer.
 */
export type StartSelection =
  | { kind: "random" }
  | { kind: "location"; location: string }
  | { kind: "archetype"; archetypeId: string }
  | { kind: "custom"; circle: CustomStartCircle }
  // An access-gated ORIGIN start scenario chosen behind the "choose an origin"
  // affordance (issue #132) — resolved by id, it seeds the continent's flag.
  | { kind: "origin-scenario"; scenarioId: string };

/**
 * Bounds so a free-text circle can't bloat the durable prompt budget. Exported
 * as the SINGLE source of truth — the creation form consumes these for its
 * `maxLength`/cap UI so the courtesy bounds can never drift from the real guard.
 */
export const MAX_TIE_LENGTH = 200;
export const MAX_COMPANIONS = 5;
export const MAX_COMPANION_LENGTH = 40;
const MAX_LOCATION_LENGTH = 80;

/** Dedupe strings case-insensitively, preserving first-seen order + casing. */
function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

/**
 * Turn a player's free-text circle into a normal `StartArchetype` (issue #131
 * follow-up) so a custom start flows through the SAME creation-seeding pipeline
 * (`createDefaultGameState` + `seedArchetype`) as a curated preset — no special-
 * casing. Companions become tracked allies (whether canon or invented — the
 * roster does not require canon), the tie becomes the durable grounding label
 * plus a relationship fact, and a generic awakening beat (continuing from the
 * potion, naming no pathway) opens the scene. All free text is trimmed and
 * length/count-bounded. Pure.
 */
export function buildCustomArchetype(
  input: CustomStartCircle,
  epoch: number | undefined,
): StartArchetype {
  const tie = input.tie.trim().slice(0, MAX_TIE_LENGTH);
  const companions = dedupeNames(
    input.companions
      .map((name) => name.trim().slice(0, MAX_COMPANION_LENGTH))
      .filter((name) => name.length > 0),
  ).slice(0, MAX_COMPANIONS);
  // Length-bound the player's location too (the UI feeds a curated select value,
  // but this is an exported API — keep the prompt-budget guarantee here). The
  // canonical epoch fallback is already bounded.
  const location =
    input.location?.trim().slice(0, MAX_LOCATION_LENGTH) ||
    getEpoch(epoch).startingLocation;

  // The label IS the player's tie (so `archetypeGrounding` reads naturally);
  // a blank tie falls back to a neutral phrasing.
  const label = tie || "an outsider with ties of their own";

  const facts: string[] = [];
  if (tie) facts.push(`Your starting circle: ${tie}.`);
  if (companions.length > 0) {
    facts.push(`Known associates at your side: ${companions.join(", ")}.`);
  }

  return {
    // Intentionally a fixed, non-unique id: a custom archetype is built on
    // demand and never registered in START_ARCHETYPES or looked up by
    // getStartArchetype, so it doesn't participate in the preset id-uniqueness
    // invariant.
    id: "custom",
    label,
    epoch: getEpoch(epoch).id,
    location,
    relationship: "circle-member",
    circleNpcs: companions,
    blurb: tie || "A circle of your own making.",
    openingBeat: `The strange potion still burns in me as I steady myself in ${location}, certain of only one thing: whatever I have become, I must keep it hidden. ${SCENE_CUE}`,
    seeds: {
      ...(companions.length > 0 ? { trackedAllies: companions } : {}),
      ...(facts.length > 0 ? { facts } : {}),
    },
  };
}

/**
 * Canon NPC names the player can be suggested as companions for a given epoch
 * (the custom-circle datalist) — epoch-gated like every other lore datum, so an
 * earlier-epoch character isn't offered Fifth-Epoch faces. Untagged NPCs are
 * universal. Players may still type any (invented) name; these are only hints.
 */
export function circleNpcSuggestions(epoch: number | undefined): string[] {
  const id = getEpoch(epoch).id;
  const names = new Set<string>();
  for (const entry of NPC_LORE) {
    if (entry.epoch === undefined || entry.epoch === id) {
      for (const name of entry.npcs) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
