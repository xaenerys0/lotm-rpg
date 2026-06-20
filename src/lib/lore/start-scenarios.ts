// ---------------------------------------------------------------------------
// Varied story openings (start scenarios)
// ---------------------------------------------------------------------------
//
// A fresh chronicle no longer always opens in the same place with the same
// line. Each epoch carries a POOL of start scenarios. By default the engine
// draws one at random (uniformly — pathway does NOT bias the random draw), so
// two characters of the same epoch can wake in different cities and read a
// different opening beat. The player may instead pick a PREFERRED starting
// location at character creation ("Surprise me" keeps it random); the picker
// surfaces, per scenario, which pathways a place thematically suits
// (`pathwayAffinity`) as a suggestion only — it never auto-selects.
//
// The Fifth Epoch is populated richly: multiple cities (Tingen/Backlund/Trier/
// Bayam) AND several distinct opening scenes per place, plus the farther canon
// regions Pritz Harbor, Enmat Harbor, and Feysac — each a first-class travel
// city with map + glossary + curated lore. Earlier epochs each derive their
// single canonical start from `EPOCHS` so the prose never drifts, and gain
// their own scenarios as the lore database grows.
//
// A scenario carries the prose the first turn needs: the `location` string
// written to `GameState.location`, and the `openingBeat` — the first-turn seed
// action. Like every epoch beat, the beat continues from the prologue's final
// moment (drinking the potion) and never names the character's pathway. The
// `blurb` is player-safe street-level flavour for the picker / the map.

import { DEFAULT_EPOCH_ID, EPOCHS, getEpoch } from "./epochs";

export interface StartScenario {
  /** Stable id (`<place>-<scene>` for the Fifth; `epoch-<id>-default` for the
   * derived earlier-epoch starts). */
  id: string;
  /** Epoch this start belongs to — gated exactly like every other epoch datum. */
  epoch: number;
  /** Value written to `GameState.location`. A clean place name whose leading
   * word keys `cityNarrationDirective` and the curated-lore city heuristic. */
  location: string;
  /** One-line player-safe public blurb (for the picker / the journal). */
  blurb: string;
  /** The first-turn seed action — an awakening beat continuing from the potion,
   * never naming the pathway, ending with the narrator's scene+choices cue. */
  openingBeat: string;
  /** Pathway ids this place thematically SUITS — surfaced as a suggestion in
   * the start picker only. It never biases the random draw. Empty/absent = a
   * neutral start that suits no pathway in particular. */
  pathwayAffinity?: readonly number[];
  /**
   * Marks an ORIGIN start in an access-gated continent (world build-out 3,
   * issue #132) — e.g. `"forsaken-land"`. Origin scenarios are EXCLUDED from the
   * default picker and the random "Surprise me" draw (`startScenariosForEpoch`
   * filters them out); they surface only behind the explicit "choose an origin"
   * affordance (`forsakenLandStartsForEpoch`). Choosing one seeds the matching
   * `accessFlags` + `currentCity` in `createDefaultGameState`. Absent = an
   * ordinary central-continent start.
   */
  origin?: "forsaken-land";
}

/** A distinct starting place for the picker, aggregated over its scenarios. */
export interface StartLocationOption {
  /** The `GameState.location` value (and picker value). */
  location: string;
  /** A representative player-safe blurb (the first scenario's). */
  blurb: string;
  /** Pathway ids any of this place's scenarios suit (deduped, ascending). */
  pathwayAffinity: number[];
  /** How many distinct opening scenes this place offers. */
  sceneCount: number;
}

/** The standard closing cue every opening beat shares. */
const SCENE_CUE = "Describe the opening scene and give me choices.";

