-- Correct world-build-out lore against the canon corpus (issues #132/#133).
-- A resync migration (the 20260618130000_resync_pathway_lore_seq0 pattern): the
-- earlier Forsaken-Land (20260620125028) and Backlund (20260620152919) seeds
-- carried memory-sourced errors caught against corpus/wiki — the Rose School of
-- Thought worships the Mother Tree of Desire (Chained pathway), NOT the Evernight
-- Goddess; Alger Wilson is not Rose School and not Backlund; the City of Silver is
-- giant-descended (Twilight Giant), not a faith-order with 'Silver Knights'. This
-- brings the affected rows to the corrected TS (src/lib/lore/* is canonical) and
-- removes the obsolete slugs. Upsert = delete-then-insert (re-runnable).

delete from public.lore_entries where slug in ('npc-alger-wilson', 'rose-school-of-thought-doctrine');

delete from public.lore_entries where slug = 'city-of-silver-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'city-of-silver-overview',
  'The City of Silver — Overview',
  'location',
  'The City of Silver is one of the few surviving cities of the Forsaken Land of the Gods, the desolate Eastern Continent that was torn from the world and sealed away when the Ancient Sun God fell. Once the seat of the Kingdom of Silver, it stands under a sky that never clears: a grey, ash-lit sprawl of old grey-white stone, narrow streets, and high lightning-rods, ringed by dead country no one crosses. Its people are the descendants of those left behind when the continent was sundered — many carry the blood of the old giants and walk the Twilight Giant path — a proud, inward-looking folk who have made their peace with isolation. They do not expect rescue and no longer want it; the City endures by its own discipline and the grim certainty that beyond its walls there is only ruin and the sealing sea. To a newcomer it is beautiful and terrible at once, a place that has outlived the god it once served.',
  null,
  5,
  'silver',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'geography', 'twilight-giant', 'fifth-epoch'],
  205
);

delete from public.lore_entries where slug = 'city-of-silver-society';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'city-of-silver-society',
  'The City of Silver — The Giant-Blooded',
  'location',
  'Silver society is a closed order shaped by centuries of isolation. Its people are giant-descended, and the strongest among them walk the Twilight Giant path — towering warriors whose elite are honoured, by old custom, with the title of Silver Knight; they hold the walls against what the dead land sends and keep the watch over Giant King''s Court. Below them the houses and guilds keep the lightning-craft, the foundries, and the rationed fields under their shielded glass. Strangers are almost unknown, so an outsider is marked at once: watched, questioned, and judged against customs they do not know. Yet the City is not cruel for its own sake — it is a people determined to remain a people in a place the world wrote off, holding to lineage, memory, and duty as the only walls that have never fallen. Ambition here is measured in standing among the giant-blood, and the surest path to belonging is to take up the watch yourself.',
  null,
  5,
  'silver',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'twilight-giant', 'society', 'fifth-epoch'],
  210
);

delete from public.lore_entries where slug = 'backlund-boroughs-structure';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-boroughs-structure',
  'Backlund — The Boroughs of the Capital',
  'location',
  'Backlund is administered as a patchwork of boroughs, and to know the capital is to know which borough a thing happens in. Four CARDINAL boroughs — North, South, East, and West — divide the city by geography, while four CLASS boroughs divide it by station: Empress Borough, where the nobility and the rich keep their townhouses behind the city''s best security; Hillston Borough, the financial and business heart, home to the banks and the Stock Exchange; Cherwood Borough, the comfortable middle along the river; and St. George Borough, the industrial working district of factories and the labouring poor. Each borough is nearly the size of all of Tingen City, so a Backlunder may live an entire life within one and rarely set foot in another. The Tussock River is the great divide between the refined bank and the working bank, and a person''s address announces their rank before they speak a word. For a Beyonder this geography is practical knowledge: the orthodox Churches and the capital''s hidden factions concentrate their attention very differently from borough to borough, and a face that belongs in Empress Borough draws suspicion in the rookeries of the East — and the reverse just as surely.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['geography', 'districts', 'social-stratification', 'setting'],
  230
);

delete from public.lore_entries where slug = 'backlund-harbor-docklands';
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

delete from public.lore_entries where slug = 'backlund-underground-ruins';
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

delete from public.lore_entries where slug = 'backlund-financial-district';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-financial-district',
  'Backlund — Hillston Borough & the Stock Exchange',
  'location',
  'Hillston Borough is the financial and business heart of the Loen Kingdom, where the institutions that move the kingdom''s money cluster on the refined bank of the Tussock: the great banks, the counting-houses, the insurance halls, and above all the Backlund Stock Exchange, where fortunes are made and unmade between the opening and closing bells. The capital styles itself the place where anything can be had for the right price — and here is where that price is set. The district runs on credit, rumour, and nerve; a whisper can crash a share or float a swindle, and the line between respectable finance and outright fraud is thin and often crossed. For the Beyonder world this matters more than it seems: vast sums move quietly here, collectors and secret societies fund themselves through shell ventures and front companies, and more than one financial panic in the capital''s history has had a supernatural hand behind it. Money is its own kind of power in Backlund, and the people who command it are always worth watching.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['district', 'hillston', 'finance', 'stock-exchange', 'setting'],
  225
);

delete from public.lore_entries where slug = 'backlund-great-smog';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-great-smog',
  'Backlund — The Great Smog',
  'event',
  'The Great Smog of Backlund is remembered by the public as the deadliest disaster in the capital''s modern history: a monstrous, unnatural fog settled over the city in the depths of winter and would not lift, choking tens of thousands to death within days, with plague and ruin claiming tens of thousands more in the aftermath. The official account blamed coal-smoke, foul weather, and a disgraced member of the royal family. The truth, known only to a few, is far worse: the smog was deliberately raised as the engine of a forbidden apotheosis ritual — the work of a Sequence-0 Demoness remembered as Lady Despair, in concert with conspirators reaching into the royal house itself and the fanatics of the Aurora Order, who meant to ride the mass death to godhood. The plot was stopped and buried, the true perpetrators struck from the record, and Backlund went on mourning a tragedy it never understood. To a Beyonder, the Great Smog stands as a warning of what the capital''s hidden powers will spend to ascend.',
  null,
  5,
  'backlund',
  '{}',
  ARRAY[5],
  ARRAY['backlund', 'great-smog', 'event', 'aurora-order', 'demoness', 'history'],
  220
);

delete from public.lore_entries where slug = 'rose-school-of-thought-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'rose-school-of-thought-overview',
  'Rose School of Thought — Overview',
  'organization',
  'The Rose School of Thought is a secret society of the Beyonder world, infamous in hushed rumour as a cult of unbound desire. It began long ago as an order devoted to TEMPERANCE — the disciplined restraint of want — but its god was corrupted by the Mother Tree of Desire, and the dominant Indulgence faction that grew from the ruin now preaches the opposite: the release and gratification of every appetite, sealed in blood and depravity. Drawn largely from the Chained pathway, with a faction of moon-worshippers sheltering uneasily among them, the School keeps to the shadows of the wider world and is reckoned by the orthodox Churches a heresy to be hunted rather than an open enemy. Where it surfaces it leaves ruin and willing converts behind it in equal measure, and it has no love for the secrecy-keeping Churches that would see it burned.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['rose-school-of-thought', 'secret-organization', 'chained-pathway', 'mother-tree-of-desire'],
  200
);

delete from public.lore_entries where slug = 'rose-school-of-thought-factions';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'rose-school-of-thought-factions',
  'Rose School of Thought — The Schism of Desire',
  'organization',
  'Behind the rumour the Rose School is split by a long and bloody schism. The INDULGENCE faction, corrupted by and devoted to the Mother Tree of Desire, holds the School and hunts all who resist it; a separate band, the Primordial Moon faction of the Moon pathway, shelters uneasily within it. Against them once stood the TEMPERANCE faction — keepers of the order''s original creed of restraint — who were shattered in a surprise attack and driven into exile. Its survivors, among them Reinette Tinekerr and her students Sharron and Maric, fled across the world and took protection under the mysterious founder of the Tarot Club, "The Fool," joining the Church of the Fool rather than be consumed by the Mother Tree. The School''s war over desire and restraint is one of the quiet fronts of the Beyonder world''s larger struggle, and the Indulgence faction''s reach now touches the Devil families and other servants of desire.',
  null,
  5,
  null,
  ARRAY['Reinette Tinekerr', 'Sharron', 'Maric'],
  ARRAY[4],
  ARRAY['rose-school-of-thought', 'secret-organization', 'chained-pathway', 'temperance', 'mother-tree-of-desire', 'spoiler'],
  205
);

delete from public.lore_entries where slug = 'backlund-nighthawks-team';
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

delete from public.lore_entries where slug = 'tarot-club-origins';
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

delete from public.lore_entries where slug = 'tarot-club-fate';
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

delete from public.lore_entries where slug = 'npc-audrey-hall';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-audrey-hall',
  'Audrey Hall — Lady of Empress Borough, the Tarot Club''s Justice',
  'npc',
  'Audrey Hall is the youngest child and only daughter of the aristocratic Hall family of Backlund''s Empress Borough — her father an Earl who sits in the Cabinet and ranks among Loen''s foremost bankers, her mother Caitlyn, and her two elder brothers Hibbert and Alfred. A poised and famously charming young noblewoman, called "Backlund''s most dazzling gem," she moves easily through the salons and balls of the capital''s high society. Behind that public face she is a Beyonder of the Visionary (Spectator) pathway, gifted in reading and gently swaying the minds and hearts of others, and — known to no one in her ordinary world — a member of the secret Tarot Club, where she takes the name "Justice." Idealistic, quick-witted, and braver than her sheltered upbringing would suggest, she is determined to use her gifts for genuine good. Her devoted golden retriever Susie — who drank one of her early potions and is no ordinary dog — is rarely far from her side. She is a living bridge between Backlund''s gilded surface and its hidden Beyonder depths.',
  null,
  5,
  'backlund',
  ARRAY['Audrey Hall', 'Hibbert Hall', 'Alfred Hall', 'Caitlyn Hall'],
  '{}',
  ARRAY['backlund', 'hall-family', 'tarot-club', 'the-justice', 'visionary-pathway'],
  250
);

delete from public.lore_entries where slug = 'npc-hall-family';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-hall-family',
  'The Hall Family — A Noble House of Empress Borough',
  'npc',
  'The Hall family is one of the most prominent aristocratic houses of Backlund, seated in the Earl Hall Villa in Empress Borough on the refined bank of the Tussock. The Earl himself is a power in the capital — a member of the Cabinet and one of the foremost bankers of the Loen Kingdom — and with his wife Caitlyn he has raised three children: the eldest son and heir Hibbert, the second son Alfred, and the youngest, his only daughter Audrey, the family''s brightest light in society. Like the great families around them the Halls live by the rituals of their class: the season''s balls, advantageous marriages, parliamentary connection, and the careful management of reputation and fortune. On the surface they are exactly what they appear to be — old money and high office in a city built on both. What the Earl does not know is that his daughter walks a hidden world far stranger and more dangerous than any drawing-room intrigue.',
  null,
  5,
  'backlund',
  ARRAY['Caitlyn Hall', 'Hibbert Hall', 'Alfred Hall', 'Audrey Hall'],
  '{}',
  ARRAY['backlund', 'hall-family', 'nobility', 'empress-borough'],
  220
);

delete from public.lore_entries where slug = 'npc-klein-backlund-identities';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-klein-backlund-identities',
  'Sherlock Moriarty & Dwayne Dantès — Backlund Cover Identities',
  'npc',
  'In Backlund, one extraordinarily capable Beyonder operates behind two carefully built faces. SHERLOCK MORIARTY is a private detective working out of an office on Minsk Street in Cherwood Borough — sharp, theatrical, and uncannily good at the cases the police cannot close; he moves through the capital''s underworld and its tragedies, the smog-choked economic crisis among them, gathering what no badge ever could. DWAYNE DANTÈS is the other face: a mysterious, fabulously wealthy tycoon and philanthropist who buys his way into Empress Borough high society, founds a charitable bursary, donates to the Church of the Evernight Goddess, and trades quietly in influence and arms. The two never appear to be the same man, and neither appears to be what he truly is — a powerful Beyonder, the Tarot Club''s masked "Fool," using Backlund as his stage. To the city they are a clever detective and a generous magnate; to those who could see clearly, they are two masks worn by a single mind.',
  null,
  5,
  'backlund',
  ARRAY['Sherlock Moriarty', 'Dwayne Dantès', 'Klein Moretti'],
  '{}',
  ARRAY['backlund', 'klein-identities', 'sherlock-moriarty', 'dwayne-dantes', 'tarot-club'],
  230
);

delete from public.lore_entries where slug = 'npc-bravehearts-temperance';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-bravehearts-temperance',
  'Sharron & Maric — the Bravehearts Bar Exiles',
  'npc',
  'Sharron and Maric are two Beyonders of the Chained pathway who fled the Rose School of Thought when its Temperance faction was shattered, and who found refuge in Backlund under the protection of the Tarot Club''s "The Fool." They keep to the Bravehearts Bar near the Backlund Bridge and to lodgings in Hillston Borough — Sharron a formidable, watchful bodyguard (hired more than once by their mysterious patron) who carries the Tarot name "Temperance," and Maric her steadfast companion, the "Knight of Swords." Survivors of an order that turned to devouring desire, they hold instead to the discipline of restraint the Rose School abandoned. To ordinary Backlunders they are simply foreign regulars at a riverside bar; in truth they are exiles of a heresy, sheltering with the very network that opposes the Mother Tree of Desire, and fiercely loyal to the patron who took them in when their own kind hunted them.',
  null,
  5,
  'backlund',
  ARRAY['Sharron', 'Maric', 'Reinette Tinekerr'],
  '{}',
  ARRAY['backlund', 'rose-school-of-thought', 'temperance', 'tarot-club', 'chained-pathway'],
  215
);

delete from public.lore_entries where slug = 'npc-derrick-berg';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-derrick-berg',
  'Derrick Berg — The Sun of the Tarot Club',
  'npc',
  'Derrick Berg is a young man born and raised in the City of Silver, one of the surviving cities of the Forsaken Land of the Gods, and one of the rare souls to leave it by the Dream-World passage. A devout, earnest, and physically powerful Beyonder of the Sun pathway, he was a defender of the City before the wider world opened to him. He becomes a member of the Tarot Club under the code name "The Sun," where his sincerity and raw strength make him both a reliable ally and, at times, an unwitting source of comedy among subtler members. His defining ties are to his home: his family and the brotherhood of the City of Silver''s defenders, the faith of the abandoned that he carries with unshaken conviction, and — through the Tarot Club — a growing bond with The Fool (Klein Moretti) and the other members "above the gray fog." Derrick''s arc is one of a sheltered believer discovering how vast and dangerous the real world is, without ever losing the openhearted decency the City raised in him.',
  null,
  5,
  'silver',
  ARRAY['Derrick Berg'],
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'tarot-club', 'the-sun', 'sun-pathway'],
  220
);
