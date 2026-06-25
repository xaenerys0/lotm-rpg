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
    content: `The Psychology Alchemists are a secret society of the Visionary pathway that wears the face of a scholarly circle — enthusiasts who hold that the mind has limitless power and infinite wonders, studying consciousness, the subconscious, hypnosis, and the travel of dreams. Compared with the great Beyonder organisations their structure is loose, more a society of like-minded mind-scientists than a disciplined order: doctors, academics, and curious intellectuals drawn together across several nations. For a Visionary Beyonder outside the orthodox churches they are one of the chief sources of potion formulas and advancement guidance, traded for contribution points earned by study and service. Their cosmology likens a person's consciousness to an island, the subconscious to the sea beneath it, and the collective subconscious to the surrounding ocean. They keep to the shadows the orthodox churches would hunt, recruiting quietly — often through asylums and lecture-halls — and testing initiates before any true initiation; a junior member knows little beyond their own local circle and the formulas it can offer.`,
    epoch: 5,
    npcs: ["Daxter Guderian"],
    sequences: [9, 8, 7, 6, 5],
    pathway: "visionary",
    tags: ["psychology-alchemists", "visionary-pathway", "secret-organization"],
    tokenCount: 215,
    narratorOnly: false,
  },
  {
    // DEEP: the order's true masters. A cross-cutting Visionary-pathway secret —
    // narrator-only, sequence-gated, and carrying NO pathway/city key so
    // selectCuratedLore never injects it into a Visionary player's prompt (the
    // aurora-order-true-nature / church-inner-secret pattern). The old
    // `psychology-alchemists-overview` revealed this to every Visionary character.
    slug: "psychology-alchemists-inner-secret",
    title: "Psychology Alchemists — The Hand Behind the Mind",
    category: "organization",
    content: `The Psychology Alchemists believe themselves explorers of the mind; few among them know whose mind they truly serve. The seminar that founded the order stumbled upon relics left by Hermes, one of the ancient Mind Dragons, and through that inheritance the order long ago became a division of the Twilight Hermit Order, functioning under the will of the Angel of Imagination, Adam — a Sequence 1 Author of the Visionary pathway and a child of the Ancient Sun God. Its true seat is no earthly chapter but the Garden of Eden, a mystical city within the Sea of Collective Consciousness that can be reached wherever two minds are near. It is governed by councillors who wear personas named for the Seven Deadly Sins beneath a President, each presiding over a nation or great city, trading formulas for the contribution and the secrets of their initiates. The rank and file, studying consciousness in good faith, are the harvest and the instrument of powers they will never be told the names of.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["psychology-alchemists", "twilight-hermit-order", "adam", "secret", "spoiler"],
    tokenCount: 230,
    narratorOnly: true,
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
    content: `If the Mandated Punishers keep only a small office in inland Tingen, in the naval port of Pritz Harbor they are at their strongest. The Mandated Punishers are the Beyonder arm of the Church of the Lord of Storms, and Pritz is a storm-faith town to its bones — a city of sailors, marines, and dockworkers whose creed is the sea's own. Here the Punishers, not the Nighthawks, are the first hand on any uncanny trouble: smuggled Beyonder materials coming over the water or down through the Amantha passes, sea-creature manifestations off the cold roadstead, drowned things that will not stay drowned, and rogue Beyonders among the fleet's crews. Their style suits the town — direct, aggressive, more inclined to force than to the Nighthawks' patient investigation — and their members run heavily to the Sailor (Tyrant) pathway, with its dominion over storm, water, and the body. The harbour's heavy garrison and real night-watch give them cover and muscle both, and a quiet understanding keeps their jurisdiction and the Nighthawks' from colliding more than the sea already does.`,
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
    content: `Beyond its golden cathedral, the Church of the Eternal Blazing Sun in Trier is a hierarchy that gives the capital's sun-faith a human face. The Trier diocese is overseen by Cardinal Plessy Descartes, an elderly, radiant churchman about whom the very shadows seem to thin; beneath the cardinals stand the deacons, the parish priests, and the lay clergy who fill the cathedral's daily services. The Church reveres Saint Viève — the one female angel named in its Bible — as a guardian angel of Trier, and pilgrims come to her cathedral from across the Republic. Its sterner hand is the Inquisition: its Purifiers hunt heresy, corruption, and the servants of the Outer Deities, and a senior Purifier may carry civic authority too — the Deacon Angoulême de François doubles as a Deputy Assistant Commissioner of Trier's police, so that in some quartiers the censer and the constable's badge are held in the same hand. Cardinals direct, deacons lead, and Purifiers enforce: a disciplined order of light that watches the City of Fashion as closely as it blesses it.`,
    epoch: 5,
    city: "trier",
    npcs: ["Plessy Descartes", "Viève", "Angoulême de François"],
    sequences: [],
    tags: [
      "eternal-blazing-sun",
      "sun-pathway",
      "trier",
      "inquisition",
      "clergy",
      "religion",
    ],
    tokenCount: 215,
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
  // ── Orthodox Churches sweep (world build-out 10, issue #139) ──
  // The eight Churches as `organization` entry sets: a public `*-church-overview`
  // (ungated doctrine/structure/roster — narratorOnly:false, sequences:[]) and a
  // gated `*-church-inner-secret` (the god's true nature + internal politics —
  // narratorOnly:true, sequences:[4], NO city/pathway key so selectCuratedLore
  // never injects it, the aurora-order-true-nature / Numinous Episcopate pattern).
  // Overviews are city-keyed to a curated travel-city seat where one exists
  // (Storms→bayam, Steam→trier, Combat→feysac, Earth Mother's Harvest Church
  // branch→backlund) and cross-cutting (no city) otherwise. CANON (corpus-
  // verified; corpus outranks the issue parentheticals): Storms governs Tyrant +
  // White Tower (no "Sailor" pathway); Earth Mother governs Mother + Moon
  // (Demoness was only Lilith's former personal path); God of Combat governs
  // Twilight Giant + Death + Darkness (not Warrior/Hunter/Red Priest); Evernight
  // governs Darkness + Death + Twilight Giant. Members ride in npcs[]; notable
  // ones are authored as npc entries (city-keyed, never pathway-keyed — the leak
  // rule). The Church of the Eternal Blazing Sun's overview/members already ship
  // (issue #135: blazing-sun-church-members); this adds only its inner secret.
  {
    slug: "evernight-church-overview",
    title: "Church of the Evernight Goddess — Overview",
    category: "organization",
    content: `The Church of the Evernight Goddess is one of the eight orthodox Churches and, with the Churches of Steam and of Storms, one of the three great faiths of the Loen Kingdom. Its goddess — the Mother of Concealment, the Empress of Misfortune and Horror, the Mistress of Repose and Silence — has no idol; the faithful pray by tapping the chest four times in a clockwise circle and keep her two great festivals, Winter Gifts Day on the longest night of the year and the Moon Mass that remembers the dead. The Church preaches the equality of women and men, honours marriage, and forbids its clergy strong drink. From its holy seat, the Cathedral of Serenity in the Amantha mountains of Winter County, a Pope and a Council of thirteen archbishops and nine high-ranking deacons govern its dioceses across the kingdom; the current Pope is Dabomachie, and Arianna — Head of the Thirteen Archbishops and matron of the Evernight Cloister — is widely thought to be the next. Its Beyonder arm is the Nighthawks, and their elite the Red Gloves, who keep the supernatural peace under cover of security companies and the police.`,
    epoch: 5,
    npcs: ["Dabomachie", "Arianna", "Anthony Stevenson"],
    sequences: [],
    tags: [
      "evernight-goddess",
      "church",
      "orthodox-church",
      "loen-kingdom",
      "religion",
      "nighthawks",
    ],
    tokenCount: 255,
    narratorOnly: false,
  },
  {
    slug: "evernight-church-inner-secret",
    title: "Church of the Evernight Goddess — The Goddess's True Nature",
    category: "organization",
    content: `Behind the orthodox legend that the Evernight Goddess was formed from the Original Creator's spirit lies a stranger truth, known only at the heights of the Church. The Goddess's true name is Amanises, and she was once a transmigrator from another world — said to be the first soul to come out of the Sefirah Castle — who awoke in the body of a demonic wolf and rose through the Second Epoch as the Goddess of Misfortune, a subsidiary of the Annihilation Demonic Wolf Flegrea, before climbing to Sequence 0 of the Darkness Pathway. The Church she rules holds the Darkness, Death, and Twilight Giant pathways in full and reaches incompletely into the Hermit and Fool besides. Its inner politics turn on the Council of twenty-two equals — thirteen archbishops and nine deacons who answer only to the Goddess and her Pope — and on her quiet patronage of certain mortals she names her Blessed, among them the man who becomes the Fool. In the ages to come her Church is fated to swallow the Churches of Combat and of Death and become the Church of the Eternal Darkness.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["evernight-goddess", "amanises", "true-nature", "secret", "spoiler"],
    tokenCount: 255,
    narratorOnly: true,
  },
  {
    slug: "storms-church-overview",
    title: "Church of the Lord of Storms — Overview",
    category: "organization",
    content: `The Church of the Lord of Storms — the Tyrant's Church — is one of the eight orthodox faiths and a great power upon the seas, worshipped by the Loen royal house, by sailors, and even by pirates of other nations. Its god is the King of the Skies, Emperor of the Seas, Lord of Calamity and God of Storms, a Sequence 0 of the Tyrant Pathway; the faithful strike the left breast with the right fist and salute one another, "May the Storm be with you." Its doctrine neither seeks war nor shuns it, but bids the believer answer an enemy with a storm's cruelty; it keeps the old order of men and women, admits no women to its high ranks, and does not stint its clergy their drink. From the Chasm of Storms Cathedral on Pasu Island the Pontiff Gaard II, Head of the Council of Cardinals, directs the Church and its Beyonder arm, the Mandated Punishers — irritable, headlong fighters of the Tyrant Pathway. In the Rorsted Archipelago the Church long ruled the Beyonder world from the Cathedral of Waves in Bayam, the seat of the Sea King, Cardinal Jahn Kottman.`,
    epoch: 5,
    city: "bayam",
    npcs: ["Gaard II", "Jahn Kottman"],
    sequences: [],
    tags: [
      "lord-of-storms",
      "church",
      "orthodox-church",
      "bayam",
      "rorsted",
      "religion",
      "mandated-punishers",
    ],
    tokenCount: 255,
    narratorOnly: false,
  },
  {
    slug: "storms-church-inner-secret",
    title: "Church of the Lord of Storms — The God's True Nature",
    category: "organization",
    content: `The orthodox tale makes the Lord of Storms a fragment of the Original Creator's spirit; the truth, kept to the Church's heights, is that his name is Leodero and that he was once the Wind Angel, one of the eight Kings of Angels who served the Ancient Sun God in the Third Epoch. He joined the conspiracy of Rose Redemption that killed his master, and from that death rose to Sequence 0 of the Tyrant Pathway — which the Church governs in full, reaching incompletely into the White Tower besides. There is no "Sailor" pathway: the sea is his theme, the Tyrant his power. His Council of Cardinals commands the Mandated Punishers directly, and his name, spoken in the right tongue, calls down lightning. In the world's last days he is fated to die rather than yield, hurling himself as ball lightning against the Crimson Moon so that his power may pass on. For all the orthodox legend of shared kinship, the Church's truest enemies are its supposed siblings — the Churches of the Blazing Sun and of Knowledge and Wisdom — the three preaching mutual hatred down the ages.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["lord-of-storms", "leodero", "true-nature", "secret", "spoiler"],
    tokenCount: 255,
    narratorOnly: true,
  },
  {
    slug: "steam-church-overview",
    title: "Church of the God of Steam and Machinery — Overview",
    category: "organization",
    content: `The Church of the God of Steam and Machinery — once the Church of Craftsmanship, renamed when the transmigrator-emperor Roselle Gustav lit the Industrial Revolution and styled himself the Son of Steam — is the orthodox faith of the machine age. Its god is a Sequence 0 of the Paragon Pathway, the Embodiment of Essence and Guardian of Craftsmen; believers draw a triangle of steam and gears upon the chest and close their prayers, "By Steam!" Alone among the great Churches its scriptures bear no hatred for the other orthodox gods; it prizes invention to the point of fanaticism, the most devout mechanising as much as a quarter of their own bodies, and it laboured beside the Church of the Evernight Goddess to bring women into the workshops. From the Patriarchal Cathedral in Trier the Church governs the Intis Republic and reaches into Loen — strongest there in the foundry-city of Constant — and its Beyonder arm is the Machinery Hivemind, technicians who share one mind across a mystical network. Its luminaries include Saint Bornova Gustav, a Guardian Angel of Trier, and Archbishop Horamick Haydn, who is also an emeritus professor at Backlund University.`,
    epoch: 5,
    city: "trier",
    npcs: ["Bornova Gustav", "Horamick Haydn", "Ikanser Bernard"],
    sequences: [],
    tags: [
      "god-of-steam",
      "church",
      "orthodox-church",
      "trier",
      "intis-republic",
      "machinery-hivemind",
      "religion",
    ],
    tokenCount: 260,
    narratorOnly: false,
  },
  {
    slug: "steam-church-inner-secret",
    title: "Church of the God of Steam and Machinery — The God's True Nature",
    category: "organization",
    content: `The Church teaches that its god is a True God who guided humanity through the Cataclysm; few know that he was once a man. His true name is Yuggs Stiano, a human born in the Third Epoch who glimpsed the Second Blasphemy Slate, helped found the Moses Ascetic Order, then vanished and ascended to Sequence 0 during the War of the Four Emperors. Because he digested his final potion poorly before apotheosis, he must labour constantly to keep his sanity, and is reckoned the weakest of the seven orthodox gods. His Church holds the Paragon and Hermit pathways in full and reaches incompletely into the Twilight Giant. Its founder-emperor Roselle Gustav — the Son of Steam, secretly a Sequence 0 of the Black Emperor Pathway — was steered, some whisper at the Church's heights, through his own son, the Saint Bornova. Of the orthodox faiths it is the least armed with Sealed Artifacts, its history being so recent; yet it is the one Church fated to keep its full influence even after the world's last catastrophe.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["god-of-steam", "yuggs-stiano", "true-nature", "secret", "spoiler"],
    tokenCount: 240,
    narratorOnly: true,
  },
  {
    slug: "knowledge-church-overview",
    title: "Church of the God of Knowledge and Wisdom — Overview",
    category: "organization",
    content: `The Church of the God of Knowledge and Wisdom is among the oldest of the eight orthodox faiths, raised after the Third-Epoch Cataclysm and avowedly neutral in the quarrels of nations. Its god is a Sequence 0 of the White Tower Pathway, hailed as omniscient and omnipotent — "Omniscience means Omnipotence!" — his emblem an all-seeing eye upon an open book, his sacred metal brass, which the faithful carry as a pocket ornament. The Church values intellect and talent above birth, prizing the clever and the learned. From the Holy Temple of Knowledge in Azshara, the capital of Lenburg, it governs the splinter-states of Lenburg, Masin, and Segar, having once shared the Feynapotter Kingdom with the Church of the Earth Mother until the Battle of the Violated Oath drove it out. It keeps no famous militant order of its own; its strength lies in its scholars and prophets — Archbishop Edwina Edwards, the pirate-admiral called Iceberg; Bishop Lucca Brewster, who carries its prophecies across the seas; and quiet agents such as the Backlund detective Isengard Stanton, who styles himself Mr. Eye of Wisdom.`,
    epoch: 5,
    npcs: ["Edwina Edwards", "Lucca Brewster", "Isengard Stanton", "Brignais"],
    sequences: [],
    tags: ["god-of-knowledge", "church", "orthodox-church", "lenburg", "religion"],
    tokenCount: 250,
    narratorOnly: false,
  },
  {
    slug: "knowledge-church-inner-secret",
    title: "Church of the God of Knowledge and Wisdom — The God's True Nature",
    category: "organization",
    content: `The orthodox legend calls the God of Knowledge and Wisdom a spirit of the Original Creator; the gated truth is that he is a dragon. His true name is Herabergen, the Dragon of Wisdom, once a subsidiary god of the Dragon of Imagination Ankewelt in the Second Epoch; after his master's death he turned to the Ancient Sun God and became the Wisdom Angel, one of the eight Kings of Angels, before joining Rose Redemption and, with the Lord of Storms and the Blazing Sun, devouring the Ancient Sun God's body to ascend. His true form is a brass dragon the size of a city, a folding tower of illusory books each set with a brass eye. Amon names him the Dragon of Betrayal. His Church holds the White Tower Pathway in full and reaches incompletely into the Red Priest. His holy bible foretells an apocalypse and a saviour to come; and in the end he chooses self-destruction, fusing himself into Adam to help fight the will of the Primordial God Almighty.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["god-of-knowledge", "herabergen", "true-nature", "secret", "spoiler"],
    tokenCount: 240,
    narratorOnly: true,
  },
  {
    slug: "earth-mother-church-overview",
    title: "Church of the Earth Mother — Overview",
    category: "organization",
    content: `The Church of the Earth Mother — the Church of Earth — is the orthodox faith of life, harvest, and fertility, raised after the Third-Epoch Cataclysm and the state religion of the Feynapotter Kingdom. Its goddess is the Mother, the Mother of All Things, a Sequence 0 who teaches from the Bible of Life that every soul is a plant that grows, withers, and returns to her embrace. The Church honours reproduction as the holiest of matters — its cloisters welcome many children — preaches the equality of women and men, wears the brown habit, and readily takes in Sanguines as priests. A Matriarch leads it, advised by her Cardinals and the archbishops and bishops below; its Beyonder enforcers are the Fertility Order. Based in Feynapotter, it reaches into the Loen Kingdom through branch chapters such as the Harvest Church of Backlund, and has lately spread toward West Balam. Its leaders in this age include the Matriarch Roland and Archbishop Agrippina of the Gaia diocese.`,
    epoch: 5,
    npcs: ["Roland", "Agrippina"],
    sequences: [],
    tags: ["earth-mother", "church", "orthodox-church", "feynapotter", "religion"],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "earth-mother-harvest-church-backlund",
    title: "Church of the Earth Mother — The Harvest Church of Backlund",
    category: "organization",
    content: `The Harvest Church on Rose Street is the Church of the Earth Mother's house in Backlund, a chapter of the life-faith set down in a city of soot and class. It is best known for two men. Father Utravsky, its towering bishop, was once a ruthless pirate of the Sonia Sea before an Earth Mother missionary turned him to the faith; he swore upon her sacred emblem to spread her worship abroad, and now tends the poor of Backlund — believer and unbeliever alike — through disaster and smog. With him is the young Sanguine Emlyn White, who fell into the Harvest Church's keeping and became the representative of Backlund's Sanguines after they merged with the Church. Both are Beyonders who keep their true natures hidden behind the censer and the soup-line; both came to know the detective Sherlock Moriarty, and through him a wider, stranger world than Rose Street ever sees. It is here, too, that the Apothecary potion's formula may be earned — by those who can master themselves.`,
    epoch: 5,
    city: "backlund",
    npcs: ["Utravsky", "Emlyn White"],
    sequences: [],
    tags: ["earth-mother", "harvest-church", "backlund", "branch-chapter", "religion"],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "earth-mother-church-inner-secret",
    title: "Church of the Earth Mother — The Goddess's True Nature",
    category: "organization",
    content: `The Earth Mother's benevolent face hides one of the world's great impostures. Her true name is Lilith, the Sanguine Ancestor — once an Ancient Goddess of the Moon Pathway who, betrayed and seemingly slain at the close of the Early Era of Fire, faked her death and, with the help of the Evernight Goddess and the Ancient Sun God, stole the very identity and fate of Omebella, the Giant Queen and Goddess of Harvest, to ascend as the Earth Mother at Sequence 0 of the Mother Pathway. Her Church governs the Mother and Moon pathways in full and reaches incompletely into the Justiciar and Twilight Giant — the Demoness was only her own former path, never the Church's. Fearing the false revelations the Mother Goddess of Depravity whispers to Moon and Mother Beyonders, she split her Church into the Favored and the Blessed, who must countersign each other's every order, beyond even the Holy See's power to override. In the 1350 World War she feigned alliance with the God of Combat and drained his life — a god who never knew that his killer wore the face of his own mother.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["earth-mother", "lilith", "true-nature", "secret", "spoiler"],
    tokenCount: 260,
    narratorOnly: true,
  },
  {
    slug: "combat-church-overview",
    title: "Church of the God of Combat — Overview",
    category: "organization",
    content: `The Church of the God of Combat is the orthodox faith of war and glory and the sole religion of the militarist Feysac Empire, where no other creed may preach. Its god is the Symbol of Power and Glory, the Great Knight God, Master of War and Patron of Guns — a Sequence 0 of the Twilight Giant Pathway. The Church is a brotherhood of men: it discourages women and gender equality more sternly than any other faith, and does not deny its clergy hard drink. From the Great Twilight Hall outside St. Millom — raised in the image of the Giant King's Court — its Chief Shepherd and archbishops command dioceses across Feysac and out to the Gargas Archipelago, Sonia Island, and the Balam colonies. From its very founding it has borne a long enmity with the Church of the Evernight Goddess over the bordering pathways of eternal darkness. Its foremost servant in this age is the Chief Shepherd Larrion, a towering Twilight Giant of fanatical loyalty.`,
    epoch: 5,
    city: "feysac",
    npcs: ["Larrion"],
    sequences: [],
    tags: ["god-of-combat", "church", "orthodox-church", "feysac", "religion"],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "combat-church-inner-secret",
    title: "Church of the God of Combat — The God's True Nature",
    category: "organization",
    content: `The God of Combat's secret is written in blood and family. His true name is Badheil, the God of Dawn of the Second Epoch — eldest son of the Giant King Aurmir and the Goddess of Harvest Omebella, who inherited his father's god-seat and climbed to Sequence 0 of the Twilight Giant Pathway. His Church holds the Twilight Giant in full and reaches incompletely into the Death and Darkness pathways — not, as outsiders guess, any "Warrior" or "Hunter" path. He joined Rose Redemption, helped bring about the Cataclysm that killed the Ancient Sun God, and in the Fourth Epoch raised the Einhorn family to found Feysac. His long feud with the Evernight Goddess over the eternal-darkness pathways ended in betrayal: in the Battle of Gods over Backlund he was killed by Lilith — wearing the face of his own mother Omebella — and by the Evernight Goddess, who took the Twilight Sword. His leaderless Church was quietly absorbed by the Church of the Evernight Goddess, his death never announced; his Chief Shepherd Larrion still awaits his return.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["god-of-combat", "badheil", "true-nature", "secret", "spoiler"],
    tokenCount: 255,
    narratorOnly: true,
  },
  {
    slug: "fool-church-overview",
    title: "Church of the Fool — Overview",
    category: "organization",
    content: `The Church of the Fool is the youngest of the great faiths, founded in 1352 of the Fifth Epoch by the people of the City of Silver and Moon City after they were led out of the Forsaken Land of the Gods. Its god is the Fool — the Mysterious Ruler above the Gray Fog, the King of Yellow and Black who wields good luck — who is said to reign over the Spirit World with eight angels at his side. From the Fool's Cathedral in the New City of Silver, in the Rorsted Archipelago, the Church keeps its plain, light-filled halls, shelters tramps and unbelievers with meals and honest work, and prays, "Praise be to Mr. Fool," a palm pressed to the breast. Its Ten Commandments forbid living sacrifice and the worship of other gods before him. A Pope leads it — Derrick Berg of the Sun Pathway — with archbishops such as Waite Chirmont, the Moon-City high priest Nim, and Susie; and its true might is the Tarot Club, the circle of the Fool's chosen, whose members rose to become angels in the world's last age.`,
    epoch: 5,
    npcs: ["Derrick Berg", "Waite Chirmont", "Nim", "Susie"],
    sequences: [],
    tags: ["the-fool", "church", "fool-pathway", "fool-church", "rorsted", "religion"],
    tokenCount: 250,
    narratorOnly: false,
  },
  {
    slug: "fool-church-inner-secret",
    title: "Church of the Fool — The God's True Nature",
    category: "organization",
    content: `The Church of the Fool worships a god who walks among mortals unknown. The Fool is Klein Moretti — once Zhou Mingrui, a transmigrator from another world — who rose to Sequence 0 of the Fool Pathway and became the Lord of Mysteries, an Above-the-Sequence power and owner of the Sefirah Castle, with authority over the Fool, Error, and Door pathways. He founded and convenes the Tarot Club under the name The Fool, and is himself the Blessed of the Evernight Goddess. The Church that grew around him is an alliance of refuges — the New City of Silver and New Moon City, the Abraham Family with their Door pathway, the Temperance faithful of the Rose School, the Church of the Sea God under his subsidiary Kalvetua — each guarding fragments of the twenty-two pathways. Its eight named angels, from the Angel of Mercury to the Angel of Stars, are mortals he raised; and the man at the heart of the godhead is one the wider world still believes a mere fortune-teller, a Backlund detective, or a dead adventurer.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["the-fool", "klein-moretti", "lord-of-mysteries", "true-nature", "spoiler"],
    tokenCount: 245,
    narratorOnly: true,
  },
  {
    slug: "blazing-sun-church-inner-secret",
    title: "Church of the Eternal Blazing Sun — The God's True Nature",
    category: "organization",
    content: `The Church of the Eternal Blazing Sun proclaims its god the Inextinguishable Light and, in its proselytising, the Father of All Life — a title that is propaganda, not truth. The gated reality is that the god's name is Aucuses, once the White Angel, one of the eight Kings of Angels who served the Ancient Sun God in the Third Epoch. He betrayed his master, joined Rose Redemption under the Dark Angel Sasrir, and with the Lord of Storms and the God of Knowledge and Wisdom consumed the Ancient Sun God's body to rise to Sequence 0 of the Sun Pathway. In the end, fragments of the Primordial God Almighty's mind began to wake within him, and rather than be lost he asked the Evernight Goddess to kill him. After his death the Church passed into the hands of Adam — the True Creator — and the once-heretical Aurora Order was folded into it as the shadow beneath the sun's rays. The Church holds the Sun Pathway in full and reaches incompletely into the Twilight Giant; its sterner hand remains the Inquisition and its Purifiers.`,
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["eternal-blazing-sun", "aucuses", "true-creator", "true-nature", "spoiler"],
    tokenCount: 250,
    narratorOnly: true,
  },
  // ── Church of the God of Combat — structure & members (world build-out 7,
  // issue #136). Complements the #139 `combat-church-overview` (doctrine) and
  // gated `combat-church-inner-secret` (Badheil) with the church's ranks,
  // dioceses, and roster. CANON (corpus-verified): the corpus names almost no
  // Combat clergy beyond the Chief Shepherd Larrion (the dioceses are listed by
  // OFFICE, not name) — so no members are invented. "Warrior"/"Hunter" are
  // Twilight Giant SEQUENCE names (Seq 9 / Seq 4), not separate pathways.
  {
    slug: "combat-church-structure",
    title: "Church of the God of Combat — Structure & Ranks",
    category: "organization",
    content: `Beneath its Chief Shepherd, the Church of the God of Combat is a martial hierarchy seated at the Great Twilight Hall outside Saint Millom — a hall raised in the likeness of the Giant King's Court, by tradition the old residence of Giant King Aurmir himself. The Chief Shepherd Larrion commands the dioceses of the Feysac heartland and the colonies: Gargas (whose archbishop is but a Sequence 5 Guardian), Sonia Island, and West Balam, with the Holy Lake Cathedral at Raklev among its seats. Its clergy climb the Twilight Giant ladder rung by rung — Warrior, Pugilist, Weapon Master, Dawn Paladin, Guardian, Demon Hunter, Silver Knight, Glory — so that the "Warrior" and "Hunter" outsiders speak of are not separate paths but sequences of the one Twilight Giant Pathway the Church wields (the Death and Darkness paths it holds only in part). It keeps no separately named inquisition; its Beyonders themselves are its enforcers, and the policing of every Beyonder incident in the empire is the Church's own charge. A brotherhood of men, height-proud and hard-drinking, it brooks no rival faith in Feysac and has feuded with the Church of the Evernight Goddess since its founding.`,
    epoch: 5,
    city: "feysac",
    npcs: ["Larrion"],
    sequences: [],
    tags: [
      "god-of-combat",
      "church",
      "feysac",
      "twilight-giant-pathway",
      "structure",
      "religion",
    ],
    tokenCount: 255,
    narratorOnly: false,
  },
  // ── Rorsted Archipelago organizations (world build-out 8, issue #137). ──
  // The native sea-god faith and the Mandated Punishers' maritime presence. All
  // corpus-verified. CANON CORRECTION (corpus outranks the issue hint): the
  // organized "Church of the Sea God" is a POST-1352 Fool subsidiary — in the
  // colonial baseline the worship is a decentralised, OUTLAWED native faith plus
  // the independence-minded Resistance, so the surface entry below is the hunted
  // belief, not a formal church. The Resistance's leadership and the sea-god's
  // true Tyrant-Pathway nature are the gated deep secret.
  {
    // SURFACE: the island-superstition the colony openly knows of and fears — no
    // named leaders, no Beyonder truths. City-keyed Bayam, ungated, so a Bayam
    // character carries it as setting; the deep secret lives in `sea-god-resistance`.
    slug: "sea-god-faith-overview",
    title: "The Sea-God Faith of the Rorsted Archipelago",
    category: "organization",
    content: `Long before Loen's fleets came, the islanders of the Rorsted Archipelago prayed to a sea-god of their own — a vast blue serpent said to hold back the earthquakes and the tsunamis — and on Blue Mountain Island and across the Sonia Sea many of them pray to him still. The colony has outlawed the worship: the Church of the Lord of Storms brooks no rival faith on its own waters, and its priests haul heretics in by the handful every month or two, while the natives bury their dead apart and keep their shrines up the jungle slopes and out of sight. Pilgrims still trade in the god's charms — tokens blessed to turn a blade or let a man swim like a fish, though the virtue is said to bleed out of them within a few months — and the faith has become a banner for everything the islanders resent about foreign rule. Where the storm-faith is the religion of the harbour and the garrison, the old sea-god is the religion of the back-streets, the fishing villages, and the quiet talk of independence. To the colonial authorities it is heresy; to the islanders it is the last of themselves they have not surrendered.`,
    epoch: 5,
    city: "bayam",
    npcs: [],
    sequences: [],
    tags: ["sea-god", "kalvetua", "native-belief", "bayam", "religion"],
    tokenCount: 240,
    narratorOnly: false,
  },
  {
    // DEEP: the organized Resistance + the sea-god's true nature. A cross-cutting
    // secret of the colony — narrator-only, sequence-gated, and carrying NO
    // city/pathway key so selectCuratedLore never injects it (the
    // aurora-order-true-nature / Numinous-Episcopate pattern).
    slug: "sea-god-resistance",
    title: "The Resistance & the Drowned God's Devotees",
    category: "organization",
    content: `Beneath the scattered back-street worship runs something organised: the Resistance, the independence movement of the Rorsted Archipelago, with the sea-god's faith for its banner and the back-country and the open sea for its hiding-places. Its leader is Kalat — "Baldy Kalat," a wheelchair-bound Beyonder once schooled in the Feysac Empire — and among its quiet backers is the half-native trader Ralph, whose trading company funds it from behind a respectable ledger. The Resistance cooperates with the archipelago's pirates and adventurers and is courted from the shadows by Loen's rivals, who would gladly see the colony bleed. Deeper and far more dangerous are the sea-god's true devotees: the guard who keep his hidden lair, and the old priests who once fed him living sacrifices — for the islanders' god is no superstition but a genuine Sea King of the Tyrant Pathway, a sea-serpent the Church of the Lord of Storms has hunted for over a century. To the colonial authorities the whole tangle is heresy and sedition; to the islanders it is a war for their own souls that the storm-priests must never be allowed to win.`,
    epoch: 5,
    npcs: ["Kalat", "Ralph"],
    sequences: [4],
    tags: ["sea-god", "resistance", "kalvetua", "tyrant-pathway", "secret-society"],
    tokenCount: 245,
    narratorOnly: true,
  },
  {
    // The Lord of Storms' Beyonder enforcement arm in the Sonia Sea — at its
    // STRONGEST here, where the storm-faith rules the sea (unlike inland Tingen).
    // City-keyed Bayam, ungated surface like the Tingen/Pritz presences. CANON:
    // "Tyrant Pathway" (the sea's power), NOT a "Sailor pathway" — Sailor is the
    // Tyrant's Sequence 9.
    slug: "mandated-punishers-bayam",
    title: "Mandated Punishers — Rorsted Archipelago Presence",
    category: "organization",
    content: `In the Rorsted Archipelago the Mandated Punishers — the Beyonder arm of the Church of the Lord of Storms — are not the junior partner they are in an inland Loen city; here, on the storm-faith's own sea, they are the first and final word on anything uncanny. Of all the nations only Loen's Church wields authority over the sea, and the Sonia Sea is its domain: from the Cathedral of Waves in Bayam the Punishers police the smuggled curios moving through the busiest port of the eastern ocean, sea-creature manifestations off the islands, rogue Beyonders among the pirate crews and the adventurers' bars, and above all the outlawed sea-god cult they hunt without end. Their members run heavily to the Tyrant Pathway — the sea's own power of storm, water, and the body — leavened with the occasional White Tower analyst, and their style is the pathway's own: headlong, aggressive, more inclined to force than to patient inquiry. Over them all stands the Sea King, Cardinal Jahn Kottman, who has made the archipelago's hidden world answer to Bayam for years.`,
    epoch: 5,
    city: "bayam",
    npcs: ["Jahn Kottman"],
    sequences: [],
    tags: [
      "mandated-punishers",
      "lord-of-storms",
      "maritime",
      "bayam",
      "tyrant-pathway",
      "beyonder-organization",
    ],
    tokenCount: 235,
    narratorOnly: false,
  },
  // ── Southern Continent — the death-faith & the Numinous Episcopate's roots
  // (world build-out 9, issue #138). Canon (corpus-verified): the Church of Death
  // was the Balam Empire's state religion (Fourth Epoch); after Death perished it
  // collapsed and surviving Eggers + Church-of-Death remnants founded the
  // Numinous Episcopate (early Fifth Epoch). The folk death-worship of the
  // colonized tribes persists separately. The Numinous Episcopate's overview /
  // true-goal already exist above (issue #132) — this CROSS-LINKS its Southern
  // origin without duplicating them. ──
  //
  // EPOCH SPLIT (passesEpochGate is exact-match): the Church of Death is Fourth-
  // Epoch history (epoch 4), never mixed with the present-day folk faith (epoch 5).
  // LEAK CONTROL: `southern-death-worship` is city-keyed `balam` (injected only
  // for a character there); `numinous-episcopate-southern-roots` carries NO city/
  // pathway key (cross-cutting secret — never curated-injected, the Numinous
  // pattern) and is narratorOnly + sequence-gated.
  {
    slug: "church-of-death",
    title: "The Church of Death (Balam Empire)",
    category: "organization",
    content: `The Church of Death was the state religion of the Balam Empire that ruled the Southern Continent through the Fourth Epoch — the faith of the Underworld Emperor, the god the histories simply call Death, first sovereign of the dead. Its priesthood deified death and the grave: it taught that dying is no ending but a threshold that may be crossed and even reversed, kept the full mysteries of the death-god's path, and governed the southern plains and rainforests hand in hand with the imperial Eggers line descended from the god himself. Its symbol was the feathered serpent, and its rites — coffins, ancestor-bones, blood offerings — set the death-soaked customs the Balam tribes keep to this day. When the orthodox gods united and slew Death near the epoch's end, the empire collapsed and the Church fell with it, its archbishops and faithful scattered or hunted down. From those remnants, and from the surviving Eggers, would grow the secret Numinous Episcopate of the Fifth Epoch — so the dead empire's church never wholly died.`,
    epoch: 4,
    npcs: [],
    sequences: [],
    tags: [
      "church-of-death",
      "balam-empire",
      "death-pathway",
      "fourth-epoch",
      "history",
      "religion",
    ],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "southern-death-worship",
    title: "The Death-Worship of the Balam Tribes",
    category: "organization",
    content: `Long after the empire fell, the death-worship of the Southern Continent endures among its colonized tribes — the folk faith the orthodox churches have outlawed. In the old imperial fiefs the people still keep the dead god's ways: they bury their dead apart and keep ancestor-bones in the home, bear the dead to rest in coffins, and wear the white feathers of the feathered serpent that was his sign. It is not a church but a creed of village shamans and grave-rites, woven through every part of native life — and in the deep jungles of West Balam its old sacrifices still run red. To the Northern colonists and the Church of the Evernight Goddess, who now holds the authority over death the old god once wielded, it is heresy and savagery to be stamped out, and its shrines are pulled down and its priests hunted. To the Balam people it is simply who they are, and the longer the colonists try to burn it out of them, the more it becomes a banner for revolt.`,
    epoch: 5,
    city: "balam",
    npcs: [],
    sequences: [],
    tags: [
      "southern-continent",
      "balam",
      "death-worship",
      "native-belief",
      "shamanism",
      "religion",
      "fifth-epoch",
    ],
    tokenCount: 235,
    narratorOnly: false,
  },
  {
    slug: "numinous-episcopate-southern-roots",
    title: "Numinous Episcopate — Roots in the Fallen Empire",
    category: "organization",
    content: `The Numinous Episcopate's roots run back to the fall of the Balam Empire. When the death-god perished and the Church of Death collapsed, a few surviving members of the Eggers family — the imperial line descended from the god himself — bound themselves into a secret society to undo that death: to resurrect the first Underworld Emperor and, with him, raise the empire again and cast the Northern colonists into the sea. "Only death endures forever," they say. From the Southern Continent the brotherhood spread; nearly eradicated by the Seven Orthodox Churches in the colonial era, it survived stubbornly and crept into the nations of the Northern Continent. Its strongest arm is the Royal Family Faction of the Eggers descendants, led by Sia Palenque Eggers; another, the Artificial Death Faction, is led by Haiter, once an archbishop of the old Church of Death. To the Church of the Evernight Goddess — who took the dead god's authority over death for her own — the Episcopate is among the deadliest heresies alive, a wound from the elder ages that has never closed.`,
    epoch: 5,
    npcs: ["Sia Palenque Eggers", "Haiter"],
    sequences: [4],
    tags: [
      "numinous-episcopate",
      "balam-empire",
      "eggers-family",
      "death-pathway",
      "secret-organization",
      "southern-continent",
      "spoiler",
    ],
    tokenCount: 240,
    narratorOnly: true,
  },
  {
    slug: "life-school-of-thought-overview",
    title: "Life School of Thought — Overview",
    category: "organization",
    content: `The Life School of Thought is a Fifth-Epoch secret organisation controlling the Wheel of Fortune pathway. Operating primarily from Backlund, it studies fate and luck — its president holds that a Beyonder of the Fate pathway must pay the price before awaiting fate's bestowment, not the reverse. When its president vanished from public life, the organisation fractured: a branch that also held parts of the Moon pathway defected to the Rose School of Thought's indulgence faction. As of 1358 the Life School of Thought is an ally of the Tarot Club.`,
    epoch: 5,
    npcs: [],
    sequences: [],
    tags: [
      "life-school-of-thought",
      "wheel-of-fortune",
      "secret-organization",
      "backlund",
    ],
    tokenCount: 175,
    narratorOnly: false,
  },
];