// ── Fifth Epoch — the rich pool (the most furnished setting). ──────────────
//
// Variety along two axes: WHERE (Tingen, Backlund, Trier, Bayam, plus the
// farther canon regions Pritz Harbor, Enmat Harbor, and Feysac) and the SCENE
// itself (same place, different awakening). `pathwayAffinity` is a thematic
// suggestion surfaced by the picker — never an automatic bias.
const FIFTH_EPOCH_STARTS: readonly StartScenario[] = [
  {
    id: "tingen-fog",
    epoch: 5,
    location: "Tingen City",
    blurb: "Gaslit fog and coal smoke in the industrial Awwa region of Loen.",
    openingBeat: `The strange potion still burns on my tongue as I move through Tingen City's gaslit fog, certain of only one thing: whatever I have just become, I must keep it hidden. ${SCENE_CUE}`,
    pathwayAffinity: [],
  },
  {
    id: "tingen-garret",
    epoch: 5,
    location: "Tingen City",
    blurb: "A rented garret above the rooftops of Tingen.",
    openingBeat: `I come back to myself in a cold rented garret, the empty vial still in my hand and the change settling into my blood; through the grimy window Tingen's chimneys exhale into the dawn. ${SCENE_CUE}`,
    pathwayAffinity: [],
  },
  {
    id: "tingen-factory-row",
    epoch: 5,
    location: "Tingen City",
    blurb: "The factory rows of Tingen at the change of shift.",
    openingBeat: `The shift whistle is still dying away when the potion takes hold, and I steady myself against a soot-black factory wall as the crowd of Tingen workers streams past, none of them seeing what is happening to me. ${SCENE_CUE}`,
    pathwayAffinity: [],
  },
  {
    id: "backlund-dust",
    epoch: 5,
    location: "Backlund",
    blurb: "The smog-bound capital of Loen, the City of Dust.",
    openingBeat: `I step down from a steam tram into Backlund's soot-yellow fog, the capital roaring around me, just as the potion finishes its work and the City of Dust seems suddenly, terribly awake to me. ${SCENE_CUE}`,
    pathwayAffinity: [1, 8],
  },
  {
    id: "backlund-cemetery",
    epoch: 5,
    location: "Backlund",
    blurb: "A fog-wrapped Backlund cemetery at dusk.",
    openingBeat: `Dusk thickens the fog among the headstones of a Backlund cemetery as the change takes me, and the silence between the graves is no longer quite empty. ${SCENE_CUE}`,
    pathwayAffinity: [4, 9],
  },
  {
    id: "trier-dawn",
    epoch: 5,
    location: "Trier",
    blurb: "The sunlit, revolutionary capital of the Intis Republic.",
    openingBeat: `Dawn bells ring over Trier's golden boulevards and the potion blooms warm and strange inside me, the sunlit capital of the Republic going about its morning as though the world had not just changed. ${SCENE_CUE}`,
    pathwayAffinity: [2, 3],
  },
  {
    id: "bayam-docks",
    epoch: 5,
    location: "Bayam",
    blurb: "The salt-and-spice colonial port of the Rorsted Archipelago.",
    openingBeat: `Salt and spice and tar fill my lungs on the Bayam docks as the potion settles, the harbour bars loud behind me and the dark island sea breathing in front, and I know I must not let anyone see. ${SCENE_CUE}`,
    pathwayAffinity: [6, 8],
  },
  {
    id: "pritz-harbor",
    epoch: 5,
    location: "Pritz Harbor",
    blurb: "Loen's chief naval port beneath the Hornacis range, all fog and warships.",
    openingBeat: `Fog rolls off the grey water of Pritz Harbor and gulls cry over the anchored warships as the change finishes in me, the Hornacis peaks a dark wall to the north and a navy town waking all around. ${SCENE_CUE}`,
    pathwayAffinity: [6, 7],
  },
  {
    id: "enmat-harbor",
    epoch: 5,
    location: "Enmat Harbor",
    blurb: "A small, fog-drowned Loen coastal town of fishing boats and lamplight.",
    openingBeat: `Lamplight smears across wet cobbles in the little coastal town of Enmat Harbor as the potion takes hold, the fishing boats creaking at their moorings and the sea-fog pressing close enough to hide whatever I have become. ${SCENE_CUE}`,
    pathwayAffinity: [4, 5],
  },
  {
    id: "feysac-frontier",
    epoch: 5,
    location: "Feysac",
    blurb: "The frozen militarist empire of the God of Combat, harsh and devout.",
    openingBeat: `My breath steams in the bitter cold of a Feysac frontier town as the potion burns through me, soldiers of the God of Combat drilling in the frozen square and the northern wilds — and whatever stalks them — pressing at the walls. ${SCENE_CUE}`,
    pathwayAffinity: [6],
  },
] as const;

// ── Origin starts in access-gated continents (issue #132). EXCLUDED from the
// default pool/picker; surfaced only behind the explicit "choose an origin"
// affordance. Choosing one seeds the continent's access flag + currentCity. ──
const ORIGIN_STARTS: readonly StartScenario[] = [
  {
    id: "forsaken-city-of-silver",
    epoch: 5,
    location: "Silver City",
    origin: "forsaken-land",
    blurb:
      "Born in the City of Silver — a surviving city of the sealed Forsaken Land of the Gods, under its perpetual lightning.",
    openingBeat: `The strange potion still burns on my tongue as the City of Silver's perpetual lightning walks the sky overhead; I have never known any world but this sealed continent, and now I am something new beneath its grey-white stone. ${SCENE_CUE}`,
    pathwayAffinity: [11],
  },
] as const;

