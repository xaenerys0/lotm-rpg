import type { LoreEntry } from "./types";

// World build-out 7 (issue #136) — the rest of the Northern Continent's great
// nations: the militarist Feysac Empire (deepening the existing `feysac` start
// region), the Feynapotter Kingdom, and the small Knowledge-faith states that
// broke from it (Lenburg, Masin, Segar). All Fifth-Epoch, `location`-category,
// player-safe surface geography (`narratorOnly: false`). Corpus-verified against
// corpus/wiki.
//
// City keys: Feysac is already a first-class travel region (`feysac`, regions.ts/
// #134), so its deepening keys to `feysac`. Feynapotter and the splinter-states
// are foreign nations, NOT wired into the travel/gazetteer model — they carry
// their own lore-only `city` keys (`feynapotter`/`lenburg`/`masin`/`segar`) so a
// character placed there (e.g. by a start archetype) draws their lore, with the
// neutral "uncertain" atlas until first travel (the off-map Stoen pattern, #134).
//
// CANON NOTE (corpus-verified; corpus outranks the issue/region hints): the
// Hornacis range is the Loen–Intis border range, NOT a Feysac range — Feysac is
// walled from Loen by Winter County's Amantha range and its own internal range is
// the Antares. The Church of the God of Combat governs the Twilight Giant Pathway
// (Death/Darkness incomplete); "Warrior"/"Hunter" are Twilight Giant SEQUENCE
// names (Seq 9 / Seq 4), not separate paths — see organizations.ts.

