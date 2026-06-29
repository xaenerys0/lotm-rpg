// ---------------------------------------------------------------------------
// Tutorial prologue (issue #14)
// ---------------------------------------------------------------------------
//
// A short, hand-authored introduction for newcomers — the first ten minutes
// before character creation. Each scene teaches one core concept THROUGH the
// fiction (no rulebook dumps), and the whole thing is skippable at any point
// for returning readers; it carries no gameplay state and feeds nothing into
// the AI. Pure data + helpers; the React layer renders it.

export interface TutorialScene {
  id: string;
  title: string;
  /** Narrative body — atmosphere first, mechanics by implication. */
  body: string;
  /** The single takeaway, stated plainly after the fiction. */
  lesson: string;
  /** Concept tags, used by tests to prove coverage of the required topics. */
  teaches: ("beyonders" | "potions" | "acting" | "pathways" | "advancement")[];
}

export const TUTORIAL_SCENES: readonly TutorialScene[] = [
  {
    id: "the-hidden-world",
    title: "The City Keeps Two Sets of Books",
    body:
      "By day, Tingen is ledgers and steam whistles, omnibuses and church bells. " +
      "By night, a second city wakes beneath the first: men whose shadows move a " +
      "half-second late, a séance behind drawn curtains, a constable who files no " +
      "report about what he shot in the sewer. The people who walk that second city " +
      "are called Beyonders, and the first rule of their world is that it does not " +
      "exist. The churches hunt those who break the silence — not out of cruelty, " +
      "but because every public miracle ends the same way: panic, fire, and " +
      "something worse arriving to feed on both.",
    lesson:
      "Beyonders are real, hidden, and policed. Flaunting power in front of " +
      "ordinary people draws the hunters of every church down on you.",
    teaches: ["beyonders"],
  },
  {
    id: "the-bitter-cup",
    title: "What the Bottle Costs",
    body:
      "Power here is drunk, not learned. A Beyonder potion — a true name, a " +
      "main ingredient, a fistful of supplements — grants its Sequence the moment " +
      "it goes down. It also brings madness with it, patient as sediment. The " +
      "ones who gulp potion after potion, hungry for the next Sequence, are the " +
      "ones the Nighthawks find later: a thing wearing a man's coat, weeping in a " +
      "cellar, no longer able to remember which of its voices was original. The " +
      "potion is not a gift. It is a tenant, and it must be digested before you " +
      "dare invite another.",
    lesson:
      "Each potion grants power and erodes sanity. Advancing too fast — before " +
      "the last potion is digested — is how Beyonders lose control and die.",
    teaches: ["potions"],
  },
  {
    id: "the-method-of-acting",
    title: "Become the Mask",
    body:
      "An old woman who has clearly drunk something stranger than gin leans " +
      "close in the tavern corner. “The ones who last,” she says, “live as the " +
      "thing they drank wants to be lived. Day on day, choice on choice, until " +
      "there's no seam between them and it.” She studies you. “And the ones who " +
      "don't — who take the power and then turn their backs on what it asks of " +
      "them — something under the skin stops sleeping. It wakes. It wants. They " +
      "do not last.” How a Beyonder must carry themselves, she will not spell " +
      "out. That, she says, you learn by living it.",
    lesson:
      "Who you choose to be, turn after turn, matters more than any single act. " +
      "Stay true to what your power asks of you and you steady; betray it and " +
      "something within turns against you. The how is yours to discover.",
    teaches: ["acting"],
  },
  {
    id: "the-twenty-two-doors",
    title: "Choosing a Door",
    body:
      "There are twenty-two pathways through the dark, each a ladder of nine " +
      "Sequences rising toward something no sane person should want to be. A " +
      "diviner's path of fog and implication. A path of radiant conviction. A " +
      "path that keeps company with the dead. The door you choose decides what " +
      "you will see, what will be asked of you, and what you will slowly become — " +
      "because every pathway changes its climber, rung by rung. Choose the one " +
      "whose madness you could live with.",
    lesson:
      "Your pathway defines your abilities, your acting requirements, and your " +
      "story. The prologue ahead will help reveal which one fits you.",
    teaches: ["pathways"],
  },
  {
    id: "the-long-climb",
    title: "The Long Climb",
    body:
      "No one stays where they begin. Above every rung waits another, and the " +
      "way up never changes its shape. First the recipe — a formula hoarded in a " +
      "church vault, bought from a fence who asks too many questions, or prised " +
      "from the cold hands of someone who climbed before you. Then the " +
      "ingredients it names, one by one: some lie on a shelf if your purse is " +
      "deep enough, others must be run down and taken from things that do not " +
      "wish to be hunted. From the fifth rung on, a rite must be performed before " +
      "the draught will so much as wet your lips. Only then do you drink — and " +
      "learn, in that swallow, whether the climb lifts you or unmakes you where " +
      "you stand. The histories of every pathway are crowded with those who " +
      "reached for the next rung a season too soon.",
    lesson:
      "Rising a Sequence is deliberate: secure the formula, gather its " +
      "ingredients (bought or hunted), perform the rite from the fifth rung " +
      "onward, then drink — each step in order. Reach too far, too fast, and the " +
      "attempt can break you.",
    teaches: ["advancement"],
  },
];

/** The concepts the tutorial must cover (acceptance criteria, issue #14). */
export const TUTORIAL_REQUIRED_TOPICS = [
  "beyonders",
  "potions",
  "acting",
  "pathways",
  "advancement",
] as const;
