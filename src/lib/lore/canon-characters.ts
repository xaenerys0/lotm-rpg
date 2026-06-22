// Canon-character takeover roster (issue #92).
//
// When a player names their character EXACTLY after a canonical Lord of the
// Mysteries figure AND chooses that figure's start-of-story pathway, they "take
// over" that character: the chronicle opens with the character's canon pathway,
// starting sequence, location, timeline position, and a prefilled, durable
// backstory — and the doppelganger is suppressed so the figure never appears as
// a separate NPC while the player IS them.
//
// Roster scope (per issue #92 + review): every takeover-able character is a
// KNOWN NOVEL FIGURE who, AT THEIR OWN INTRODUCTION in the novel, is a low
// Beyonder (Sequence 7-9, "under Sequence 6") on ANY of the 22 fully-playable
// pathways (the prologue + manual creation both reach all 22; a pathway needs
// no special richness to be taken over — the matcher, seeding, and suppression
// are pathway-agnostic). Each preset's `startSequence`/`startLocation`/
// `canonPosition` reflect WHERE AND WHEN that character is introduced — not the
// literal first chapter — so taking them over begins their story as the novel
// began it for them. (Derrick Berg — Sun — is deliberately excluded: he only
// becomes a Beyonder deep into Book 1, inside the access-gated City of Silver,
// so he is neither low-Sequence at his introduction in an ordinary sense nor a
// reachable mainland start.)
//
import type { AccessFlag } from "@/lib/ai";

// CANON: every fact below (pathway, starting sequence, introduction chapter,
// family/relationships, residence) is verified against `corpus/` — the LOTM wiki
// dump and novel EPUB — NOT memory. See the repo-root CLAUDE.md "Canon & Source
// Material" section. `background` is deliberately SPOILER-BOUNDED to each
// character's introduction point: who they are, their family/relationships,
// their situation, and how they became a Beyonder — never their later arc.

export interface CanonCharacterPreset {
  /** Stable id, matching the `npcs.ts` slug stem (used for suppression lookup). */
  id: string;
  /** Canonical display name, e.g. "Klein Moretti". */
  displayName: string;
  /**
   * Other names the narrator might use for this character — folded into the
   * name match AND the doppelganger suppression set. Kept specific (no bare
   * generic words like "Captain") so suppression never strips an unrelated NPC.
   */
  aliases: string[];
  /** Canon pathway id at the story's start (any of the 22 playable pathways). */
  pathwayId: number;
  /** Canon Sequence at the character's INTRODUCTION (7-9). */
  startSequence: number;
  /** Canon starting location string (leading word resolves to the city). */
  startLocation: string;
  /** Starting epoch (the Fifth for every current roster member). */
  epoch: number;
  /**
   * Capability flags the character holds from the start (issue #130) — only for
   * a figure who BEGINS inside an access-gated continent (e.g. Derrick Berg, a
   * City-of-Silver native, holds the dream-world passage + his city's awareness
   * flag). Absent for an ordinary mainland start. Seeded onto `GameState`.
   */
  accessFlags?: AccessFlag[];
  /**
   * The shared-timeline position to seed (issue #63 RAG gate): the chapter at
   * which this character is INTRODUCED, so retrieval exposes only past/present
   * corpus and never future-arc spoilers. Klein (the protagonist) = 1.
   */
  canonPosition: number;
  /**
   * DURABLE identity + backstory + relationships, spoiler-bounded to the
   * character's story start. Lives in the never-trimmed game-state `background`
   * layer (issue #92's durability insight) — NOT in trimmable session facts —
   * so the narrator never loses the character's family/identity over a long
   * chronicle.
   */
  background: string;
  /**
   * Optional durable "how you arrive at the story's start" bridge — pinned into
   * the `prologueRecap` slot, a DISTINCT durable channel from `background`
   * (never the same string duplicated into both).
   */
  openingRecap?: string;
  /**
   * Optional turn-0 facts for immediacy only — these are allowed to age out of
   * the session-fact window; they are NOT where the durable relationships live.
   */
  earlySalienceFacts?: string[];
}

/**
 * Normalize a name for matching + suppression: lowercased, whitespace
 * collapsed, trimmed. Mirrors the lower/trim shape used elsewhere in the lore
 * layer (cf. `normalizePathwayKey` in `index.ts`).
 */