export const FEYSAC_LORE: LoreEntry[] = [
  {
    slug: "feysac-saint-millom",
    title: "Feysac Empire — Saint Millom, the Imperial Capital",
    category: "location",
    content: `Saint Millom is the capital of the Feysac Empire, a great cold coastal city on the Midseashire shore — lesser than Backlund, Trier, or Feynapotter City, but the militarist north's beating heart. It stands on the same ground where the Second Solomon Empire's capital once rose, ringed by thick forests and the coal and iron mines that feed the empire's foundries and guns, lashed by fierce North Sea winds and snowbound before October is out. At its centre is Aurmir Palace, the seat of the ruling Einhorn house, named — like so much in Feysac — for the Giant King Aurmir. Outside the walls looms the Great Twilight Hall, the Church of the God of Combat's headquarters, raised in the likeness of the Giant King's Court. The streets run to higher doorways and taller ceilings than a southerner expects, for this is a city where men claim the blood of giants, and where height itself is read as rank. To arrive in Saint Millom is to feel the whole weight of the warrior-north bearing down: disciplined, devout, and openly in love with strength.`,
    epoch: 5,
    city: "feysac",
    npcs: [],
    sequences: [],
    tags: ["feysac-empire", "saint-millom", "midseashire", "capital", "geography"],
    tokenCount: 250,
    narratorOnly: false,
  },
  {
    slug: "feysac-imperial-state",
    title: "Feysac Empire — The Einhorn Throne & the Warrior-State",
    category: "location",
    content: `The Feysac Empire is ruled by the Einhorn family, an angel house of the Red Priest Pathway that holds the throne from Aurmir Palace and commands the Sonia Sea Fleet, the imperial navy. The Einhorns founded the realm after the Trunsoest Empire fell, splitting the weakened north with the backing of the God of Combat, whose Church has been the empire's sole faith ever since — no other creed may preach here, and the Church itself polices every Beyonder incident. Status in Feysac is read first in height: the nobility and the military brass, claiming descent from giants through the Twilight Giant bloodline, routinely stand over two metres, and the brass are nobles or at least seasoned Beyonders. To Loen eyes the Feysacians are "northern barbarians" — boorish, hard-drinking (the Church itself sponsors the drink), their tongue the harsh Ancient Feysac. Beyond the walled towns and the internal Antares range lies a dangerous frontier of evil spirits and monsters that keeps every town's militia drilled, while across the seas the empire holds colonies on Sonia Island, the Gargas Archipelago, and the Balams. Its coin is the gold hoorn.`,
    epoch: 5,
    city: "feysac",
    npcs: ["Awatoma Einhorn"],
    sequences: [],
    tags: ["feysac-empire", "einhorn", "red-priest", "militarism", "geography"],
    tokenCount: 255,
    narratorOnly: false,
  },
  {
    slug: "feynapotter-kingdom",
    title: "The Feynapotter Kingdom",
    category: "location",
    content: `The Feynapotter Kingdom is the third-strongest nation of the Northern Continent, lying across the southern reaches below the Intis Republic and the Loen Kingdom, its capital at Feynapotter City. It is ruled by the Castiya family — an angel house of the Justiciar Pathway that founded the kingdom when the old empires fell — but its true character is set by its faith: this is the land of the Earth Mother, a romantic, matriarchal, devout realm that holds women in the highest regard, venerates the eldest grandmother, and treats marriage and childbearing as sacred. It is the continent's breadbasket, its fertile fields and the Church's blessed husbandry yielding such surplus that even Loen imports Feynapotter grain, and its people live longer and beg less than their northern neighbours. Once the kingdom shared its devotion with the Church of the God of Knowledge and Wisdom, until the two faiths fell to war and the Battle of the Violated Oath tore them apart — leaving the Earth Mother alone here, and three small states broken away. Its coin is the risot, its common tongue the Highlander descended from Ancient Feysac.`,
    epoch: 5,
    city: "feynapotter",
    npcs: [],
    sequences: [],
    tags: ["feynapotter-kingdom", "castiya", "earth-mother", "justiciar", "geography"],
    tokenCount: 255,
    narratorOnly: false,
  },
  {
    slug: "lenburg-knowledge-realm",
    title: "Lenburg — Realm of the Knowledge-Faith",
    category: "location",
    content: `Lenburg is the foremost of the three small states that broke from the Feynapotter Kingdom at the Battle of the Violated Oath, and the strangest in its governance: it has no royal house at all. In its place the Church of the God of Knowledge and Wisdom rules in all but name, directing the country from the Holy Temple of Knowledge in the capital, Azshara — a temple that was once the god's own earthly divine kingdom, left behind when he withdrew into the Astral World. Here knowledge is the highest good and "Omniscience means Omnipotence" the national creed: a Lenburger's whole life is a ladder of examinations and evaluations, schooling compulsory down to the dead tongue of Ancient Feysac, talent and learning prized far above birth. The fashion runs to light-coloured clothes and brass ornaments, the god's sacred metal; the coin is the gold sassen; the speech is a dialect of the Highlander shared with Feynapotter. To live in Lenburg is to be tested, ranked, and valued for what one knows.`,
    epoch: 5,
    city: "lenburg",
    npcs: [],
    sequences: [],
    tags: ["lenburg", "azshara", "god-of-knowledge", "geography", "fifth-epoch"],
    tokenCount: 240,
    narratorOnly: false,
  },
  {
    slug: "masin-knowledge-state",
    title: "Masin — A Knowledge-Faith Splinter-State",
    category: "location",
    content: `Masin is one of the three small states that won their independence from the Feynapotter Kingdom at the Battle of the Violated Oath, set in the continent's south below the Intis Republic and west toward the Fog Sea. Like its neighbours Lenburg and Segar, it carried off the worship of the God of Knowledge and Wisdom when it broke away, so that the patchwork of little realms along Feynapotter's borders shares one faith between them where the kingdom they left keeps another. Masin is a quiet country of the southern marches, its coin the gold porter, its life ordered by the same reverence for learning that binds the Knowledge-faith states together. It is the kind of small, studious nation the great powers scarcely notice — until they need what its scholars know.`,
    epoch: 5,
    city: "masin",
    npcs: [],
    sequences: [],
    tags: ["masin", "god-of-knowledge", "splinter-state", "geography", "fifth-epoch"],
    tokenCount: 180,
    narratorOnly: false,
  },
  {
    slug: "segar-knowledge-state",
    title: "Segar — A Knowledge-Faith Splinter-State",
    category: "location",
    content: `Segar is the easternmost of the three small states that split from the Feynapotter Kingdom at the Battle of the Violated Oath, set on the kingdom's northeastern border. A single-faith nation like Lenburg and Masin, it keeps the worship of the God of Knowledge and Wisdom that all three carried out of Feynapotter, its life turned toward learning and the omniscient eye on the open book. From its marches come hard travellers of the southern seas — the treasure-hunter Anderson Hood, the Fog Sea's strongest, was Segar-born before he made his name. Its coin is the gold złoty. Small and easily overlooked among the continent's great nations, Segar is nonetheless a piece of the Knowledge-faith's quiet dominion over the little realms that ring the Feynapotter Kingdom.`,
    epoch: 5,
    city: "segar",
    npcs: [],
    sequences: [],
    tags: ["segar", "god-of-knowledge", "splinter-state", "geography", "fifth-epoch"],
    tokenCount: 185,
    narratorOnly: false,
  },
];
