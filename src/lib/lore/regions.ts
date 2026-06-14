import type { LoreEntry } from "./types";

// Farther Fifth-Epoch regions beyond the four hub cities (varied story
// openings). Each is a first-class start location and travel destination, so it
// carries a player-safe overview the same way the city files do. Grounded in
// the LOTM source: Pritz Harbor (the Loen navy's chief port below the Hornacis
// range), Enmat Harbor (a small fog-bound Loen coastal town), and Feysac (the
// militarist northern empire of the God of Combat). Tagged `epoch: 5`; the
// `city` field is the lowercase leading word so selection/narration/travel all
// agree on the place.
export const REGIONS_LORE: LoreEntry[] = [
  {
    slug: "pritz-harbor-overview",
    title: "Pritz Harbor — Overview",
    category: "location",
    content: `Pritz Harbor is the Loen Kingdom's chief naval port, set on the cold northern coast below the Hornacis mountain range that walls Loen off from the Feysac Empire. It is a working navy town before it is anything else: dry-docks and shipyards, powder magazines and victualling yards, ironclads and gunboats riding at anchor in a grey, fog-bound roadstead, and streets full of sailors, marines, and the families that supply them. The Hornacis passes at its back are a smuggler's country and a monster's country both, so the garrison is heavy and the night watch real. For the Beyonder world the harbour matters as a chokepoint: contraband curios, sealed artifacts, and people who would rather not be noticed all move through a port this busy, and the Church of the Lord of Storms keeps a watchful presence over a town that lives and dies by the sea's temper.`,
    epoch: 5,
    city: "pritz",
    npcs: [],
    sequences: [],
    tags: ["geography", "setting", "loen-kingdom", "port", "navy", "fifth-epoch"],
    tokenCount: 180,
    narratorOnly: false,
  },
  {
    slug: "enmat-harbor-overview",
    title: "Enmat Harbor — Overview",
    category: "location",
    content: `Enmat Harbor is a small coastal town of the Loen Kingdom — a huddle of fishing boats, net-lofts, and lamplit lanes that the sea-fog swallows most nights of the year. It is the kind of place where everyone knows everyone, strangers are counted, and the old sea-superstitions are kept up in earnest: charms nailed over doorways, names not spoken after dark, a wary respect for what the tide brings in. Industry has barely touched it; the rhythm of the town is the rhythm of the boats. That quiet is exactly why it draws the Beyonder world's quieter business — a smuggler's landing, a cult that wants no neighbours, a thing that came ashore and did not leave. The fog that hides the fishermen's morning hides a great deal else, and the nearest real authority is a long, cold road away.`,
    epoch: 5,
    city: "enmat",
    npcs: [],
    sequences: [],
    tags: ["geography", "setting", "loen-kingdom", "coastal-town", "fifth-epoch"],
    tokenCount: 175,
    narratorOnly: false,
  },
  {
    slug: "feysac-overview",
    title: "Feysac Empire — Overview",
    category: "location",
    content: `The Feysac Empire is the great northern power of the continent, a cold, mountainous, militarist state whose dominant faith is the Church of the God of Combat. Where Loen runs on ledgers and Intis on ideals, Feysac runs on discipline, martial honour, and devotion: its nobility are warriors, its commoners are hardy, and strength openly commands respect. The climate is harsh and the frontier is dangerous — long winters, walled towns, and wild lands beyond them where evil spirits, mutated beasts, and monsters press in often enough that a town keeps its militia drilled and its walls manned. Beyonders are understood here through a martial lens: the God of Combat's faithful prize ferocity and the test of battle, and a newly-changed Beyonder in Feysac learns quickly that power is admired but also measured, and that the Church does not look kindly on the kind it cannot account for.`,
    epoch: 5,
    city: "feysac",
    npcs: [],
    sequences: [],
    tags: ["geography", "setting", "feysac-empire", "god-of-combat", "fifth-epoch"],
    tokenCount: 195,
    narratorOnly: false,
  },
];
