-- Seed additional city lore entries (issue #23): Backlund, Trier, Bayam
-- Generated from src/lib/lore/{backlund,trier,bayam}.ts TypeScript source files

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-city-overview',
  'Backlund — Overview',
  'location',
  'Backlund is the capital of the Loen Kingdom and the largest city of the Northern Continent, a metropolis of over five million people that styles itself the "Land of Hope" and the "City of Cities." It is also bitterly nicknamed the "Capital of Dust" for the atmospheric pollution that hangs over it. Sitting in the middle of the kingdom, only dozens of kilometres from the Sonia Sea, the city is split into two halves by the Tussock River, which flows to the southeast; the two banks are joined by the Backlund Bridge and by ferries. In the Fourth Epoch it was the capital of the Tudor-Trunsoest United Empire, and beneath its streets lie countless ancient ruins. Industry, opera, fashion, and finance all flourish here — anything can be had for the right price — but so does desperate poverty, and the Churches quietly press the nobility to reform the slums lest misery breed the descent of an evil god. All three orthodox Beyonder organizations active in the midlands maintain a far heavier presence here than in a provincial town like Tingen, and the capital teems with both Church-affiliated and unaffiliated Beyonders.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'capital', 'fifth-epoch'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-empress-borough',
  'Backlund — Empress Borough',
  'location',
  'Empress Borough is one of Backlund''s class-defined boroughs, the heart of wealth, fashion, and high society on the more refined bank of the Tussock River. Where the city''s cardinal boroughs — North, South, East, and West — are named for direction, the four class boroughs (Empress, Cherwood, Hillston, and St. George) are named for status, and Empress sits at the top. Here stand the townhouses of the nobility, the most exclusive clubs and salons, the grand opera houses, and shops selling goods from across both continents. Each borough is nearly the size of all of Tingen City, so even this single district is a small city in its own right. Wide, well-lit avenues are swept daily and patrolled openly; carriages of lacquered black roll between glittering windows. The borough is the social stage on which the kingdom''s great families perform their rivalries — through marriages, investments, and parliamentary intrigue — and where collectors of rare and dangerous curios quietly trade behind respectable doors.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['district', 'upper-class', 'high-society', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-hillston-borough',
  'Backlund — Hillston Borough',
  'location',
  'Hillston Borough is the borough of the comfortable and the aspiring — the bourgeoisie, prosperous merchants, senior civil servants, and professionals who have climbed clear of the working districts but cannot yet pretend to the heights of Empress Borough. Detached and semi-detached houses with small gardens line orderly streets; respectability here is a daily performance, maintained with domestic staff, calling cards, and careful attention to which clubs one belongs to. Like every borough of Backlund it is nearly the size of Tingen City entire. Hillston is the natural habitat of the rising middle class produced by the kingdom''s reforms — the Civil Servant Unified Examination and expanded education have swelled their ranks — and of the new money made in industry and finance. For the Beyonder world it is significant ground: organizations that recruit the educated and the ambitious, such as the psychiatry-fronted alchemists, find fertile soil among Hillston''s discreetly anxious strivers, and more than one unremarkable townhouse conceals a private collection of sealed curios.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['district', 'middle-class', 'setting', 'social-stratification'],
  205
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-east-borough',
  'Backlund — East Borough',
  'location',
  'East Borough is the vast working heart of Backlund — at least twice the size of any other borough, a sprawl of tenements, factories, foundries, and the smoke-spewing industrial district that gives the capital its choking air. Here live the labourers, dockhands, costermongers, and the desperately poor, packed into back-to-backs and rookeries where a single yellow-lit room may house a whole family. It was over East Borough, the dock area, and the factory quarter that the deadly smog of the winter of 1349 settled, killing tens of thousands. The squalor and resentment of the lower districts is exactly what the Churches fear: a breeding ground where misery might be harnessed to call down an evil god, and indeed cults have schemed to use precisely this. Beneath East Borough run sewers grander than those of any other city, and below them older tunnels still — the strata of a capital that has been inhabited since before the Fifth Epoch began.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['district', 'working-class', 'industrial', 'poverty', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-bridge-tussock',
  'Backlund — The Backlund Bridge & the Tussock River',
  'location',
  'The Tussock River cuts Backlund in two as it flows southeast toward the distant Sonia Sea, and the Backlund Bridge — together with a traffic of ferries — is the great seam that stitches the city''s two halves together. The same river that gives Tingen its docks far upstream becomes, here in the capital, a crowded artery of barges, lighters, and seagoing vessels feeding the dockland "shipyards" that line the waterfront. The bridge itself is a landmark and a thoroughfare: a river of carriages, omnibuses, and pedestrians crossing above a river of water, where the two distinct halves of Backlund society meet and mingle in transit. Fog rolls thick off the water at dusk, and the embankments below are a world apart from the boroughs above — mudlarks, watermen, and those with reasons to avoid the bridge''s gaslight. Because maritime and waterborne supernatural incidents fall to the Church of the Lord of Storms, its Beyonders keep a particular watch over the river, the bridge, and the dockland districts.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['landmark', 'waterway', 'bridge', 'docks', 'setting'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'backlund-orthodox-churches',
  'Backlund — The Orthodox Churches in the Capital',
  'organization',
  'Because Backlund is the capital and the most populous city of the Loen Kingdom, the orthodox Churches maintain their grandest cathedrals and their heaviest Beyonder presence here, far exceeding anything in a provincial town. The Church of the Evernight Goddess, the Church of the Lord of Storms, and the Church of the God of Steam and Machinery all hold formal authority in the kingdom, and their Beyonder arms — the Nighthawks, the Mandated Punishers, and the Machinery Hivemind — operate across the city under their respective jurisdictions. Since many devout workers cannot rest on Sundays and labour through the day, the cathedrals here keep their doors open until the early hours, letting believers come to pray and repent through the night. Beyond the orthodox Churches, the capital''s size shelters a dense undergrowth of the unaffiliated and the heretical: independent Beyonders, collectors, smuggling rings dealing in sealed curios, and on occasion full cults whose schemes have more than once threatened the city itself. Backlund is where the Beyonder world''s stakes are highest and its secrecy most fiercely guarded.',
  null,
  5,
  'backlund',
  '{}',
  '{}',
  ARRAY['organization', 'churches', 'nighthawks', 'mandated-punishers', 'setting'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-city-overview',
  'Trier — Overview',
  'location',
  'Trier is the capital of the Intis Republic, set in the region where the Ryan and Srenzo rivers meet on the western side of the Northern Continent. It is a world-class metropolis and a sacred land for artists, musicians, and novelists — a place of bustling arts and humanities so devoted to display that it is nicknamed the "City of Fashion," where even a figure in a black robe and hood draws no second glance and idlers walk turtles on leads to advertise their leisurely elegance. In the Fourth Epoch it was the capital of the Tudor Empire; in the Fifth it was rebuilt into its modern grandeur after the era of Emperor Roselle. Though Trier has its own pollution, its factories are sensibly confined to the south, so the city largely keeps its sunlight — unlike smog-shrouded Backlund. The Intis Republic is governed not by a king but by a parliament, and Trier seethes with the revolutionary ferment of that order: audacious students shout slogans in the streets, and the city is a crossroads of political fervour, art, and faith.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'intis-republic', 'capital', 'fifth-epoch'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-city-walls-quartiers',
  'Trier — The City Walls & Quartiers',
  'location',
  'Trier is girdled by a wall three metres high pierced by fifty-four gates, each manned by tax collectors and police who also watch for wanted criminals passing in or out. Within the walls the city is divided into twenty quartiers, and these districts structure both its government and its policing: Trier holds nearly forty seats in the Intis National Convention, distributed among the twenty quartiers, and the district representatives double as councillors on the Trier City Council. Every quartier keeps its own police headquarters under a commissioner, with a four-rank hierarchy of officers. Seats and prosperity are not evenly shared — the wealthier Greater Trier region carries disproportionate weight in the Convention, a fact that feeds the city''s political resentments. The gated, walled structure gives Trier a layered character: each quartier is a small world with its own character, police, and grievances, knit together by the toll-gates and the river traffic of the Ryan and Srenzo.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['district', 'walls', 'administration', 'setting'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-island-district',
  'Trier — The Island District',
  'location',
  'The Island District is the spiritual centre of Trier and the seat of the city''s dominant faith. Here rises Saint Viève Cathedral, the headquarters and chief cathedral of the Church of the Eternal Blazing Sun, whose golden dome catches and throws back the daylight the city is so proud of keeping. Like all cathedrals of the Blazing Sun, it is built on a resplendent golden base adorned with gilded accents — an onion-shaped dome painted shimmering gold as a representation of the radiant sun, set above white walls edged in gilt, a monumental Sun Sacred Emblem, vivid stained glass, and a vast mural sprinkled with golden powder. Sunlight pouring through the glass behind the altar lends the interior an atmosphere of profound sanctity. The Island District is therefore the beating heart of sun-worship in the Republic, the place from which the Church''s white-and-gold-robed clergy radiate their influence; their prayer gesture — head raised, arms spread as if to embrace sunlight — is performed here daily before the dawn.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['district', 'cathedral', 'eternal-blazing-sun', 'religion', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-underground',
  'Trier — The Underground & Catacombs',
  'location',
  'Beneath Trier lies a labyrinth as extensive as the surface, or more so. The city was once smaller and ringed by quarries that supplied its building stone; as the population swelled, Trier expanded to swallow the quarries, leaving the ground riddled with holes and mine tunnels. Part of the city sank underground in the Fourth Epoch, and the later installation of sewers, subways, and gas pipes made the subterranean network denser still. Over nearly a decade the City Hall reinforced pillars, joined isolated quarries, ruins, catacombs, and sewers into a single mapped warren, and — so workers would not lose themselves — named the underground streets to match the streets above. The Catacombs of Trier, entered near the Place du Purgatoire, were created when overcrowded surface cemeteries forced the dead underground; visitors are told to extinguish their lanterns and carry white candles instead, a quasi-ritual said to invoke a hidden protection. The deep levels are reputed to touch the corrupt remnants of Fourth Epoch Trier — making the underground a refuge for smugglers, rioters, cultists, and worse.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['district', 'underground', 'catacombs', 'setting'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-stations-transport',
  'Trier — Stations & City Transport',
  'location',
  'Trier moves on rails, river, and rented carriages. Two great steam-locomotive stations anchor its rail traffic: Suhit Station, linking the southern and central regions, and the Northern Train Station, serving the northern provinces — from here a traveller can take a third-, second-, or first-class seat to distant ports, or a private business-class room sold only in packages to keep companions'' affairs discreet. Within the city, hiring a carriage by day costs a verl d''or and a quarter for the first hour and more for each hour after; fares rise after midnight, and double-decker carriages carry the thriftier for a few coppet a head. The whole apparatus of tolls, fares, and timetables runs through the gated quartiers, so a journey across Trier is a passage through checkpoints as much as distance. It is a city built for showing oneself off in transit — its avenues, stations, and promenades are stages, and the leisurely pace of its citizens is itself a kind of performance.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['transport', 'railway', 'setting'],
  205
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-church-eternal-blazing-sun',
  'Trier — The Church of the Eternal Blazing Sun',
  'organization',
  'The Church of the Eternal Blazing Sun is the dominant orthodox faith of the Intis Republic and one of the great Churches of the Northern Continent, controlling the Sun Pathway. Its god, the Eternal Blazing Sun, is worshipped as the "Father of All Life," and the Republic — which it shares with the Church of the God of Steam and Machinery — is said to stand at the forefront of the world in the art of gold. Its headquarters and main cathedral, Saint Viève, stand in the Island District of Trier. The Church keeps poor relations with the Church of the Lord of Storms and the Church of the God of Knowledge and Wisdom, the three regarding one another as enemies. Its clergy wear resplendent white robes interwoven with golden thread and greet the sun with raised heads and outspread arms. In Trier the Church is not a distant authority but the visible spiritual power of the city — its golden domes, its night-and-day services, and its sun-priests are woven into the texture of a capital that prides itself on living in the light, even as revolutionary politics and a faith of radiant order strain against one another in the streets.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['organization', 'eternal-blazing-sun', 'sun-pathway', 'religion', 'setting'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'bayam-city-overview',
  'Bayam — Overview',
  'location',
  'Bayam is the capital of the Rorsted Archipelago, a port city built on Blue Mountain Island in the central Sonia Sea and nicknamed the "City of Generosity." The island it occupies is largely forested and richly endowed — gold, silver, copper, coal, and iron in its hills, and an abundance of fruit from its fertile land — so its first colonists named it for the plenty they found, a promised land said to flow with milk and honey. Bayam was for less than fifty years a pivotal colony of the Loen Kingdom in its Sonia Sea holdings, and the city still bears that history: many of its streets are named after cities of the Loen homeland. The air is salt and spice; the harbour is crowded with merchantmen, adventurers, informants, and pirates; and the whole archipelago trades on its exotic spices and its notorious pleasure-houses. By night a strict curfew falls over the city, and the cemeteries do not open until dawn. Beneath the colonial trade and the cosmopolitan bustle runs a deep current of island superstition that the foreign rulers have never fully suppressed.',
  null,
  5,
  'bayam',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'rorsted-archipelago', 'colony', 'fifth-epoch'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'bayam-harbour-district',
  'Bayam — The Harbour & Adventurers'' Quarter',
  'location',
  'Bayam''s life turns on its harbour and the warren of streets behind it where adventurers, sailors, informants, and pirates gather. The Swordfish Bar is the accepted meeting-place for adventurers, its blackboards of posted requests propped on wooden shelves along the wall; the Amyris Leaf Bar is famous as a Beyonder gathering spot where pirates and intelligence-brokers trade in rumour; and the rougher Seaweed Bar is where gangs and infamous pirates do their darker business through secret channels. Inns line the trade streets — the luxurious Wind of Azure Inn on Acid Lemon Street, the Teana Inn, and others — catering to travellers from across the seas. The local press, the Sonia Morning Post and the News Report, carry the announcements that send the whole quarter buzzing. Foreign powers keep embassies here — Intis, Feysac, and Feynapotter all maintain missions — so the harbour district is at once a marketplace, a rumour-mill, and a quiet battleground of competing interests, where a careful listener can buy almost any secret for the right price.',
  null,
  5,
  'bayam',
  '{}',
  '{}',
  ARRAY['district', 'harbour', 'adventurers', 'setting'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'bayam-cathedral-of-waves',
  'Bayam — The Cathedral of Waves',
  'location',
  'The Cathedral of Waves is the chief church of the Church of the Lord of Storms in the Rorsted Archipelago, and for years it was the largest cathedral in Bayam — the visible seat of orthodox authority over the sea-faring colony. The Church of the Lord of Storms is the true ruling power of the Beyonder world in the archipelago, charged with maritime and storm-related supernatural affairs across the Sonia Sea, and the Cathedral of Waves is the centre from which its high-ranking deacon — a member of the Council of Cardinals permanently stationed here — administers this key diocese. The cathedral stands above a city of foreigners and natives uneasily mingled, presiding over a colony where the Church has long waged a quiet war against the outlawed worship of the native sea-deity. Its services, its clergy, and its authority give Bayam an orthodox face; but the cathedral''s dominance has been challenged, and the religious landscape of the City of Generosity has proven far less settled than the Church''s grand stonework would suggest.',
  null,
  5,
  'bayam',
  '{}',
  '{}',
  ARRAY['cathedral', 'lord-of-storms', 'religion', 'setting'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'bayam-streets-cemeteries',
  'Bayam — Streets, Markets & Cemeteries',
  'location',
  'Bayam wears its colonial history in its very geography. Its streets carry the names of Loen cities, a constant reminder of the kingdom that ruled here; Enmat Street, named for Enmat Harbour, holds Mabel''s Sundry Store among its shopfronts, and Blackhorn Street its rented apartments. The city is sharply divided in death as in life: the natives are buried on the mountainside on the city''s outskirts, in ground specially set aside by the Church of Storms and the governor-general''s office, while foreigners who have settled here — merchants, adventurers, and migrants from Loen, Intis, Feysac, and Feynapotter — lie on a flat plain across the way, backed by forest. The Red Theatre, the most famous pleasure-house in the surrounding seas, anchors the city''s other great trade alongside the spices. Under a nightly curfew the streets empty after dark and the graveyards stay shut until dawn — a discipline that speaks to how much the colonial rulers fear what moves in Bayam by night.',
  null,
  5,
  'bayam',
  '{}',
  '{}',
  ARRAY['district', 'streets', 'cemeteries', 'colony', 'setting'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'bayam-sea-god-kalvetua',
  'Bayam — The Sea God Kalvetua & Native Belief',
  'metaphysics',
  'Before the Loen Kingdom completed its colonisation of the Rorsted Archipelago, the natives of Bayam, Blue Mountain Island, and the surrounding seas worshipped the Sea God Kalvetua — an unimaginably huge blue sea serpent, its scales covered in symbols, believed to guard the islands from earthquakes and tsunamis. Kalvetua is no mere legend: it is a genuine Beyonder of the Tyrant Pathway that took elements of an ancient power and styled itself a god, able to answer its believers'' prayers across the archipelago and to enchant their charms and tokens — though such blessings fade to nothing within a few months. The Church of the Lord of Storms has outlawed this worship and hunts its heretics, capturing devotees every month or two; rumour holds that powerful cardinals defeated and drove the serpent into hiding more than a century ago. Yet belief endures stubbornly in Bayam and across the islands, bound up with native resentment of colonial rule. The faith of the Sea God is the deepest of the island superstitions — a drowned, hunted, but living religion beneath the colony''s orthodox surface.',
  null,
  5,
  'bayam',
  '{}',
  '{}',
  ARRAY['sea-god', 'kalvetua', 'native-belief', 'tyrant-pathway', 'setting'],
  240
);

