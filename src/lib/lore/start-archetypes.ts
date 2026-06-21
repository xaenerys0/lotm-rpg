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
import { HISTORICAL_LORE } from "./history";
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

// ── Backlund archetypes (world build-out 4, issue #133) — begin embedded in a
// circle of the Loen capital, referencing the Backlund NPCs added in `npcs.ts`. ──
const BACKLUND_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "backlund-hall-attendant",
    label: "An attendant to Lady Audrey Hall in Empress Borough",
    epoch: 5,
    location: "Backlund",
    relationship: "assistant",
    circleNpcs: ["Audrey Hall"],
    blurb:
      "You serve in the Hall household of Empress Borough, close to the charming young noblewoman Audrey Hall.",
    openingBeat: `The strange potion still burns in me as I cross the marble entrance hall of the Hall family's Empress Borough townhouse to attend Lady Audrey, the soot-yellow fog of Backlund pressing at the tall windows — whatever I have become this night, none of this gilded household must ever learn it. ${SCENE_CUE}`,
    pathwayAffinity: [2],
    seeds: {
      trackedAllies: ["Audrey Hall"],
      facts: [
        "You attend Lady Audrey Hall in her family's Empress Borough townhouse in Backlund; she knows you as a trusted member of the household.",
      ],
    },
  },
  {
    id: "backlund-detective-assistant",
    label: "An assistant to the Backlund detective Sherlock Moriarty",
    epoch: 5,
    location: "Backlund",
    relationship: "assistant",
    circleNpcs: ["Sherlock Moriarty"],
    blurb:
      "You keep the case files for the enigmatic private detective Sherlock Moriarty in Cherwood Borough.",
    openingBeat: `The strange potion still burns in me as I climb the stairs to the Minsk Street office of Sherlock Moriarty, the famous private detective I assist through Backlund's soot-yellow fog — and I realise the strangest case in this city of secrets may now be myself. ${SCENE_CUE}`,
    pathwayAffinity: [2],
    seeds: {
      trackedAllies: ["Sherlock Moriarty"],
      facts: [
        "You assist the private detective Sherlock Moriarty from his office on Minsk Street in Backlund's Cherwood Borough; he knows your face and trusts you with his case files.",
      ],
    },
  },
] as const;

// ── Wider Loen Kingdom archetypes (world build-out 5, issue #134) — begin
// embedded in a circle of the kingdom beyond the capital, referencing the Loen
// NPCs/orgs added in `npcs.ts`/`organizations.ts`. The Foundation clerk opens in
// Stoen City (East Chester County) — not a curated travel city, so the map
// shows the neutral "uncertain" atlas until the character first travels (a
// designed, self-healing fallback), exactly the graceful path a custom start
// with an off-map location takes. ──
const LOEN_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "constant-mcgovern-friend",
    label: "A friend of the McGovern banking family of Constant City",
    epoch: 5,
    location: "Constant City",
    relationship: "family-friend",
    circleNpcs: ["Welch McGovern"],
    blurb:
      "You move in the coal-and-steel money of the Wind City, close to the McGoverns and their easy-going son Welch.",
    openingBeat: `The strange potion still burns in me as the blast furnaces of Constant glow against the night, the hard sea wind tugging at my coat outside the McGovern townhouse where I am counted a friend of the family — and I understand that whatever I have just become, none of this comfortable world must learn it. ${SCENE_CUE}`,
    // Paragon (id 19) — the Savant pathway of the God of Steam & Machinery, the
    // industrial Wind City's defining pathway.
    pathwayAffinity: [19],
    seeds: {
      trackedAllies: ["Welch McGovern"],
      facts: [
        "You are a trusted friend of the wealthy McGovern banking family of Constant City, close to their son Welch, a Khoy University man.",
      ],
    },
  },
  {
    id: "loen-foundation-clerk",
    label: "A clerk of the Loen Relic Search & Preservation Foundation",
    epoch: 5,
    location: "Stoen City",
    relationship: "subordinate",
    circleNpcs: ["Pacheco Dwayne"],
    affiliationOrg: "loen-relic-foundation-overview",
    blurb:
      "You keep the records of Audrey Hall's relic foundation in Stoen City, under the watchful Compliance Department.",
    openingBeat: `The change is still settling into my blood as I let myself into the Loen Relic Search and Preservation Foundation's offices in Stoen City, the cabinets of dig-reports and catalogued antiquities around me and the strict Compliance Department a closed door at the end of the hall — and I know I must not let Deputy Director Pacheco Dwayne see what I have become. ${SCENE_CUE}`,
    pathwayAffinity: [],
    seeds: {
      trackedAllies: ["Barton"],
      facts: [
        "You clerk for the Loen Relic Search and Preservation Foundation in Stoen City, under Deputy Director Pacheco Dwayne of the Compliance Department; the ordinary employee Barton is your friend there.",
      ],
    },
  },
] as const;

