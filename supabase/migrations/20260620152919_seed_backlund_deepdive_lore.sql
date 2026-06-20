-- Seed lore for the Backlund deep-dive (world build-out 4, issue #133): notable
-- boroughs/landmarks, the Rose School of Thought, the capital's Nighthawks
-- division, the Tarot Club, and the Backlund NPCs (12 entries). Generated from
-- the TS source (src/lib/lore/{backlund,organizations,npcs}.ts) — TS is
-- canonical. Same lore_entries INSERT format as the earlier lore seeds.
-- narratorOnly is a TS-only prompt flag (no column), intentionally not persisted.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-boroughs-structure',
  'Backlund — The Boroughs of the Capital',
  'location',
  'Backlund is administered as a patchwork of boroughs, and to know the capital is to know which borough a thing happens in. Four CARDINAL boroughs — North, South, East, and West — divide the city by geography, while four CLASS boroughs — Empress, Cherwood, Hillston, and St. George — divide it by station, from the gilded heights down through the comfortable middle to the labouring poor. Each borough is nearly the size of all of Tingen City, so a Backlunder may live an entire life within one and rarely set foot in another. The Tussock River is the great divide between the refined bank and the working bank, and a person''s address announces their rank before they speak a word. For a Beyonder this geography is practical knowledge: the orthodox Churches and the capital''s hidden factions concentrate their attention very differently from borough to borough, and a face that belongs in Empress Borough draws suspicion in the rookeries of the East — and the reverse just as surely.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['geography', 'districts', 'social-stratification', 'setting'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-harbor-docklands',
  'Backlund — Backlund Harbor & the Docklands',
  'location',
  'Where the Tussock River widens toward the distant Sonia Sea, Backlund becomes a working harbour: a forest of masts and smokestacks, wet-docks and dry-docks, warehouses and customs houses, and the long shipyards that build and mend the vessels of the largest port-capital on the Northern Continent. Goods from across both continents come ashore here, and so do things that pay to slip past the customs men — sealed curios, smuggled Beyonder materials, and stranger cargo still. The docklands are loud, dangerous, and a law unto themselves after dark, worked by sailors, stevedores, and the desperate, where a knife in the fog settles more disputes than any constable. Because maritime and weather-borne supernatural incidents fall to the Church of the Lord of Storms, its Mandated Punishers keep their closest watch over the harbour, the river-mouth, and the sailors'' quarter — for a returning ship may carry home far more than spice and tea.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['landmark', 'harbour', 'docks', 'mandated-punishers', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-underground-ruins',
  'Backlund — The Underground & the Ancient Ruins',
  'location',
  'Beneath Backlund lies another, older city. The capital''s sewers are the grandest in the kingdom, a brick labyrinth large enough to lose an army in, and below even them run the buried strata of everything Backlund has ever been: the city was the seat of the Tudor-Trunsoest United Empire in the Fourth Epoch, and the foundations, vaults, and tunnels of that vanished age still honeycomb the ground. Mudlarks and tunnel-folk work the upper drains; smugglers move goods through the lower ones; and now and then a digging crew or a collapsed cellar breaks through onto something far older and far worse — a sealed chamber, a ruin that should have stayed buried, a relic of the Empire that fell. The Churches treat the underground as permanently suspect, for it is exactly the kind of place where a cult can work unseen and an ancient horror can be woken by the careless or the curious.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['landmark', 'underground', 'ruins', 'fourth-epoch', 'setting'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-financial-district',
  'Backlund — The Financial District & the Stock Exchange',
  'location',
  'Backlund is the financial heart of the Loen Kingdom, and the institutions that move the kingdom''s money cluster on the refined bank of the Tussock: the great banks, the counting-houses, the insurance halls, and above all the Backlund Stock Exchange, where fortunes are made and unmade between the opening and closing bells. The capital styles itself the place where anything can be had for the right price — and here is where that price is set. The district runs on credit, rumour, and nerve; a whisper can crash a share or float a swindle, and the line between respectable finance and outright fraud is thin and often crossed. For the Beyonder world this matters more than it seems: vast sums move quietly here, collectors and secret societies fund themselves through shell ventures and front companies, and more than one financial panic in the capital''s history has had a supernatural hand behind it. Money is its own kind of power in Backlund, and the people who command it are always worth watching.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['landmark', 'finance', 'stock-exchange', 'setting'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'rose-school-of-thought-overview',
  'Rose School of Thought — Overview',
  'organization',
  'The Rose School of Thought is a secret society rooted in Backlund and the wider Loen Kingdom, drawn chiefly from the nobility, the wealthy, and the educated. Standing outside the authority of the orthodox Church of the Evernight Goddess, its members privately revere the Goddess in their own heterodox fashion — as patrons of mysticism, collectors of the rare and the forbidden, and seekers after the truths the orthodox clergy keep locked away. To the little of the world that knows it exists at all, the Rose School is a rumour of a refined salon where titled men and women trade in curios and secrets behind respectable doors; its true membership, reach, and purposes it keeps well hidden. It recruits quietly from those with standing to lose and curiosity enough to risk it, and it takes a particular interest in Beyonders who can be made useful to its discreet designs.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['rose-school-of-thought', 'secret-organization', 'evernight-goddess', 'backlund', 'nobility'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'rose-school-of-thought-doctrine',
  'Rose School of Thought — Heterodox Doctrine',
  'organization',
  'Behind its salon face the Rose School of Thought is a genuine mystic order with its own theology and its own ambitions. Its inner teaching holds that the orthodox Church has tamed and diminished the Evernight Goddess''s mysteries, and that the night, the soul, the moon, and the boundary of death conceal deeper truths the Church will not pursue — so the School pursues them itself. It keeps its own rites, its own collection of sealed artifacts and forbidden texts, and quiet ties to Beyonders of the moonlit and night-bound pathways who would find no welcome among the orthodox. Its highest circles guard knowledge the Church would call heresy and the Mandated Punishers would call a crime, advancing it patiently, under cover of respectability, across generations of Loen''s great families. To rise within the Rose School is to learn how much of the capital''s quiet power already answers to it.',
  null,
  5,
  'backlund',
  '{}',
  ARRAY[4],
  ARRAY['rose-school-of-thought', 'secret-organization', 'evernight-goddess', 'moon-pathway', 'spoiler'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-nighthawks-team',
  'Nighthawks — Backlund Division',
  'organization',
  'The Backlund Nighthawks are the Church of the Evernight Goddess''s Beyonder arm in the capital, and they dwarf a provincial posting like Tingen''s. Where Tingen fields a single dozen-strong team, Backlund supports multiple teams under the capital''s bishops, coordinating across a metropolis of five million through cover identities, safehouses, and the diocese''s central vault of sealed artifacts. Their casework is heavier and far more dangerous: organised cults, rogue high-Sequence Beyonders, smuggling rings moving curios through the docklands, and incidents that reach up into Parliament and the noble houses themselves. The capital''s Nighthawks work alongside — and sometimes against the jurisdiction of — the Mandated Punishers of the Lord of Storms and the Machinery Hivemind of the God of Steam, with whom they share the city by uneasy treaty. For an ambitious or unlucky Beyonder, Backlund is where the Nighthawks'' reach is longest and the cost of being noticed is highest.',
  null,
  5,
  'backlund',
  '{}',
  ARRAY[9, 8, 7],
  ARRAY['nighthawks', 'evernight-goddess', 'backlund', 'team-composition'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tarot-club-origins',
  'The Tarot Club — Origins & the Meeting Above the Gray Fog',
  'organization',
  'The Tarot Club is a tiny, intensely secret gathering convened "above the gray fog" — in a space beyond the ordinary world, reached only through the ritual of its founder, the masked figure known as The Fool. Its members attend not in the flesh but as summoned presences seated around a long bronze table, and each is known only by the name of a tarot card — The Fool, The Sun, The Star, The Hanged Man, Justice, and others as the circle slowly grows. They never learn one another''s true faces, names, or homes unless they choose to share them. What binds them is mutual benefit and a fragile, deepening trust: they trade intelligence, Beyonder ingredients, formulas, and warnings none could gather alone, each profiting from the others'' distant corners of the world. The Club''s very existence is among the best-kept secrets of the Beyonder world, and its members guard it as though their lives depend on it — because, very often, they do.',
  null,
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['tarot-club', 'the-fool', 'secret-organization', 'fool-pathway'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tarot-club-fate',
  'The Tarot Club — The Fool and Fate',
  'organization',
  'To its members the Tarot Club is more than a meeting; it rests on the mystery of its founder. The Fool presents as an ancient, all-knowing deity "who does not truly exist," a being wrapped in the imagery of fate, fortune, and the turning card — and the members, unable to verify the claim and unwilling to test it, treat him with genuine awe. The Club''s power feels like the power of fate itself: its summoning ritual reaches across the world without regard for distance, its divinations seem to bend probability, and to sit at its bronze table is to feel oneself caught in a design larger than any single Beyonder. Whether The Fool is the god he appears, a mortal of extraordinary craft, or something stranger between, none of the members can say — and the not-knowing is part of what holds the circle in its careful, fate-bound trust.',
  null,
  5,
  null,
  '{}',
  ARRAY[4],
  ARRAY['tarot-club', 'the-fool', 'fate', 'divination', 'secret-organization', 'spoiler'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-audrey-hall',
  'Audrey Hall — Lady of Empress Borough, the Tarot Club''s Justice',
  'npc',
  'Audrey Hall is the youngest daughter of the aristocratic Hall family of Backlund''s Empress Borough, a poised and famously charming young noblewoman who moves easily through the salons and balls of the capital''s high society. Behind that public face she is a Beyonder of the Spectator (Visionary) pathway, gifted in reading and gently swaying the minds and emotions of others, and — known to no one in her ordinary world — a member of the secret Tarot Club, where she takes the name "Justice." Audrey is idealistic, quick-witted, and far braver than her sheltered upbringing would suggest, determined to use her gifts to do genuine good. Her ties define her: her stern father the Earl, her sociable elder brother Hibbert Hall, and her devoted dog Susie at home; and, above the gray fog, the mysterious The Fool and her fellow Tarot members, whom she comes to trust more than almost anyone in her daylight life. She is a living bridge between Backlund''s gilded surface and its hidden Beyonder depths.',
  null,
  5,
  'backlund',
  ARRAY['Audrey Hall', 'Hibbert Hall'],
  '{}',
  ARRAY['backlund', 'hall-family', 'tarot-club', 'the-justice', 'visionary-pathway'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-hall-family',
  'The Hall Family — A Noble House of Empress Borough',
  'npc',
  'The Hall family is one of the established aristocratic houses of Backlund, seated in a fine townhouse in Empress Borough on the refined bank of the Tussock. Headed by the Earl — a proud, conventional patriarch concerned above all with the family''s standing — the household includes his elder son and heir Hibbert Hall, who is sociable, a touch idle, and fond of the capital''s pleasures, and his youngest daughter Audrey, the family''s brightest light in society. Like the great families around them, the Halls live by the rituals of their class: the season''s balls, advantageous marriages, parliamentary connections, and the careful management of reputation. On the surface they are exactly what they appear to be — old money in a city built on it. What the Earl does not know is that his daughter walks in a hidden world far stranger and more dangerous than any drawing-room intrigue, and that the Hall name has quietly become a thread in the Beyonder affairs of the capital.',
  null,
  5,
  'backlund',
  ARRAY['Hibbert Hall', 'Audrey Hall'],
  '{}',
  ARRAY['backlund', 'hall-family', 'nobility', 'empress-borough'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-alger-wilson',
  'Alger Wilson — The Hanged Man',
  'npc',
  'Alger Wilson is a sea-faring Beyonder, a hard and watchful man shaped by years aboard ship and in the harbour underworlds of the Northern Continent. Within the Beyonder world he belongs to the Rose School of Thought, the secret Loen mystic society, and — above the gray fog — to the Tarot Club, where he is known as "The Hanged Man." Cautious to the point of paranoia and slow to trust, Alger has clawed his survival and his advancement out of dangerous waters by being careful, and he brings that wariness to the Club''s table, trading intelligence and Beyonder goods like a man who expects every bargain to be a trap. His ties run to the sea and its sailor-Beyonders, to the Rose School''s hidden network, and to his fellow Tarot members — above all the enigmatic The Fool, whose power he respects and fears in equal measure. He is the kind of ally who keeps a promise precisely because he assumes everyone else will break theirs.',
  null,
  5,
  null,
  ARRAY['Alger Wilson'],
  ARRAY[7],
  ARRAY['tarot-club', 'the-hanged-man', 'rose-school-of-thought', 'sailor'],
  220
);
