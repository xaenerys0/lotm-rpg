import type { LoreEntry } from "./types";

// Third Epoch — the Cataclysm Epoch (issue: character epoch isolation). Canon-
// grounded from the LOTM wiki (Third Epoch, Ancient Sun God, Forsaken Land of
// the Gods, City of Silver pages). Note the correction to the in-repo summary:
// the Ancient Sun God's UPRISING is late Second Epoch; the Third Epoch is his
// REIGN (the Glorious/Radiant Era) and his ASSASSINATION (the Cataclysm Era).

export const THIRD_EPOCH_LORE: LoreEntry[] = [
  {
    slug: "third-epoch-overview",
    title: "Third Epoch — The Cataclysm Epoch",
    category: "metaphysics",
    content: `The Third Epoch is humanity's golden age and the catastrophe that ended it. Having slain the Ancient Gods, the human survivor Grisha Adam became the Ancient Sun God — the sole Orthodox God, "The Omniscient and Omnipotent" — and for the first time humanity stood as the world's favored, dominant race. This is the Glorious Era (also called the Radiant Era), a theocratic golden age of faith and sun-worship that endured for over a thousand years under one god and his single church. It is also doomed. The epoch's second half, the Cataclysm Era, is the god's fall: a conspiracy of his own lieutenants and rival deities besieges and kills him, and his death scars the world. To play in this age is to live inside either the radiant certainty of the one faith or the lightless grief that follows its collapse.`,
    epoch: 3,
    npcs: [],
    sequences: [],
    tags: ["epoch", "cataclysm", "world-setting", "history", "sun-god"],
    tokenCount: 215,
    narratorOnly: false,
  },
  {
    slug: "third-epoch-glorious-era",
    title: "Third Epoch — The Glorious Era and the Cataclysm",
    category: "metaphysics",
    content: `In the Glorious Era, humanity prospers under the Ancient Sun God as the blessed people of the one god. Society is faith-centered and optimistic: sun-worship, church and crusade, civilization rebuilt across the continents under divine sponsorship. Power is mystical rather than mechanical — this is the age in which the codified pathway-and-potion system matures under the god's favor, not an age of machines. Then comes the Cataclysm. A conspiracy, Rose Redemption — formed by the dark-angel Sasrir and the Evernight Goddess, joined by six of the god's own Kings of Angels, five former subsidiary gods, and the God of Combat — besieges the Ancient Sun God while a Primordial will wars inside him, and kills him at the Battlefield of the Gods. His fall shatters the most prosperous continent into the cursed, sunless Forsaken Land, and from his remains the first modern deities — the Lord of Storms, the Eternal Blazing Sun, and others — are born.`,
    epoch: 3,
    npcs: [],
    sequences: [],
    tags: ["powers", "rose-redemption", "kings-of-angels", "history"],
    tokenCount: 235,
    narratorOnly: true,
  },
  {
    slug: "third-epoch-war-camp",
    title: "Third Epoch — The War-Camp of the Faithful",
    category: "location",
    content: `Across the Third Epoch, the crusading host of the one faith moves as a city on the march. A war-camp of the faithful is a sprawl of canvas and banner ringed by pickets and prayer-fires: rows of tents, a smith's line, a field-temple to the Ancient Sun God at its heart, and the perpetual noise of soldiers, pilgrims, healers, and zealots. By day the horns muster the columns; by night the camp glows with watch-fires and hymn. Beyonders serve as the host's living artillery and its most dangerous secrets, their powers framed as miracles granted by the sun. Faith is law here, doubt is dangerous, and advancement — in rank or in Sequence — is bound up with devotion. In the Cataclysm Era these same camps become refuges and last stands as the golden age burns, their certainties curdling into desperation under a dimming sky.`,
    epoch: 3,
    city: "war-camp",
    npcs: [],
    sequences: [],
    tags: ["geography", "war-camp", "setting", "crusade"],
    tokenCount: 210,
    narratorOnly: false,
  },
  {
    slug: "third-epoch-forsaken-land",
    title: "Third Epoch — The Forsaken Land and the City of Silver",
    category: "location",
    content: `When the Ancient Sun God fell, the continent at the heart of his glory was split from the world and cursed: the Forsaken Land of the Gods, wrapped in permanent storm-cloud and lightless dark, where day and night are told only by the frequency of the lightning. Within it endure broken societies that still worship the lost Creator — chief among them the Kingdom of Silver and its City of Silver, whose people, believing themselves abandoned, perform endless penance and sacrifice while awaiting the day the sun rises again. The Battlefield of the Gods, where the god was slain, becomes the Sea of Ruins. For a character of the late Third Epoch, this is the shape of the end times: pilgrimage through ash and lightning, faith soured into penitential dread, and the slow realization that the god who blessed the world is not coming back.`,
    epoch: 3,
    city: "forsaken",
    npcs: [],
    sequences: [],
    tags: ["geography", "forsaken-land", "city-of-silver", "setting"],
    tokenCount: 215,
    narratorOnly: false,
  },
];