// ── Intis Republic archetypes (world build-out 6, issue #135) — begin embedded
// in a circle of the sun-faith capital, referencing the Trier NPCs/orgs added in
// `npcs.ts`/`organizations.ts`. (The "assistant to the Halls" circle the issue
// notes is sited in Backlund, where Lady Audrey Hall lives — it ships as
// `backlund-hall-attendant`, so it is not duplicated here.) ──
const INTIS_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "trier-blazing-sun-acolyte",
    label: "An acolyte of the Church of the Eternal Blazing Sun in Trier",
    epoch: 5,
    location: "Trier",
    relationship: "subordinate",
    circleNpcs: ["Plessy Descartes"],
    affiliationOrg: "blazing-sun-church-members",
    blurb:
      "You serve at Saint Viève Cathedral in Trier's Island District, under the eye of Cardinal Plessy Descartes.",
    openingBeat: `The strange potion still burns in me as dawn gilds the dome of Saint Viève Cathedral and the white-robed clergy raise their arms to greet the sun, and I — the most junior of the Cardinal's acolytes — must keep my head bowed and let no one in this house of light see what I have become. ${SCENE_CUE}`,
    pathwayAffinity: [3],
    seeds: {
      trackedAllies: ["Plessy Descartes"],
      facts: [
        "You serve as an acolyte of the Church of the Eternal Blazing Sun at Saint Viève Cathedral in Trier, under Cardinal Plessy Descartes, who knows your face among the clergy.",
      ],
    },
  },
  {
    id: "trier-inquisition-initiate",
    label: "An initiate of the Blazing Sun's Inquisition in Trier",
    epoch: 5,
    location: "Trier",
    relationship: "subordinate",
    circleNpcs: ["Angoulême de François"],
    affiliationOrg: "blazing-sun-church-members",
    blurb:
      "You serve under Deacon Angoulême de François, who hunts heresy in Trier with a censer in one hand and a police badge in the other.",
    openingBeat: `The change is still settling into my blood as I report to Deacon Angoulême de François in the lamplit back-office of Quartier 13, where the Inquisition and the city police are one and the same — and I understand that the newest of his hunters of heresy must now hide a heresy of his own. ${SCENE_CUE}`,
    pathwayAffinity: [3],
    seeds: {
      trackedAllies: ["Angoulême de François"],
      facts: [
        "You serve under Deacon Angoulême de François, a Purifier of the Church of the Eternal Blazing Sun's Inquisition and a Deputy Assistant Commissioner of Trier's police; he counts you among his junior hunters.",
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
    label: "A giant-blooded warden of the City of Silver",
    epoch: 5,
    location: "Silver City",
    relationship: "circle-member",
    circleNpcs: ["Derrick Berg"],
    origin: "forsaken-land",
    blurb:
      "A giant-descended defender of the City of Silver, raised to the watch in the sealed Forsaken Land.",
    openingBeat: `The strange potion still burns in me as I stand the watch on the grey-white walls of the City of Silver, the perpetual lightning walking the sky above the dead country beyond — my line has guarded this sealed city since the world forgot us, and now I am something even our oldest customs have no name for. ${SCENE_CUE}`,
    pathwayAffinity: [11],
    seeds: {
      trackedAllies: ["Derrick Berg"],
      facts: [
        "You are a giant-blooded warden of the City of Silver in the Forsaken Land, sworn to its watch, and you know Derrick Berg among the City's defenders.",
      ],
    },
  },
  {
    id: "forsaken-moon-watcher",
    label: "A fog-watcher of Moon City",
    epoch: 5,
    location: "Moon City",
    relationship: "subordinate",
    circleNpcs: ["Nim"],
    origin: "forsaken-land",
    blurb:
      "A keeper of Moon City's ancient watch on the gray fog, serving under the High Priest Nim in the sealed Forsaken Land.",
    openingBeat: `The strange potion still burns in me as I stand my watch on Moon City's eastern walls, the wall of gray fog unmoving beyond and the perpetual lightning flickering above — I was raised to this vigil under the High Priest Nim, and now I am something our old rites have no name for. ${SCENE_CUE}`,
    pathwayAffinity: [5],
    seeds: {
      trackedAllies: ["Nim"],
      facts: [
        "You keep Moon City's watch on the gray fog in the Forsaken Land, serving under the High Priest Nim; he knows your face among the fog-watch.",
      ],
    },
  },
] as const;

// ── Earlier-epoch archetypes (world build-out 12, issue #141) ──
// Starts embedded in the named historical eras, each `epoch`-tagged (3-4) so
// they surface only for a character of that epoch and never leak into the Fifth.
// Their circle/grounding ties to a historical figure authored in `history.ts`
// (HISTORICAL_LORE) — a distant sovereign served, not a travelling companion, so
// no `trackedAllies` are seeded. Canon has no named First/Second-Epoch mortals to
// build a personal circle on, so the earliest of these is the Third Epoch.
const EARLIER_EPOCH_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "sun-god-crusader",
    label: "A crusader of the Ancient Sun God",
    epoch: 3,
    location: "a war-camp of the uprising",
    relationship: "subordinate",
    circleNpcs: ["Grisha"],
    blurb:
      "A soldier of the one faith in the Glorious Era, sworn to the Ancient Sun God.",
    openingBeat: `The strange draught still burns in me as I take my place among the host's prayer-fires, the banners of the one faith snapping overhead and the field-temple of the Ancient Sun God bright at the camp's heart — I march as the least of the faithful, and whatever I have just become, it must look like nothing more than the god's blessing. ${SCENE_CUE}`,
    pathwayAffinity: [3],
    seeds: {
      facts: [
        "You march with the crusading host of the Ancient Sun God in the Third Epoch's Glorious Era, one of countless faithful sworn to the one god.",
      ],
    },
  },
  {
    id: "solomon-empire-legionary",
    label: "A legionary of the Solomon Empire",
    epoch: 4,
    location: "the outskirts of the Solomon Empire's capital",
    relationship: "subordinate",
    circleNpcs: ["Solomon"],
    blurb:
      "A soldier under the Black Emperor's banner in the god-empire of the Fourth Epoch.",
    openingBeat: `The strange draught still burns in me as I stand among the ranks at the gates of Saint Millom, the Solomon Empire's black capital, where the Black Emperor's word is law and his war upon the gods never ends — I am one spear among thousands, and whatever I have just become, none of my officers must ever see it. ${SCENE_CUE}`,
    pathwayAffinity: [13],
    seeds: {
      facts: [
        "You serve in the legions of the Solomon Empire under the distant sovereignty of the Black Emperor; you are a face in his vast god-empire, not a confidant.",
      ],
    },
  },
] as const;

