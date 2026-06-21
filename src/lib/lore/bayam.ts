import type { LoreEntry } from "./types";

// Bayam & the Rorsted Archipelago (world build-out 8, issue #137). Deepens the
// capital of the Loen Kingdom's Sonia Sea colony beyond the original stub: the
// wider archipelago and its isles, the Sonia Sea's powers and sea-lanes, a
// deepened Cathedral of Waves, and the native sea-god belief. Every entry is
// `epoch: 5`, `city: "bayam"`, so curated selection injects it only for a
// character actually in Bayam. All canon (the islands, the colonial structure,
// the Sonia Sea's Loen/Feysac division, the Cathedral of Waves diocese, the
// Sea God Kalvetua) is verified against corpus/wiki — see the root CLAUDE.md
// "Canon & Source Material" — NOT memory.
//
// Leak-safety note: the native sea-god belief (`bayam-sea-god-kalvetua`) is a
// `location` entry, NOT `metaphysics`. A `metaphysics` + `epoch: 5` entry is
// indexed as Fifth-Epoch *setting* (`getLoreByEpochSetting`) and injected into
// EVERY Fifth-Epoch character's curated lore regardless of where they are — so a
// city-specific belief tagged `metaphysics` leaks to the whole mainland. Keeping
// it a city-keyed `location` confines it to a Bayam character, the same rule the
// Forsaken Land present-day entries follow (issue #132). Its deeper truth stays
// `narratorOnly`.
//
// Canon (corpus-verified, the corpus outranking any issue hint): the Sonia Sea
// lies EAST of the Northern Continent; the Fog Sea is on the continent's far
// WEST side and is NOT adjacent to the Rorsted Archipelago — a Bayam sailor
// knows of it only by reputation. Gargas Archipelago and Sonia Island are
// FEYSAC colonies, not Loen. The Cathedral of Waves is a diocese of the Church
// of the Lord of Storms (HQ: the Chasm of Storms Cathedral on Pasu Island), not
// the Church's seat. There is no "Sailor pathway": the sea is the Tyrant
// Pathway's theme ("Sailor" is its Sequence 9).
export const BAYAM_LORE: LoreEntry[] = [
  {
    slug: "bayam-city-overview",
    title: "Bayam — Overview",
    category: "location",
    content: `Bayam is the capital of the Rorsted Archipelago, a port city built on Blue Mountain Island in the central Sonia Sea and nicknamed the "City of Generosity." The island it occupies is largely forested and richly endowed — gold, silver, copper, coal, and iron in its hills, and an abundance of fruit from its fertile land — so its first colonists named it for the plenty they found, a promised land said to flow with milk and honey. Bayam was for less than fifty years a pivotal colony of the Loen Kingdom in its Sonia Sea holdings, and the city still bears that history: many of its streets are named after cities of the Loen homeland. The air is salt and spice; the harbour is crowded with merchantmen, adventurers, informants, and pirates; and the whole archipelago trades on its exotic spices and its notorious pleasure-houses. By night a strict curfew falls over the city, and the cemeteries do not open until dawn. Beneath the colonial trade and the cosmopolitan bustle runs a deep current of island superstition that the foreign rulers have never fully suppressed.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: ["geography", "setting", "rorsted-archipelago", "colony", "fifth-epoch"],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "bayam-harbour-district",
    title: "Bayam — The Harbour & Adventurers' Quarter",
    category: "location",
    content: `Bayam's life turns on its harbour and the warren of streets behind it where adventurers, sailors, informants, and pirates gather. The Swordfish Bar is the accepted meeting-place for adventurers, its blackboards of posted requests propped on wooden shelves along the wall; the Amyris Leaf Bar is famous as a Beyonder gathering spot where pirates and intelligence-brokers trade in rumour; and the rougher Seaweed Bar is where gangs and infamous pirates do their darker business through secret channels. Inns line the trade streets — the luxurious Wind of Azure Inn on Acid Lemon Street, the Teana Inn, and others — catering to travellers from across the seas. The local press, the Sonia Morning Post and the News Report, carry the announcements that send the whole quarter buzzing. Foreign powers keep embassies here — Intis, Feysac, and Feynapotter all maintain missions — so the harbour district is at once a marketplace, a rumour-mill, and a quiet battleground of competing interests, where a careful listener can buy almost any secret for the right price.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: ["district", "harbour", "adventurers", "setting"],
    tokenCount: 225,
    narratorOnly: false,
  },
  {
    slug: "bayam-rorsted-isles",
    title: "The Rorsted Archipelago — Its Isles",
    category: "location",
    content: `The Rorsted Archipelago — the "Spice Archipelago" — is a scatter of islands in the central Sonia Sea, and Bayam, on Blue Mountain Island, is its capital and the greater half of it. Blue Mountain Island is the rich one: gold, silver, copper, coal, and iron in its forested hills and fruit enough that the first colonists named the place for plenty. Beyond it the archipelago runs out into lesser isles. Symeem Island lies at the far end, a place of old elven ruins and the small port of Symeem Harbor, known for its Gurney Sap and watched over by an outlying chapel of the storm-faith. Longtail Island marks the southern edge of the Rorsted waters. Loen has held the whole archipelago for less than fifty years, and its grip shows everywhere — the governor-general's office, a Parliament and courts staffed at the top entirely by Loenese, the harbour patrols and the garrison — yet the islands keep their own weather, their own tongues, and their own old loyalties beneath the colonial paint. The natives fill the lower ranks; the descendants of the islands' former kings and chieftains hold the middle; and the resentment of the ruled is never far below the surface.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "rorsted-archipelago",
      "isles",
      "colony",
      "fifth-epoch",
    ],
    tokenCount: 245,
    narratorOnly: false,
  },
  {
    slug: "bayam-sonia-sea-lanes",
    title: "The Sonia Sea & Its Lanes",
    category: "location",
    content: `The Sonia Sea is the great eastern ocean off the Northern Continent, and Bayam lives by it. Two powers hold its islands. The Loen Kingdom rules the Rorsted Archipelago in the central waters; the Feysac Empire holds the north and east — Sonia Island, the largest island in the whole sea and an old elf refuge Feysac took from Loen generations ago, and the Gargas Archipelago at the eastern front, a whale-fishing, white-walled colony (its capital Nas, the "City of White") so loosely policed it is half a pirates' playground. Loen's own outposts string the sea-lanes between: the busy free port of Oravi Island a few days' sail out, the storm-faith's holy seat on Pasu Island, and the once-famous Bansy Harbor on the long run back toward Pritz Harbor, now fallen to ruin. Far to the east, past Gargas, the charts give out at the Sea of Ruins — a dead and dangerous water no nation claims, where old battles of the gods are said to litter the deep. And away on the continent's far western side lies the Fog Sea with its Intis spice-islands, a world every Bayam sailor has heard of in the harbour bars and almost none will ever see.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: [
      "geography",
      "setting",
      "sonia-sea",
      "gargas-archipelago",
      "sea-lanes",
      "fifth-epoch",
    ],
    tokenCount: 255,
    narratorOnly: false,
  },
  {
    slug: "bayam-cathedral-of-waves",
    title: "Bayam — The Cathedral of Waves",
    category: "location",
    content: `The Cathedral of Waves is the Church of the Lord of Storms' great seat in the Rorsted Archipelago — for now the largest cathedral in all Bayam, its bells timed to the tides and its seafront steps worn by sailors leaving offerings before a voyage. But its true weight is not in its stone. Of all the nations only Loen's storm-faith holds authority over the sea, and in the Sonia Sea that authority runs through this cathedral: it is the diocese from which the Church administers the Beyonder world of the whole archipelago, answering to the Pontiff Gaard II at the Chasm of Storms Cathedral on distant Pasu Island. Its archbishop, the Cardinal Jahn Kottman — a Sea King of fearsome repute who boasts that even a War Bishop must bow his head in his waters — has long been the real ruler of the islands' hidden world, and through him the Mandated Punishers keep their watch. From here the Church wages its quiet, endless war on the outlawed worship of the native sea-god, hauling heretics in every month or two; and from here it would answer, should the drowned thing the old cardinals are said to have driven into hiding a century ago ever stir again.`,
    epoch: 5,
    city: "bayam",
    npcs: ["Jahn Kottman"],
    sequences: [],
    tags: ["cathedral", "lord-of-storms", "religion", "bayam", "setting"],
    tokenCount: 250,
    narratorOnly: true,
  },
  {
    slug: "bayam-streets-cemeteries",
    title: "Bayam — Streets, Markets & Cemeteries",
    category: "location",
    content: `Bayam wears its colonial history in its very geography. Its streets carry the names of Loen cities, a constant reminder of the kingdom that ruled here; Enmat Street, named for Enmat Harbour, holds Mabel's Sundry Store among its shopfronts, and Blackhorn Street its rented apartments. The city is sharply divided in death as in life: the natives are buried on the mountainside on the city's outskirts, in ground specially set aside by the Church of Storms and the governor-general's office, while foreigners who have settled here — merchants, adventurers, and migrants from Loen, Intis, Feysac, and Feynapotter — lie on a flat plain across the way, backed by forest. The Red Theater, the most famous pleasure-house in the surrounding seas, anchors the city's other great trade alongside the spices. Under a nightly curfew the streets empty after dark and the graveyards stay shut until dawn — a discipline that speaks to how much the colonial rulers fear what moves in Bayam by night.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: ["district", "streets", "cemeteries", "colony", "setting"],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "bayam-sea-god-kalvetua",
    title: "Bayam — The Sea God Kalvetua & Native Belief",
    category: "location",
    content: `Before the Loen Kingdom completed its colonisation of the Rorsted Archipelago, the natives of Bayam, Blue Mountain Island, and the surrounding seas worshipped the Sea God Kalvetua — an unimaginably huge blue sea serpent, its scales covered in symbols, believed to guard the islands from earthquakes and tsunamis. Kalvetua is no mere legend: it is a genuine Beyonder of the Tyrant Pathway that took elements of an ancient power and styled itself a god, able to answer its believers' prayers across the archipelago and to enchant their charms and tokens — though such blessings fade to nothing within a few months. The Church of the Lord of Storms has outlawed this worship and hunts its heretics, capturing devotees every month or two; rumour holds that powerful cardinals defeated and drove the serpent into hiding more than a century ago. Yet belief endures stubbornly in Bayam and across the islands, bound up with native resentment of colonial rule. The faith of the Sea God is the deepest of the island superstitions — a drowned, hunted, but living religion beneath the colony's orthodox surface.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: ["sea-god", "kalvetua", "native-belief", "tyrant-pathway", "setting"],
    tokenCount: 240,
    narratorOnly: true,
  },
];
