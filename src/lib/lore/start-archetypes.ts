// ---------------------------------------------------------------------------
// Start archetypes (world build-out 2, issue #131)
// ---------------------------------------------------------------------------
//
// Beyond simply choosing WHERE a chronicle opens (`start-scenarios.ts`), a
// player may begin already EMBEDDED in an existing character's social circle —
// "a classmate of Klein at Khoy University", "a junior Tingen Nighthawk under
// Dunn Smith". An archetype carries the same opening prose a scenario does, plus
// the relationship data the engine needs to seed a real starting position: the
// NPCs the character is tied to, an optional organization affiliation, and the
// concrete seeds applied at creation (tracked allies who travel at the
// character's side, an optional pre-membership society, and durable relationship
// grounding facts).
//
// This module is APPEND-ONLY across regions: every later region issue contributes
// its own archetypes referencing that region's NPCs. This issue ships the Tingen
// archetypes, which reference already-available Tingen NPCs (`npcs.ts`) and
// organizations (`organizations.ts`), so the feature works the moment it merges.
//
// Grounding follows the durable-context insight (issue #92): relationship/
// identity context belongs in the never-trimmed game-state layer (the character
// background + initial memory), not in trimmable session facts alone. The
// seeding glue lives in `@/lib/game/session.ts`; this file is pure data + the
// pure prose/lookup helpers over it.

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
  /** The nature of the tie to the anchor NPC(s). */
  relationship: ArchetypeRelationship;
  /** Existing NPC names (from `npcs.ts`) this character is bound to. */
  anchorNpcs: string[];
  /** Organization slug (from `organizations.ts`) the character is affiliated with. */
  anchorOrg?: string;
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
    anchorNpcs: ["Klein Moretti"],
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
    anchorNpcs: ["Dunn Smith", "Leonard Mitchell"],
    anchorOrg: "nighthawks-tingen-team",
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
    anchorNpcs: ["Old Neil"],
    anchorOrg: "nighthawks-tingen-team",
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
    anchorNpcs: ["Melissa Moretti", "Klein Moretti"],
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

/** Every start archetype, all regions/epochs (append-only). */
export const START_ARCHETYPES: readonly StartArchetype[] = [...TINGEN_ARCHETYPES];

/**
 * The archetypes available for a character's epoch. Resolves the epoch loosely
 * (an unknown/undefined epoch yields the empty list rather than throwing — the
 * picker simply shows no archetypes for an epoch that has none authored yet).
 */
export function startArchetypesForEpoch(epoch: number | undefined): StartArchetype[] {
  const id = epoch ?? 5;
  return START_ARCHETYPES.filter((a) => a.epoch === id);
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