// ── Feysac / Feynapotter-region archetypes (world build-out 7, issue #136) ──
// A Combat-church squire in the militarist north (Feysac is a real travel
// region) and a Knowledge-faith acolyte in Lenburg (an off-map nation — the map
// shows the neutral "uncertain" atlas until first travel, the Stoen pattern).
const FEYSAC_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "feysac-combat-squire",
    label: "A squire of the Church of the God of Combat",
    epoch: 5,
    location: "Feysac Empire",
    relationship: "subordinate",
    circleNpcs: ["Larrion"],
    affiliationOrg: "combat-church-overview",
    blurb:
      "A sworn squire of the war-faith in the militarist Feysac Empire, serving under the Chief Shepherd Larrion.",
    openingBeat: `The strange draught still burns in me as I stand in the cold shadow of the Great Twilight Hall outside Saint Millom, my training-blade heavy at my side — I am the lowest squire of the war-faith, sworn under the Chief Shepherd Larrion, and whatever I have just become, the brothers who prize only honest strength must never learn of it. ${SCENE_CUE}`,
    pathwayAffinity: [11],
    seeds: {
      society: { orgSlug: "combat-church-overview", role: "squire" },
      facts: [
        "You are a sworn squire of the Church of the God of Combat in the Feysac Empire, serving under the Chief Shepherd Larrion among the war-faith's brothers.",
      ],
    },
  },
  {
    id: "lenburg-knowledge-acolyte",
    label: "An acolyte of the Holy Temple of Knowledge in Lenburg",
    epoch: 5,
    location: "Lenburg",
    relationship: "subordinate",
    circleNpcs: ["Edwina Edwards"],
    affiliationOrg: "knowledge-church-overview",
    blurb:
      "A junior scholar of the Church of Knowledge in Azshara, under the Lenburg-born archbishop Edwina Edwards.",
    openingBeat: `The strange draught still burns in me as I shelve a stack of brass-clasped tomes in the Holy Temple of Knowledge at Azshara, the seat of the faith that rules Lenburg — I answer to the authority of the archbishop Edwina Edwards, and in a realm of endless examinations a secret is the one thing that cannot be filed away, so what I have just become I must keep off every ledger. ${SCENE_CUE}`,
    pathwayAffinity: [10],
    seeds: {
      society: { orgSlug: "knowledge-church-overview", role: "acolyte" },
      facts: [
        "You serve as a junior acolyte of the Church of the God of Knowledge and Wisdom at the Holy Temple of Knowledge in Azshara, Lenburg, under the authority of the Lenburg-born archbishop Edwina Edwards.",
      ],
    },
  },
] as const;

