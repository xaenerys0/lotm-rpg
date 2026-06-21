import type { LoreEntry } from "./types";

// ---------------------------------------------------------------------------
// Secret organizations & the great Angel Families (world build-out 11, issue
// #140). The social web many start-archetypes hang off. ORG entries only — the
// notable members live as `npc` entries in `npcs.ts` (so the archetype
// name-resolution + the existing NPC machinery see them). All canon corpus-
// verified (wiki pages: Tarot Club + /List of Members, Twilight Hermit Order,
// Demoness Sect, and the Abraham/Amon/Antigonus/Augustus/Andariel/Beria/Castiya/
// Einhorn/Eggers Family pages + /List of Members; List of Families).
// ---------------------------------------------------------------------------
//
// CANON CORRECTIONS honoured (corpus outranks the issue's parentheticals):
//   • "The World" is NOT a separate person — it is Klein/The Fool's own second
//     seat. "Death" (Azik Eggers) is a PLANTED FALSE RUMOR, not a real member.
//   • Abraham = Door pathway, founded by Bethel Abraham ("Mr. Door"); it only
//     LATER converted its faith to the Fool (it was not "founded by Mr. Fool").
//   • Andariel & Beria are ABYSS-pathway Devil families (not "time"/"Worm of
//     Time"; the Worm of Time is Error Seq 1, Amon's birth sequence).
//   • Cattleya ("The Hermit") is a Hermit-pathway Beyonder, NOT an Andariel.
//
// LEAK CONTROL (DoD): these are the DEEPEST spoilers — Tarot identities, family
// true natures. Every entry is `epoch: 5`, `narratorOnly: true`, and heavily
// `sequences`-gated ([4], the Saint tier), and carries NO `city`/`pathway` key —
// so `selectCuratedLore` NEVER injects them (cross-cutting secret, corpus/RAG +
// integrity only, the Numinous-Episcopate / `*-church-inner-secret` pattern).
// The publicly-knowable faces (the royal houses, the fallen empires) already live
// ungated in the region/history lore; these entries are the hidden reality.
// No duplication: Rose School (#133) and Aurora Order (#132/#135) already exist
// and are cross-linked by name, not re-authored.

