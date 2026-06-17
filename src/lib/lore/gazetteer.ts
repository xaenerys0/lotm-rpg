// Per-place gazetteer (issues: character epoch isolation, #101). The map atlas is
// keyed on BOTH the character's epoch AND, within the Fifth Epoch, their current
// CITY — so a character standing in Bayam sees Bayam's districts and a "Bayam"
// header, not Tingen's (issue #101). A non-Fifth character never sees the
// Fifth-Epoch cities at all. Every blurb here is street-level PUBLIC knowledge a
// person living in that place would hold — the narrator-only curated lore must
// NOT bleed into the atlas (the same rule the map component carried before this
// moved to a pure, testable module). The Fifth Epoch shows the current city's
// districts plus inter-city travel to the others; the earlier epochs show a
// static region list (the CITIES travel model is Fifth-Epoch only).

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

// ── The other Fifth-Epoch cities — public, street-level district lists. ──
const BACKLUND_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "backlund-east-borough",
    name: "The East Borough",
    blurb:
      "Factories, gasworks, and tenement rookeries crammed below the smog line — the working bank of the Tussock, loud day and night and policed in numbers.",
    keywords: ["east borough", "east end", "rookery"],
  },
  {
    slug: "backlund-empress-borough",
    name: "The Empress Borough",
    blurb:
      "Government offices, banks, and the townhouses of the rich on the clean bank of the river. Doormen, private clubs, and streets swept before dawn.",
    keywords: ["empress borough", "west borough", "empress"],
  },
  {
    slug: "backlund-hillston-borough",
    name: "Hillston Borough",
    blurb:
      "The respectable middle of the city — shops, counting-houses, and lodging for clerks who dress a notch above their wages.",
    keywords: ["hillston"],
  },
  {
    slug: "backlund-bridge",
    name: "The Backlund Bridge & the Tussock",
    blurb:
      "The great iron bridge spanning the soot-brown Tussock that splits the capital in two. Barges, toll-gates, and a fog that never quite lifts off the water.",
    keywords: ["backlund bridge", "tussock", "the bridge"],
  },
];

const TRIER_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "trier-island-district",
    name: "The Island District",
    blurb:
      "The sunlit heart of Trier on its river island, crowned by the cathedral. Cafés, galleries, and well-dressed crowds taking the afternoon air.",
    keywords: ["island district", "saint vieve", "viève"],
  },
  {
    slug: "trier-fifty-four-gates",
    name: "The Fifty-Four Gates",
    blurb:
      "The ring-wall pierced by fifty-four gates, each with its tax-clerks and police. Twenty quartiers of shops and lodging press up against the stone.",
    keywords: ["gate", "wall", "quartier"],
  },
  {
    slug: "trier-boulevards",
    name: "The Boulevards",
    blurb:
      "Broad tree-lined avenues where students argue politics, fashion houses show their wares, and a careless word about the Republic can still draw a crowd.",
    keywords: ["boulevard", "avenue"],
  },
  {
    slug: "trier-underground",
    name: "The Underground",
    blurb:
      "Quarries and catacombs honeycombing the rock beneath the streets — old bone-galleries and damp tunnels the respectable pretend not to use.",
    keywords: ["underground", "catacomb", "quarry"],
  },
];

const BAYAM_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "bayam-harbour",
    name: "The Harbour & Adventurers' Quarter",
    blurb:
      "Wharves thick with masts and the loud bars where sailors and treasure-hunters drink. The pulse of the port — and where a curfew falls hard at nightfall.",
    keywords: ["harbour", "harbor", "adventurer", "quay", "wharf"],
  },
  {
    slug: "bayam-cathedral-of-waves",
    name: "The Cathedral of Waves",
    blurb:
      "The great seafront church watching over the bay, its bells timed to the tides. Sailors leave offerings here before any long voyage.",
    keywords: ["cathedral of waves", "cathedral", "waves"],
  },
  {
    slug: "bayam-spice-markets",
    name: "The Spice Markets",
    blurb:
      "Crowded bazaars of gold, pepper, and stranger goods that earned the City of Generosity its name. Every tongue of the Sonia Sea haggles here.",
    keywords: ["market", "spice", "bazaar"],
  },
  {
    slug: "bayam-cemeteries",
    name: "The Old Cemeteries",
    blurb:
      "Terraced graveyards climbing the hill behind the town, half-swallowed by jungle. Quiet by day, and avoided after dark for reasons no one says aloud.",
    keywords: ["cemetery", "graveyard", "tomb"],
  },
];

const PRITZ_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "pritz-dry-docks",
    name: "The Dry-Docks & Naval Yard",
    blurb:
      "The navy's great repair basins and slipways under the cold cliffs — anchored ironclads, riveters' din, and sentries at every gate.",
    keywords: ["dry-dock", "drydock", "naval", "yard"],
  },
  {
    slug: "pritz-garrison-town",
    name: "The Garrison Town",
    blurb:
      "Barracks, chandlers, and dockside taverns serving the fleet. A heavy garrison and a real night-watch keep the smugglers honest — mostly.",
    keywords: ["garrison", "barracks", "town"],
  },
  {
    slug: "pritz-hornacis-passes",
    name: "The Hornacis Passes",
    blurb:
      "The cold mountain roads at the harbour's back, where smugglers work the high trails. Beyond them the range climbs into killing weather.",
    keywords: ["hornacis", "pass", "mountain"],
  },
];

