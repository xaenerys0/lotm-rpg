// Per-epoch gazetteer (issue: character epoch isolation). The map atlas is
// epoch-keyed so a non-Fifth character never sees Tingen's districts or the
// Fifth-Epoch cities. Every blurb here is street-level PUBLIC knowledge a person
// living in that era would hold — the narrator-only curated lore must NOT bleed
// into the atlas (the same rule the map component carried before this moved to a
// pure, testable module). The Fifth Epoch keeps the full Tingen gazetteer plus
// inter-city travel; the earlier epochs show a static region list (the CITIES
// travel model is Fifth-Epoch only) until their world model grows.

import { DEFAULT_EPOCH_ID, getEpoch } from "./epochs";

export interface GazetteerDistrict {
  slug: string;
  name: string;
  blurb: string;
  /** Keywords matched against the session's location string for "You are here". */
  keywords: string[];
}

export interface GazetteerFartherCity {
  id: string;
  name: string;
  realm: string;
  blurb: string;
}

export interface EpochGazetteer {
  /** One-line italic header describing the atlas for this epoch. */
  intro: string;
  districts: GazetteerDistrict[];
  /** Reachable cities with a "Set out" travel control. Fifth Epoch only today. */
  fartherCities: GazetteerFartherCity[];
  /** Whether the inter-city travel model (CITIES/travelTo) applies. */
  travelEnabled: boolean;
}

// ── Fifth Epoch — the full Tingen gazetteer (unchanged content). ──
const FIFTH_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "zouteland-street",
    name: "Zouteland Street & the Old Quarter",
    blurb:
      "Gas lamps, narrow brick terraces, and the smell of coal and rain. Most of Tingen's clerks and dockworkers live out their whole lives within ten streets of here.",
    keywords: ["zouteland", "old quarter", "tingen"],
  },
  {
    slug: "iron-cross-district",
    name: "Iron Cross District",
    blurb:
      "The working heart of the city: foundries, machine shops, and pubs that open before dawn. Wages are thin, tempers thinner, and the constables patrol in pairs.",
    keywords: ["iron cross"],
  },
  {
    slug: "khoy-university",
    name: "Khoy University",
    blurb:
      "Lecture halls, debating societies, and students who can quote the Roselle diaries they are not supposed to own. A respectable place to be poor and ambitious.",
    keywords: ["khoy", "university"],
  },
  {
    slug: "tussock-river",
    name: "Tussock River & the Docks",
    blurb:
      "Barges, fish markets, and fog thick enough to lose a cart in. Sailors trade stories here that respectable people pretend not to believe.",
    keywords: ["tussock", "dock", "river", "canal"],
  },
  {
    slug: "cathedral-of-serenity",
    name: "Cathedral of Serenity",
    blurb:
      "Seat of the Church of the Evernight Goddess in Tingen. Black-robed clergy, evening services, and bells that mark the hours after dark.",
    keywords: ["cathedral", "serenity", "chapel", "church"],
  },
  {
    slug: "divination-club",
    name: "The Divination Club",
    blurb:
      "A fashionable salon where the curious pay to have their fortunes read over tea. Mostly theatre — or so its members insist.",
    keywords: ["divination club"],
  },
  {
    slug: "north-borough",
    name: "The Northern Borough",
    blurb:
      "Townhouses, private clubs, and streets that are swept twice a day. Money lives here, and money prefers not to be stared at.",
    keywords: ["north", "borough", "hillston"],
  },
  {
    slug: "blackthorn",
    name: "Blackthorn Security Company",
    blurb:
      "A private security firm with an unremarkable office and a reputation for handling the cases the police decline to discuss.",
    keywords: ["blackthorn"],
  },
];

const FIFTH_FARTHER_CITIES: GazetteerFartherCity[] = [
  {
    id: "backlund",
    name: "Backlund",
    realm: "Loen Kingdom — the capital",
    blurb:
      "The capital, days downriver: a vast metropolis of five million souls under a permanent pall of yellow smog. Opera houses and counting-houses on one bank, factories and rookeries on the other, joined by the great Backlund Bridge over the Tussock.",
  },
  {
    id: "trier",
    name: "Trier",
    realm: "Intis Republic — the capital",
    blurb:
      "The sunlit capital of the Intis Republic across the border, a walled city of fifty-four gates famed for its artists and its fashion. Students shout politics in the boulevards; quarries and catacombs honeycomb the ground beneath.",
  },
  {
    id: "bayam",
    name: "Bayam",
    realm: "Rorsted Archipelago — the capital",
    blurb:
      "A colonial port-capital far out in the Sonia Sea, built on a forested island and named the City of Generosity for its gold and spice. Its harbour bars are loud with sailors and adventurers; a curfew falls hard at nightfall.",
  },
  {
    id: "pritz",
    name: "Pritz Harbor",
    realm: "Loen Kingdom — the chief naval port",
    blurb:
      "Loen's great navy town on the cold northern coast, under the shadow of the Hornacis range. Fog, dry-docks, and anchored ironclads; smugglers work the mountain passes at its back, so the garrison is heavy and the night watch real.",
  },
  {
    id: "enmat",
    name: "Enmat Harbor",
    realm: "Loen Kingdom — a coastal town",
    blurb:
      "A small fishing town the sea-fog swallows most nights — net-lofts, lamplit lanes, and old charms over the doorways. Quiet enough that strangers are counted, and quiet enough to hide the kind of business that wants no neighbours.",
  },
  {
    id: "feysac",
    name: "Feysac",
    realm: "Feysac Empire — the militarist north",
    blurb:
      "The cold northern empire of the God of Combat, beyond the Hornacis range: walled towns, drilled militias, and martial faith. The winters are long and the frontier dangerous, where monsters press at the walls and strength commands open respect.",
  },
];

