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
  teaches: ("beyonders" | "potions" | "acting" | "pathways")[];
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
      "An old Seer puts it this way, over cards she never seems to shuffle: " +
      "“The potion thinks it is still a person. Convince it you are that " +
      "person, and it stops fighting you.” A Seer who divines daily, reads " +
      "fortunes, trusts the cards — her potion settles, dissolves, becomes simply " +
      "her. A Seer who never touches the cards keeps a stranger under his skin. " +
      "They call it the acting method: do not merely hold the role. Wear it, " +
      "honestly, until the boundary between actor and role wears through.",
    lesson:
      "Acting in line with your Sequence's role digests the potion — the game " +
      "scores how truly you play the part, and digestion is how you advance safely.",
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
];

/** The concepts the tutorial must cover (acceptance criteria, issue #14). */
export const TUTORIAL_REQUIRED_TOPICS = [
  "beyonders",
  "potions",
  "acting",
  "pathways",
] as const;