const ENMAT_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "enmat-net-lofts",
    name: "The Net-Lofts & Quay",
    blurb:
      "Tar-black net-lofts and a short stone quay where the fishing boats land their catch. The whole town smells of brine and woodsmoke.",
    keywords: ["net-loft", "quay", "wharf"],
  },
  {
    slug: "enmat-lamplit-lanes",
    name: "The Lamplit Lanes",
    blurb:
      "A handful of narrow lanes with old charms nailed over the doorways. Strangers are counted here, and remembered.",
    keywords: ["lane", "lamplit", "town"],
  },
  {
    slug: "enmat-fogbound-shore",
    name: "The Fog-Bound Shore",
    blurb:
      "The grey coast the sea-fog swallows most nights — mudflats, old wreck-timbers, and the kind of quiet that hides business wanting no neighbours.",
    keywords: ["shore", "coast", "fog"],
  },
];

const FEYSAC_DISTRICTS: GazetteerDistrict[] = [
  {
    slug: "feysac-walled-town",
    name: "The Walled Town",
    blurb:
      "Grey stone houses behind a thick curtain-wall, banners of the God of Combat over every gate. Strength is shown openly and respected.",
    keywords: ["walled town", "town", "wall"],
  },
  {
    slug: "feysac-drill-grounds",
    name: "The Drill-Grounds",
    blurb:
      "Muster-yards where the militias drill from first light. Martial faith runs deep, and a duel settles what words cannot.",
    keywords: ["drill", "muster", "barracks"],
  },
  {
    slug: "feysac-frontier-marches",
    name: "The Frontier Marches",
    blurb:
      "The dangerous edge of the empire beyond the walls, where monsters press in from the cold wilds and only the strong patrol after dark.",
    keywords: ["frontier", "march", "border"],
  },
];

// The full Fifth-Epoch city roster (Tingen + the rest), used both for the
// per-city district lookup and the "farther afield" travel list.
const FIFTH_CITIES: GazetteerFartherCity[] = [
  {
    id: "tingen",
    name: "Tingen City",
    realm: "Loen Kingdom — the Awwa region",
    blurb:
      "A mid-sized industrial city under coal-smoke and overcast skies, where most chronicles begin.",
  },
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

// District lists keyed by city id — the intra-city "site" layer per place.
const FIFTH_CITY_DISTRICTS: Record<string, GazetteerDistrict[]> = {
  tingen: FIFTH_DISTRICTS,
  backlund: BACKLUND_DISTRICTS,
  trier: TRIER_DISTRICTS,
  bayam: BAYAM_DISTRICTS,
  pritz: PRITZ_DISTRICTS,
  enmat: ENMAT_DISTRICTS,
  feysac: FEYSAC_DISTRICTS,
};

const FIFTH_CITY_BY_ID: Record<string, GazetteerFartherCity> = Object.fromEntries(
  FIFTH_CITIES.map((c) => [c.id, c]),
);

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

/** The default Fifth-Epoch city when the current location names none. */
const FIFTH_DEFAULT_CITY = "tingen";

/**
 * The atlas for a character's epoch and (in the Fifth Epoch) current city. The
 * Fifth Epoch returns the CURRENT city's districts with a header naming that
 * city and "farther afield" travel to the OTHER cities (issue #101 — a character
 * in Bayam sees Bayam, not Tingen); an unrecognised `cityId` falls back to
 * Tingen. Earlier epochs return a static, public region list with travel
 * disabled. An absent epoch defaults to the Fifth.
 *
 * `cityId` is supplied by the caller (e.g. `cityIdFromLocation(location)` in the
 * map component) — the gazetteer lives in the lore layer and must not import the
 * game-layer city resolver.
 */
export function gazetteerForEpoch(
  epoch: number | undefined,
  cityId?: string,
): EpochGazetteer {
  const id = epoch ?? DEFAULT_EPOCH_ID;
  if (id === DEFAULT_EPOCH_ID) {
    // `current` is always a known city id (a recognised `cityId`, else Tingen),
    // so both lookups below resolve — no fallback branch.
    const current = cityId && FIFTH_CITY_DISTRICTS[cityId] ? cityId : FIFTH_DEFAULT_CITY;
    const city = FIFTH_CITY_BY_ID[current];
    return {
      intro: `A walker’s gazetteer of ${city.name} — ${city.realm}.`,
      districts: FIFTH_CITY_DISTRICTS[current],
      // Every Fifth-Epoch city EXCEPT the one you are in is "farther afield".
      fartherCities: FIFTH_CITIES.filter((c) => c.id !== current),
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
