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
  // ── Wider Loen Kingdom (world build-out 5, issue #134) ──
  // The Loen Relic Search & Preservation Foundation is a cross-cutting body
  // headquartered in Stoen City, East Chester County — NOT a curated travel
  // city — so it carries NO `city` key (the Numinous Episcopate / Rose School
  // pattern): selectCuratedLore never injects it, and it lives here for corpus/
  // RAG + integrity + the start-archetype tie only. Its public charitable face
  // is ungated; the Compliance Department's true nature as a Beyonder division
  // is the gated spoiler. The Red Gloves likewise carry no city — they are the
  // kingdom-wide elite Nighthawk division, deployed wherever they are needed.
  // The regional Mandated Punishers / Machinery Hivemind presences ARE city-
  // keyed (pritz / constant) so they reach a character actually in that city.
  // CANON NOTE (verified against corpus/wiki — see CLAUDE.md): the Foundation
  // was founded by Audrey Hall through Associate Professor Michelle Deuth on 14
  // April 1350; its Compliance Department is secretly a Beyonder division.
  {
    slug: "loen-relic-foundation-overview",
    title: "Loen Relic Search & Preservation Foundation — Overview",
    category: "organization",
    content: `The Loen Relic Search and Preservation Foundation is a non-profit body devoted to the discovery, study, and preservation of ancient relics, headquartered in Stoen City of East Chester County in the Loen Kingdom. It was established by the young Backlund noblewoman Audrey Hall — working through Associate Professor Michelle Deuth of Stoen University — with a founding gift of money, land, and a manor, and it funds archaeological expeditions, buys up antiquities, and shelters scholars across the kingdom. Its stated purpose is exactly what it appears: to keep the relics of older epochs out of careless hands and in the light of study, and to lend its founder the prestige of a patron of learning. The Foundation is notable, too, for employing a great many women, from its ordinary clerks up to the deputy directors of its departments — unusual for an institution of the age. To the public it is a respectable charity of digs, donations, and dusty notebooks; what passes through its hands, and why its founder cares so much what those digs turn up, is a quieter matter.`,
    epoch: 5,
    npcs: ["Audrey Hall", "Michelle Deuth"],
    sequences: [],
    tags: [
      "loen-relic-foundation",
      "loen-kingdom",
      "east-chester-county",
      "audrey-hall",
      "relic-preservation",
    ],
    tokenCount: 215,
    narratorOnly: false,
  },
  {
    slug: "loen-relic-foundation-compliance",
    title: "Loen Relic Search & Preservation Foundation — The Compliance Department",
    category: "organization",
    content: `Behind the Foundation's charitable face stands its Compliance Department, and it is not what its name suggests. Officially it audits the Foundation's projects for any breach of rule or provision; in truth it is a division of Beyonders, raised quietly by Audrey Hall to handle the abnormal, the dangerous, and the inexplicable that a foundation digging up the relics of older epochs is bound to unearth. The standing rule is plain: should any expedition produce a phenomenon that is terrifying or beyond explanation, the staff are to stop at once and report to Compliance — and Compliance comes. Its deputy directors include the former Backlund lawyer Pacheco Dwayne, a Beyonder of the Black Emperor pathway who prizes order and rule above all, alongside others of capability. To the Foundation's ordinary clerks the Compliance Department is simply the strict office one does not cross; to the Beyonder world it is a private, well-funded, and discreet force answering to one of the Tarot Club's own — a hidden hand reaching wherever the Foundation's diggers turn up something they should not have.`,
    epoch: 5,
    npcs: ["Pacheco Dwayne", "Alicia Tamara", "Audrey Hall"],
    sequences: [5],
    tags: [
      "loen-relic-foundation",
      "compliance-department",
      "beyonder-organization",
      "audrey-hall",
      "spoiler",
    ],
    tokenCount: 215,
    narratorOnly: true,
  },
  {
    slug: "mandated-punishers-pritz",
    title: "Mandated Punishers — Pritz Harbor Presence",
    category: "organization",
    content: `If the Mandated Punishers keep only a small office in inland Tingen, in the naval port of Pritz Harbor they are at their strongest. The Mandated Punishers are the Beyonder arm of the Church of the Lord of Storms, and Pritz is a storm-faith town to its bones — a city of sailors, marines, and dockworkers whose creed is the sea's own. Here the Punishers, not the Nighthawks, are the first hand on any uncanny trouble: smuggled Beyonder materials coming over the water or down through the Hornacis passes, sea-creature manifestations off the cold roadstead, drowned things that will not stay drowned, and rogue Beyonders among the fleet's crews. Their style suits the town — direct, aggressive, more inclined to force than to the Nighthawks' patient investigation — and their members run heavily to the Sailor (Tyrant) pathway, with its dominion over storm, water, and the body. The harbour's heavy garrison and real night-watch give them cover and muscle both, and a quiet understanding keeps their jurisdiction and the Nighthawks' from colliding more than the sea already does.`,
    epoch: 5,
    city: "pritz",
    npcs: [],
    sequences: [],
    tags: [
      "mandated-punishers",
      "lord-of-storms",
      "pritz",
      "maritime",
      "beyonder-organization",
    ],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "machinery-hivemind-constant",
    title: "Machinery Hivemind — Constant City Presence",
    category: "organization",
    content: `In the industrial Wind City of Constant the Machinery Hivemind comes into its own. The Hivemind is the Beyonder division of the Church of the God of Steam and Machinery, and Constant — second city of the Loen Kingdom, all blast furnaces and rolling-mills and the strong popular faith of the working engineer — is the Church of Steam's great seat outside the capital. Here the Hivemind is no afterthought as it is in Tingen but a serious power: technically-minded Beyonders of the Savant pathway who pass for the metallurgists, machinists, and inventors they walk among, watching the foundries for supernatural contamination in manufactured iron, for mystical machinery run amok, and for the industrial accidents whose true causes the coroners can never name. Their signature is the shared mind — a mystical network through which members pool what they see and coordinate without a word — which suits a city the size of Constant, where a single team could never watch every workshop alone. Among the chimneys and the union halls, the line between an ingenious invention and an uncanny one runs very thin, and it is the Hivemind that decides which is which.`,
    epoch: 5,
    city: "constant",
    npcs: [],
    sequences: [],
    tags: [
      "machinery-hivemind",
      "god-of-steam",
      "constant",
      "industrial",
      "beyonder-organization",
    ],
    tokenCount: 225,
    narratorOnly: false,
  },
  {
    slug: "red-gloves-division",
    title: "The Red Gloves — Elite Nighthawk Division",
    category: "organization",
    content: `The Red Gloves are the elite division of the Nighthawks, promoted from the ordinary city teams of the Church of the Evernight Goddess and seated in the great Backlund diocese, but they belong to no single city. Their mission is twofold: to reinforce any Nighthawk team across the Loen Kingdom that has called for help against a threat beyond it, and to hunt down and arrest the worst evildoers of the Beyonder world without the jurisdictional limits that bind a local team. Where a city team handles its own patch, the Red Gloves go where the danger is — into Tingen for a betrayal too large for Captain Dunn Smith's dozen, out to the industrial north of Constant for an incident the local teams could not close, anywhere a sealed report turns urgent. Their members are seasoned, higher-Sequence Beyonders, the captain among them the poet and Sleepless Leonard Mitchell, raised from the Tingen team to the Red Gloves and known in quieter circles as "The Star." To the wider Church they are the long arm reserved for what the ordinary Nighthawks cannot reach.`,
    epoch: 5,
    npcs: ["Leonard Mitchell"],
    sequences: [],
    tags: ["nighthawks", "red-gloves", "evernight-goddess", "elite", "law-enforcement"],
    tokenCount: 215,
    narratorOnly: false,
  },
  // ── Intis Republic (world build-out 6, issue #135) ──
  // The Church of the Eternal Blazing Sun's Trier structure + named members
  // (city-keyed "trier" so it reaches a character in the capital; surface
  // public knowledge of a great orthodox Church). The Aurora Order's TRUE
  // NATURE is the gated depth: a cross-cutting high-concealment secret (domain
  // Loen AND Intis), so — like the Numinous Episcopate's true goal — it carries
  // NO city and NO pathway key (never curated-injected) and is narratorOnly +
  // sequence-gated. CANON NOTE (corpus-verified, see CLAUDE.md): the Aurora
  // Order's primary pathway is the HANGED MAN (not the Sun); it worships the
  // True Creator, a Sequence 0 Hanged Man born from the corpse of the Ancient
  // Sun God — the existing `aurora-order-overview` stays the ungated surface.
  {
    slug: "blazing-sun-church-members",
    title: "Church of the Eternal Blazing Sun — Trier Structure & Members",
    category: "organization",
    content: `In Trier the Church of the Eternal Blazing Sun is no distant authority but the visible spiritual power of the capital, ruled from Saint Viève Cathedral in the Island District. The Trier diocese is overseen by Cardinal Plessy Descartes, an elderly, radiant churchman about whom the very shadows seem to thin; beneath the cardinals stand the deacons, priests, and the white-and-gold-robed clergy who greet the dawn with raised heads and outspread arms. The Church reveres Saint Viève — the one female angel named in its Bible — as a guardian angel of Trier, and her cathedral is the heart of the city's sun-worship. Its stern hand is the Inquisition: its Purifiers hunt heresy, corruption, and the servants of the Outer Deities, and a senior Purifier like the Deacon Angoulême de François may hold civic power too, doubling as a Deputy Assistant Commissioner of Trier's police. The Church controls the Sun pathway and keeps poor relations with the Churches of the Lord of Storms and of the God of Knowledge and Wisdom; in the Republic it shares the faith of the people with the Church of the God of Steam and Machinery.`,
    epoch: 5,
    city: "trier",
    npcs: ["Plessy Descartes", "Viève", "Angoulême de François"],
    sequences: [],
    tags: [
      "organization",
      "eternal-blazing-sun",
      "sun-pathway",
      "trier",
      "inquisition",
      "religion",
    ],
    tokenCount: 245,
    narratorOnly: false,
  },
  {
    slug: "aurora-order-true-nature",
    title: "The Aurora Order — The True Creator's Cult",
    category: "organization",
    content: `Behind the newspapers' picture of a mere terrorist cult, the Aurora Order is a secret organisation perhaps two or three centuries old that worships the True Creator — and its true nature is far stranger than arson and assassination. The Order's primary pathway is the Hanged Man, with reach into the Wheel of Fortune and (through traitors of the Abraham Family) the Door; its god, the True Creator, is a Sequence 0 Hanged Man born as a negative personality from the very corpse and spirit of the Ancient Sun God, which is why the Order preaches that "He" is the rightful heir to the Ancient Sun God's legacy, the father of all living things in whom divinity dwells. Its symbol is no orthodox emblem but an idol: a naked male god hung upside-down on a cross, pierced with rusted nails, his face blurred but for tight-shut eyes. The Order is structured into seven Saints and twenty-two Oracles — Beyonders from Sequence 7 down to 5 who take single letters of the alphabet for code names and convene the Beyonder gatherings — and it operates across both the Loen Kingdom and the Intis Republic. It is the sworn enemy of the orthodox Churches, the Tarot Club, and the Rose School of Thought, and it has an uncanny gift for sniffing out the servants of the Outer Deities. Its members are lunatics or lunatics-in-waiting, and its true aim is nothing less than to bring its god down into the world.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: [
      "aurora-order",
      "true-creator",
      "hanged-man-pathway",
      "secret-organization",
      "spoiler",
    ],
    tokenCount: 270,
    narratorOnly: true,
  },
];
