import type { LoreEntry } from "./types";

// ---------------------------------------------------------------------------
// Southern Continent — the colonized lands of the old Balam Empire (world
// build-out 9, issue #138). Content for the freely-reachable continent #130/#138
// wired into the travel model.
// ---------------------------------------------------------------------------
//
// Canon (verified against corpus/wiki — Southern Continent, Balam Empire, West
// Balam, East Balam, Salinger/Death, Eggers Family, Numinous Episcopate): the
// Southern Continent is hot jungle-and-desert country across the storm-wracked
// Berserk Sea, "less developed... inhabited by primitive tribes with a
// shamanistic belief system originally worship[ping]... Death." In the Fourth
// Epoch the whole continent was the Balam Empire of the death-god Salinger ("the
// Underworld Emperor", "the first Underworld"), ruled in the real world by his
// son the Death Consul Azik Eggers, under the Church of Death. When the orthodox
// gods slew Death near the epoch's end the empire and church collapsed and his
// death tore open the Berserk Sea. By the Fifth Epoch the Northern powers have
// colonized the ruins, fragmenting it into East Balam (Loen), West Balam (Intis),
// the Star Highlands (the Highlands Kingdom, a satellite state), and the rest.
//
// REACHABILITY (issue #138): the Southern Continent is FREELY reachable — an
// ordinary, long, perilous sea voyage across the Berserk Sea — NOT sealed like
// the dream-gated Forsaken Land. It carries no access flag (`travel.ts`).
//
// LEAK CONTROL (mirrors forsaken-land.ts): every present-day entry is tagged
// `epoch: 5` and CITY-KEYED `city: "balam"` (the leading word of the location
// string) so `selectCuratedLore` injects it only for a character actually THERE
// — a mainland character never receives it. The Fourth-Epoch history (the Church
// of Death, the empire's fall) is kept SEPARATE in `organizations.ts`/`history.ts`
// as `epoch: 4` (never mixed on one entry — `passesEpochGate` is exact-match).
// Nothing here is `metaphysics`/epoch-setting (that would inject into every Fifth
// prompt and leak the continent to the mainland). Deep facts (the death-god's
// undersea tomb) are additionally `narratorOnly` + `sequences`-gated.

