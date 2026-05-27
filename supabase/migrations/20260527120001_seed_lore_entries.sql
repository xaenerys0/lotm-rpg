npm warn exec The following package was not found and will be installed: tsx@4.22.3
-- Seed lore entries for MVP (4 pathways, Tingen City, Fifth Epoch)
-- Generated from src/lib/lore/ TypeScript source files

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-city-overview',
  'Tingen City — Overview',
  'location',
  'Tingen City is a mid-sized industrial city in the Awwa County of the Loen Kingdom, situated along the Tussock River in the kingdom''s midlands. It serves as the primary setting for the opening arc of Lord of the Mysteries. The city is a microcosm of Fifth Epoch society: gas-lit streets, steam-powered factories, horse-drawn carriages, and a populace navigating the tensions between industrial progress and entrenched class hierarchies. Tingen has a population of roughly 300,000 and functions as a regional center for trade, education, and light manufacturing. The city''s atmosphere is defined by perpetual overcast skies, the smell of coal smoke, and a pervasive sense that something ancient lurks beneath its veneer of modernity. Supernatural incidents are quietly handled by the three official Beyonder organizations stationed here: the Nighthawks (Church of the Evernight Goddess), the Mandated Punishers (Church of the Lord of Storms), and the Machinery Hivemind (Church of the God of Steam and Machinery).',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'loen-kingdom', 'fifth-epoch'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-iron-cross-district',
  'Tingen — Iron Cross District',
  'location',
  'Iron Cross Street and its surrounding district form one of Tingen''s lower-middle-class neighborhoods. Klein Moretti''s apartment is located here, a modest flat in a multi-story tenement building. The district is characterized by narrow cobblestone streets, rows of brick tenements with iron railings, small shops at street level, and the constant background noise of factory whistles. The residents are predominantly factory workers, clerks, and minor civil servants. Gas lamps line the main thoroughfares but many side alleys remain dark after sunset. A small church and several pubs serve as community gathering points. The area is not impoverished but carries a sense of constrained respectability — residents maintain appearances despite modest means. Klein''s daily life here involves walking to Blackthorn Security Company (the Nighthawks'' cover operation) and frequenting the local newsstand and food vendors.',
  null,
  5,
  'tingen',
  ARRAY['Klein Moretti'],
  '{}',
  ARRAY['district', 'residential', 'setting'],
  180
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-khoy-university',
  'Tingen — Khoy University',
  'location',
  'Khoy University is Tingen''s premier institution of higher learning, located in the northern part of the city. It offers programs in history, law, medicine, and the natural sciences. Klein Moretti attended Khoy University as a history student before his death and subsequent transmigration. The university campus features stone buildings in a classical architectural style, a modest library, lecture halls, and tree-lined courtyards. The faculty includes both conventional academics and, unbeknownst to most, individuals with connections to the Beyonder world — some serve as informants for the orthodox churches. The university plays a role in the early narrative as Klein draws on his academic knowledge of history to navigate the Beyonder world''s complex lore and rituals. Students at Khoy University represent Tingen''s aspiring middle class, and the institution serves as a social hub where different classes intermingle.',
  null,
  5,
  'tingen',
  ARRAY['Klein Moretti'],
  '{}',
  ARRAY['education', 'institution', 'setting'],
  185
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-blackthorn-security',
  'Tingen — Blackthorn Security Company',
  'location',
  'Blackthorn Security Company is the front operation for the Tingen Nighthawks team, located on Zouteland Street. To the public, it appears to be a small private security firm. Behind its mundane facade, the building contains a concealed underground operations center where the Nighthawks conduct their true work: investigating supernatural incidents, sealing dangerous artifacts, and eliminating threats from uncontrolled Beyonders and aberrations. The building has a modest office on the ground floor with a reception area staffed by Mrs. Klarman, and the real work happens in sealed basement rooms equipped with ritual materials, containment wards, and an evidence vault for mystical artifacts. Captain Dunn Smith maintains his office here, perpetually dozing between cases. The Nighthawks operate under strict secrecy — their existence as a Beyonder organization is classified, and all members maintain cover identities as security consultants.',
  null,
  5,
  'tingen',
  ARRAY['Dunn Smith', 'Klein Moretti', 'Leonard Mitchell'],
  '{}',
  ARRAY['nighthawks', 'headquarters', 'cover-operation', 'setting'],
  195
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-divination-club',
  'Tingen — Divination Club',
  'location',
  'The Divination Club is a semi-private social gathering in Tingen where enthusiasts of the occult meet to practice divination, share mystical knowledge, and discuss esoteric topics. Located in a rented hall, the club is one of Tingen''s few venues where interest in the supernatural is openly expressed — though most members are ordinary people dabbling in superstition rather than true Beyonders. Klein Moretti frequents the club after becoming a Sequence 9 Seer, using it both to practice his divination abilities and to digest his potion by "acting" the role of a mysterious seer. The club provides Klein with a social cover and a venue for his acting method. Members are a mix of curious intellectuals, minor nobles seeking entertainment, and the occasional genuine practitioner. The club''s atmosphere blends Victorian parlor society with occult aesthetics — crystal balls, tarot decks, astrology charts, and dim candlelight define the setting.',
  null,
  5,
  'tingen',
  ARRAY['Klein Moretti'],
  ARRAY[9],
  ARRAY['social', 'divination', 'acting-method', 'setting'],
  195
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-cathedral-of-serenity',
  'Tingen — Cathedral of Serenity',
  'location',
  'The Cathedral of Serenity is Tingen''s primary house of worship for the Church of the Evernight Goddess. It is the largest religious building in the city, featuring tall stained-glass windows depicting the Goddess in her aspect as guardian of the night, dark stone architecture, and a perpetually dim interior lit by candlelight. The cathedral serves as the spiritual center for Tingen''s Evernight faithful and the administrative hub from which the Nighthawks receive their orders. Bishop Utravsky presides over public services, while the Nighthawks'' chain of command runs through the church hierarchy. The cathedral''s basement contains restricted archives and sealed chambers for handling dangerous artifacts. Sunday services draw large congregations from all social classes. The atmosphere is solemn and comforting — the Evernight Goddess''s doctrine emphasizes rest, darkness as shelter, and the peace of eternal sleep. For Klein, the cathedral represents both his cover organization''s spiritual authority and a genuine source of protection.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['church', 'evernight-goddess', 'religion', 'nighthawks', 'setting'],
  200
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-tussock-river',
  'Tingen — Tussock River and Docks',
  'location',
  'The Tussock River runs through Tingen City, serving as both a commercial waterway and a natural boundary between the city''s districts. The docks along the river handle cargo from inland barges and smaller seagoing vessels, making Tingen a secondary trade hub. The dock district is rougher than the city center — warehouses, taverns catering to sailors and dockworkers, and flophouses line the waterfront. The Mandated Punishers (the Beyonder arm of the Church of the Lord of Storms) maintain a stronger presence in this area, as maritime supernatural incidents fall under their jurisdiction. At night, the river district becomes particularly atmospheric: fog rolls off the water, gas lamps create pools of yellowish light, and the sound of the river provides a constant backdrop. Several early supernatural encounters in the narrative occur near or on the Tussock River, including investigations into smuggled Beyonder materials and encounters with water-dwelling aberrations.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['waterway', 'commerce', 'docks', 'mandated-punishers', 'setting'],
  195
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'tingen-north-district',
  'Tingen — Backlund and Hillston Upper Districts',
  'location',
  'Tingen''s northern and elevated areas house the city''s wealthier residents. Named areas like Hillston Borough feature detached homes with small gardens, wider streets with better gas lighting, and proximity to Khoy University. The local aristocracy and successful merchants reside here, maintaining social clubs, hosting evening gatherings, and employing domestic staff. These districts contrast sharply with the working-class neighborhoods near the river and factories. The police presence is more visible, the streets are cleaner, and horse-drawn carriages are common. For the Beyonder world, these upper districts are significant because several secretive collectors of mystical artifacts reside here, and the Psychology Alchemists recruit from the educated upper class. The social stratification visible in Tingen''s geography mirrors the Loen Kingdom''s broader class structure, where birth, education, and wealth determine access to both mundane and supernatural opportunities.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['district', 'upper-class', 'setting', 'social-stratification'],
  185
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fifth-epoch-overview',
  'Fifth Epoch — The Iron Age',
  'metaphysics',
  'The Fifth Epoch, known as the Iron Age, is the current historical era. It began after the conclusion of the Fourth Epoch''s devastating divine wars and is defined by three characteristics: the Industrial Revolution, the concealment of mysticism from the general public, and the dominance of the Seven Orthodox Churches. Steam power drives factories and transportation, gas lamps illuminate city streets, and mechanical innovation reshapes society. The general populace is unaware of the Beyonder world — supernatural incidents are suppressed by the orthodox churches and their Beyonder organizations. This concealment is deliberate policy: the churches learned from the Fourth Epoch that open divine intervention causes catastrophic collateral damage. The major nations of the Northern Continent — the Loen Kingdom, the Intis Republic, the Feysac Empire, and the Feynapotter Kingdom — maintain an uneasy balance of power, with each nation aligned with specific orthodox churches. The Southern Continent remains largely colonized by Northern powers.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['epoch', 'history', 'industrial-revolution', 'concealment', 'world-setting'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fifth-epoch-political-landscape',
  'Fifth Epoch — Political Landscape',
  'metaphysics',
  'The Northern Continent''s four major nations each maintain distinct political systems and church alignments. The Loen Kingdom, modeled on Victorian Britain, is a constitutional monarchy with a strong parliament and aristocratic class. Its primary churches are the Church of the Evernight Goddess and the Church of the Lord of Storms, with the Church of the God of Steam and Machinery also holding significant influence due to industrialization. The Intis Republic, inspired by industrial France, is dominated by the Church of the Eternal Blazing Sun and maintains republican governance. The Feysac Empire, resembling Imperial Russia, is an autocracy closely tied to the Church of the God of Combat. The Feynapotter Kingdom serves as a fourth balancing power. Colonial competition over the Southern Continent drives international tension. Beneath the surface, the royal families of each nation harbor Beyonder secrets — the Loen royal family in particular pursues the Black Emperor pathway toward apotheosis, a plot that becomes central to the mid-narrative.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['politics', 'nations', 'loen-kingdom', 'intis-republic', 'feysac-empire'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fifth-epoch-technology',
  'Fifth Epoch — Technology and Industry',
  'metaphysics',
  'Fifth Epoch technology mirrors the Victorian-to-Edwardian transition, driven by steam power and early electrical experimentation. Key technologies include steam engines powering factories and locomotives, gas lighting in urban areas, telegraph communication networks, mechanical printing presses enabling mass media, and early experiments with internal combustion and electricity. The Church of the God of Steam and Machinery actively promotes technological innovation, viewing it as an expression of their deity''s domain. Firearms are widespread: revolvers and rifles are standard for law enforcement and military, and even Beyonders at lower sequences are vulnerable to gunfire. This creates a distinctive power dynamic where mundane technology remains dangerous to supernatural beings until they reach mid-sequence. Transportation relies on horse-drawn carriages in cities, steam trains between cities, and steam-powered ships for maritime travel. Medicine is advancing but still limited — diseases like tuberculosis and cholera remain threats, though Beyonder healing can cure what conventional medicine cannot.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['technology', 'steam-power', 'firearms', 'industry', 'world-setting'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fifth-epoch-social-norms',
  'Fifth Epoch — Social Norms and Daily Life',
  'metaphysics',
  'Fifth Epoch society follows Victorian social conventions with rigid class stratification. The aristocracy and wealthy merchants occupy the upper echelons, followed by a growing middle class of professionals, clerks, and skilled tradesmen, with factory workers and laborers forming the working class. Social etiquette demands formal dress, proper modes of address, and strict gender role expectations — though women have begun entering the workforce in limited capacities. Religion plays a central social role: church attendance is expected, the seven orthodox faiths provide community structure, and blasphemy carries social and sometimes legal consequences. Newspapers are the primary information medium, and literacy rates are rising due to public education initiatives. Entertainment includes theater, music halls, horse racing, social clubs, and the emergence of organized sports. Poverty and industrial exploitation exist alongside displays of wealth, creating social tension that mirrors real Victorian inequalities. The supernatural world operates entirely within these social structures — Beyonders maintain cover identities appropriate to their class.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['society', 'class-system', 'victorian', 'daily-life', 'world-setting'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fifth-epoch-hidden-mysticism',
  'Fifth Epoch — The Hidden World of Beyonders',
  'metaphysics',
  'Beneath the mundane surface of Fifth Epoch society, an entire world of supernatural power operates in secrecy. The Seven Orthodox Churches maintain divisions of Official Beyonders who investigate supernatural incidents, contain dangerous artifacts, and eliminate threats. These divisions — the Nighthawks, Mandated Punishers, Machinery Hivemind, Inquisition, and others — function as secret supernatural police forces. Beyond the churches, secret organizations like the Psychology Alchemists, the Aurora Order, and the Rose School of Thought pursue their own agendas. The black market for Beyonder materials thrives in the shadows: potion formulas, mystical ingredients, and Beyonder characteristics are traded in underground exchanges. Ordinary citizens occasionally encounter the supernatural — unexplained deaths, haunted locations, mysterious disappearances — but the churches suppress evidence and maintain the narrative that such things are superstition. This concealment serves a practical purpose: widespread knowledge of the Beyonder world would cause mass panic and make it easier for malevolent entities to recruit followers. The tension between the hidden and mundane worlds defines the setting''s atmosphere.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['beyonder-world', 'secrecy', 'churches', 'black-market', 'world-setting'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'nighthawks-overview',
  'Nighthawks — Overview',
  'organization',
  'The Nighthawks are the official Beyonder division of the Church of the Evernight Goddess. They function as a supernatural investigation and enforcement unit, handling incidents involving uncontrolled Beyonders, cursed artifacts, undead manifestations, and other threats that fall under the Evernight Goddess''s domain: darkness, night, sleep, and death. Nighthawk teams are stationed in every major city across the Loen Kingdom, operating under cover identities — typically as security companies or private detective agencies. Their mandate is threefold: investigate supernatural incidents, contain or destroy dangerous artifacts and entities, and maintain the secrecy of the Beyonder world from ordinary citizens. Nighthawks are authorized to use lethal force against threats and carry both conventional firearms and mystical equipment. The organization has a military-style hierarchy with captains leading city-level teams, reporting through bishops to the church''s central command. Members are recruited from church faithful who show aptitude, and they primarily follow the Sleepless (Darkness) pathway, though members of other pathways serve in support roles.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['nighthawks', 'evernight-goddess', 'beyonder-organization', 'law-enforcement'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'nighthawks-tingen-team',
  'Nighthawks — Tingen Team',
  'organization',
  'The Tingen Nighthawks team operates out of Blackthorn Security Company on Zouteland Street. Led by Captain Dunn Smith, the team consists of roughly a dozen members, making it a standard-sized regional unit. The team handles all supernatural incidents in Tingen City and the surrounding Awwa County. Key members include Dunn Smith (Captain, Sequence 7 Nightmare), Leonard Mitchell (Sequence 9 Sleepless, later Sequence 8), Klein Moretti (Sequence 9 Seer, the Fool pathway — an unusual assignment since the Fool pathway is not native to the Nighthawks), Old Neil (team historian and artificer), and Daly Simone (Sequence 7 Spirit Medium from the Death pathway, on secondment). The team''s daily operations involve monitoring reports of unexplained deaths, ghost sightings, and artifact smuggling; conducting investigations; performing containment rituals; and filing classified reports with the diocese. The Tingen team is considered a quiet posting compared to Backlund, though several major incidents during the narrative period — including the Antigonus Family Notebook case and the Ince Zangwill betrayal — dramatically escalate the danger.',
  null,
  5,
  'tingen',
  ARRAY['Dunn Smith', 'Leonard Mitchell', 'Klein Moretti', 'Old Neil', 'Daly Simone'],
  ARRAY[9, 8, 7],
  ARRAY['nighthawks', 'tingen', 'team-composition'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'nighthawks-procedures',
  'Nighthawks — Standard Procedures',
  'organization',
  'Nighthawk operations follow strict protocols designed to minimize risk and maintain secrecy. Investigations begin with preliminary reports from informants, police contacts, or church sources. Team members are dispatched in pairs for routine investigations, with full-team deployment reserved for confirmed Beyonder-level threats. Standard equipment includes revolvers, holy water blessed by the Evernight Goddess, containment seals, and basic ritual materials. When encountering uncontrolled Beyonders or aberrations, the protocol is containment first, elimination if containment fails. All recovered artifacts are logged and stored in sealed evidence vaults, with particularly dangerous items sent to the diocese''s central vault. After each operation, detailed reports are filed and all civilian witnesses are managed — through obfuscation, cover stories, or in extreme cases, memory-altering rituals performed by higher-sequence members. Nighthawks are forbidden from revealing their true nature to civilians, using Beyonder abilities in public view, or retaining confiscated artifacts for personal use. Violations are treated as potential signs of corruption or loss of control and trigger immediate internal review.',
  null,
  5,
  null,
  '{}',
  '{}',
  ARRAY['nighthawks', 'protocols', 'operations', 'secrecy'],
  220
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'mandated-punishers-tingen',
  'Mandated Punishers — Tingen Presence',
  'organization',
  'The Mandated Punishers are the Beyonder division of the Church of the Lord of Storms, responsible for supernatural incidents related to maritime activity, weather phenomena, and the Tyrant pathway. In Tingen, they maintain a smaller presence than the Nighthawks, primarily operating near the Tussock River docks and handling cases involving smuggled Beyonder materials arriving by water, sea-creature manifestations, and conflicts between sailor Beyonders. Their jurisdiction sometimes overlaps with the Nighthawks, creating inter-organizational tension. The Mandated Punishers have a reputation for being more aggressive and direct than the Nighthawks — their operational style favors rapid force over careful investigation. Their members primarily follow the Sailor (Tyrant) pathway, granting them abilities related to storms, water, and physical combat. The Church of the Lord of Storms emphasizes masculine virtues, martial discipline, and dominion over nature, which shapes the Punishers'' culture into a more militant organization compared to the contemplative Nighthawks.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['mandated-punishers', 'lord-of-storms', 'maritime', 'beyonder-organization'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'machinery-hivemind-tingen',
  'Machinery Hivemind — Tingen Presence',
  'organization',
  'The Machinery Hivemind is the Beyonder division of the Church of the God of Steam and Machinery. In Tingen, they are the smallest of the three official Beyonder organizations, focused on cases involving industrial accidents with supernatural causes, malfunctioning mystical machinery, and the Savant pathway. Their members tend to be technically minded, often with engineering or scientific backgrounds, and they approach supernatural problems with an analytical methodology. The Hivemind''s unique ability is a form of collective consciousness — members can share information and coordinate through a mystical network that connects their minds, giving them superior communication and coordination in the field. In Tingen''s industrial landscape, the Hivemind monitors factories and workshops for signs of Beyonder contamination in manufactured goods and investigates cases where industrial processes accidentally interact with supernatural forces. Their relationship with both the Nighthawks and Mandated Punishers is generally cooperative but bureaucratically distant, with each organization guarding its jurisdictional boundaries.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['machinery-hivemind', 'god-of-steam', 'industrial', 'beyonder-organization'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'psychology-alchemists-overview',
  'Psychology Alchemists — Overview',
  'organization',
  'The Psychology Alchemists are a semi-secret organization specializing in the Visionary pathway. They present themselves as a scholarly society dedicated to understanding the human mind through a blend of psychology, philosophy, and mystical practice. Their members include academics, doctors, and upper-class intellectuals who study mental phenomena, hypnosis, and the nature of consciousness. For aspiring Beyonders of the Visionary pathway, the Psychology Alchemists are one of the primary sources of potion formulas and advancement guidance outside the orthodox churches. However, the organization harbors a dark secret: it is a shadow subsidiary of the Twilight Hermit Order, controlled by the Angel of Imagination, Adam. Many rank-and-file members are unaware of this connection and genuinely believe in the organization''s academic mission. The Psychology Alchemists operate through local chapters in major cities, including a presence in Tingen that becomes relevant when the narrative explores Audrey Hall''s storyline and the broader conspiracy surrounding the Visionary pathway.',
  'visionary',
  5,
  null,
  ARRAY['Audrey Hall'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['psychology-alchemists', 'visionary-pathway', 'secret-organization', 'twilight-hermit-order'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'aurora-order-overview',
  'Aurora Order — Overview',
  'organization',
  'The Aurora Order is a fanatical secret organization that worships the "True Creator," an entity connected to the ancient Sun God. Their members are often mentally unstable Beyonders who have been driven partially mad by their abilities or by direct exposure to the True Creator''s influence. The Order seeks to bring about their god''s physical descent into the world, believing this will usher in an age of divine truth. In Tingen, the Aurora Order operates clandestinely, recruiting from the margins of society — desperate individuals, failed Beyonders, and those who have been rejected by the orthodox churches. Their activities include terrorist attacks against church targets, attempts to steal powerful artifacts, and conducting dangerous rituals. The Aurora Order poses a recurring threat in the Tingen narrative, with several members appearing as antagonists. Their connection to the deeper conspiracy — that the True Creator and the Angel of Imagination Adam are both aspects of the ancient Sun God — only becomes clear much later in the story. For gameplay purposes, they serve as a dangerous faction that players may encounter as enemies.',
  null,
  5,
  'tingen',
  '{}',
  '{}',
  ARRAY['aurora-order', 'true-creator', 'antagonist', 'secret-organization'],
  225
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-dunn-smith',
  'Dunn Smith — Tingen Nighthawks Captain',
  'npc',
  'Captain Dunn Smith is the leader of the Tingen Nighthawks team. A Sequence 7 Nightmare on the Darkness (Sleepless) pathway, Dunn is a tall, handsome man in his late thirties with a perpetually drowsy demeanor — he is often found dozing at his desk, a trait both endearing and deceptive, as his apparent laziness conceals sharp instincts and significant combat ability. Dunn''s leadership style is understated: he gives his team members considerable autonomy, trusts their judgment, and intervenes only when situations escalate beyond their capability. He is deeply protective of his team and takes losses personally. As a Nightmare, Dunn possesses abilities related to dreams and sleep manipulation — he can enter others'' dreams, induce sleep, and create nightmarish illusions. His combat effectiveness is considerable for Tingen-level threats. Dunn maintains a calm, fatherly relationship with his subordinates, particularly Klein, whom he mentors in the early days. His character arc in the narrative is tragic: he becomes entangled in the Ince Zangwill conspiracy and ultimately cannot protect his team from the dangers that converge on Tingen.',
  'darkness',
  5,
  'tingen',
  ARRAY['Dunn Smith'],
  ARRAY[7],
  ARRAY['nighthawks', 'captain', 'mentor', 'darkness-pathway'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-leonard-mitchell',
  'Leonard Mitchell — Nighthawk and Poet',
  'npc',
  'Leonard Mitchell is a young Nighthawk serving on the Tingen team and one of Klein Moretti''s earliest companions. A Sequence 9 Sleepless on the Darkness pathway (advancing to Sequence 8 during the Tingen arc), Leonard is notable for his poetic sensibility, good looks, and a habit of composing verses in his head during tense situations. He is observant, empathetic, and genuinely committed to protecting civilians from supernatural threats. Leonard harbors a significant secret: he is the host of Pallez Zoroast, a Sequence 1 Angel (Parasite) of the Marauder pathway, who resides within Leonard''s body as a symbiotic entity. Pallez provides Leonard with occasional guidance and enhanced abilities but also represents a constant danger — the Angel''s own agenda may not always align with Leonard''s. In the Tarot Club, Leonard later becomes "The Star." His friendship with Klein is one of the narrative''s most enduring relationships, and he plays a critical role in later volumes. In Tingen, Leonard serves as Klein''s partner on investigations and provides the reader''s window into the Nighthawks'' daily operations.',
  'darkness',
  5,
  'tingen',
  ARRAY['Leonard Mitchell', 'Pallez Zoroast'],
  ARRAY[9, 8],
  ARRAY['nighthawks', 'tarot-club', 'the-star', 'darkness-pathway'],
  250
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-old-neil',
  'Old Neil — Nighthawk Artificer',
  'npc',
  'Old Neil is the Tingen Nighthawks'' resident artificer and historian, an elderly man who serves as the team''s expert on mystical artifacts, ritual materials, and Beyonder history. He maintains the team''s equipment, identifies recovered artifacts, and provides technical support for operations. Old Neil is warm, grandfatherly, and generous with his knowledge — he teaches Klein about ritual practices, artifact handling, and the practical aspects of the Beyonder world that formal training doesn''t cover. He follows the Mystery Pryer (White Tower) pathway at a low sequence level, giving him analytical and knowledge-gathering abilities. Old Neil''s fate becomes one of the Tingen arc''s most poignant tragedies: he is manipulated into attempting an advancement ritual that goes wrong, leading to his loss of control. His transformation into an uncontrolled aberration forces the Nighthawks team to confront and put down one of their own — an event that deeply affects Klein and demonstrates the ever-present danger of Beyonder advancement. Old Neil''s death serves as a formative trauma that shapes Klein''s cautious approach to advancement throughout the narrative.',
  null,
  5,
  'tingen',
  ARRAY['Old Neil'],
  ARRAY[9, 8],
  ARRAY['nighthawks', 'artificer', 'mentor', 'tragedy', 'loss-of-control'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-daly-simone',
  'Daly Simone — Spirit Medium',
  'npc',
  'Daly Simone is a Sequence 7 Spirit Medium on the Death pathway, serving with the Tingen Nighthawks on secondment. She is one of the team''s most capable combatants, specializing in communicating with the dead, banishing restless spirits, and navigating the boundary between the living and the dead. Daly is a composed, professional woman who approaches her work with clinical detachment — necessary given the disturbing nature of her abilities, which include channeling dead spirits through her own body and entering the death realm. She serves as a senior field operative and is often paired with less experienced members for dangerous assignments. Daly''s expertise in death-related phenomena makes her invaluable when the team encounters undead threats, haunted locations, or cases requiring forensic communication with murder victims. Her presence on the Tingen team illustrates how the orthodox churches share personnel across pathway specializations when local expertise is needed. Daly maintains professional relationships with her colleagues but keeps emotional distance — a defense mechanism common among Spirit Mediums who regularly expose themselves to the grief and trauma of the dead.',
  'death',
  5,
  'tingen',
  ARRAY['Daly Simone'],
  ARRAY[7],
  ARRAY['nighthawks', 'death-pathway', 'spirit-medium', 'senior-operative'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-azik-eggers',
  'Azik Eggers — The Undying Teacher',
  'npc',
  'Azik Eggers is a mysterious figure who serves as a history lecturer in Tingen, known to Klein Moretti from his university days. Behind his academic facade, Azik is an extraordinarily powerful Beyonder of the Death pathway — a being who has lived for centuries, possibly since the Second or Third Epoch. He possesses the title and power of a "Death Consul" at the Angel level (approximately Sequence 2). Azik''s memory is fragmented due to the immense age of his existence and the accumulation of Death pathway characteristics; he periodically forgets his past and assumes new identities. In Tingen, he lives as a mild-mannered professor who has forgotten much of his true nature. Klein''s interaction with Azik predates his transmigration — the original Klein knew Azik as a kind teacher. After Klein''s transmigration, Azik becomes an unwitting ally, occasionally providing crucial assistance in life-threatening situations when fragments of his true power surface. Azik''s copper whistle, which Klein inherits, becomes one of Klein''s most important protective artifacts, capable of summoning death-related powers far beyond Klein''s own sequence level.',
  'death',
  5,
  'tingen',
  ARRAY['Azik Eggers'],
  ARRAY[2],
  ARRAY['death-pathway', 'angel', 'ancient-being', 'university', 'mentor'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-klein-moretti',
  'Klein Moretti — The Transmigrated Protagonist',
  'npc',
  'Klein Moretti is the protagonist of Lord of the Mysteries. Originally Zhou Mingrui, a young Chinese man from modern Earth, he awakens in the body of Klein Moretti, a Tingen history graduate who recently committed suicide. Klein must navigate his new identity while hiding the fact that he is not the original Klein. He quickly discovers the Beyonder world when he accidentally activates a ritual that connects him to Sefirah Castle — a mysterious extradimensional space that becomes his greatest asset. Klein joins the Nighthawks to investigate the circumstances of the original Klein''s death and to gain access to Beyonder resources. He begins the Fool pathway as a Sequence 9 Seer, using divination and spiritual perception as his primary tools. Klein is defined by his intelligence, caution, and emotional depth — he genuinely cares about the people around him and struggles with the moral compromises the Beyonder world demands. His modern knowledge gives him analytical advantages, and his discovery of the Acting Method allows him to advance more safely than most Beyonders. In the Tarot Club, he assumes the persona of "The Fool," masquerading as an ancient deity.',
  'fool',
  5,
  'tingen',
  ARRAY['Klein Moretti'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['protagonist', 'transmigrator', 'tarot-club', 'the-fool', 'seer', 'fool-pathway'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-melissa-moretti',
  'Melissa Moretti — Klein''s Sister',
  'npc',
  'Melissa Moretti is Klein''s younger sister in his adopted identity. She is a hardworking young woman employed at a textile factory, contributing to the household finances after their parents'' death and Klein''s recent graduation. Melissa is practical, caring, and slightly stern — she manages the household budget, prepares meals, and worries constantly about Klein''s erratic behavior after his "illness" (the transmigration). She represents Klein''s primary emotional anchor to his new life and identity: protecting Melissa and ensuring her wellbeing becomes one of his core motivations. Melissa is unaware of the Beyonder world and Klein''s supernatural activities. Their modest apartment on Iron Cross Street is the domestic center of Klein''s Tingen life. Melissa''s character embodies the ordinary people whom the Beyonder organizations strive to protect — she lives in a world where supernatural horrors lurk just beyond perception, shielded only by the efforts of people like her brother. Klein''s determination to keep her safe and ignorant of the dangers he faces drives many of his decisions. Benson Moretti, their older brother, works in another city and sends money home occasionally.',
  null,
  5,
  'tingen',
  ARRAY['Melissa Moretti', 'Benson Moretti'],
  '{}',
  ARRAY['family', 'civilian', 'anchor', 'iron-cross-street'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-ince-zangwill',
  'Ince Zangwill — The Fallen Nighthawk',
  'npc',
  'Ince Zangwill is a former high-ranking Nighthawk who serves as the primary antagonist of the Tingen arc. A Sequence 5 Gatekeeper on the Darkness pathway, Zangwill possesses the "0-08" card — one of the most dangerous sealed artifacts in the Church of the Evernight Goddess''s possession. This living, malevolent playing card can manipulate fate and probability, making Zangwill extraordinarily dangerous. Zangwill betrayed the Nighthawks by stealing the card and fleeing, becoming a fugitive pursued by the church. His return to Tingen drives the climactic events of Volume 1: he orchestrates a series of incidents that culminate in a deadly confrontation where Klein Moretti is killed. Zangwill''s motivations are complex — the 0-08 card''s corrupting influence has warped his mind, and his actions serve both his own ambitions and the card''s mysterious agenda. He represents the danger of powerful artifacts corrupting their wielders and the threat that rogue Beyonders pose to both the mundane and supernatural worlds. Klein''s eventual revenge against Zangwill becomes a driving motivation that spans multiple volumes.',
  'darkness',
  5,
  'tingen',
  ARRAY['Ince Zangwill'],
  ARRAY[5],
  ARRAY['antagonist', 'nighthawks', '0-08-card', 'darkness-pathway', 'betrayal'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-pathway-overview',
  'Fool Pathway — Overview',
  'pathway',
  'The Fool pathway belongs to the Mysteries group, anchored to the Sefirah Castle. It is one of the most versatile and deceptive pathways, progressing from perception and divination at low sequences to reality manipulation and cosmic authority at high sequences. The pathway''s neighboring pathways are Error (Marauder) and Door (Apprentice), all sharing themes of fate, deception, and hidden knowledge. The Fool pathway is unique in that its Sequence 0 position — "The Fool" — is the Lord of Mysteries, one of the three Pillars of the universe. This makes it one of the most powerful and consequential pathways in existence. In the Fifth Epoch, the Fool pathway has no single orthodox church controlling it; its sequences are scattered among various organizations and individuals, making it rare and difficult to advance. The Church of the Evernight Goddess possesses some related knowledge through the neighboring Darkness pathway but does not directly control Fool pathway resources. Klein Moretti''s choice of this pathway, initially accidental, sets him on a collision course with the highest powers in the universe.',
  'fool',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['fool-pathway', 'mysteries-group', 'sefirah-castle', 'overview'],
  240
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-seq9-seer',
  'Fool Pathway — Sequence 9: Seer',
  'pathway',
  'The Seer is the entry point of the Fool pathway, granting abilities centered on perception of the supernatural world. A Seer gains Spirit Vision — the ability to see the spirit world overlaid on physical reality, perceiving lingering spiritual traces, emotional auras, and supernatural entities invisible to normal sight. They can perform divination using mediums such as tarot cards, pendulums, crystal balls, or dream interpretation, receiving limited but often cryptic answers about past events or near-future possibilities. Spiritual Intuition provides a passive danger sense, alerting the Seer to anomalies and threats. The potion formula requires Dragon Blood Grass, Night Vale Flower, and Stellar Aqua Crystal. The acting method for a Seer demands speaking and acting with mystery and reserve, observing more than revealing, and avoiding proactive divination without proper ritual preparation. Klein Moretti exemplifies the Seer''s role: his early Nighthawk investigations rely heavily on divination rituals performed above the gray fog of Sefirah Castle, and his deliberate air of mysteriousness at the Divination Club helps him digest the potion. The Seer sequence has no advancement ritual — digesting the potion through acting is sufficient for progressing to Sequence 8.',
  'fool',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[9],
  ARRAY['fool-pathway', 'seer', 'divination', 'spirit-vision', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-seq8-clown',
  'Fool Pathway — Sequence 8: Clown',
  'pathway',
  'The Clown sequence builds on the Seer''s perceptive abilities with physical enhancement and performance-based powers. A Clown gains supernatural agility and acrobatic ability, making them nimble fighters. They can perform Distraction — using sleight of hand and misdirection enhanced by spiritual energy to redirect attention. Flame Manipulation allows control of small flames, useful for both performance and combat. Paper Figurine Substitution enables escape from danger by leaving a paper decoy in the Clown''s place. The potion requires a Manhal Fish Eyeball and Dream Honeydew. The advancement ritual requires performing before a live audience while channeling spiritual power. The acting method is emotionally challenging: a Clown must perform for audiences and make others laugh or feel joy, while never revealing their true emotions. This duality of outward cheerfulness concealing inner turmoil defines the sequence. Klein struggles with this acting requirement, as he must maintain a facade of humor and showmanship while dealing with genuine grief and danger. The Clown sequence''s abilities make it effective for investigation work — misdirection, agility, and flame control provide both combat utility and infiltration tools. The Clown is where the Fool pathway begins to reveal its core theme: the separation between appearance and reality.',
  'fool',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[8],
  ARRAY['fool-pathway', 'clown', 'performance', 'agility', 'acting-method'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-seq7-magician',
  'Fool Pathway — Sequence 7: Magician',
  'pathway',
  'The Magician represents the Fool pathway''s entry into mid-sequence power. Magicians gain Damage Transfer — the ability to redirect damage from themselves onto a connected object or person, making them deceptively durable in combat. They can create mystical Seals to bind or contain supernatural entities. Item Affinity enhances their interaction with enchanted objects, and Conjuring allows summoning small objects from hidden spaces. The potion requires a Thousand-faced Hunter Eye Crystal, Rosemary Essential Oil, and Ghost Shark Blood. The advancement ritual involves drawing a ritual circle, reciting the Magician invocation at midnight, and sealing a minor supernatural entity. The acting method requires daily practice of magic tricks and illusions, always carrying props and mystical tools, and maintaining showmanship in all interactions. At Sequence 7, the Fool pathway begins to demonstrate its theme of control through deception — the Magician doesn''t overpower opponents directly but redirects damage, seals threats, and manipulates the battlefield through misdirection. This sequence is also where Beyonders begin facing the "initial onset of madness" common to mid-sequence advancement, requiring stronger mental discipline to maintain identity.',
  'fool',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[7],
  ARRAY['fool-pathway', 'magician', 'mid-sequence', 'damage-transfer', 'sealing'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-seq6-faceless',
  'Fool Pathway — Sequence 6: Faceless',
  'pathway',
  'The Faceless sequence grants the Fool pathway''s signature identity manipulation abilities. A Faceless can completely transform their appearance, voice, and physique to perfectly imitate another person through Shapeshifting. Identity Theft allows temporary absorption of a touched target''s surface memories and mannerisms, enabling convincing impersonation. Body Malleability lets them reshape their body to squeeze through gaps or resist physical impacts. The potion requires a Thousand-faced Hunter Mutant Pituitary Gland, Hound of Fulgrim Saliva, and Three Petals of Spirit World Celandine. The advancement ritual demands assuming a false identity and maintaining it through a crisis without breaking character. The acting method is perhaps the most psychologically demanding thus far: the Faceless must adopt a new identity for at least one full day each week, live convincingly as someone else, and never grow too attached to a single identity. This creates a genuine risk of identity dissolution — the Beyonder must constantly ask "who am I really?" while pretending to be others. Klein uses the Faceless abilities extensively in Backlund, adopting personas like detective Sherlock Moriarty. The Faceless sequence embodies the pathway''s philosophical core: identity is a performance, and the self is the ultimate illusion.',
  'fool',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[6],
  ARRAY['fool-pathway', 'faceless', 'identity', 'shapeshifting', 'acting-method'],
  275
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'fool-seq5-marionettist',
  'Fool Pathway — Sequence 5: Marionettist',
  'pathway',
  'The Marionettist is the apex of mid-sequence power in the Fool pathway, granting abilities centered on control and manipulation of others. Marionette Control allows taking direct control of a living person''s body, turning them into a puppet. Thread Manipulation creates invisible spiritual threads to manipulate objects and people at range. Grafting enables absorbing abilities from defeated Beyonders onto the Marionettist or their marionettes, creating an ever-expanding repertoire of stolen powers. Enhanced Spiritual Perception greatly improves detection of spiritual fluctuations. The potion requires a Beyonder Characteristic of a Faceless, a Mind Dragon Tendon, and a Psychic Puppet Core. The advancement ritual requires overpowering a Beyonder''s will and converting them into a marionette through spiritual domination. The acting method demands controlling at least one marionette at all times, directing events from behind the scenes, and treating every interaction as a stage. Klein''s advancement to Marionettist transforms his combat effectiveness — he begins collecting powerful marionettes, effectively fielding a small army of stolen Beyonder abilities. The Marionettist sequence crystallizes the Fool pathway''s ultimate theme: the world is a stage, and the Fool pulls the strings from behind the curtain. At this level, the Beyonder transitions from performer to director.',
  'fool',
  5,
  null,
  ARRAY['Klein Moretti'],
  ARRAY[5],
  ARRAY['fool-pathway', 'marionettist', 'puppeteer', 'control', 'mid-sequence-apex'],
  280
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'visionary-pathway-overview',
  'Visionary Pathway — Overview',
  'pathway',
  'The Visionary pathway belongs to the God Almighty group, anchored to the Chaos Sea. It is the pathway of the mind — progressing from emotional perception at low sequences to reality-shaping imagination at the highest levels. The pathway''s neighboring pathway is the Sun pathway, and both share the God Almighty group with the Tyrant, White Tower, and Hanged Man pathways. The Visionary pathway''s Sequence 0 position is one of the thrones of God Almighty, making it cosmically significant. In the Fifth Epoch, the Psychology Alchemists serve as the primary non-church organization for the Visionary pathway, though they are secretly controlled by the Twilight Hermit Order. The Church of the God of Knowledge and Wisdom also possesses related knowledge. The Visionary pathway is particularly suited to investigation, social manipulation, and support roles. Its practitioners excel at reading people, healing psychological trauma, and eventually reshaping reality through pure imagination. Audrey Hall, "Justice" of the Tarot Club, is the narrative''s primary Visionary pathway Beyonder, advancing from Spectator through multiple sequences while navigating the Psychology Alchemists'' hidden corruption.',
  'visionary',
  5,
  null,
  ARRAY['Audrey Hall'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['visionary-pathway', 'god-almighty-group', 'chaos-sea', 'overview'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'visionary-seq9-spectator',
  'Visionary Pathway — Sequence 9: Spectator',
  'pathway',
  'The Spectator is the entry point of the Visionary pathway, granting abilities focused on observation and emotional perception. A Spectator gains Emotion Reading — the ability to read micro-expressions, body language, and subtle physiological cues to detect lies, hidden emotions, and psychological states with preternatural accuracy. Psychological Analysis allows rapid assessment of a person''s motivations, fears, and mental vulnerabilities. Enhanced Perception heightens awareness of subtle social and environmental cues that ordinary people miss. The potion requires the Placenta of a Beyond-level Demon Cat and Tears of a Willow Sprite. The acting method requires observing people and social dynamics without interfering, recording observations in a journal, and analyzing motivations before taking action. The Spectator must be a watcher, not a participant. Audrey Hall demonstrates this sequence''s potential: as a high-society noblewoman, she uses her Spectator abilities to navigate the complex social politics of Backlund''s aristocracy, reading the true intentions behind polite conversation and diplomatic posturing. The Spectator sequence has no advancement ritual — acting is sufficient. This sequence is ideal for characters who favor investigation and social interaction over combat.',
  'visionary',
  5,
  null,
  ARRAY['Audrey Hall'],
  ARRAY[9],
  ARRAY['visionary-pathway', 'spectator', 'observation', 'emotion-reading', 'acting-method'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'visionary-seq8-telepathist',
  'Visionary Pathway — Sequence 8: Telepathist',
  'pathway',
  'The Telepathist sequence advances the Spectator''s passive observation into active mental communication and influence. A Telepathist gains Telepathy — the ability to read surface thoughts and send mental messages, enabling silent communication and basic mind-reading. Mental Shield constructs a psychic barrier protecting against mental intrusion from other Beyonders. Empathic Influence allows subtly shifting a nearby target''s emotional state without their awareness. The potion requires Mirror Hedgehog Spinal Fluid and Piper Fruit. The advancement ritual requires establishing a sustained two-way telepathic link with another Beyonder for one full hour and transmitting a complex memory through it. The acting method emphasizes practicing telepathic communication daily, respecting mental boundaries, and meditating to strengthen psychic fortitude. The Telepathist represents the Visionary pathway''s transition from observer to participant: where the Spectator merely watches, the Telepathist begins to touch minds. This sequence introduces the pathway''s core ethical tension — the ability to read thoughts creates constant temptation to invade privacy, and the acting method''s emphasis on respecting boundaries reflects the danger of losing one''s moral compass when others'' thoughts become accessible.',
  'visionary',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['visionary-pathway', 'telepathist', 'telepathy', 'mental-shield', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'visionary-seq7-psychiatrist',
  'Visionary Pathway — Sequence 7: Psychiatrist',
  'pathway',
  'The Psychiatrist sequence marks the Visionary pathway''s entry into mid-sequence power, focusing on deep mental manipulation and healing. A Psychiatrist gains Deep Mental Probe — the ability to dive into a subject''s subconscious and uncover hidden or suppressed memories. Psychological Healing allows repairing trauma and mental afflictions through psychic therapy, making Psychiatrists invaluable for treating Beyonders suffering from potion-related mental deterioration. Mental Suggestion implants subtle ideas that the target perceives as their own thoughts. Psychic Resilience provides greatly enhanced resistance to mental corruption. The potion requires Wraith Dust, Moonstone Shard, and Calming Lily Extract. The advancement ritual requires healing a patient whose mind has been damaged by Beyonder influence through multiple sessions of psychic therapy. The acting method demands helping others resolve psychological issues regularly, studying the subconscious mind, and maintaining personal mental health. The Psychiatrist represents the Visionary pathway''s healing potential — unlike the Sun pathway''s physical healing, the Psychiatrist heals the mind. This makes them critical for treating the psychological damage that Beyonder advancement and supernatural encounters inflict, and establishes the pathway''s dual nature as both healer and manipulator.',
  'visionary',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['visionary-pathway', 'psychiatrist', 'mental-healing', 'mid-sequence', 'subconscious'],
  265
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'visionary-seq6-hypnotist',
  'Visionary Pathway — Sequence 6: Hypnotist',
  'pathway',
  'The Hypnotist sequence dramatically escalates the Visionary pathway''s control over other minds. A Hypnotist gains Mass Hypnosis — the ability to place multiple targets into a trance simultaneously, enabling crowd control in both social and combat situations. Memory Manipulation allows altering, erasing, or implanting specific memories, making the Hypnotist capable of reshaping a person''s perceived past. Dream Invasion enables entering a sleeping target''s dreams and manipulating the dream environment. Psychic Dominance creates a passive aura that makes weaker-willed individuals more suggestible in the Hypnotist''s presence. The potion requires an Eye of a Dreamweaver Spider, Slumber Flower Pollen, and Liquid Silver Mercury. The advancement ritual requires entering and fully controlling the dream of a Beyonder-level target without being detected. The acting method involves practicing hypnotic techniques weekly, studying dreams, and maintaining absolute control over one''s own psychic state. The Hypnotist represents the Visionary pathway at its most morally ambiguous: the ability to rewrite memories and control dreams grants power over the fundamental nature of a person''s identity and reality. The ethical implications are enormous, and practitioners who abuse these abilities risk becoming the very manipulators the pathway''s higher sequences warn against.',
  'visionary',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['visionary-pathway', 'hypnotist', 'memory-manipulation', 'dreams', 'mass-hypnosis'],
  275
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'visionary-seq5-dreamwalker',
  'Visionary Pathway — Sequence 5: Dreamwalker',
  'pathway',
  'The Dreamwalker is the apex of mid-sequence power in the Visionary pathway, granting mastery over the boundary between dreams and reality. A Dreamwalker gains Dream World Access — the ability to physically enter the dream world and traverse it as a real space. Dream Materialization allows pulling objects and entities from the dream world into reality, blurring the line between imagination and the physical. Collective Dream creates a shared dream space that multiple people inhabit simultaneously, useful for secret meetings, training, or psychological therapy on a grand scale. Subconscious Fortress makes the Dreamwalker''s mind a fortified dream realm, rendering them nearly impervious to mental attack. The potion requires a Beyonder Characteristic of a Hypnotist, a Dream Realm Anchor Shard, and Essence of Deep Sleep. The advancement ritual must be performed within the dream world itself — brewing the potion there, opening a gateway between dream and reality that persists for one hour, and bringing a materialized object into the waking world. The Dreamwalker foreshadows the Visionary pathway''s ultimate power: at the highest sequences, Visionaries can envision reality itself, literally imagining things into existence. The Dreamwalker is the first step toward that terrifying capability, limited to materializing dream-stuff rather than creating from pure will.',
  'visionary',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['visionary-pathway', 'dreamwalker', 'dream-world', 'materialization', 'mid-sequence-apex'],
  280
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'sun-pathway-overview',
  'Sun Pathway — Overview',
  'pathway',
  'The Sun pathway belongs to the God Almighty group, anchored to the Chaos Sea. It is the pathway of holy light, purification, and healing — progressing from simple hymns and minor healing at low sequences to devastating solar judgment and sanctified authority at higher levels. The Sun pathway neighbors the Visionary pathway within the God Almighty group. In the Fifth Epoch, the Church of the Eternal Blazing Sun is the primary orthodox institution controlling the Sun pathway, with its Beyonder division — the Inquisition — serving as both supernatural enforcement and religious authority, particularly dominant in the Intis Republic. The Sun pathway is unique in the Forsaken Land of the Gods, where the City of Silver (sealed from sunlight for millennia) reveres the God of the Sun and maintains its own tradition of Sun pathway Beyonders. Derrick Berg, "The Sun" of the Tarot Club, comes from this tradition. The Sun pathway is the most straightforwardly "heroic" of the four MVP pathways: its practitioners heal the wounded, purify corruption, and smite evil with holy light. This makes it both powerful in combat against undead and evil entities and invaluable as a support role.',
  'sun',
  5,
  null,
  ARRAY['Derrick Berg'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['sun-pathway', 'god-almighty-group', 'chaos-sea', 'overview', 'eternal-blazing-sun'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'sun-seq9-bard',
  'Sun Pathway — Sequence 9: Bard',
  'pathway',
  'The Bard is the entry point of the Sun pathway, granting abilities tied to music, warmth, and minor healing. A Bard gains Holy Hymn — the ability to sing songs that channel purifying energy, cleansing minor corruption and bolstering the morale of allies. Minor Healing allows channeling warmth through touch to mend small wounds and ease pain, making the Bard an immediate asset in any group. Light Sensitivity provides enhanced perception in well-lit environments, complementing the pathway''s solar theme. The potion requires Sunflower Essence and Golden Honey. The acting method requires singing or performing music daily, spreading warmth and hope to those in despair, and rising with the sun to greet the dawn. The Bard''s acting method is one of the most positive of any pathway — it demands genuine optimism and a commitment to uplifting others. This makes it emotionally sustainable compared to pathways like the Clown, which require suppressing true emotions. However, maintaining constant positivity in the face of the Beyonder world''s horrors presents its own challenge. Derrick Berg''s earnest, almost naive optimism in the Tarot Club reflects the Bard sequence''s ideal. No advancement ritual is required.',
  'sun',
  5,
  null,
  ARRAY['Derrick Berg'],
  ARRAY[9],
  ARRAY['sun-pathway', 'bard', 'healing', 'music', 'purification', 'acting-method'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'sun-seq8-light-suppliant',
  'Sun Pathway — Sequence 8: Light Suppliant',
  'pathway',
  'The Light Suppliant sequence enhances the Bard''s abilities with focused light manipulation and stronger healing. A Light Suppliant gains Light Beam — the ability to project a focused beam of purifying light that damages supernatural evil. Healing Touch upgrades Minor Healing to cure moderate wounds and minor diseases through direct contact. Radiant Aura creates a passive glow that repels weaker undead and evil spirits, making the Light Suppliant a natural enemy of the Death pathway''s lower-sequence creations. The potion requires a Solar Amber Crystal and White Dew Grass Juice. The advancement ritual requires conducting a healing ceremony under direct sunlight, gathering those in need of healing, channeling sunlight through prayer, and healing at least three people. The acting method demands praying at dawn and dusk without fail, aiding the sick whenever possible, and carrying light into darkness — never shying away from it. The Light Suppliant embodies the Sun pathway''s priestly aspect: the practitioner is a servant of the light, healing and protecting as a sacred duty. This sequence begins to establish the Sun pathway''s combat niche as an anti-undead and anti-corruption specialist, making Sun Beyonders highly valued partners for Darkness and Death pathway operatives who regularly face such threats.',
  'sun',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['sun-pathway', 'light-suppliant', 'healing', 'purification', 'anti-undead'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'sun-seq7-solar-high-priest',
  'Sun Pathway — Sequence 7: Solar High Priest',
  'pathway',
  'The Solar High Priest marks the Sun pathway''s entry into mid-sequence power, combining area-effect purification with religious authority. A Solar High Priest gains Blazing Radiance — an intense burst of holy light that deals heavy damage to evil entities in a wide area. Purification Ritual allows cleansing an entire location of spiritual corruption through extended prayer. Endurance of the Sun provides enhanced physical stamina and resistance to cold and darkness effects. Consecration blesses an object or location to repel evil for a sustained duration. The potion requires a Phoenix Feather Fragment, Sacred Incense Resin, and Dawn Dew. The advancement ritual requires identifying a location tainted by supernatural darkness and performing a purification from dawn to noon, successfully cleansing the corruption. The acting method demands leading religious ceremonies regularly, protecting the faithful, defending sacred sites, and embodying scriptural teachings. The Solar High Priest represents the Sun pathway''s transition from individual healer to community leader — the practitioner becomes a focal point of faith and protection for others. The Consecration ability is particularly significant for gameplay: it allows establishing safe zones in hostile environments, a capability no other MVP pathway provides.',
  'sun',
  5,
  null,
  '{}',
  ARRAY[7],
  ARRAY['sun-pathway', 'solar-high-priest', 'mid-sequence', 'purification', 'consecration'],
  265
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'sun-seq6-notary',
  'Sun Pathway — Sequence 6: Notary',
  'pathway',
  'The Notary sequence introduces the Sun pathway''s authority and justice-based abilities. A Notary gains Sacred Contract — the power to create supernaturally binding agreements where breakers suffer divine retribution, making them invaluable for enforcing deals between Beyonders. Truth Detection compels honesty during formal questioning. Aura of Authority projects a presence that compels respect and obedience from weaker-willed beings. Holy Fire summons flames of purification that burn evil but spare the innocent — a more targeted version of earlier light-based attacks. The potion requires a Scale of a Golden Serpent, Ink of Binding, and Judgment Stone Dust. The advancement ritual requires adjudicating a dispute between two Beyonders and enforcing the outcome through Sacred Contract. The acting method demands upholding justice, serving as arbiter when called upon, and never breaking one''s own word. The Notary represents a thematic shift in the Sun pathway from healer to judge. This sequence is narratively significant because it establishes the Sun pathway''s connection to law and order — at higher sequences, this evolves into divine authority over truth and morality. For gameplay, Sacred Contract creates unique social mechanics: the ability to enforce agreements supernaturally adds a powerful diplomatic tool.',
  'sun',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['sun-pathway', 'notary', 'contracts', 'justice', 'truth', 'authority'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'sun-seq5-priest-of-light',
  'Sun Pathway — Sequence 5: Priest of Light',
  'pathway',
  'The Priest of Light is the apex of mid-sequence power in the Sun pathway, combining devastating solar combat with supreme healing and protective abilities. A Priest of Light gains Divine Healing — the ability to heal severe wounds and cure serious diseases through channeled light, making them the most powerful healers among the four MVP pathways at this level. Solar Judgment calls down a pillar of concentrated sunlight to smite a target area, functioning as the pathway''s ultimate offensive ability. Sanctuary creates a zone of holy light that protects all within from evil influence, establishing a fortified position. Radiant Constitution suffuses the body with light, granting high resistance to corruption, poison, and disease. The potion requires a Beyonder Characteristic of a Notary, a Heart of a Sun Elemental, and Holy Water of the Dawn Cathedral. The advancement ritual requires establishing a new consecrated sanctuary through a day-long ritual and defending it against a supernatural assault. The acting method demands leading a congregation, performing major healing works weekly, and standing as a beacon of light. The Priest of Light embodies the Sun pathway''s highest ideal within the MVP scope: a spiritual leader who heals the broken, shields the vulnerable, and burns away evil. At this level, the practitioner''s body literally begins to radiate light, marking them as something more than human.',
  'sun',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['sun-pathway', 'priest-of-light', 'divine-healing', 'solar-judgment', 'mid-sequence-apex'],
  285
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'death-pathway-overview',
  'Death Pathway — Overview',
  'pathway',
  'The Death pathway belongs to the Eternal Darkness group, anchored to the River of Eternal Darkness. It is the pathway of spirits, undead, and the boundary between life and death — progressing from speaking with the dead at low sequences to commanding legions of undead and achieving a form of immortality at higher levels. The Death pathway''s neighboring pathways within the Eternal Darkness group are the Darkness (Sleepless) pathway and the Twilight Giant pathway. In the Fifth Epoch, the Death pathway has no single orthodox church controlling it. The Church of the Evernight Goddess possesses knowledge of the Death pathway through its connection to night and death, and some Nighthawk team members follow the Death pathway. The Southern Continent holds many Death pathway secrets. The Death pathway is the darkest and most macabre of the four MVP pathways, dealing directly with corpses, spirits, and the death realm. Its practitioners serve as mediators between the living and the dead. The pathway''s abilities are particularly effective against undead threats and in investigations involving murder victims, making Death pathway Beyonders valuable specialists. Daly Simone and Azik Eggers represent different expressions of this pathway in the Tingen narrative.',
  'death',
  5,
  null,
  ARRAY['Daly Simone', 'Azik Eggers'],
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['death-pathway', 'eternal-darkness-group', 'river-of-eternal-darkness', 'overview'],
  255
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'death-seq9-corpse-collector',
  'Death Pathway — Sequence 9: Corpse Collector',
  'pathway',
  'The Corpse Collector is the entry point of the Death pathway, granting abilities centered on interaction with the dead. A Corpse Collector gains Corpse Communication — the ability to speak with recently deceased individuals and learn their final moments, making them invaluable for murder investigations and recovering information from the dead. Death Sense provides passive detection of death, undead, and lingering spirits in the vicinity, acting as an early warning system in haunted locations. Preserve Remains allows slowing or halting decomposition through spiritual means, useful for preserving evidence or maintaining bodies for later communication. The potion requires Corpse Grass and Black-faced Vulture Oil. The acting method requires treating the dead with respect, performing proper burial rites, spending time among graves without fear, and cataloging remains encountered. The Corpse Collector''s acting method is psychologically challenging in a different way from other pathways: it demands comfort with death and corpses, requiring the practitioner to overcome natural human revulsion. Those who succeed develop a respectful, professional relationship with death itself. No advancement ritual is required — the potion is digested through consistent acting. The Corpse Collector is a support and investigation specialist, better suited to forensic work than combat.',
  'death',
  5,
  null,
  '{}',
  ARRAY[9],
  ARRAY['death-pathway', 'corpse-collector', 'forensic', 'spirit-communication', 'acting-method'],
  260
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'death-seq8-gravedigger',
  'Death Pathway — Sequence 8: Gravedigger',
  'pathway',
  'The Gravedigger sequence advances the Corpse Collector''s connection to death into active combat capability. A Gravedigger gains Undead Command — the ability to raise and command a small number of basic undead such as skeletons and zombies, making them the only low-sequence Beyonder among the four MVP pathways who can create minions. Bone Weapon allows shaping bones into supernatural weapons, providing melee combat tools enhanced with death energy. Death''s Endurance reduces the need for sleep and food while granting resistance to cold and disease — the Gravedigger''s body begins its slow transition away from normal human biology. The potion requires a Zombie Heart and Graveyard Soil. The advancement ritual requires putting a restless undead to permanent rest through a rite of final rest at the undead''s original grave. The acting method demands digging graves and burying the dead as community service, studying the nature of death and undeath, and protecting burial sites from desecration. The Gravedigger sequence introduces the Death pathway''s dual nature: the practitioner both commands and respects the dead. The ability to raise undead is not about domination but stewardship — the Gravedigger maintains order in the boundary between life and death. This sequence''s combat abilities are modest but unique, establishing the Death pathway''s role as the "summoner" among MVP pathways.',
  'death',
  5,
  null,
  '{}',
  ARRAY[8],
  ARRAY['death-pathway', 'gravedigger', 'undead-command', 'bone-weapons', 'acting-method'],
  275
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'death-seq7-spirit-medium',
  'Death Pathway — Sequence 7: Spirit Medium',
  'pathway',
  'The Spirit Medium marks the Death pathway''s entry into mid-sequence power, focusing on the boundary between the living and the dead. A Spirit Medium gains Spirit Channeling — the ability to allow a spirit to temporarily inhabit their body to communicate, a dangerous ability that risks losing oneself if the spirit is too powerful. Ghost Walk enables becoming partially incorporeal for short periods, passing through solid objects for infiltration or escape. Death Domain Awareness provides wide-area sensing of disturbances in the life-death boundary. Spirit Binding allows anchoring a willing or weakened spirit to an object or location, creating wards or sentinels. The potion requires a Wraith Crystal, Spirit World Incense, and Tears of the Bereaved. The advancement ritual requires channeling a powerful spirit (at least Sequence 8) through the body without losing control and delivering its final message. The acting method demands regular communion with spirits, mediating between living and dead, and never abusing spirits'' trust. Daly Simone exemplifies the Spirit Medium''s role on the Tingen Nighthawks: she channels murder victims to gather evidence, senses undead presences during investigations, and serves as the team''s specialist for ghost-related incidents. The Spirit Medium''s psychological burden is heavy — they regularly experience the grief, trauma, and confusion of the dead firsthand through channeling.',
  'death',
  5,
  null,
  ARRAY['Daly Simone'],
  ARRAY[7],
  ARRAY['death-pathway', 'spirit-medium', 'channeling', 'ghost-walk', 'mid-sequence'],
  280
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'death-seq6-spirit-guide',
  'Death Pathway — Sequence 6: Spirit Guide',
  'pathway',
  'The Spirit Guide sequence grants the Death pathway''s ability to cross between the realms of the living and the dead. A Spirit Guide gains Death Gate — the ability to open a temporary passage to the death realm, a vast, terrifying dimension where spirits wander and powerful death-related entities dwell. Soul Harvest allows extracting the soul of a recently deceased being before it dissipates, preserving it for communication, protection, or other purposes. Deathly Resilience enables surviving injuries that would kill ordinary beings and dramatically slows aging. Spirit Army allows commanding a small host of bound spirits in combat. The potion requires a Heart of a Death Elemental, a Veil Fragment, and Ancient Funeral Ash. The advancement ritual requires entering the death realm through a Death Gate, locating a specific lost soul, and guiding it to its final rest. The acting method demands guiding lost souls regularly, walking the boundary between life and death, and treating death as a domain to steward rather than fear. The Spirit Guide represents a fundamental shift in the Death pathway practitioner''s relationship with death: they are no longer visitors to death''s domain but residents of it, moving freely between the living and dead worlds. The Spirit Army ability transforms the practitioner into a commander of ghostly forces.',
  'death',
  5,
  null,
  '{}',
  ARRAY[6],
  ARRAY['death-pathway', 'spirit-guide', 'death-realm', 'soul-harvest', 'spirit-army'],
  275
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'death-seq5-undying',
  'Death Pathway — Sequence 5: Undying',
  'pathway',
  'The Undying is the apex of mid-sequence power in the Death pathway, granting a form of pseudo-immortality and supreme command over the undead. An Undying gains Resurrection — the passive ability to revive from death once, their body reforming over time from accumulated death energy. This makes the Undying the only MVP pathway Beyonder with a built-in second chance at life. Death''s Embrace allows inflicting severe necrotic damage through touch, the damage resisting conventional healing. Undead Legion enables raising and commanding a large force of powerful undead — far exceeding the Gravedigger''s modest skeletons. Deathless Form causes the body to exist partially in the death realm, rendering the practitioner immune to most physical damage. The potion requires a Beyonder Characteristic of a Spirit Guide, a Lich Bone Fragment, and Essence of the Death Realm. The advancement ritual is the most dramatic among the four MVP pathways: the practitioner must truly die and then reconstitute themselves through death energy and force of will. The acting method demands embracing the duality of life and death, maintaining dominion over a territory where the dead outnumber the living, and accepting death as something to transcend rather than fear. The Undying represents the Death pathway''s ultimate promise: mastery over death itself, beginning the practitioner''s transformation from a mortal who studies death into a being who has conquered it.',
  'death',
  5,
  null,
  '{}',
  ARRAY[5],
  ARRAY['death-pathway', 'undying', 'resurrection', 'undead-legion', 'mid-sequence-apex'],
  290
);


npm notice
npm notice New major version of npm available! 10.9.7 -> 11.15.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.15.0
npm notice To update run: npm install -g npm@11.15.0
npm notice
