import type { LoreEntry } from "./types";

// Wider Loen Kingdom regions (world build-out 5, issue #134). Deepens the Loen
// Kingdom beyond the capital and the existing start regions: Awwa County (the
// county Tingen sits in), the city of Constant (the "Wind City", Loen's second
// city, in Midseashire), plus added depth for the existing Pritz Harbor / Enmat
// Harbor start regions. Every entry is player-safe, street-level public
// knowledge, tagged `epoch: 5` and city-keyed so curated selection injects it
// only for a character actually there. All canon (county/city facts, the Awwa
// Knights' Order, Constant's coal-and-steel industry, the rivers) is verified
// against corpus/wiki — see the root CLAUDE.md "Canon & Source Material" — NOT
// memory.
//
// City keys: Awwa County is Tingen's surrounding region, so it is keyed
// "tingen" (it surfaces for a Tingen character as their county context).
// Constant is a first-class travel city keyed "constant" (travel.ts / gazetteer
// / narration / glossary all agree on the id). The Pritz/Enmat depth entries
// reuse the existing "pritz"/"enmat" keys from regions.ts.
export const LOEN_LORE: LoreEntry[] = [
  {
    slug: "awwa-county-overview",
    title: "Awwa County — Tingen's Region",
    category: "location",
    content: `Awwa County is the region of the Loen Kingdom in which Tingen — the City of Universities — sits, on the Northern Continent where the Khoy and Tussock rivers meet. It is flanked by Winter County to the north, with the Khoy River to its east and the Tussock to its south and south-west, the great Tussock running on from here down to the capital, Backlund, and out to the sea near Pritz Harbor. Beyond Tingen the county is a patchwork of smaller towns and parishes — Morse Town and its cathedral among them — and quiet farming country between the rivers. The two faiths that hold sway here are the Church of the Evernight Goddess and the Church of the Lord of Storms, their bells dividing the week between them. Once the county was guarded by the Awwa Knights' Order of Chivalry; the order is gone now, made obsolete by the high-pressure steam gun and the six-barrel machine gun, and only a handful of old swordsmen remember it. Day-to-day order falls instead to the Awwa County Police, whose Special Operations Department handles the cases the ordinary constabulary will not discuss.`,
    epoch: 5,
    city: "tingen",
    npcs: [],
    sequences: [],
    tags: ["geography", "setting", "loen-kingdom", "awwa-county", "fifth-epoch"],
    tokenCount: 215,
    narratorOnly: false,
  },
  {
    slug: "constant-city-overview",
    title: "Constant City — Overview",
    category: "location",
    content: `Constant City — the "Wind City" — is the second-largest city in the Loen Kingdom and the provincial capital of Midseashire County on the Northern Continent's north-eastern coast. Reckoned one of the three great cities of Loen, it is built on coal and steel: a forest of chimneys and tall blast furnaces, streets of concrete and rolled iron, and a skyline that strikes a visitor as even more relentlessly industrial than the capital. Where Backlund smothers under its yellow smog, Constant is scoured by a hard sea breeze off the North Sea, so for all the coal-ash that streaks its walls the air runs cleaner and colder. The Constant Coal and Steel Consortium drives its fortune; the Constant Industry University trains the engineers who keep the furnaces fed; and the harbour ships finished iron out to the wider kingdom and the world. It is a city of foundrymen and shipping clerks, union halls and counting-houses, loud and prosperous and proud of its own grime — and, like any great industrial city, it has corners where stranger industries than steel quietly turn.`,
    epoch: 5,
    city: "constant",
    npcs: [],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "loen-kingdom",
      "constant",
      "midseashire",
      "fifth-epoch",
    ],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "constant-industry-and-steam",
    title: "Constant City — The Furnaces & the Church of Steam",
    category: "location",
    content: `The beating heart of Constant is its industry. Blast furnaces run day and night, the Constant Coal and Steel Consortium roping together mines, mills, and rolling-works into one of the great fortunes of the Loen Kingdom, and the Constant Industry University turns out the engineers and metallurgists who keep it all running — its tuition kept low so that a foundryman's clever son might rise. In a city built on iron and fire it is the Church of the God of Steam and Machinery that commands the deepest popular devotion: its cathedrals stand among the workshops, its calendar marked by the festivals of the engine and the forge, and the working people who pray to progress treat the Church as their own in a way the older faiths are not. For the Beyonder world that means Constant is the Church of Steam's strongest seat outside the capital, where the Savant pathway's quiet practitioners find ready cover among genuine machinists and the line between an ingenious invention and a mystical one runs very thin.`,
    epoch: 5,
    city: "constant",
    npcs: [],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "loen-kingdom",
      "constant",
      "god-of-steam",
      "fifth-epoch",
    ],
    tokenCount: 215,
    narratorOnly: false,
  },
  {
    slug: "constant-wind-city-coast",
    title: "Constant City — The Wind City & the Midseashire Coast",
    category: "location",
    content: `They call Constant the Wind City for good reason: it stands on the open north-eastern coast of Midseashire, where the cold wind off the North Sea never quite stops and carries the coal-smoke out to sea almost as fast as the furnaces make it. Its harbour is a working one — colliers and ore-boats, iron freighters and the grey ships of Loen's Midseashire Fleet — and the quays are loud with the same dockside trade and dockside trouble any great port knows. Midseashire is the most crowded, most industrious stretch of the whole Northern Continent's coast, its cities (Constant chief among Loen's) ringed by lesser mill-towns, and across the water lie the rival ports of other powers. That makes Constant a frontier of commerce and, in harder times, of strategy: a place where fortunes and contraband and quieter cargoes all come and go on the tide, and where the wind carries away a great deal that the city would rather not have overheard.`,
    epoch: 5,
    city: "constant",
    npcs: [],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "loen-kingdom",
      "constant",
      "midseashire",
      "port",
      "fifth-epoch",
    ],
    tokenCount: 210,
    narratorOnly: false,
  },
  {
    slug: "pritz-harbor-naval-yard",
    title: "Pritz Harbor — The Naval Yard & the Storm-Faith",
    category: "location",
    content: `Beneath Pritz Harbor's fog the real business of the town is the navy. The royal dockyards run the length of the grey roadstead — building-slips and dry-docks, powder magazines and victualling stores, ironclads under repair and gunboats fitting out — and a whole town of riggers, shipwrights, chandlers, and the families that serve them lives by the rhythm of the fleet. The garrison is heavy, the night watch real, and the Amantha passes at the harbour's back are worked hard by smugglers running goods over the mountains to and from the Feysac frontier. Pritz is above all a city of the Church of the Lord of Storms: the storm-faith of sailors and soldiers is the dominant creed here, its seafront chapels blessing every long voyage, and so it is the Lord of Storms' own Beyonder enforcers — the Mandated Punishers — who hold the strongest hand over the uncanny in this port, more even than the Nighthawks. Sealed cargo, drowned things, and Beyonders who would rather not be logged all pass through a navy town this busy, and the storm-priests watch the water for them.`,
    epoch: 5,
    city: "pritz",
    npcs: [],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "loen-kingdom",
      "pritz",
      "navy",
      "lord-of-storms",
      "fifth-epoch",
    ],
    tokenCount: 230,
    narratorOnly: false,
  },
  {
    slug: "enmat-harbor-fogbound-trade",
    title: "Enmat Harbor — The Fog-Bound Landing",
    category: "location",
    content: `Enmat Harbor keeps its secrets in the fog. A small Loen coastal town of fishing boats, net-lofts, and lamplit lanes, it is the kind of close-mouthed place where everyone is counted and strangers are remembered, the old sea-charms still nailed over the doorways and certain names left unspoken after dark. Industry has passed it by, and the nearest real authority is a long, cold road away — which is precisely why the Beyonder world's quieter traffic likes it. The fog that hides the fishermen's morning hides a smuggler's landing as readily, and more than one cult or fugitive has chosen Enmat for having no neighbours worth the name. It is also a town that grows its own uncanny: the most famous Spirit Medium of all Awwa County, Daly Simone, came from coastal stock and made her home here before the Nighthawks called her in, and the locals' wary respect for what the tide brings in is not entirely superstition. Whatever comes ashore at Enmat tends to come ashore unseen.`,
    epoch: 5,
    city: "enmat",
    npcs: ["Daly Simone"],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "loen-kingdom",
      "enmat",
      "coastal-town",
      "fifth-epoch",
    ],
    tokenCount: 215,
    narratorOnly: false,
  },
];
