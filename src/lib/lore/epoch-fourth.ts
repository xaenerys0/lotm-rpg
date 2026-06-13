import type { LoreEntry } from "./types";

// Fourth Epoch — the Epoch of the Gods (issue: character epoch isolation). The
// best-documented of the pre-Iron-Age epochs; canon-grounded from the LOTM wiki
// (Fourth Epoch, Solomon Empire, Solomon, Alista Tudor, Fourth Epoch Trier,
// Underground Trier pages). It directly sets up the Fifth-Epoch status quo.

export const FOURTH_EPOCH_LORE: LoreEntry[] = [
  {
    slug: "fourth-epoch-overview",
    title: "Fourth Epoch — The Epoch of the Gods",
    category: "metaphysics",
    content: `The Fourth Epoch is the age when gods walk the world in person and raise mortal-divine empires to wage war across the continents. With the Ancient Sun God gone, new deities descend frequently into reality, and god-emperors carve the Northern Continent into rival dominions. It is an imperial, theological, and dark age — not the steam-and-iron world of the Fifth Epoch, but a pre-industrial one of walled cities, candlelight, black stone, and divine politics. Mighty empires rise and fall in succession: the Solomon Empire of the Black Emperor, the Tudor-Trunsoest United Empire that overthrows it, and the War of the Four Emperors that follows. Divine intervention is administered like taxation, and a mortal Beyonder lives among miracles and atrocities alike, carrying a power they must not openly declare among gods who notice such things. The epoch ends in catastrophe and the gods' retreat — the threshold of the modern world.`,
    epoch: 4,
    npcs: [],
    sequences: [],
    tags: ["epoch", "epoch-of-the-gods", "world-setting", "history", "solomon-empire"],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "fourth-epoch-empires",
    title: "Fourth Epoch — The God-Empires and Their Fall",
    category: "metaphysics",
    content: `Three powers define the Fourth Epoch's history. First, the Solomon Empire, ruled by the Sequence-0 Black Emperor Solomon and backed by the True Creator and Rose Redemption, which dominated the Northern Continent and warred on the orthodox Seven Gods for roughly a thousand years. Then Alista Tudor and Trunsoest, with six gods' backing, rebelled, killed Solomon, and founded the Tudor-Trunsoest United Empire — until Solomon resurrected and rebuilt his empire, igniting the War of the Four Emperors, in which Tudor forcibly swapped to the Red Priest Pathway and became a half-mad Sequence-0 sovereign. Finally, after the emperors fell, came the Pale Disaster: the Primordial Demoness and Death ravaged the Northern Continent until the Seven Deities united, slew Death, and gravely wounded the Demoness — but were so injured that they withdrew their Divine Kingdoms into the Astral World, thereafter sending only avatars. That retreat hands the world to the Seven Orthodox Churches and the great nations of the Fifth Epoch.`,
    epoch: 4,
    npcs: [],
    sequences: [],
    tags: ["powers", "solomon-empire", "tudor", "pale-disaster", "history"],
    tokenCount: 245,
    narratorOnly: true,
  },
  {
    slug: "fourth-epoch-society",
    title: "Fourth Epoch — Imperial Life Among the Gods",
    category: "metaphysics",
    content: `Fourth-Epoch civilization is recognizably imperial but gothic and god-haunted. Cities are walled and gated, watched by tax-collectors and police, lit by candle and torch rather than gas; the great imperial architecture favors black stone, asymmetrical and disorderly designs, and candlesticks hung from high ceilings. Society is layered beneath god-emperors and their divine patrons, with churches, courts, and cults threaded through every city. Power is divine and Beyonder rather than mechanical, and the supernatural is not hidden as it will be in the Fifth Epoch — gods and their works are a public, terrifying fact of life. Beneath the order runs a constant undercurrent of cults, demon-worship, and conspiracy, for the age's emperors themselves dealt with demons and fallen angels. For a mortal, daily life means living small and careful in the gaps between empires and deities whose quarrels remake the map.`,
    epoch: 4,
    npcs: [],
    sequences: [],
    tags: ["society", "daily-life", "imperial", "world-setting"],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "fourth-epoch-trier",
    title: "Fourth Epoch — Imperial Trier",
    category: "location",
    content: `The Tudor Empire's capital, the Trier of the Fourth Epoch, is the era's signature city: a magnificent, ominous sprawl of pitch-black and blood-red buildings, asymmetrical black halls beside houses that look splashed with gore, intermittently veiled in thin gray fog. Its streets run so narrow in places that neighbors could shake hands across them. A three-meter wall pierced by fifty-four gates rings the city, each gate manned by tax-collectors and police who watch for the wanted, enclosing twenty quartiers of imperial life. After the War of the Four Emperors part of the city sank into the earth, becoming the Underground Trier — a buried refuge of rioters, murderers, smugglers, and cultists — over which a new city was raised as a seal against what festers below. Centuries later, the Fifth Epoch's Intis capital will be built upon this same haunted ground; here, in the Fourth, it is a living imperial seat of black stone and divine dread.`,
    epoch: 4,
    city: "imperial",
    npcs: [],
    sequences: [],
    tags: ["geography", "trier", "tudor-empire", "setting"],
    tokenCount: 235,
    narratorOnly: false,
  },
];