export const SOUTHERN_CONTINENT_LORE: LoreEntry[] = [
  {
    slug: "southern-continent-overview",
    title: "The Southern Continent — Overview",
    category: "location",
    content: `The Southern Continent lies across the Berserk Sea from the Northern Continent, the far side of the Five Seas — Berserk to the north, the Sonia Sea east, the Fog Sea west, the Polar Sea south. It is a hot land of jungle and desert, far less developed than the gaslit North, and its native peoples are scattered tribes whose oldest faith was the worship of a death-god. Once it was a single dominion: through the Fourth Epoch the whole continent was the Balam Empire of the Underworld Emperor, until the orthodox gods slew him and the empire fell to ruin. Into that wreckage came the powers of the North. By the present day the Loen Kingdom and the Intis Republic — with Feysac and Feynapotter pressing in — have colonized the old imperial lands, breaking them into East Balam, West Balam, the Star Highlands, and a patchwork of conquered tribes and client states. It is a place of abundant sun, raw wealth, and brutal exploitation, where the colonists grow rich and the subjugated natives nurse a long, smoldering resentment.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: ["southern-continent", "balam", "geography", "colony", "fifth-epoch"],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "balam-colonies",
    title: "East Balam & West Balam — The Colonies",
    category: "location",
    content: `After the Balam Empire fell, its crown passed to the North — to Loen's Augustus royal house — and its lands were carved into two great colonies. East Balam is the Loen Kingdom's prize, a contested ground the Feysac Empire has fought it over for years; beneath its plantations and garrisons a secret army still worships the dead god and dreams of resurrecting the empire and driving the foreigners into the sea. West Balam is the Intis Republic's holding, a wilder country mostly of rainforest, more lawless than the East, where the old traditions of slavery and blood-sacrifice were never fully stamped out — its ports Pylos and harbours and the jungle-edge town of Tizamo strung between the trees. In both, the native death-customs persist openly enough to unsettle the colonists: the dead carried to burial in coffins, ancestor-bones kept in the home, and the white feathers of the old feathered-serpent god worn as marks of standing. To a Loen gentleman it is a land of "kind and obedient servants"; to the Balam people it is occupation.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: [
      "southern-continent",
      "balam",
      "east-balam",
      "west-balam",
      "colony",
      "fifth-epoch",
    ],
    tokenCount: 245,
    narratorOnly: false,
  },
  {
    slug: "southern-continent-tribes",
    title: "The Tribes of the Southern Continent",
    category: "location",
    content: `The native peoples of the Southern Continent are tribes scattered through jungle and desert, organized around shamanistic leaders — spirit-warlocks who speak with the dead and the spirits — and bound by a faith far older than the colonists who now rule them. Their oldest god was Death itself, so their whole way of life is steeped in the grave: they keep the bones of their ancestors close, bear their dead to rest in coffins, and treat dying not as an ending but as a passage. Some tribes are nocturnal, moving and worshipping by night; their feather-marked relics and altars are dangerous things, prized and feared by the Northern armies that have plundered them. Under colonization the tribes have been conquered, enslaved, and worked on the plantations and in the mines, sold as servants and sacrificed to the colonists' greed — and so, beneath the obedient surface the colonists prize, runs a current of hatred and revolt that the death-faith and the resurgent empire-cult alike know how to stir.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: [
      "southern-continent",
      "balam",
      "tribes",
      "shamanism",
      "native-belief",
      "fifth-epoch",
    ],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "balam-star-highlands",
    title: "The Star Highlands & the Client Kingdoms",
    category: "location",
    content: `Beyond the two Balams the Southern Continent runs on into a patchwork of conquered and client lands. The Star Highlands hold the Highlands Kingdom, a native realm raised after the empire's fall and now kept on a short leash as a satellite state under heavy Loen and Intis control — its founder-king's daughter, Reinette Tinekerr, a name spoken with weight in its halls, and the Rose School of Thought quietly woven through its affairs. South and inland lie the Haagenti Plains, and the Paz Valley, where the Paz Kingdom rose in the power-vacuum the dead god left behind only to be destroyed by Loen and Intis together. Where faith in the old death-god has faded, the dead do not always rest: there have been seasons when the undead plagued these regions and emptied them. It is a continent of borders drawn by foreign hands, of native crowns reduced to puppets, and of old powers still stirring in the back-country the colonists have never truly tamed.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: [
      "southern-continent",
      "balam",
      "star-highlands",
      "highlands-kingdom",
      "geography",
      "fifth-epoch",
    ],
    tokenCount: 230,
    narratorOnly: false,
  },
  {
    slug: "berserk-sea",
    title: "The Berserk Sea",
    category: "location",
    content: `The Berserk Sea is the storm-wracked water that walls the Southern Continent off from the North — the topmost of the Five Seas, and the one barrier every traveller to the colonies must cross. It was not always there: it was torn open by catastrophe at the end of the Fourth Epoch, when the death-god the South had worshipped was slain and his dying ruined the ocean. Now it churns with ceaseless thunder and lightning, a chaotic magnetism that sends compass-needles spinning and renders even wireless telegraphs all but useless, and storms that rise without warning. Only a handful of sea-routes are reckoned passable at all, and every voyage across is long, costly, and dangerous; ships are lost to it every season. It is why the Balam colonies feel so remote from the mainland that rules them — weeks of perilous water lie between — and why the sailors who run the crossing are a breed apart. Among them an old story persists: that the dead god's tomb lies somewhere beneath the raging deep.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: [
      "southern-continent",
      "balam",
      "berserk-sea",
      "geography",
      "barrier",
      "fifth-epoch",
    ],
    tokenCount: 240,
    narratorOnly: false,
  },
  {
    slug: "balam-empire-ruins",
    title: "The Ruins of the Balam Empire",
    category: "location",
    content: `Scattered the length of the Southern Continent stand the ruins of the empire that once ruled it all: the broken step-pyramids, drowned temples, and great mausolea of the Balam Empire of the death-god, swallowed now by jungle or half-buried in the plains. Their stones are carved everywhere with the feathered serpent that was the dead god's sign, and their tombs were built to honour death above all things — so they are rich with grave-goods and old sealed relics, and they draw the greedy and the devout in equal measure: colonial expeditions, orthodox-church investigators, relic-hunting adventurers, and the death-cult that holds the sites holy. Near Tizamo in West Balam a tomb a thousand years old is famed for an ancient death-mask sought by stranger hands than archaeologists'. The colonial powers cart off what they can pry loose; the natives guard what they can; and in the deep jungle some of the old empire's tombs have never been opened at all, waiting in the green dark for whoever is fool enough to find them.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: ["southern-continent", "balam", "balam-empire", "ruins", "fifth-epoch"],
    tokenCount: 240,
    narratorOnly: false,
  },
  {
    slug: "death-undersea-mausoleum",
    title: "The Death-God's Tomb Beneath the Berserk Sea",
    category: "location",
    content: `Beneath the raging Berserk Sea, the sailors' story runs, lies the tomb of Death himself — and the story is true. When the orthodox gods united and slew the Underworld Emperor at the close of the Fourth Epoch, the same catastrophe that drowned the sea hid his corpse and his legacy somewhere in its depths, sealed away from any but one who carries the right key. To raise it would be to lay hands on the inheritance of a Sequence-0 god of death — and, the death-cult believes, the means to bring the first Underworld Emperor back into the world. The Numinous Episcopate covets it above all things, for it is the keystone of their long work of resurrection; and the undying son of the dead god is said to know the sunless ways down to it. The Church of the Evernight Goddess, who took the authority over death for her own when the old god fell, would drown the whole continent before she let that tomb be opened.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [4],
    tags: [
      "southern-continent",
      "balam",
      "berserk-sea",
      "death-pathway",
      "secret",
      "fifth-epoch",
    ],
    tokenCount: 220,
    narratorOnly: true,
  },
];
