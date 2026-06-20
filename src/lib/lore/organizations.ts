import type { LoreEntry } from "./types";

export const ORGANIZATION_LORE: LoreEntry[] = [
  {
    slug: "nighthawks-overview",
    title: "Nighthawks — Overview",
    category: "organization",
    content: `The Nighthawks are the official Beyonder division of the Church of the Evernight Goddess. They function as a supernatural investigation and enforcement unit, handling incidents involving uncontrolled Beyonders, cursed artifacts, undead manifestations, and other threats that fall under the Evernight Goddess's domain: darkness, night, sleep, and death. Nighthawk teams are stationed in every major city across the Loen Kingdom, operating under cover identities — typically as security companies or private detective agencies. Their mandate is threefold: investigate supernatural incidents, contain or destroy dangerous artifacts and entities, and maintain the secrecy of the Beyonder world from ordinary citizens. Nighthawks are authorized to use lethal force against threats and carry both conventional firearms and mystical equipment. The organization has a military-style hierarchy with captains leading city-level teams, reporting through bishops to the church's central command. Members are recruited from church faithful who show aptitude, and they primarily follow the Sleepless (Darkness) pathway, though members of other pathways serve in support roles.`,
    epoch: 5,
    npcs: [],
    sequences: [],
    tags: ["nighthawks", "evernight-goddess", "beyonder-organization", "law-enforcement"],
    tokenCount: 220,
  },
  {
    slug: "nighthawks-tingen-team",
    title: "Nighthawks — Tingen Team",
    category: "organization",
    content: `The Tingen Nighthawks team operates out of Blackthorn Security Company on Zouteland Street. Led by Captain Dunn Smith, the team consists of roughly a dozen members, making it a standard-sized regional unit. The team handles all supernatural incidents in Tingen City and the surrounding Awwa County. Key members include Dunn Smith (Captain, Sequence 7 Nightmare), Leonard Mitchell (Sequence 9 Sleepless, later Sequence 8), Klein Moretti (Sequence 9 Seer, the Fool pathway — an unusual assignment since the Fool pathway is not native to the Nighthawks), Old Neil (team historian and artificer), and Daly Simone (Sequence 7 Spirit Medium from the Death pathway, on secondment). The team's daily operations involve monitoring reports of unexplained deaths, ghost sightings, and artifact smuggling; conducting investigations; performing containment rituals; and filing classified reports with the diocese. The Tingen team is considered a quiet posting compared to Backlund, though several major incidents during the narrative period — including the Antigonus Family Notebook case and the Ince Zangwill betrayal — dramatically escalate the danger.`,
    epoch: 5,
    city: "tingen",
    npcs: ["Dunn Smith", "Leonard Mitchell", "Klein Moretti", "Old Neil", "Daly Simone"],
    sequences: [9, 8, 7],
    tags: ["nighthawks", "tingen", "team-composition"],
    tokenCount: 245,
  },
  {
    slug: "nighthawks-procedures",
    title: "Nighthawks — Standard Procedures",
    category: "organization",
    content: `Nighthawk operations follow strict protocols designed to minimize risk and maintain secrecy. Investigations begin with preliminary reports from informants, police contacts, or church sources. Team members are dispatched in pairs for routine investigations, with full-team deployment reserved for confirmed Beyonder-level threats. Standard equipment includes revolvers, holy water blessed by the Evernight Goddess, containment seals, and basic ritual materials. When encountering uncontrolled Beyonders or aberrations, the protocol is containment first, elimination if containment fails. All recovered artifacts are logged and stored in sealed evidence vaults, with particularly dangerous items sent to the diocese's central vault. After each operation, detailed reports are filed and all civilian witnesses are managed — through obfuscation, cover stories, or in extreme cases, memory-altering rituals performed by higher-sequence members. Nighthawks are forbidden from revealing their true nature to civilians, using Beyonder abilities in public view, or retaining confiscated artifacts for personal use. Violations are treated as potential signs of corruption or loss of control and trigger immediate internal review.`,
    epoch: 5,
    npcs: [],
    sequences: [],
    tags: ["nighthawks", "protocols", "operations", "secrecy"],
    tokenCount: 220,
  },
  {
    slug: "mandated-punishers-tingen",
    title: "Mandated Punishers — Tingen Presence",
    category: "organization",
    content: `The Mandated Punishers are the Beyonder division of the Church of the Lord of Storms, responsible for supernatural incidents related to maritime activity, weather phenomena, and the Tyrant pathway. In Tingen, they maintain a smaller presence than the Nighthawks, primarily operating near the Tussock River docks and handling cases involving smuggled Beyonder materials arriving by water, sea-creature manifestations, and conflicts between sailor Beyonders. Their jurisdiction sometimes overlaps with the Nighthawks, creating inter-organizational tension. The Mandated Punishers have a reputation for being more aggressive and direct than the Nighthawks — their operational style favors rapid force over careful investigation. Their members primarily follow the Sailor (Tyrant) pathway, granting them abilities related to storms, water, and physical combat. The Church of the Lord of Storms emphasizes masculine virtues, martial discipline, and dominion over nature, which shapes the Punishers' culture into a more militant organization compared to the contemplative Nighthawks.`,
    epoch: 5,
    city: "tingen",
    npcs: [],
    sequences: [],
    tags: ["mandated-punishers", "lord-of-storms", "maritime", "beyonder-organization"],
    tokenCount: 210,
  },
  {
    slug: "machinery-hivemind-tingen",
    title: "Machinery Hivemind — Tingen Presence",
    category: "organization",
    content: `The Machinery Hivemind is the Beyonder division of the Church of the God of Steam and Machinery. In Tingen, they are the smallest of the three official Beyonder organizations, focused on cases involving industrial accidents with supernatural causes, malfunctioning mystical machinery, and the Savant pathway. Their members tend to be technically minded, often with engineering or scientific backgrounds, and they approach supernatural problems with an analytical methodology. The Hivemind's unique ability is a form of collective consciousness — members can share information and coordinate through a mystical network that connects their minds, giving them superior communication and coordination in the field. In Tingen's industrial landscape, the Hivemind monitors factories and workshops for signs of Beyonder contamination in manufactured goods and investigates cases where industrial processes accidentally interact with supernatural forces. Their relationship with both the Nighthawks and Mandated Punishers is generally cooperative but bureaucratically distant, with each organization guarding its jurisdictional boundaries.`,
    epoch: 5,
    city: "tingen",
    npcs: [],
    sequences: [],
    tags: ["machinery-hivemind", "god-of-steam", "industrial", "beyonder-organization"],
    tokenCount: 210,
  },
  {
    slug: "psychology-alchemists-overview",
    title: "Psychology Alchemists — Overview",
    category: "organization",
    content: `The Psychology Alchemists are a semi-secret organization specializing in the Visionary pathway. They present themselves as a scholarly society dedicated to understanding the human mind through a blend of psychology, philosophy, and mystical practice. Their members include academics, doctors, and upper-class intellectuals who study mental phenomena, hypnosis, and the nature of consciousness. For aspiring Beyonders of the Visionary pathway, the Psychology Alchemists are one of the primary sources of potion formulas and advancement guidance outside the orthodox churches. However, the organization harbors a dark secret: it is a shadow subsidiary of the Twilight Hermit Order, controlled by the Angel of Imagination, Adam. Many rank-and-file members are unaware of this connection and genuinely believe in the organization's academic mission. The Psychology Alchemists operate through local chapters in major cities, including a presence in Tingen that becomes relevant when the narrative explores Audrey Hall's storyline and the broader conspiracy surrounding the Visionary pathway.`,
    epoch: 5,
    npcs: ["Audrey Hall"],
    sequences: [9, 8, 7, 6, 5],
    pathway: "visionary",
    tags: [
      "psychology-alchemists",
      "visionary-pathway",
      "secret-organization",
      "twilight-hermit-order",
    ],
    tokenCount: 225,
  },
  {
    slug: "aurora-order-overview",
    title: "Aurora Order — Overview",
    category: "organization",
    content: `The Aurora Order is a fanatical secret organization that worships the "True Creator," an entity connected to the ancient Sun God. Their members are often mentally unstable Beyonders who have been driven partially mad by their abilities or by direct exposure to the True Creator's influence. The Order seeks to bring about their god's physical descent into the world, believing this will usher in an age of divine truth. In Tingen, the Aurora Order operates clandestinely, recruiting from the margins of society — desperate individuals, failed Beyonders, and those who have been rejected by the orthodox churches. Their activities include terrorist attacks against church targets, attempts to steal powerful artifacts, and conducting dangerous rituals. The Aurora Order poses a recurring threat in the Tingen narrative, with several members appearing as antagonists. Their connection to the deeper conspiracy — that the True Creator and the Angel of Imagination Adam are both aspects of the ancient Sun God — only becomes clear much later in the story. For gameplay purposes, they serve as a dangerous faction that players may encounter as enemies.`,
    epoch: 5,
    city: "tingen",
    npcs: [],
    sequences: [],
    tags: ["aurora-order", "true-creator", "antagonist", "secret-organization"],
    tokenCount: 225,
  },
  // ── Numinous Episcopate (world build-out 3, issue #132) ──
  // Corrected against the dump: a Death-revival secret society ORIGINATING on
  // the Southern Continent (Eggers Family / Church of Death remnants), spread
  // into the Northern Continent. Surface existence is ungated rumour
  // (narratorOnly false); the true goal is deep spoiler — narratorOnly + gated.
  // Org lore is not injected by selectCuratedLore (corpus/RAG + integrity only),
  // so these never leak into a mainland character's curated prompt.
  {
    slug: "numinous-episcopate-overview",
    title: "Numinous Episcopate — Overview",
    category: "organization",
    content: `The Numinous Episcopate is a secret society of the Death pathway that originated on the Southern Continent, grown from remnants of the old Church of Death and the legacy of the Eggers family, and has since spread its quiet influence into the Northern Continent where the orthodox churches hold sway. To the wider Beyonder world it is little more than a rumour: a scattered brotherhood preoccupied with death, mourning, and the boundary the living are not meant to cross, surfacing in tales of grave-robbings, hushed funerary rites, and members who treat the dead as unfinished business. Where it is known at all it is treated as a heresy to be watched rather than an open enemy, for it keeps to shadows and speaks of its true purposes to no one outside its inner ranks. Its members recognise one another by signs the churches have never fully catalogued.`,
    epoch: 5,
    npcs: [],
    sequences: [],
    tags: [
      "numinous-episcopate",
      "death-pathway",
      "secret-organization",
      "southern-continent",
    ],
    tokenCount: 190,
    narratorOnly: false,
  },
  {
    slug: "numinous-episcopate-true-goal",
    title: "Numinous Episcopate — The True Goal",
    category: "organization",
    content: `Behind its funerary face the Numinous Episcopate pursues a single forbidden end: the revival of the dead at a scale the world has not seen since the elder ages, and with it the usurpation of authority over death itself. Its inner doctrine holds that the present custodianship of death — embodied above all in the Church of the Evernight Goddess and her dominion over night, secrets, and the dead — is a throne wrongfully held, and that the Episcopate's hidden masters mean to take it. To that purpose they gather Death-pathway Beyonders, sealed artifacts, and the bodies and Beyonder characteristics that a true resurrection would demand, working toward a rite the orthodox churches would burn the continent to stop. It is this goal — not its grave-side rituals — that makes the Episcopate one of the most dangerous heresies alive, and the reason it never shows the world its real face.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: [
      "numinous-episcopate",
      "death-pathway",
      "secret-organization",
      "evernight-goddess",
      "spoiler",
    ],
    tokenCount: 200,
    narratorOnly: true,
  },
  // ── Backlund deep-dive (world build-out 4, issue #133) ──
  // The capital's Nighthawks division is Backlund-LOCAL and city-keyed
  // ("backlund"). The Rose School of Thought is NOT Backlund-based — it is a
  // cross-cutting Chained-pathway secret society of the wider world (its
  // Temperance refugees are the Backlund hook, carried by the Sharron/Maric NPC
  // entry) — and the Tarot Club convenes "above the gray fog", a profound
  // Fool-pathway secret. So both the Rose School and the Tarot Club carry NEITHER
  // a city NOR a pathway key: selectCuratedLore would otherwise inject them into
  // every Backlund or every same-pathway character and leak them. They live here
  // for corpus/RAG + integrity only (the Numinous Episcopate pattern).
  //
  // CANON NOTE (verified against corpus/wiki — see CLAUDE.md): the Rose School
  // worships the Mother Tree of Desire (Indulgence) / the Primordial Moon, on the
  // Chained and Moon pathways, riven by an Indulgence-vs-Temperance schism. It has
  // NOTHING to do with the Evernight Goddess (an earlier draft and the issue's
  // hint were both wrong); the corpus is authoritative.
  {
    slug: "rose-school-of-thought-overview",
    title: "Rose School of Thought — Overview",
    category: "organization",
    content: `The Rose School of Thought is a secret society of the Beyonder world, infamous in hushed rumour as a cult of unbound desire. It began long ago as an order devoted to TEMPERANCE — the disciplined restraint of want — but its god was corrupted by the Mother Tree of Desire, and the dominant Indulgence faction that grew from the ruin now preaches the opposite: the release and gratification of every appetite, sealed in blood and depravity. Drawn largely from the Chained pathway, with a faction of moon-worshippers sheltering uneasily among them, the School keeps to the shadows of the wider world and is reckoned by the orthodox Churches a heresy to be hunted rather than an open enemy. Where it surfaces it leaves ruin and willing converts behind it in equal measure, and it has no love for the secrecy-keeping Churches that would see it burned.`,
    epoch: 5,
    npcs: [],
    sequences: [],
    tags: [
      "rose-school-of-thought",
      "secret-organization",
      "chained-pathway",
      "mother-tree-of-desire",
    ],
    tokenCount: 200,
    narratorOnly: false,
  },
  {
    slug: "rose-school-of-thought-factions",
    title: "Rose School of Thought — The Schism of Desire",
    category: "organization",
    content: `Behind the rumour the Rose School is split by a long and bloody schism. The INDULGENCE faction, corrupted by and devoted to the Mother Tree of Desire, holds the School and hunts all who resist it; a separate band, the Primordial Moon faction of the Moon pathway, shelters uneasily within it. Against them once stood the TEMPERANCE faction — keepers of the order's original creed of restraint — who were shattered in a surprise attack and driven into exile. Its survivors, among them Reinette Tinekerr and her students Sharron and Maric, fled across the world and took protection under the mysterious founder of the Tarot Club, "The Fool," joining the Church of the Fool rather than be consumed by the Mother Tree. The School's war over desire and restraint is one of the quiet fronts of the Beyonder world's larger struggle, and the Indulgence faction's reach now touches the Devil families and other servants of desire.`,
    epoch: 5,
    npcs: ["Reinette Tinekerr", "Sharron", "Maric"],
    sequences: [4],
    tags: [
      "rose-school-of-thought",
      "secret-organization",
      "chained-pathway",
      "temperance",
      "mother-tree-of-desire",
      "spoiler",
    ],
    tokenCount: 205,
    narratorOnly: true,
  },
  {
    slug: "backlund-nighthawks-team",
    title: "Nighthawks — Backlund Division",
    category: "organization",
    content: `The Backlund Nighthawks are the Church of the Evernight Goddess's Beyonder arm in the capital, and they dwarf a provincial posting like Tingen's. Where Tingen fields a single dozen-strong team, Backlund supports multiple teams under the capital's bishops, coordinating across a metropolis of five million through cover identities, safehouses, and the diocese's central vault of sealed artifacts. Their casework is heavier and far more dangerous: organised cults, rogue high-Sequence Beyonders, smuggling rings moving curios through the docklands, and incidents that reach up into Parliament and the noble houses themselves. The capital's Nighthawks work alongside — and sometimes against the jurisdiction of — the Mandated Punishers of the Lord of Storms and the Machinery Hivemind of the God of Steam, with whom they share the city by uneasy treaty. For an ambitious or unlucky Beyonder, Backlund is where the Nighthawks' reach is longest and the cost of being noticed is highest.`,
    epoch: 5,
    city: "backlund",
    npcs: [],
    sequences: [9, 8, 7],
    tags: ["nighthawks", "evernight-goddess", "backlund", "team-composition"],
    tokenCount: 215,
  },
  {
    slug: "tarot-club-origins",
    title: "The Tarot Club — Origins & the Meeting Above the Gray Fog",
    category: "organization",
    content: `The Tarot Club is a tiny, intensely secret gathering convened "above the gray fog" — in a space beyond the ordinary world, reached only through the ritual of its founder, the masked figure known as The Fool. Its members attend not in the flesh but as summoned presences seated around a long bronze table, and each is known only by the name of a tarot card — The Fool, The Sun, The Star, The Hanged Man, Justice, and others as the circle slowly grows. They never learn one another's true faces, names, or homes unless they choose to share them. What binds them is mutual benefit and a fragile, deepening trust: they trade intelligence, Beyonder ingredients, formulas, and warnings none could gather alone, each profiting from the others' distant corners of the world. The Club's very existence is among the best-kept secrets of the Beyonder world, and its members guard it as though their lives depend on it — because, very often, they do.`,
    epoch: 5,
    npcs: [],
    sequences: [7],
    tags: ["tarot-club", "the-fool", "secret-organization", "fool-pathway"],
    tokenCount: 210,
    narratorOnly: true,
  },
  {
    slug: "tarot-club-fate",
    title: "The Tarot Club — The Fool and Fate",
    category: "organization",
    content: `To its members the Tarot Club is more than a meeting; it rests on the mystery of its founder. The Fool presents as an ancient, all-knowing deity "who does not truly exist," a being wrapped in the imagery of fate, fortune, and the turning card — and the members, unable to verify the claim and unwilling to test it, treat him with genuine awe. The Club's power feels like the power of fate itself: its summoning ritual reaches across the world without regard for distance, its divinations seem to bend probability, and to sit at its bronze table is to feel oneself caught in a design larger than any single Beyonder. Whether The Fool is the god he appears, a mortal of extraordinary craft, or something stranger between, none of the members can say — and the not-knowing is part of what holds the circle in its careful, fate-bound trust.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: [
      "tarot-club",
      "the-fool",
      "fate",
      "divination",
      "secret-organization",
      "spoiler",
    ],
    tokenCount: 200,
    narratorOnly: true,
  },
];