export function normalizeCanonName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export const CANON_PLAYABLE_CHARACTERS: CanonCharacterPreset[] = [
  {
    id: "klein-moretti",
    displayName: "Klein Moretti",
    aliases: ["Klein", "Mr. Fool", "The Fool"],
    pathwayId: 1, // Fool
    startSequence: 9, // Seer
    startLocation: "Tingen City",
    epoch: 5,
    canonPosition: 1, // The protagonist — the story opens on him.
    background: `You are Klein Moretti, a recent history graduate of Khoy University in the smog-wreathed industrial city of Tingen, in the Loen Kingdom — but the soul behind that name is no longer the man Tingen knew. You woke in Klein's body after he put a revolver to his own head, carrying the memories of Zhou Mingrui, a young man from another world entirely; the secret that you are NOT the original Klein is one you must guard above all else, for it can be neither explained nor forgiven. The Moretti household is a modest one on Daffodil Street: your elder brother Benson, steady and dependable, has held the family together since your parents' deaths, while your younger sister Melissa, sharp and studious, keeps the books and frets over your strange new behaviour. Their wellbeing is the anchor that steadies you in a world gone suddenly, terribly strange. That world cracked open when a divination ritual — worked with your own blood and your own true name — pulled your spirit up above a boundless grey fog, to an ancient, silent palace that answers to no god you have ever heard named. Soon after, Captain Dunn Smith of the Tingen Nighthawks recruited you into the Church of the Evernight Goddess's secret arm and set a Seer's potion before you: the first rung of the Fool's pathway, the gift of divination and spiritual sight. You are a Beyonder now — cautious, clever, and quietly terrified of the hidden supernatural underworld you have joined, determined to protect your family, hide your borrowed life, and survive the dangers that killed the man whose face you wear.`,
    openingRecap: `The ritual that lifted your spirit above the grey fog still rings in your bones, and the bitter Seer's potion is freshly swallowed. You are a newly sworn Nighthawk of Tingen, hiding a borrowed life behind a dead man's face, with your first real cases and your first real dangers waiting just beyond the office door.`,
    earlySalienceFacts: [
      "You have just become a Sequence 9 Seer of the Fool pathway, newly inducted into the Tingen Nighthawks under Captain Dunn Smith.",
      "Your siblings — elder brother Benson and younger sister Melissa — live with you on Daffodil Street and know nothing of the Beyonder world.",
      "Your gravest secret is that you are not the original Klein Moretti: you carry the memories of Zhou Mingrui from another world.",
    ],
  },
  {
    id: "dunn-smith",
    displayName: "Dunn Smith",
    aliases: ["Dunn", "Captain Dunn Smith", "Captain Dunn"],
    pathwayId: 5, // Darkness
    startSequence: 7, // Nightmare
    startLocation: "Tingen City",
    epoch: 5,
    canonPosition: 12, // Introduced as Klein joins the Nighthawks.
    background: `You are Dunn Smith, Captain of the Tingen City team of the Nighthawks — the Church of the Evernight Goddess's secret order that hunts rogue Beyonders, restless spirits, and the horrors that prey on the gaslit world. A tall, handsome man in your late thirties with a perpetually drowsy, half-asleep manner, you have led this small team long enough to wear your authority lightly: you give your people room, trust their judgement, and rouse yourself only when the danger is real — at which point the laziness falls away and a Sequence 7 Nightmare of the Darkness pathway stands in its place, able to walk in dreams, induce sleep, and turn a foe's own mind against them. Your team is your charge and very nearly your family: the elderly artificer Old Neil, the young poet Leonard Mitchell, the seconded Spirit Medium Daly Simone, and the newest recruit — the quiet, sharp-eyed Klein Moretti, whom you have just brought into the fold. You answer to the Church's Tingen chapter and to the cathedral above it, forever balancing official orders against the lives of the people under you. Beneath the drowsy calm you carry the weight every captain carries — that the next case could cost you one of your own — and you carry it without complaint, because in Tingen there is no one else to.`,
    openingRecap: `Another grey Tingen morning, another stack of case files and a fresh recruit to break in. You doze at your desk in the Nighthawks office with one ear open — for in this city the unnatural never waits long, and the safety of your team and the people of Tingen rests on your drowsy, watchful shoulders.`,
    earlySalienceFacts: [
      "You are a Sequence 7 Nightmare of the Darkness pathway and Captain of the Tingen Nighthawks.",
      "Your team includes the artificer Old Neil, the poet Leonard Mitchell, the Spirit Medium Daly Simone, and the new recruit Klein Moretti.",
      "You answer to the Church of the Evernight Goddess's Tingen chapter.",
    ],
  },
  {
    id: "daly-simone",
    displayName: "Daly Simone",
    aliases: ["Daly", "Ma'am Daly"],
    pathwayId: 4, // Death
    startSequence: 7, // Spirit Medium
    startLocation: "Tingen City",
    epoch: 5,
    canonPosition: 14, // Introduced shortly after Klein joins the team.
    background: `You are Daly Simone, a Sequence 7 Spirit Medium of the Death pathway, seconded to the Tingen City Nighthawks from the orthodox Church to lend the team an expertise it badly needs. Composed, professional, and quietly formidable, you do the work few Beyonders can stomach: you commune with the dead, banish restless and malevolent spirits, channel the departed through your own body, and step — when you must — across the boundary into the realm of death itself. You reached Sequence 7 in only two years, a pace remarkable enough that your captain, Dunn Smith, marvels at it; greater rank and a transfer to the Backlund diocese wait for you not far ahead, once you reach Sequence 6. The constant nearness of grief and horror has taught you a clinical detachment that reads as coldness to those who do not know the cost of your gift, but the discipline is armour, not indifference. Among your colleagues — the artificer Old Neil, the poet Leonard Mitchell, your drowsy captain, and the new recruit Klein Moretti — you keep a professional distance and a reliable hand: the one they turn to whenever a case turns on the murdered, the haunted, or the unquiet dead.`,
    openingRecap: `The dead are restless in Tingen, and so the Nighthawks have sent for you. You arrive composed and ready, the cold discipline of a Spirit Medium settling over you like a veil — for between the living and what lingers past death, you are the team's surest hand.`,
    earlySalienceFacts: [
      "You are a Sequence 7 Spirit Medium of the Death pathway, seconded to the Tingen Nighthawks.",
      "You commune with and banish the dead, and you are close to advancing to Sequence 6 and a transfer to Backlund.",
      "Your captain is Dunn Smith; your colleagues include Old Neil, Leonard Mitchell, and Klein Moretti.",
    ],
  },
  {
    id: "leonard-mitchell",
    displayName: "Leonard Mitchell",
    aliases: ["Leonard", "Mr. Poet", "The Star"],
    pathwayId: 5, // Darkness
    startSequence: 9, // Sleepless
    startLocation: "Tingen City",
    epoch: 5,
    canonPosition: 17, // Introduced as a member of the Tingen team.
    background: `You are Leonard Mitchell, the youngest of the Tingen Nighthawks and the team's resident poet — handsome, easygoing, and forever composing verse in your head, even in the middle of a fight. A Sequence 9 Sleepless of the Darkness pathway, you need little rest and see well in the dark, and you throw yourself into the order's work with a genuine, unaffected care for the ordinary people of Tingen who will never learn how close the horrors come. You serve under Captain Dunn Smith alongside the artificer Old Neil and the seconded Spirit Medium Daly Simone, and you have quickly fallen into an easy partnership with the team's newest recruit, Klein Moretti. You carry one secret heavier than your charming manner lets on: lodged within you is Pallez Zoroast, a powerful entity of the Error pathway who lives as a symbiote in your body, lending you guidance and uncanny strength — and a danger you can never quite forget, for the Angel's own purposes are not always your own. Beneath the poetry and the good looks you are observant, empathetic, and braver than you seem, a young man who chose this dangerous, hidden vocation because someone has to stand between Tingen and the dark.`,
    openingRecap: `A new case, a half-finished verse, and the easy company of the Nighthawks — this is the life you have made in Tingen. You shoulder your gear with a poet's grin and a Sleepless's tireless calm, the quiet presence of Pallez stirring somewhere beneath your thoughts, and step out into another night's work against the dark.`,
    earlySalienceFacts: [
      "You are a Sequence 9 Sleepless of the Darkness pathway, the youngest of the Tingen Nighthawks.",
      "You serve under Captain Dunn Smith beside Old Neil, Daly Simone, and the new recruit Klein Moretti.",
      "Your secret: the Error-pathway entity Pallez Zoroast lives within you as a symbiote — both ally and danger.",
    ],
  },
  {
    id: "audrey-hall",
    displayName: "Audrey Hall",
    aliases: ["Audrey", "Miss Justice", "Justice"],
    pathwayId: 2, // Visionary
    startSequence: 9, // Spectator
    startLocation: "Backlund",
    epoch: 5,
    canonPosition: 41, // Introduced when she gains the Spectator potion in Backlund.
    background: `You are Audrey Hall, the youngest child and only daughter of the aristocratic Hall family of Empress Borough, in the refined heart of Backlund, capital of the Loen Kingdom. Your father is an Earl who sits in the Cabinet and ranks among the realm's foremost bankers; your mother is the Countess Caitlyn, and your two elder brothers are Hibbert, the heir, and Alfred. Poised, dazzling, and famously charming, you move through the salons, balls, and drawing rooms of high society as one of its brightest ornaments — and you are quietly weary of being only that. Beneath the gowns and the good breeding you have crossed into a hidden world: you are a Sequence 9 Spectator of the Visionary pathway, newly gifted at reading and gently swaying the minds and hearts of others, a power you are determined to use for genuine good rather than mere advantage. Your devoted golden retriever, Susie — who lapped up one of your early potions and is now no ordinary dog — is rarely far from your side. Idealistic, quick-witted, and braver than your sheltered upbringing should allow, you keep your Beyonder life an absolute secret from your family and your world: a young noblewoman with one foot in Backlund's gilded surface and the other in its strange, dangerous depths.`,
    openingRecap: `Backlund glitters with another season of balls and intrigues, and the Hall family's only daughter is expected at every one of them. But your thoughts are elsewhere — on the secret potion newly settled within you, on the powers stirring at your fingertips, and on Susie at your heel — as you slip from the drawing rooms of Empress Borough toward a hidden world your family will never see.`,
    earlySalienceFacts: [
      "You are a Sequence 9 Spectator of the Visionary pathway, newly able to read and sway minds — a secret you keep from everyone.",
      "You are the only daughter of the Hall family of Empress Borough, Backlund: your father an Earl and Cabinet banker, your mother Caitlyn, your brothers Hibbert and Alfred.",
      "Your golden retriever Susie drank one of your potions and is no ordinary dog.",
    ],
  },
  {
    id: "old-neil",
    displayName: "Old Neil",
    aliases: ["Neil"],
    pathwayId: 18, // Hermit
    startSequence: 9, // Mystery Pryer
    startLocation: "Tingen City",
    epoch: 5,
    canonPosition: 19, // Introduced among the Tingen team early in Book 1.
    background: `You are Old Neil, the resident artificer and historian of the Tingen City Nighthawks — an elderly, grandfatherly man who keeps the team's mystical equipment, identifies the relics and ritual materials they recover, and carries more lore of the Beyonder world in his head than any book in Tingen holds. You walk the Hermit pathway at its first rung, a Sequence 9 Mystery Pryer, whose gifts run to divination, analysis, and the patient gathering of hidden knowledge rather than to force. Warm and generous with what you know, you have taken it upon yourself to teach the team's newest recruit, Klein Moretti, the practical craft the formal training never covers — how to handle an artifact without being devoured by it, how to lay out a ritual, how a careful Beyonder stays alive. You serve under Captain Dunn Smith alongside the poet Leonard Mitchell and the seconded Spirit Medium Daly Simone — the steady old hand at the workbench while the younger ones go into the dark. You know better than any of them how fragile a Beyonder's footing is, and how much depends on caution, which is exactly why they trust you to mind the dangerous things.`,
    openingRecap: `The Nighthawks' workshop in Tingen smells of oil, old paper, and warded iron, and the day's recovered oddments wait on your bench for your patient eye. You settle in among your tools and your lore — the team's quiet keeper of dangerous things — as another case stirs somewhere out in the gaslit city.`,
    earlySalienceFacts: [
      "You are a Sequence 9 Mystery Pryer of the Hermit pathway, the Tingen Nighthawks' artificer and lore-keeper.",
      "You serve under Captain Dunn Smith alongside Leonard Mitchell and Daly Simone, and you mentor the recruit Klein Moretti.",
      "Your craft is artifacts, rituals, and Beyonder history — knowledge and caution, not force.",
    ],
  },
  {
    id: "isengard-stanton",
    displayName: "Isengard Stanton",
    aliases: ["Isengard", "Mr. Eye of Wisdom"],
    pathwayId: 10, // White Tower
    startSequence: 7, // Detective
    startLocation: "Backlund",
    epoch: 5,
    canonPosition: 157, // Introduced as the Backlund detective in Book 1.
    background: `You are Isengard Stanton, a private detective of notable fame in Backlund, capital of the Loen Kingdom, who styles himself "Mr. Eye of Wisdom." You keep no formal office, working instead from your own home with a handful of hired assistants — a graying man fond of a dark pipe and the quiet of an unlit fireplace while the facts arrange themselves behind your eyes. Behind the detective's reputation you are a Beyonder of the White Tower pathway, a Sequence 7 Detective, whose reason and deduction are precisely the gifts the god you secretly serve prizes above birth or wealth. For you are a believer of the Church of the God of Knowledge and Wisdom, a faith you took up across four years of study in Lenburg; at home in Loen you keep a careful cover as a worshipper of the Evernight Goddess, for the wisdom-faith is foreign here. Your work brings you into the orbit of another Backlund detective, the theatrical Sherlock Moriarty, with whom you keep a wary friendship of professional equals. Devout in your own quiet way, you have asked that when you die your remains be carried to the Holy Temple of Knowledge in distant Azshara — a scholar's last pilgrimage to the seat of the omniscient eye.`,
    openingRecap: `Backlund's fog presses at the windows, a client waits on your sofa, and your pipe smoulders as the deductions fall into place. You are Mr. Eye of Wisdom, the detective who solves what the police cannot — and, behind that, a quiet servant of the omniscient god, taking up another case in the smog-bound capital.`,
    earlySalienceFacts: [
      "You are a Sequence 7 Detective of the White Tower pathway, a famous Backlund private detective who styles himself 'Mr. Eye of Wisdom.'",
      "You secretly believe in the Church of the God of Knowledge and Wisdom, keeping a cover as an Evernight worshipper at home in Loen.",
      "You keep a wary professional friendship with the detective Sherlock Moriarty.",
    ],
  },
  {
    id: "derrick-berg",
    displayName: "Derrick Berg",
    aliases: ["Derrick", "The Sun"],
    pathwayId: 3, // Sun
    startSequence: 9, // Bard
    startLocation: "Silver City",
    epoch: 5,
    canonPosition: 157, // Becomes a Bard (his Beyonder genesis) via Mr. Fool.
    accessFlags: ["dream-world-passage", "silver-city-passage"],
    background: `You are Derrick Berg, a young man — barely more than a boy — born and raised in the City of Silver, one of the last surviving cities of the Forsaken Land of the Gods, a sealed continent walled off from the wider world. Yours has been a hard upbringing under the City's terrible curse: when one of its people dies, they must be slain by their own kin, or else rise as a wraith — and so you were forced to put your own parents to death by your hand, a grief that drove you, in your desperation, to pray with all your heart to the god your people still keep faith with: the Ancient Sun God, the Creator they believe abandoned this land. That prayer was answered. A passage opened to you through the Dream World — a way out of the sealed continent — and a mysterious benefactor known only as Mr. Fool set a Sun-pathway potion before you. You have just become a Sequence 9 Bard, the first rung of the Sun pathway, and taken your place in the strange gathering "above the gray fog" as a member of the secret Tarot Club, where you are called "The Sun." Earnest, devout, and sincere to a fault — and carrying the vigour the Sun's road grants even in one so young — you are a sheltered believer stepping for the first time into a world vaster and more dangerous than the City ever taught you, without losing the openhearted decency it raised in you.`,
    openingRecap: `The lightning-wracked sky of the City of Silver still hangs over you, and the grief of what the curse made you do has not faded — but a door has opened that no one here has walked through in lifetimes. The Sun-potion's warmth settles in your chest, the Tarot Club's gathering above the gray fog still ringing in your memory, as you take your first steps as The Sun, suddenly part of something far larger than your sealed home.`,
    earlySalienceFacts: [
      "You are a Sequence 9 Bard of the Sun pathway, newly made a Beyonder by a potion from Mr. Fool.",
      "You are a youth of the City of Silver in the sealed Forsaken Land; its curse forced you to kill your own parents, and you keep faith with the Ancient Sun God.",
      "In the secret Tarot Club, gathered above the gray fog, your code name is 'The Sun.'",
    ],
  },
  {
    id: "fors-wall",
    displayName: "Fors Wall",
    aliases: ["Fors", "The Magician", "Margaret Taylor"],
    pathwayId: 7, // Door
    startSequence: 9, // Apprentice
    startLocation: "Backlund",
    epoch: 5,
    canonPosition: 107,
    background: `You are Fors Wall, a spirited, ambitious, sometimes scatterbrained young woman who scrapes a living in Backlund as a writer and a private tutor of the occult. Behind that ordinary face you are a Beyonder of the Door pathway, trained as an outside disciple of the ancient Abraham line — the house that holds the full Door formula and has, in this age, turned its faith to the Fool. You are no blood of theirs: your father was a minor military officer, and you came to the Door through the teaching of an Abraham mentor rather than by birth. At the first rung of your path, a Sequence 9 Apprentice, your Door artistry — drawing portals, sending messages and small objects across distance — is still slight, but it already makes you quietly useful to the secret circle you have fallen in with: the Tarot Club, gathered above the gray fog, where you hold the card of "The Magician." You keep the faith of the Church of the Fool, and you move about Backlund under cover names like Margaret Taylor. Braver and more resourceful than your chaotic surface suggests, you are an eccentric authoress to your neighbours and a budding sorceress to the few who know the truth.`,
    openingRecap: `Backlund's smog and your unpaid bills press in as ever, but your head is full of portals and possibilities. The Door's first secrets are yours now, the Tarot Club's gathering still glittering in your memory, as you set out — an aspiring authoress, an occult tutor, and the Club's newest Magician — to make your slight new powers count.`,
    earlySalienceFacts: [
      "You are a Sequence 9 Apprentice of the Door pathway, an outside disciple of the Abraham line.",
      "You scrape a living in Backlund as a writer and occult tutor, under cover names like Margaret Taylor.",
      "In the secret Tarot Club you hold the card of 'The Magician,' and you keep the faith of the Church of the Fool.",
    ],
  },
  {
    id: "xio-derecha",
    displayName: "Xio Derecha",
    aliases: ["Xio", "Judgment"],
    pathwayId: 12, // Justiciar
    startSequence: 9, // Arbiter
    startLocation: "Backlund",
    epoch: 5,
    canonPosition: 112,
    background: `You are Xio Derecha, a young Beyonder of the Justiciar pathway making your way in Backlund, capital of the Loen Kingdom. Very short — barely over five feet — with soft, youthful features, messy shoulder-length blond hair, and sun-darkened skin, you carry nonetheless an unmistakable dignity and a quiet, convincing charm. You walk the Justiciar's road of order, law, and judgment at its first rung, a Sequence 9 Arbiter, with an earnest devotion to fairness that runs deeper than your unassuming look suggests. Your closest tie is your friendship with the eccentric authoress Fors Wall, and through that circle you have come into the secret Tarot Club, gathered above the gray fog, where you hold the code name "Judgment." Idealistic and upright, you mean to use the order-keeping gifts of your pathway to set wrong things right — a small, sun-browned figure with a god's instinct for the scales, finding her footing in the capital's hidden Beyonder world.`,
    openingRecap: `Backlund stretches out before you, vast and unfair and full of things that need setting right. The Justiciar's first powers are settling into you, your friend Fors Wall not far off and the Tarot Club's gathering fresh in your mind, as you step out — small, sun-browned, and quietly determined — to weigh the capital's wrongs on your own scales.`,
    earlySalienceFacts: [
      "You are a Sequence 9 Arbiter of the Justiciar pathway, devoted to order, law, and judgment.",
      "Your closest friend is the authoress and Door-Beyonder Fors Wall.",
      "In the secret Tarot Club, gathered above the gray fog, your code name is 'Judgment.'",
    ],
  },
  {
    id: "trissy",
    displayName: "Trissy",
    aliases: ["Tris", "Trissy Cheek"],
    pathwayId: 15, // Demoness
    startSequence: 7, // Trissy emerges from Tris on reaching Sequence 7
    startLocation: "Tingen City",
    epoch: 5,
    canonPosition: 122,
    background: `You are Trissy — once a man named Tris, a drifter who found a place in the Theosophy Order and walked the strange, dangerous road of the Demoness pathway. Tris was a round-faced, shy young man, happiest tucked in a corner, whom only those who knew him well discovered to be a wonderful conversationalist. Upon reaching Sequence 7, the Demoness pathway worked its transformation, and Tris became Trissy: a gorgeous young woman of perhaps eighteen or nineteen, with a round face, slender eyes, and a gentle, refined temperament, genuinely sweet beneath the new beauty. You are a Demoness Beyonder now, your gifts those of charm, allure, and the subtler arts your pathway grants, and you move through the underworld and the hidden corners of Loen where Beyonders quietly trade in secrets and favours. The change of name and shape is no disguise but a truth your path made of you — and you carry it with a poised, unhurried calm, a person remade by the very power you chose to chase.`,
    openingRecap: `The transformation is still new in your skin — Tris is behind you now, and Trissy looks back from every dark window. You move through the hidden markets and back rooms where Beyonders deal, a freshly-remade Demoness of the seventh Sequence, learning what your new shape and your pathway's gifts can do.`,
    earlySalienceFacts: [
      "You are a Sequence 7 Beyonder of the Demoness pathway, gifted in charm and allure.",
      "You were once a man named Tris, a drifter of the Theosophy Order; the Demoness path remade you as Trissy on reaching Sequence 7.",
      "You move through the Beyonder underworld of Loen, where secrets and favours are traded.",
    ],
  },
  {
    id: "emlyn-white",
    displayName: "Emlyn White",
    aliases: ["Emlyn", "The Moon", "Bai Ailin"],
    pathwayId: 17, // Moon
    startSequence: 7, // Vampire — a Sanguine is BORN at Sequence 7 (corpus)
    startLocation: "Backlund",
    epoch: 5,
    canonPosition: 316,
    background: `You are Emlyn White — once known as Bai Ailin — a young Sanguine in Backlund, capital of the Loen Kingdom. As one of the Sanguines, you were born already a Beyonder of the Moon pathway at Sequence 7, a Vampire, with the blood-born gifts and hungers of your kind. Your road to the Harvest Church on Rose Street — the Church of the Earth Mother's house in the capital — was a crooked one: you caught a thief and confiscated his Master Key, but the cursed key left you hopelessly lost, and you were taken in by the towering ex-pirate bishop Father Utravsky, who planted a psychological compulsion to keep you at the Church to work off your crimes. You despised him at first as a "dirty old man," but, against your own will, you grew sympathetic to the life-faith and its people and became a believer of the Earth Mother. A Sanguine among the Church's life-faithful, you are a wary bridge between Backlund's Sanguines and the order that took you in. You have also fallen in with a stranger circle still — the secret Tarot Club, gathered above the gray fog, where you hold the card of "The Moon" — and befriended a Backlund detective named Sherlock Moriarty. Proud, prickly, and more softhearted than you let on, you are a lost young Sanguine finding, against your own expectations, something like a place to belong.`,
    openingRecap: `Rose Street's Harvest Church has become an unlikely tether — Utravsky's planted compulsion binding you to it, the Earth Mother's faith working on you despite yourself. A Sanguine Vampire of the seventh Sequence and the Tarot Club's quiet "Moon," you move through Backlund's underside, learning warily whether the people who caught you are worth the trust.`,
    earlySalienceFacts: [
      "You are a Sequence 7 Vampire of the Moon pathway — a Sanguine, born to that rung.",
      "You caught a thief and took his cursed Master Key, got lost, and were caught by Father Utravsky, who planted a compulsion to keep you at the Harvest Church of the Earth Mother.",
      "In the secret Tarot Club you hold the card of 'The Moon,' and you have befriended the detective Sherlock Moriarty.",
    ],
  },
];

const CANON_BY_ID = new Map<string, CanonCharacterPreset>(
  CANON_PLAYABLE_CHARACTERS.map((preset) => [preset.id, preset]),
);

/**
 * Match a player's chosen NAME + pathway against the canon roster. BOTH must
 * match (the name — display name or any alias, normalized — AND the exact
 * pathway id) for a takeover; either alone returns null. A missing/blank name
 * also returns null.
 */
export function matchCanonCharacter(
  name: string | undefined,
  pathwayId: number,
): CanonCharacterPreset | null {
  if (!name) return null;
  const normalized = normalizeCanonName(name);
  if (!normalized) return null;
  for (const preset of CANON_PLAYABLE_CHARACTERS) {
    if (preset.pathwayId !== pathwayId) continue;
    const names = [preset.displayName, ...preset.aliases].map(normalizeCanonName);
    if (names.includes(normalized)) return preset;
  }
  return null;
}

/** O(1) lookup by id (used by world-state for doppelganger suppression). */
export function getCanonCharacter(id: string): CanonCharacterPreset | null {
  return CANON_BY_ID.get(id) ?? null;
}