// ── Earlier epochs (1-4) — one canonical start each, derived from EPOCHS. ──
//
// Kept in lockstep with the epoch definitions (no duplicated prose to drift).
// The Fifth is populated explicitly above; richer pools for the earlier epochs
// can be authored here as their lore deepens.
const EARLIER_EPOCH_STARTS: readonly StartScenario[] = EPOCHS.filter(
  (e) => e.id !== DEFAULT_EPOCH_ID,
).map((e) => ({
  id: `epoch-${e.id}-default`,
  epoch: e.id,
  location: e.startingLocation,
  blurb: e.summary,
  openingBeat: e.openingBeat,
  pathwayAffinity: [],
}));

/** Every start scenario, all epochs — including the gated ORIGIN starts (so
 * `getStartScenario` can resolve one by id). Default selection filters origins
 * out; `forsakenLandStartsForEpoch` filters them in. */
export const START_SCENARIOS: readonly StartScenario[] = [
  ...FIFTH_EPOCH_STARTS,
  ...ORIGIN_STARTS,
  ...EARLIER_EPOCH_STARTS,
];

/**
 * The DEFAULT start scenarios for a character's epoch — ordinary central-
 * continent starts only. Resolves the epoch the same way the rest of the
 * codebase does (`getEpoch` → unknown/undefined falls back to the Fifth), so the
 * pool is always non-empty. ORIGIN starts (issue #132) are excluded here so the
 * random "Surprise me" draw and the default location picker never land a player
 * in an access-gated continent; `forsakenLandStartsForEpoch` exposes those.
 */
export function startScenariosForEpoch(epoch: number | undefined): StartScenario[] {
  const id = getEpoch(epoch).id;
  return START_SCENARIOS.filter((s) => s.epoch === id && s.origin === undefined);
}

/**
 * The Forsaken-Land ORIGIN start scenarios for an epoch (issue #132) — surfaced
 * only behind the explicit "choose an origin" affordance in the picker, never in
 * the default pool. Empty for epochs with no origin starts authored.
 */
export function forsakenLandStartsForEpoch(epoch: number | undefined): StartScenario[] {
  const id = getEpoch(epoch).id;
  return START_SCENARIOS.filter((s) => s.epoch === id && s.origin === "forsaken-land");
}

/**
 * The distinct starting PLACES for an epoch, for the character-creation picker.
 * Scenarios that share a `location` collapse into one option whose
 * `pathwayAffinity` is the union of its scenarios' affinities and whose
 * `sceneCount` reports how many opening scenes that place offers. Order follows
 * first appearance in the pool.
 */
export function startLocationsForEpoch(epoch: number | undefined): StartLocationOption[] {
  const byLocation = new Map<string, StartLocationOption>();
  for (const s of startScenariosForEpoch(epoch)) {
    const existing = byLocation.get(s.location);
    if (existing) {
      existing.sceneCount += 1;
      for (const p of s.pathwayAffinity ?? []) {
        if (!existing.pathwayAffinity.includes(p)) existing.pathwayAffinity.push(p);
      }
    } else {
      byLocation.set(s.location, {
        location: s.location,
        blurb: s.blurb,
        pathwayAffinity: [...(s.pathwayAffinity ?? [])],
        sceneCount: 1,
      });
    }
  }
  for (const option of byLocation.values()) {
    option.pathwayAffinity.sort((a, b) => a - b);
  }
  return [...byLocation.values()];
}

/**
 * Pick one start scenario for a fresh character of this epoch, uniformly at
 * random. Pathway is intentionally NOT a factor. Pure and deterministic under
 * the injected `random` (default `Math.random`); the pool is guaranteed
 * non-empty (every epoch has at least one start), so this always returns one.
 */
export function selectStartScenario(
  epoch: number | undefined,
  random: () => number = Math.random,
): StartScenario {
  return pickFrom(startScenariosForEpoch(epoch), random);
}

/**
 * Pick a start scenario for a PREFERRED location (the player's choice in the
 * picker). The scene still varies — when a place has several opening scenes,
 * one is drawn at random among them. Falls back to a fully random epoch start
 * when the location names no scenario of this epoch (defence in depth).
 */
export function selectStartScenarioForLocation(
  epoch: number | undefined,
  location: string,
  random: () => number = Math.random,
): StartScenario {
  const pool = startScenariosForEpoch(epoch);
  const matches = pool.filter((s) => s.location === location);
  return pickFrom(matches.length > 0 ? matches : pool, random);
}

/** Look up a start scenario by id, or `undefined` if none matches. */
export function getStartScenario(id: string): StartScenario | undefined {
  return START_SCENARIOS.find((s) => s.id === id);
}

/** Uniform draw from a non-empty scenario list (clamps the rare random()===1). */
function pickFrom(pool: StartScenario[], random: () => number): StartScenario {
  const idx = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[idx]!;
}
