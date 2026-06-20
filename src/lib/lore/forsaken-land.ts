import type { LoreEntry } from "./types";

// ---------------------------------------------------------------------------
// Forsaken Land of the Gods — the sealed Eastern Continent (world build-out 3,
// issue #132). Content + activation for the access-gated continent #130 wired in.
// ---------------------------------------------------------------------------
//
// Canon (verified against corpus/wiki): the Forsaken Land is the desolate
// Eastern Continent, split from the world at the END OF THE THIRD EPOCH (the
// fall of the Ancient Sun God), sealed behind the Sea of Ruins. Its only
// entrance is the shadow of Giant King's Court in the Dream World (the gate
// reopened in 1351); its far eastern edge is a gray-fog barrier toward the
// sealed Western Continent. The City of Silver (former Kingdom of Silver) lives
// under perpetual lightning — active by day, slowing at night.
//
// LEAK CONTROL (issue #132): the PLAYABLE PRESENT is tagged `epoch: 5`, the
// Third-Epoch fall is kept SEPARATE as `epoch: 3` history (never mixed on one
// entry — `passesEpochGate` is exact-match). Every present-day entry is
// CITY-KEYED (`city: "silver" | "giant"`, the leading word of its location
// string) so `selectCuratedLore` only ever injects it for a character actually
// THERE — and reaching the City of Silver / Giant King's Court requires the
// `dream-world-passage` flag (#130). A central-continent character therefore
// never receives any of it. Deep/spoiler facts are additionally `narratorOnly`
// + `sequences`-gated so they unlock only as a resident grows in power. No
// `metaphysics`/epoch-setting entry is created here — that would inject into
// every Fifth-Epoch prompt and leak the continent to the mainland.

