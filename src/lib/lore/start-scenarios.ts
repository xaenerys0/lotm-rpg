// ---------------------------------------------------------------------------
// Varied story openings (start scenarios)
// ---------------------------------------------------------------------------
//
// A fresh chronicle no longer always opens in the same place with the same
// line. Each epoch carries a POOL of start scenarios; `selectStartScenario`
// draws one at random (uniformly — pathway does NOT bias the start; any
// "preferred start" would be an explicit future player choice, not automatic),
// so two characters of the same epoch can wake in different cities and read a
// different opening beat. The Fifth Epoch is populated richly (multiple cities
// and several distinct scenes per city, plus a few farther canon regions);
// earlier epochs each derive their single canonical start from `EPOCHS` so the
// prose never drifts, and gain their own scenarios as the lore database grows.
//
// A scenario only carries the prose the first turn needs: the `location` string
// written to `GameState.location`, and the `openingBeat` — the first-turn seed
// action. Like every epoch beat, the beat continues from the prologue's final
// moment (drinking the potion) and never names the character's pathway, so the
// chronicle opens on a scene rather than an out-of-character announcement. The
// `blurb` is player-safe street-level flavour, ready for a future "choose your
// start" picker and the map/journal.

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
  /** One-line player-safe public blurb (for a future picker / the journal). */
  blurb: string;
  /** The first-turn seed action — an awakening beat continuing from the potion,
   * never naming the pathway, ending with the narrator's scene+choices cue. */
  openingBeat: string;
}

/** The standard closing cue every opening beat shares. */
const SCENE_CUE = "Describe the opening scene and give me choices.";

// ── Fifth Epoch — the rich pool (the most furnished setting). ──────────────
//
// Variety along two axes: WHERE (Tingen, Backlund, Trier, Bayam, plus the
// farther canon regions Pritz Harbor, Enmat Harbor, and Feysac) and the SCENE
// itself (same place, different awakening).
const FIFTH_EPOCH_STARTS: readonly StartScenario[] = [
  {
    id: "tingen-fog",
    epoch: 5,
    location: "Tingen City",
    blurb: "Gaslit fog and coal smoke in the industrial Awwa region of Loen.",
    openingBeat: `The strange potion still burns on my tongue as I move through Tingen City's gaslit fog, certain of only one thing: whatever I have just become, I must keep it hidden. ${SCENE_CUE}`,
  },
  {
    id: "tingen-garret",
    epoch: 5,
    location: "Tingen City",
    blurb: "A rented garret above the rooftops of Tingen.",
    openingBeat: `I come back to myself in a cold rented garret, the empty vial still in my hand and the change settling into my blood; through the grimy window Tingen's chimneys exhale into the dawn. ${SCENE_CUE}`,
  },
  {
    id: "tingen-factory-row",
    epoch: 5,
    location: "Tingen City",
    blurb: "The factory rows of Tingen at the change of shift.",
    openingBeat: `The shift whistle is still dying away when the potion takes hold, and I steady myself against a soot-black factory wall as the crowd of Tingen workers streams past, none of them seeing what is happening to me. ${SCENE_CUE}`,
  },
  {
    id: "backlund-dust",
    epoch: 5,
    location: "Backlund",
    blurb: "The smog-bound capital of Loen, the City of Dust.",
    openingBeat: `I step down from a steam tram into Backlund's soot-yellow fog, the capital roaring around me, just as the potion finishes its work and the City of Dust seems suddenly, terribly awake to me. ${SCENE_CUE}`,
  },
  {
    id: "backlund-cemetery",
    epoch: 5,
    location: "Backlund",
    blurb: "A fog-wrapped Backlund cemetery at dusk.",
    openingBeat: `Dusk thickens the fog among the headstones of a Backlund cemetery as the change takes me, and the silence between the graves is no longer quite empty. ${SCENE_CUE}`,
  },
  {
    id: "trier-dawn",
    epoch: 5,
    location: "Trier",
    blurb: "The sunlit, revolutionary capital of the Intis Republic.",
    openingBeat: `Dawn bells ring over Trier's golden boulevards and the potion blooms warm and strange inside me, the sunlit capital of the Republic going about its morning as though the world had not just changed. ${SCENE_CUE}`,
  },
  {
    id: "bayam-docks",
    epoch: 5,
    location: "Bayam",
    blurb: "The salt-and-spice colonial port of the Rorsted Archipelago.",
    openingBeat: `Salt and spice and tar fill my lungs on the Bayam docks as the potion settles, the harbour bars loud behind me and the dark island sea breathing in front, and I know I must not let anyone see. ${SCENE_CUE}`,
  },
  {
    id: "pritz-harbor",
    epoch: 5,
    location: "Pritz Harbor",
    blurb: "Loen's chief naval port beneath the Hornacis range, all fog and warships.",
    openingBeat: `Fog rolls off the grey water of Pritz Harbor and gulls cry over the anchored warships as the change finishes in me, the Hornacis peaks a dark wall to the north and a navy town waking all around. ${SCENE_CUE}`,
  },
  {
    id: "enmat-harbor",
    epoch: 5,
    location: "Enmat Harbor",
    blurb: "A small, fog-drowned Loen coastal town of fishing boats and lamplight.",
    openingBeat: `Lamplight smears across wet cobbles in the little coastal town of Enmat Harbor as the potion takes hold, the fishing boats creaking at their moorings and the sea-fog pressing close enough to hide whatever I have become. ${SCENE_CUE}`,
  },
  {
    id: "feysac-frontier",
    epoch: 5,
    location: "Feysac",
    blurb: "The frozen militarist empire of the God of Combat, harsh and devout.",
    openingBeat: `My breath steams in the bitter cold of a Feysac frontier town as the potion burns through me, soldiers of the God of Combat drilling in the frozen square and the northern wilds — and whatever stalks them — pressing at the walls. ${SCENE_CUE}`,
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
}));

/** Every start scenario, all epochs. */
export const START_SCENARIOS: readonly StartScenario[] = [
  ...FIFTH_EPOCH_STARTS,
  ...EARLIER_EPOCH_STARTS,
];

/**
 * The start scenarios for a character's epoch. Resolves the epoch the same way
 * the rest of the codebase does (`getEpoch` → unknown/undefined falls back to
 * the Fifth), so the pool is always non-empty.
 */
export function startScenariosForEpoch(epoch: number | undefined): StartScenario[] {
  const id = getEpoch(epoch).id;
  return START_SCENARIOS.filter((s) => s.epoch === id);
}

/**
 * Pick one start scenario for a fresh character of this epoch, uniformly at
 * random. Pathway is intentionally NOT a factor. Pure and deterministic under
 * the injected `random` (default `Math.random`), so it is fully testable; the
 * pool is guaranteed non-empty (every epoch has at least one start), so this
 * always returns a scenario.
 */
export function selectStartScenario(
  epoch: number | undefined,
  random: () => number = Math.random,
): StartScenario {
  const pool = startScenariosForEpoch(epoch);
  // `random()` is in [0, 1); clamp the rare exact-1 case to the last index.
  const idx = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[idx]!;
}

/** Look up a start scenario by id, or `undefined` if none matches. */
export function getStartScenario(id: string): StartScenario | undefined {
  return START_SCENARIOS.find((s) => s.id === id);
}
