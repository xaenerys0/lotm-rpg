-- Seed the wider Loen Kingdom lore (world build-out 5, issue #134):
-- Awwa County + the city of Constant + added Pritz/Enmat depth (locations), the
-- Loen Relic Search & Preservation Foundation and its Compliance Department, the
-- regional Mandated Punishers (Pritz) / Machinery Hivemind (Constant) / Red
-- Gloves presences (organizations), and the notable NPCs Gawain, Welch McGovern,
-- Pacheco Dwayne, and Barton (15 entries total).
-- Generated from the TS source (src/lib/lore/{loen,organizations,npcs}.ts — the
-- canonical data); same lore_entries INSERT format as the earlier seed
-- migrations. `narratorOnly` is a TS-only prompt flag (no column), intentionally
-- not persisted, matching the prior lore seeds. Parity (TS <-> rows) verified
-- via the Supabase MCP after apply.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'awwa-county-overview',
  'Awwa County — Tingen''s Region',
  'location',
  'Awwa County is the region of the Loen Kingdom in which Tingen — the City of Universities — sits, on the Northern Continent where the Khoy and Tussock rivers meet. It is flanked by Winter County to the north, with the Khoy River to its east and the Tussock to its south and south-west, the great Tussock running on from here down to the capital, Backlund, and out to the sea near Pritz Harbor. Beyond Tingen the county is a patchwork of smaller towns and parishes — Morse Town and its cathedral among them — and quiet farming country between the rivers. The two faiths that hold sway here are the Church of the Evernight Goddess and the Church of the Lord of Storms, their bells dividing the week between them. Once the county was guarded by the Awwa Knights'' Order of Chivalry; the order is gone now, made obsolete by the high-pressure steam gun and the six-barrel machine gun, and only a handful of old swordsmen remember it. Day-to-day order falls instead to the Awwa County Police, whose Special Operations Department handles the cases the ordinary constabulary will not discuss.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'awwa-county', 'fifth-epoch'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'constant-city-overview',
  'Constant City — Overview',
  'location',
  'Constant City — the "Wind City" — is the second-largest city in the Loen Kingdom and the provincial capital of Midseashire County on the Northern Continent''s north-eastern coast. Reckoned one of the three great cities of Loen, it is built on coal and steel: a forest of chimneys and tall blast furnaces, streets of concrete and rolled iron, and a skyline that strikes a visitor as even more relentlessly industrial than the capital. Where Backlund smothers under its yellow smog, Constant is scoured by a hard sea breeze off the North Sea, so for all the coal-ash that streaks its walls the air runs cleaner and colder. The Constant Coal and Steel Consortium drives its fortune; the Constant Industry University trains the engineers who keep the furnaces fed; and the harbour ships finished iron out to the wider kingdom and the world. It is a city of foundrymen and shipping clerks, union halls and counting-houses, loud and prosperous and proud of its own grime — and, like any great industrial city, it has corners where stranger industries than steel quietly turn.',
  null,
  5,
  'constant',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'constant', 'midseashire', 'fifth-epoch'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'constant-industry-and-steam',
  'Constant City — The Furnaces & the Church of Steam',
  'location',
  'The beating heart of Constant is its industry. Blast furnaces run day and night, the Constant Coal and Steel Consortium roping together mines, mills, and rolling-works into one of the great fortunes of the Loen Kingdom, and the Constant Industry University turns out the engineers and metallurgists who keep it all running — its tuition kept low so that a foundryman''s clever son might rise. In a city built on iron and fire it is the Church of the God of Steam and Machinery that commands the deepest popular devotion: its cathedrals stand among the workshops, its calendar marked by the festivals of the engine and the forge, and the working people who pray to progress treat the Church as their own in a way the older faiths are not. For the Beyonder world that means Constant is the Church of Steam''s strongest seat outside the capital, where the Savant pathway''s quiet practitioners find ready cover among genuine machinists and the line between an ingenious invention and a mystical one runs very thin.',
  null,
  5,
  'constant',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'constant', 'god-of-steam', 'fifth-epoch'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'constant-wind-city-coast',
  'Constant City — The Wind City & the Midseashire Coast',
  'location',
  'They call Constant the Wind City for good reason: it stands on the open north-eastern coast of Midseashire, where the cold wind off the North Sea never quite stops and carries the coal-smoke out to sea almost as fast as the furnaces make it. Its harbour is a working one — colliers and ore-boats, iron freighters and the grey ships of Loen''s Midseashire Fleet — and the quays are loud with the same dockside trade and dockside trouble any great port knows. Midseashire is the most crowded, most industrious stretch of the whole Northern Continent''s coast, its cities (Constant chief among Loen''s) ringed by lesser mill-towns, and across the water lie the rival ports of other powers. That makes Constant a frontier of commerce and, in harder times, of strategy: a place where fortunes and contraband and quieter cargoes all come and go on the tide, and where the wind carries away a great deal that the city would rather not have overheard.',
  null,
  5,
  'constant',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'constant', 'midseashire', 'port', 'fifth-epoch'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'pritz-harbor-naval-yard',
  'Pritz Harbor — The Naval Yard & the Storm-Faith',
  'location',
  'Beneath Pritz Harbor''s fog the real business of the town is the navy. The royal dockyards run the length of the grey roadstead — building-slips and dry-docks, powder magazines and victualling stores, ironclads under repair and gunboats fitting out — and a whole town of riggers, shipwrights, chandlers, and the families that serve them lives by the rhythm of the fleet. The garrison is heavy, the night watch real, and the Hornacis passes at the harbour''s back are worked hard by smugglers running goods over the mountains to and from the Feysac frontier. Pritz is above all a city of the Church of the Lord of Storms: the storm-faith of sailors and soldiers is the dominant creed here, its seafront chapels blessing every long voyage, and so it is the Lord of Storms'' own Beyonder enforcers — the Mandated Punishers — who hold the strongest hand over the uncanny in this port, more even than the Nighthawks. Sealed cargo, drowned things, and Beyonders who would rather not be logged all pass through a navy town this busy, and the storm-priests watch the water for them.',
  null,
  5,
  'pritz',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'pritz', 'navy', 'lord-of-storms', 'fifth-epoch'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'enmat-harbor-fogbound-trade',
  'Enmat Harbor — The Fog-Bound Landing',
  'location',
  'Enmat Harbor keeps its secrets in the fog. A small Loen coastal town of fishing boats, net-lofts, and lamplit lanes, it is the kind of close-mouthed place where everyone is counted and strangers are remembered, the old sea-charms still nailed over the doorways and certain names left unspoken after dark. Industry has passed it by, and the nearest real authority is a long, cold road away — which is precisely why the Beyonder world''s quieter traffic likes it. The fog that hides the fishermen''s morning hides a smuggler''s landing as readily, and more than one cult or fugitive has chosen Enmat for having no neighbours worth the name. It is also a town that grows its own uncanny: the most famous Spirit Medium of all Awwa County, Daly Simone, came from coastal stock and made her home here before the Nighthawks called her in, and the locals'' wary respect for what the tide brings in is not entirely superstition. Whatever comes ashore at Enmat tends to come ashore unseen.',
  null,
  5,
  'enmat',
  '{"Daly Simone"}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'enmat', 'coastal-town', 'fifth-epoch'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'loen-relic-foundation-overview',
  'Loen Relic Search & Preservation Foundation — Overview',
  'organization',
  'The Loen Relic Search and Preservation Foundation is a non-profit body devoted to the discovery, study, and preservation of ancient relics, headquartered in Stoen City of East Chester County in the Loen Kingdom. It was established by the young Backlund noblewoman Audrey Hall — working through Associate Professor Michelle Deuth of Stoen University — with a founding gift of money, land, and a manor, and it funds archaeological expeditions, buys up antiquities, and shelters scholars across the kingdom. Its stated purpose is exactly what it appears: to keep the relics of older epochs out of careless hands and in the light of study, and to lend its founder the prestige of a patron of learning. The Foundation is notable, too, for employing a great many women, from its ordinary clerks up to the deputy directors of its departments — unusual for an institution of the age. To the public it is a respectable charity of digs, donations, and dusty notebooks; what passes through its hands, and why its founder cares so much what those digs turn up, is a quieter matter.',
  null,
  5,
  null,
  '{"Audrey Hall","Michelle Deuth"}',
  '{}',
  ARRAY['loen-relic-foundation', 'loen-kingdom', 'east-chester-county', 'audrey-hall', 'relic-preservation'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'loen-relic-foundation-compliance',
  'Loen Relic Search & Preservation Foundation — The Compliance Department',
  'organization',
  'Behind the Foundation''s charitable face stands its Compliance Department, and it is not what its name suggests. Officially it audits the Foundation''s projects for any breach of rule or provision; in truth it is a division of Beyonders, raised quietly by Audrey Hall to handle the abnormal, the dangerous, and the inexplicable that a foundation digging up the relics of older epochs is bound to unearth. The standing rule is plain: should any expedition produce a phenomenon that is terrifying or beyond explanation, the staff are to stop at once and report to Compliance — and Compliance comes. Its deputy directors include the former Backlund lawyer Pacheco Dwayne, a Beyonder of the Black Emperor pathway who prizes order and rule above all, alongside others of capability. To the Foundation''s ordinary clerks the Compliance Department is simply the strict office one does not cross; to the Beyonder world it is a private, well-funded, and discreet force answering to one of the Tarot Club''s own — a hidden hand reaching wherever the Foundation''s diggers turn up something they should not have.',
  null,
  5,
  null,
  '{"Pacheco Dwayne","Alicia Tamara","Audrey Hall"}',
  '{5}',
  ARRAY['loen-relic-foundation', 'compliance-department', 'beyonder-organization', 'audrey-hall', 'spoiler'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'mandated-punishers-pritz',
  'Mandated Punishers — Pritz Harbor Presence',
  'organization',
  'If the Mandated Punishers keep only a small office in inland Tingen, in the naval port of Pritz Harbor they are at their strongest. The Mandated Punishers are the Beyonder arm of the Church of the Lord of Storms, and Pritz is a storm-faith town to its bones — a city of sailors, marines, and dockworkers whose creed is the sea''s own. Here the Punishers, not the Nighthawks, are the first hand on any uncanny trouble: smuggled Beyonder materials coming over the water or down through the Hornacis passes, sea-creature manifestations off the cold roadstead, drowned things that will not stay drowned, and rogue Beyonders among the fleet''s crews. Their style suits the town — direct, aggressive, more inclined to force than to the Nighthawks'' patient investigation — and their members run heavily to the Sailor (Tyrant) pathway, with its dominion over storm, water, and the body. The harbour''s heavy garrison and real night-watch give them cover and muscle both, and a quiet understanding keeps their jurisdiction and the Nighthawks'' from colliding more than the sea already does.',
  null,
  5,
  'pritz',
  '{}',
  '{}',
  ARRAY['mandated-punishers', 'lord-of-storms', 'pritz', 'maritime', 'beyonder-organization'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'machinery-hivemind-constant',
  'Machinery Hivemind — Constant City Presence',
  'organization',
  'In the industrial Wind City of Constant the Machinery Hivemind comes into its own. The Hivemind is the Beyonder division of the Church of the God of Steam and Machinery, and Constant — second city of the Loen Kingdom, all blast furnaces and rolling-mills and the strong popular faith of the working engineer — is the Church of Steam''s great seat outside the capital. Here the Hivemind is no afterthought as it is in Tingen but a serious power: technically-minded Beyonders of the Savant pathway who pass for the metallurgists, machinists, and inventors they walk among, watching the foundries for supernatural contamination in manufactured iron, for mystical machinery run amok, and for the industrial accidents whose true causes the coroners can never name. Their signature is the shared mind — a mystical network through which members pool what they see and coordinate without a word — which suits a city the size of Constant, where a single team could never watch every workshop alone. Among the chimneys and the union halls, the line between an ingenious invention and an uncanny one runs very thin, and it is the Hivemind that decides which is which.',
  null,
  5,
  'constant',
  '{}',
  '{}',
  ARRAY['machinery-hivemind', 'god-of-steam', 'constant', 'industrial', 'beyonder-organization'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'red-gloves-division',
  'The Red Gloves — Elite Nighthawk Division',
  'organization',
  'The Red Gloves are the elite division of the Nighthawks, promoted from the ordinary city teams of the Church of the Evernight Goddess and seated in the great Backlund diocese, but they belong to no single city. Their mission is twofold: to reinforce any Nighthawk team across the Loen Kingdom that has called for help against a threat beyond it, and to hunt down and arrest the worst evildoers of the Beyonder world without the jurisdictional limits that bind a local team. Where a city team handles its own patch, the Red Gloves go where the danger is — into Tingen for a betrayal too large for Captain Dunn Smith''s dozen, out to the industrial north of Constant for an incident the local teams could not close, anywhere a sealed report turns urgent. Their members are seasoned, higher-Sequence Beyonders, the captain among them the poet and Sleepless Leonard Mitchell, raised from the Tingen team to the Red Gloves and known in quieter circles as "The Star." To the wider Church they are the long arm reserved for what the ordinary Nighthawks cannot reach.',
  null,
  5,
  null,
  '{"Leonard Mitchell"}',
  '{}',
  ARRAY['nighthawks', 'red-gloves', 'evernight-goddess', 'elite', 'law-enforcement'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-gawain',
  'Gawain — The Last Awwa Knight',
  'npc',
  'Gawain is one of the last living representatives of the Awwa Knights'' Order of Chivalry, the knighthood that once guarded Tingen''s county and faded into history when the high-pressure steam gun and the six-barrel machine gun made armoured swordsmen obsolete. Far from mourning the change, Gawain has embraced it: a hard, weathered old combatant, he holds that there is no sense studying the sword in this age and that a fighting man should learn instead to draw his gun and shoot, mastering the most advanced weaponry the foundries can make. He earns his living now as a combat instructor in Tingen, drilling those who need to survive violence in strength, endurance, footwork, and marksmanship — among his pupils, for a season, the young Nighthawk-to-be Klein Moretti, whom he ran ragged through afternoons of basic conditioning and pistol work. Gruff, practical, and entirely without romance about his vanished order, Gawain is a useful man to know for anyone in Awwa County who expects to have to fight and would rather not die learning how.',
  null,
  5,
  'tingen',
  '{"Gawain","Klein Moretti"}',
  '{}',
  ARRAY['tingen', 'awwa-county', 'awwa-knights', 'combat-instructor', 'mentor'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-welch-mcgovern',
  'Welch McGovern — The Banker''s Son of Constant',
  'npc',
  'Welch McGovern is a young man of the Wind City of Constant, the son of a wealthy banking family with a stake in the Constant Coal and Steel Consortium, who came south to read history at Khoy University in Tingen. There he studied under Senior Associate Professor Cohen alongside Naya and the original Klein Moretti, and — easy-going, well-funded, and not much troubled by ambition — fell into the habit of leaning on his cleverer group-mates to carry the work he could not be bothered to do himself. Generous with his father''s money and careless with most else, he is the very picture of the comfortable provincial money that Constant''s furnaces have made: a Khoy man with a soft accent of the industrial north, a name that opens doors among the coal-and-steel set, and family connections that reach from the counting-houses of Constant to the lecture halls of Tingen. To anyone tied to the McGovern household he is a friend worth having and a responsibility worth watching — for trouble has a way of finding the heedless rich.',
  null,
  5,
  'constant',
  '{"Welch McGovern","Klein Moretti"}',
  '{}',
  ARRAY['constant', 'khoy-university', 'banking-family', 'civilian'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-pacheco-dwayne',
  'Pacheco Dwayne — Deputy Director of Compliance',
  'npc',
  'Pacheco Dwayne is a deputy director of the Compliance Department of the Loen Relic Search and Preservation Foundation — and, unknown to the Foundation''s ordinary staff, a Beyonder of the Black Emperor pathway. Common-featured, black-haired, and unremarkable to look at, he was once a private lawyer in Backlund, partner to the late Framis Cage and afterward legal adviser to the Backlund Bike Company. When Cage died, Pacheco secured Cage''s family a considerable share by means his rivals called inappropriate, and the enmity that earned him made Backlund too warm to stay; at Audrey Hall''s invitation he left the capital for East Chester County and the Foundation''s discreet Beyonder division. He is a man defined by a single conviction — that the world needs order and rules — and he applies it with a lawyer''s cold precision to the abnormal things the Foundation''s diggers unearth. Loyal to Audrey, allied with the men he trusts, and ruthless with those who break the order he believes in, Pacheco is the kind of subordinate a hidden power most wants: competent, principled in his fashion, and entirely discreet.',
  null,
  5,
  null,
  '{"Pacheco Dwayne","Framis Cage","Audrey Hall"}',
  '{5}',
  ARRAY['loen-relic-foundation', 'compliance-department', 'black-emperor-pathway', 'audrey-hall'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-barton',
  'Barton — An Ordinary Man of the Foundation',
  'npc',
  'Barton is an upper-middle-class clerk in the employ of the Loen Relic Search and Preservation Foundation, living a settled life in Stoen City of East Chester County with his wife and children, a devotee of the Church of the Lord of Storms and a reader of cheap murder-and-romance novels in his spare hours. He is, by every measure, an ordinary man — save for one thing. Ten years ago, on an archaeological excavation that went badly, Barton came away with a faint thread of spiritual perception no ordinary person carries: he senses, now and then, movements and presences that others cannot, a prickle at the back of the neck when something is wrong. It is not power, only awareness — but in a foundation whose diggers turn up the relics of older epochs, an ordinary man who can feel when a thing is wrong is more useful than he knows. His old friend the archaeologist Vernal Fnarr brings him trouble; his colleague the deputy director Pacheco Dwayne brings him answers; and Barton, who wants only a quiet life, keeps being drawn to the edge of a hidden world he was never meant to see.',
  null,
  5,
  null,
  '{"Barton","Vernal Fnarr","Pacheco Dwayne"}',
  '{}',
  ARRAY['loen-relic-foundation', 'east-chester-county', 'civilian', 'spiritual-perception'],
  230
);