export const FORSAKEN_LAND_LORE: LoreEntry[] = [
  // ── City of Silver (former Kingdom of Silver) — the inhabited heart. ──
  {
    slug: "city-of-silver-overview",
    title: "The City of Silver — Overview",
    category: "location",
    content: `The City of Silver is the last living city of the Forsaken Land of the Gods, the desolate Eastern Continent that was torn from the world long ago and sealed away. Once the seat of the Kingdom of Silver, it now stands alone under a sky that never clears: a grey, ash-lit sprawl of old grey-white stone, narrow streets, and high lightning-rods, ringed by dead country no one crosses. Its people are the descendants of those abandoned here when the continent fell — proud, devout, and inward-looking, keeping the rites of a faith the rest of the world has forgotten. They do not expect rescue and no longer want it; the City endures by its own discipline, its Silver Knights, and the grim certainty that beyond its walls there is nothing but ruin and the sealing sea. To a newcomer it is beautiful and terrible at once, a place that has made its peace with the end of everything.`,
    epoch: 5,
    city: "silver",
    npcs: [],
    sequences: [],
    tags: ["forsaken-land", "city-of-silver", "geography", "fifth-epoch"],
    tokenCount: 200,
    narratorOnly: false,
  },
  {
    slug: "city-of-silver-perpetual-lightning",
    title: "The City of Silver — The Perpetual Lightning",
    category: "location",
    content: `The defining curse and clock of the City of Silver is its sky of perpetual lightning. By day the storm overhead is fierce and ceaseless — chains of white fire walking the clouds, thunder that never fully stops, the air sharp with the smell of scorched stone. By night the lightning slows, dimming to a restless flicker on the horizon, and only then do the people move freely through the upper streets. Life is built around this rhythm: tall iron rods and grounded copper lattices crown every quarter, the great houses sit low and shielded, and the day is for shelter and work indoors while the night is for travel, market, and watch. The lightning is more than weather — the devout call it the lingering wrath left when the god fell, and to be caught exposed under the noon storm is to invite a death the City treats as judgement.`,
    epoch: 5,
    city: "silver",
    npcs: [],
    sequences: [],
    tags: ["forsaken-land", "city-of-silver", "lightning", "fifth-epoch"],
    tokenCount: 200,
    narratorOnly: false,
  },
  {
    slug: "city-of-silver-society",
    title: "The City of Silver — The Abandoned Faithful",
    category: "location",
    content: `Silver society is a closed order shaped by centuries of isolation. At its head stand the keepers of the old faith and the Silver Knights — a martial order, part guard and part priesthood, who patrol the night streets, hold the walls against what the dead land sends, and enforce the City's strict observances. Below them the houses and guilds keep the lightning-craft, the foundries, and the rationed fields under their shielded glass. Strangers are almost unknown, so an outsider is marked at once: watched, questioned, and judged against rites they do not know. Yet the City is not cruel for its own sake — it is a people determined to remain people in a place the world wrote off, holding to memory, lineage, and duty as the only walls that have never fallen. Ambition here is measured in standing within the order, and the surest path to belonging is to take up the night-watch yourself.`,
    epoch: 5,
    city: "silver",
    npcs: [],
    sequences: [],
    tags: ["forsaken-land", "city-of-silver", "silver-knights", "society", "fifth-epoch"],
    tokenCount: 210,
    narratorOnly: false,
  },
  // ── Giant King's Court — the seat, and the only way in. ──
  {
    slug: "giant-kings-court-overview",
    title: "Giant King's Court — Overview",
    category: "location",
    content: `Giant King's Court is the other great site of the Forsaken Land: the ruined seat of a Giant King from the elder ages, a hall built to a scale no human raised, its broken colonnades and titan-sized thrones half-swallowed by the dead grey country east of the City of Silver. By day it lies empty under the same walking lightning; by night the City's expeditions and the devout come to it warily, for the Court is reckoned a holy and dangerous place — the point where the sealed continent presses closest against the wider world. Its real importance is not its stone but its shadow: in the Dream World, the Court is the single doorway through which the Forsaken Land can still be entered or left at all. Those who keep the City's deepest secrets guard what that means, and most who walk the Court's floor never learn it.`,
    epoch: 5,
    city: "giant",
    npcs: [],
    sequences: [],
    tags: ["forsaken-land", "giant-kings-court", "geography", "fifth-epoch"],
    tokenCount: 200,
    narratorOnly: false,
  },
  {
    slug: "giant-kings-court-dream-gate",
    title: "Giant King's Court — The Dream-World Gate",
    category: "location",
    content: `The Forsaken Land has no ordinary road in or out: the Sea of Ruins seals it on every coast. The sole passage is the shadow of Giant King's Court in the Dream World — a threshold reached not by ship but by crossing into dream and finding the Court's reflection there, which opens onto the sealed continent and back again. The gate was shut for ages and reopened in the year 1351; since then a precious few have come and gone by it. To use it is to hold the rarest of capabilities, and those who possess it can move between the Forsaken Land and the wider world where no vessel could. The City's keepers treat the dream-passage as their most guarded knowledge, for it is at once their last tie to the world and the one door through which the world might reach them.`,
    epoch: 5,
    city: "giant",
    npcs: [],
    sequences: [4],
    tags: ["forsaken-land", "giant-kings-court", "dream-world", "secret", "fifth-epoch"],
    tokenCount: 195,
    narratorOnly: true,
  },
  // ── The seals at the continent's edges. ──
  {
    slug: "forsaken-land-sea-of-ruins",
    title: "The Sea of Ruins",
    category: "location",
    content: `The Sea of Ruins is the drowned, debris-choked ocean that walls the Forsaken Land away from the rest of the world. It is not a sea that can be sailed: its waters are wreck-strewn and wrong, swallowing any vessel that tries the crossing and turning back even the strongest Beyonders who attempt it by force. Together with the perpetual storm overhead, the Sea is why the Eastern Continent is "sealed" — why no fleet has ever reached the City of Silver and why its people gave up on rescue generations ago. The City's scholars hold that the Sea was made by the same catastrophe that sundered the continent, a barrier as much metaphysical as physical. The only way past it is not across but through the Dream World, by the shadow of Giant King's Court.`,
    epoch: 5,
    city: "silver",
    npcs: [],
    sequences: [],
    tags: ["forsaken-land", "sea-of-ruins", "barrier", "geography", "fifth-epoch"],
    tokenCount: 185,
    narratorOnly: false,
  },
  {
    slug: "forsaken-land-eastern-grayfog",
    title: "The Forsaken Land — The Gray-Fog Eastern Edge",
    category: "location",
    content: `At the far eastern rim of the Forsaken Land the dead country ends in a wall of unmoving gray fog — the same dread, world-ending barrier that the elders of other lands speak of in their oldest fears. Beyond it, the City's deepest lore holds, lies the sealed Western Continent, another place cut off from the world; the gray fog is the seam between two sealings. The fog does not drift and cannot be safely entered: those who walk in do not return, and the City forbids approach to its edge. For most of the abandoned faithful it is simply the eastern end of the world, a grey nothing to be left alone. For the few who understand what it borders, it is a reminder that the Forsaken Land is not the only continent the world has shut away.`,
    epoch: 5,
    city: "silver",
    npcs: [],
    sequences: [4],
    tags: ["forsaken-land", "gray-fog", "western-continent", "barrier", "fifth-epoch"],
    tokenCount: 185,
    narratorOnly: true,
  },
  // ── Third-Epoch HISTORY — kept strictly separate (epoch: 3). ──
  {
    slug: "forsaken-land-sundering",
    title: "The Sundering of the Eastern Continent",
    category: "event",
    content: `The Forsaken Land of the Gods was made at the end of the Third Epoch, when the Ancient Sun God — the human who had slain the Ancient Gods and reigned as the sole Orthodox God — was betrayed and brought down by his own lieutenants. In the cataclysm of his fall the Eastern Continent, heart of his dominion, was torn from the world: its sky set alight with a lightning that would never end, its seas turned to the impassable Sea of Ruins, its faithful abandoned where they stood. What had been the centre of a god's empire became a sealed and sunless land, left to keep a penance for a god who would not return. The rest of the world moved on into the Fourth Epoch and then the Fifth; the Eastern Continent simply stopped, holding the shape of the moment it was forsaken.`,
    epoch: 3,
    npcs: [],
    sequences: [],
    tags: ["forsaken-land", "ancient-sun-god", "third-epoch", "history", "sundering"],
    tokenCount: 195,
    narratorOnly: true,
  },
];