export const SECRET_SOCIETIES_LORE: LoreEntry[] = [
  // ── Secret organizations ──
  {
    slug: "tarot-club-roster",
    title: "The Tarot Club — The Circle of Cards",
    category: "organization",
    content: `The Tarot Club's members are known to one another only by the cards they hold. It was founded by three — The Fool (its masked, fate-wrapped convener), Justice, and The Hanged Man — and grew into a small circle of Major Arcana: Justice is Audrey Hall, a Visionary noblewoman of Backlund; The Hanged Man is Alger Wilson, a sea-faring Beyonder of the storm-faith who began on the Tyrant path; The Sun is Derrick Berg of the City of Silver; The Magician is Fors Wall of the old Abraham line, who walks the Door; The Moon is Emlyn White, a Sanguine of the scarlet moon; The Hermit is Cattleya, a pirate-queen of the far seas; The Star is Leonard Mitchell, a Darkness Beyonder of the Evernight Church; and Judgment is the justiciar Xio Derecha. They never see one another's true faces unless they choose, and trade intelligence, ingredients, and formulas none could gather alone. Two cautions for any who study them: "The World" is no separate member but the Fool's own second seat, and the outside churches' belief that "Death" sits among them is a false rumour the Star planted on purpose.`,
    epoch: 5,
    npcs: [
      "Audrey Hall",
      "Alger Wilson",
      "Derrick Berg",
      "Fors Wall",
      "Emlyn White",
      "Cattleya",
      "Leonard Mitchell",
    ],
    sequences: [4],
    tags: ["tarot-club", "the-fool", "secret-organization", "roster", "spoiler"],
    tokenCount: 255,
    narratorOnly: true,
  },
  {
    slug: "twilight-hermit-order",
    title: "The Twilight Hermit Order",
    category: "organization",
    content: `The Twilight Hermit Order is one of the two secret powers said to rival the orthodox churches and the royal families — and the more shadowed of the two. It was founded by Adam, the eldest son of the Ancient Sun God, and it works toward a single hidden end: to guide history from behind the curtain so that the Original Creator, the fallen Ancient Sun God, may one day resurrect. It keeps a Second Blasphemy Slate, the slab that records all twenty-two pathways, and it asks its initiates to take up the Visionary, Sun, White Tower, or Tyrant paths unless they come already Beyonders of another. Its true strength is placement: its members sit in high offices of the churches, the militaries, and the noble houses, and from there they nudge wars, assassinations, and ascensions to fall as the Order wills. It gathers in a dreamscape that spans the continent, bears an old grudge against the True Creator, and guards its name so jealously that to speak it aloud is to invite quiet elimination. Among those it has counted are the transmigrator-emperor Roselle Gustav and the Visionary Hermes.`,
    epoch: 5,
    npcs: ["Roselle Gustav", "Hermes"],
    sequences: [4],
    tags: [
      "twilight-hermit-order",
      "ancient-sun-god",
      "secret-organization",
      "blasphemy-slate",
      "spoiler",
    ],
    tokenCount: 255,
    narratorOnly: true,
  },
  {
    slug: "demoness-sect",
    title: "The Demoness Sect",
    category: "organization",
    content: `The Demoness Sect is the present-day heir of the Fourth-Epoch Demoness Family, and it controls the Demoness Pathway. It worships the Primordial Demoness, the being its doctrine holds to be the true inheritor of the Creator — the first thing born of the Chaos and the last Ender of all things. Its matriarch is Judith, the Demoness of Gray, daughter of the Blood Emperor Alista Tudor and the Primordial Demoness herself. The Sect is, by the nature of its path, wholly female: fathers and sons alike are made women as they climb the Demoness sequences, daughters who cannot walk it are given away, and — strangest of all — it despises and destroys any true-born female Demoness it finds, for the Primordial Demoness suffers no rival. Its affairs are run by thirteen high Demonesses each titled by a colour, a name earned only on reaching the Sequence of Unaging. It is a deadly enemy of the Tarot Club; in the end, after the Primordial Demoness falls, its remnants are folded into the Church of the Ruler of Calamity.`,
    epoch: 5,
    npcs: ["Judith"],
    sequences: [4],
    tags: [
      "demoness-sect",
      "demoness-pathway",
      "primordial-demoness",
      "secret-organization",
      "spoiler",
    ],
    tokenCount: 250,
    narratorOnly: true,
  },
  // ── The great Angel Families ──
  {
    slug: "abraham-family",
    title: "The Abraham Family",
    category: "organization",
    content: `The Abraham Family was one of the most powerful noble houses of the Fourth-Epoch Tudor Empire, and it holds the full formula of the Door Pathway. Its ancestor was Bethel Abraham — "Mr. Door" — a King of Angels of the Door who, in the elder Warring Era, was reckoned the angel likeliest of all to become a god. For that ambition he was undone: banished into a sealed space of storms and darkness by the Evernight Goddess and the Lord of Storms in the War of the Four Emperors, and his endless cries from that prison became a curse upon his blood, driving his descendants to terrifying madness whenever they reached for the high sequences. Only when Mr. Door finally died did the curse lift. In the present day the surviving family has turned its faith to the Fool and stands among the Church of the Fool; its sign is a set of layered doors drawn in simple lines. It now trains promising outsiders in the Door as well as its own — Fors Wall, the Tarot Club's Magician, learned her art as a disciple of the family — and it was betrayed from within by the traitor Botis, who carried a stolen relic to the worshippers of the True Creator.`,
    epoch: 5,
    npcs: ["Bethel Abraham", "Fors Wall"],
    sequences: [4],
    tags: [
      "abraham-family",
      "door-pathway",
      "angel-family",
      "church-of-the-fool",
      "spoiler",
    ],
    tokenCount: 250,
    narratorOnly: true,
  },
  {
    slug: "amon-family",
    title: "The Amon Family",
    category: "organization",
    content: `The Amon Family holds the entire formula of the Error Pathway, and it guards a secret stranger than any other house keeps: every member of the family is Amon. They are not kin to their founder but avatars of him — one being wearing many lives — so that to deal with any Amon is to deal with them all. Their ancestor is Amon himself, the Angel of Time, a King of Angels of the Third Epoch and a child of the Ancient Sun God; the family is rumoured a line of blasphemers who claim descent from that dead god. They were broken and scattered in the War of the Four Emperors, weakened ever since. Their emblem is a sign of time — a grey-white disc divided into twelve uneven segments, each half-swallowed in shadow, a black needle laid across it like the hand of a broken clock. To meet an Amon is to suspect that the trickster across the table has met you before, in a face you will never place.`,
    epoch: 5,
    npcs: ["Amon"],
    sequences: [4],
    tags: ["amon-family", "error-pathway", "angel-family", "amon", "spoiler"],
    tokenCount: 235,
    narratorOnly: true,
  },
  {
    slug: "antigonus-family",
    title: "The Antigonus Family",
    category: "organization",
    content: `The Antigonus Family is remembered, where it is remembered at all, by two words: strange, and terrifying. Its founder Antigonus was a descendant of the Annihilation Demonic Wolf Flegrea and brother to the Mother of the Sky, and he raised the ancient Nation of the Evernight on the Fool Pathway before the orthodox powers turned on his house. The Church of the Evernight Goddess destroyed the family utterly. Its ancestor went mad and was sealed away in the Foggy Town atop the Hornacis Mountain Range, where what remained of him became a crawling mass of transparent maggots — for he could not suppress the Primordial will of the Celestial Worthy of Heaven and Earth that woke inside him. The bloodline guttered out entirely with the death of its last descendant, an ordinary man named Ray Bieber, and his mother. The family's sign is a single vertical eye worked from many thin lines, and to find that mark is reckoned among the worst of omens.`,
    epoch: 5,
    npcs: ["Antigonus", "Ray Bieber"],
    sequences: [4],
    tags: [
      "antigonus-family",
      "fool-pathway",
      "angel-family",
      "evernight-goddess",
      "spoiler",
    ],
    tokenCount: 240,
    narratorOnly: true,
  },
  {
    slug: "augustus-family",
    title: "The Augustus Family",
    category: "organization",
    content: `To the public the Augustus Family is simply the royal house of the Loen Kingdom; in truth it is an Angel Family, controlling the Justiciar and Black Emperor pathways and devoted in secret to the Lord of Storms. It rose from the angel houses of the old Trunsoest Empire: in the wreckage of the War of the Four Emperors it joined the others in splitting the weakened empire and destroying the royal Trunsoest line, then — with the backing of the Lord of Storms and the Evernight Goddess — raised the Loen Kingdom in its place. Its founder and undying ancestor, William Augustus I, still walks among it as one of its living Angels, alongside Dlink Augustus; a third, the Black Emperor George Augustus III, fell in recent years. Its sign is the Sword of Judgment — two ruby-crowned blades pointed down — and its secret hand reaches through the kingdom's shadow service, MI9. Beneath the crown and the cabinet runs a bloodline far older and more dangerous than any ordinary throne.`,
    epoch: 5,
    npcs: ["William Augustus I", "George Augustus III"],
    sequences: [4],
    tags: [
      "augustus-family",
      "justiciar-pathway",
      "black-emperor-pathway",
      "angel-family",
      "loen-kingdom",
      "spoiler",
    ],
    tokenCount: 250,
    narratorOnly: true,
  },
  {
    slug: "andariel-family",
    title: "The Andariel Family",
    category: "organization",
    content: `The Andariel Family was one of the three great Devil families of the Fourth Epoch — with the Nois and the Beria — and it controls the Abyss Pathway. Its ancestors took the bestowment of the Abyss long ago and worship the evil god the lore names the Dark Side of the Universe, and its members are not merely devil-worshippers but Devils in truth, walking the sequences of Serial Killer and Devil. In the ages since its height the family has fallen far, declining into a vassal of the stronger Nois house; in the present day it has thrown in with the Rose School of Thought, and word among Beyonders is that its own leader is dead — given up, they say, as a sacrifice to something larger. Its known sons are few and grim: Devajo Andariel and his nephew Bram. To deal with an Andariel is to deal with the Abyss itself, and few who do so come away unchanged.`,
    epoch: 5,
    npcs: ["Devajo Andariel", "Bram Andariel"],
    sequences: [4],
    tags: [
      "andariel-family",
      "abyss-pathway",
      "devil-family",
      "rose-school-of-thought",
      "spoiler",
    ],
    tokenCount: 230,
    narratorOnly: true,
  },
  {
    slug: "beria-family",
    title: "The Beria Family",
    category: "organization",
    content: `The Beria Family is the second of the Fourth Epoch's three great Devil families, and like the Andariel it controls the Abyss Pathway and worships the Dark Side of the Universe. "Beria?" a Sanguine once spat at the name — "that crazy family that worships devils? No — they ARE devils." Its members are Devils in the flesh, and its sign is an abstract pentagram crossed with goat's horns. Like the Andariel it has long since declined into a vassal of the Nois house, its old greatness spent. Its most notable son in the present age is Jason Beria, who wore the face of an ordinary banker named Patrick Jason while serving two hidden masters at once — the blood-soaked Blood Sanctify Sect and the shadow-spinning Twilight Hermit Order, for whom he did quiet, lethal work before his death. Where a Beria's coin or counsel turns up, an abyssal bargain is rarely far behind.`,
    epoch: 5,
    npcs: ["Jason Beria"],
    sequences: [4],
    tags: [
      "beria-family",
      "abyss-pathway",
      "devil-family",
      "twilight-hermit-order",
      "spoiler",
    ],
    tokenCount: 225,
    narratorOnly: true,
  },
  {
    slug: "castiya-family",
    title: "The Castiya Family",
    category: "organization",
    content: `To the public the Castiya Family is the royal house of the Feynapotter Kingdom; in truth it is an Angel Family of the Justiciar Pathway, devoted in secret to the Earth Mother. It began as a lesser noble house of the old Solomon Empire, rose under the Trunsoest, and in the aftermath of the War of the Four Emperors joined the families that destroyed the Trunsoest line — then, with the backing of the Earth Mother and the God of Knowledge and Wisdom, raised the Feynapotter Kingdom for its own. It rules that breadbasket realm to this day. Among its living sons is Camus Castiya, a Justiciar Beyonder who keeps the Earth Mother's faith far from home in the colonial patrols of the Southern Continent. Beneath the matriarchal crown of Feynapotter runs the old order-keeping power of the Justiciar's scales, held by a bloodline that has outlasted three empires.`,
    epoch: 5,
    npcs: ["Camus Castiya"],
    sequences: [4],
    tags: [
      "castiya-family",
      "justiciar-pathway",
      "angel-family",
      "feynapotter-kingdom",
      "earth-mother",
      "spoiler",
    ],
    tokenCount: 235,
    narratorOnly: true,
  },
  {
    slug: "einhorn-family",
    title: "The Einhorn Family",
    category: "organization",
    content: `To the public the Einhorn Family is the imperial house of the Feysac Empire; in truth it is an Angel Family of the Red Priest Pathway, devoted to the God of Combat, and it commands the empire's navy and its Sonia Sea Fleet. Its ancestor's soul was bound up long ago with those of Medici and Sauron, the three fusing into a single Red Angel evil spirit; when the Blood Emperor fell, the Einhorn and the Sauron reclaimed their Beyonder inheritance and have been knotted together by marriage ever since. Its living strength is martial and real: the Supreme Commander of the Feysac navy, Awatoma Einhorn, and the imperial-fleet commander Egor Einhorn are of its blood, and Elros Einhorn carries both Einhorn and Sauron lines at once, cousin to the dead Poufer Sauron. Beneath Feysac's cult of strength and height runs the crimson, conquering power of the Red Priest, held by a house that has made war its faith.`,
    epoch: 5,
    npcs: ["Awatoma Einhorn", "Egor Einhorn", "Elros Einhorn"],
    sequences: [4],
    tags: [
      "einhorn-family",
      "red-priest-pathway",
      "angel-family",
      "feysac-empire",
      "god-of-combat",
      "spoiler",
    ],
    tokenCount: 250,
    narratorOnly: true,
  },
  {
    slug: "eggers-family",
    title: "The Eggers Family",
    category: "organization",
    content: `The Eggers Family was the imperial line of the Balam Empire that ruled the Southern Continent in the Fourth Epoch, and it holds the entire formula of the Death Pathway — for the family are the descendants of Salinger, the death-god the histories call "Death," the first Underworld Emperor. When the orthodox gods slew Salinger and the empire fell, a few surviving Eggers founded the secret Numinous Episcopate to work toward their ancestor's resurrection. Its sign is the feathered serpent. Its blood runs on in the present in stranger channels than the Episcopate alone: Azik Eggers, the undying Death Consul who once ruled the empire in the flesh, now keeps a far gentler vigil as the Angel of Death under the Fool; Sia Palenque Eggers, the "Pale-White Empress," leads the Episcopate's Royal Family Faction toward the old throne's revival; and quieter descendants like Iveljsta Eggers have left the death-road entirely, walking the Chained path among the Fool's faithful.`,
    epoch: 5,
    npcs: ["Azik Eggers", "Sia Palenque Eggers", "Iveljsta Eggers", "Salinger"],
    sequences: [4],
    tags: [
      "eggers-family",
      "death-pathway",
      "angel-family",
      "numinous-episcopate",
      "balam-empire",
      "spoiler",
    ],
    tokenCount: 255,
    narratorOnly: true,
  },
];