// ── Earlier epochs — static, public region lists drawn from the lore. ──
const EARLIER_DISTRICTS: Record<number, GazetteerDistrict[]> = {
  1: [
    {
      slug: "first-firelit-camp",
      name: "The Firelit Camp",
      blurb:
        "A ring of hide tents and a guttering fire at the edge of the wild lands — the nameless settlement where you woke. Safety lasts only as long as the watch stays awake.",
      keywords: ["settlement", "wild lands", "camp", "tents"],
    },
    {
      slug: "first-hunting-grounds",
      name: "The Hunting Grounds",
      blurb:
        "The broken country the camp dares to forage: game trails, old kills, and the constant risk of meeting something that hunts people instead.",
      keywords: ["hunting", "grounds", "forage"],
    },
    {
      slug: "first-gray-fog-wall",
      name: "The Gray-Fog Wall",
      blurb:
        "Far to the west, a wall of unmoving gray fog where the world simply ends. The elders say something vast was sealed behind it; no one who walks in walks back.",
      keywords: ["gray fog", "western", "seal"],
    },
  ],
  2: [
    {
      slug: "second-human-enclave",
      name: "The Human Enclave",
      blurb:
        "The walled, watched quarter where your people are kept — mud-and-timber dwellings, labor sheds, and a market of scraps. Keep your eyes down and your power hidden.",
      keywords: ["enclave", "quarter", "slave"],
    },
    {
      slug: "second-overseers-hall",
      name: "The Overseers' Hall",
      blurb:
        "From here the masters' will is enforced upon the enclave. The overseers answer to inhuman lords, and they watch closely for any human who shines too brightly.",
      keywords: ["overseer", "hall"],
    },
    {
      slug: "second-dominion",
      name: "The Inhuman Dominion",
      blurb:
        "Beyond the enclave's bounds lies the realm proper — architecture built for beings far larger and stranger than people, where a human walks only on an errand, never freely.",
      keywords: ["dominion", "masters", "realm"],
    },
  ],
  3: [
    {
      slug: "third-war-camp",
      name: "The War-Camp of the Faithful",
      blurb:
        "Canvas, banner, and prayer-fire as far as the eye can see — the crusading host of the one faith, mustered at dawn. You woke among its tents with your first potion in your blood.",
      keywords: ["war-camp", "war camp", "camp", "uprising"],
    },
    {
      slug: "third-field-temple",
      name: "The Field-Temple of the Sun",
      blurb:
        "At the host's heart, an open-air shrine to the Ancient Sun God where hymns never quite stop. Beyonders are framed here as miracle-workers; doubt is dangerous.",
      keywords: ["temple", "shrine", "sun"],
    },
    {
      slug: "third-forsaken-land",
      name: "The Forsaken Land (afar)",
      blurb:
        "Whispered of at the fires: a continent split from the world and cursed lightless when a god fell, where the abandoned faithful keep their endless penance under eternal lightning.",
      keywords: ["forsaken", "silver", "lightning"],
    },
  ],
  4: [
    {
      slug: "fourth-imperial-trier",
      name: "Imperial Trier",
      blurb:
        "The Tudor capital of black stone and blood-red halls, veiled in thin gray fog, its streets so narrow neighbors shake hands across them. You arrived among its pilgrims and petitioners.",
      keywords: ["trier", "imperial", "capital", "outskirts", "solomon"],
    },
    {
      slug: "fourth-fifty-four-gates",
      name: "The Fifty-Four Gates",
      blurb:
        "A three-meter wall pierced by fifty-four gates rings the city, each manned by tax-collectors and police who watch for the wanted. The gates enclose twenty quartiers of imperial life.",
      keywords: ["gates", "wall", "quartier"],
    },
    {
      slug: "fourth-underground-trier",
      name: "The Underground Trier",
      blurb:
        "Beneath the streets lies the city that sank in the War of the Four Emperors — a buried warren of rioters, smugglers, and cultists, sealed under the living city above.",
      keywords: ["underground", "catacomb", "below"],
    },
  ],
};

/**
 * The atlas for a character's epoch. The Fifth Epoch returns the full Tingen
 * gazetteer with inter-city travel; earlier epochs return a static, public
 * region list with travel disabled. An absent epoch defaults to the Fifth.
 */
export function gazetteerForEpoch(epoch: number | undefined): EpochGazetteer {
  const id = epoch ?? DEFAULT_EPOCH_ID;
  if (id === DEFAULT_EPOCH_ID) {
    return {
      intro: "A walker’s gazetteer of Tingen, in the Awwa region of the Loen Kingdom.",
      districts: FIFTH_DISTRICTS,
      fartherCities: FIFTH_FARTHER_CITIES,
      travelEnabled: true,
    };
  }
  const era = getEpoch(id);
  return {
    intro: `A traveller’s gazetteer of the ${era.name} — the ${era.era}.`,
    districts: EARLIER_DISTRICTS[id] ?? [],
    fartherCities: [],
    travelEnabled: false,
  };
}