// ── Rorsted Archipelago archetypes (world build-out 8, issue #137) ──
// Begin embedded in a circle of the Loen Kingdom's Sonia Sea colony: an initiate
// of the outlawed native sea-god faith (tied to the secret merchant-devotee
// Ralph), and a crewmember of a treasure-seeking privateer fleet (tied to the
// Golden Dream boatswain Danitz Dubois). Both open in Bayam, a real travel city.
const RORSTED_ARCHETYPES: readonly StartArchetype[] = [
  {
    id: "bayam-sea-god-acolyte",
    label: "An initiate of the outlawed sea-god faith in Bayam",
    epoch: 5,
    location: "Bayam",
    relationship: "subordinate",
    circleNpcs: ["Ralph"],
    affiliationOrg: "sea-god-faith-overview",
    blurb:
      "A native initiate of the hunted Sea-God faith, brought into the fold by the merchant-devotee Ralph in colonial Bayam.",
    openingBeat: `The strange draught still burns in me as I keep the curfew in a back-street shrine above Bayam's harbour, the salt-spice dark pressing close and a charm of the old sea-god cool in my fist — Ralph, the trader who brought me to the faith, vouches for me among the islanders, and whatever I have just become, the storm-priests who hunt heretics must never learn of it. ${SCENE_CUE}`,
    pathwayAffinity: [6],
    seeds: {
      trackedAllies: ["Ralph"],
      society: { orgSlug: "sea-god-faith-overview", role: "initiate" },
      facts: [
        "You are a native initiate of the outlawed Sea-God faith in Bayam, brought into it by the half-native merchant Ralph, who funds the islanders' Resistance from behind his respectable trading company.",
      ],
    },
  },
  {
    id: "bayam-golden-dream-privateer",
    label: "A crewmember of the Golden Dream privateer fleet",
    epoch: 5,
    location: "Bayam",
    relationship: "circle-member",
    circleNpcs: ["Danitz Dubois"],
    blurb:
      "A hand aboard Vice Admiral Iceberg's treasure-seeking fleet, signed on through the boatswain Danitz Dubois in the bars of Bayam.",
    openingBeat: `The strange draught still burns in me as the harbour bars of Bayam roar behind us and the dark island sea breathes ahead, my sea-bag over my shoulder and a berth on a famous treasure-fleet waiting — the boatswain Danitz Dubois clapped me aboard on his own word, and whatever I have just become out here among the salt and the rumour, I must keep it from every soul on the crew. ${SCENE_CUE}`,
    pathwayAffinity: [6],
    seeds: {
      trackedAllies: ["Danitz Dubois"],
      facts: [
        "You crew for the Golden Dream, the treasure-seeking pirate fleet of Vice Admiral Iceberg (Edwina Edwards), signed on through the boatswain Danitz Dubois, who knows your face in Bayam's harbour.",
      ],
    },
  },
] as const;

/** Every start archetype, all regions/epochs (append-only) — including gated
 * ORIGIN archetypes (so `getStartArchetype` resolves them by id). Default
 * selection filters origins out; `forsakenLandArchetypesForEpoch` filters in. */
export const START_ARCHETYPES: readonly StartArchetype[] = [
  ...TINGEN_ARCHETYPES,
  ...BACKLUND_ARCHETYPES,
  ...LOEN_ARCHETYPES,
  ...INTIS_ARCHETYPES,
  ...FORSAKEN_ARCHETYPES,
  ...EARLIER_EPOCH_ARCHETYPES,
  ...FEYSAC_ARCHETYPES,
  ...RORSTED_ARCHETYPES,
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
  // Both the Fifth-Epoch NPC roster and the named historical figures
  // (`history.ts`, issue #141) are eligible, each epoch-gated, so an earlier-
  // epoch custom circle is offered its era's faces, not Fifth-Epoch ones.
  for (const entry of [...NPC_LORE, ...HISTORICAL_LORE]) {
    if (entry.epoch === undefined || entry.epoch === id) {
      for (const name of entry.npcs) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
