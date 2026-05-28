import { createMemoryState } from "@/lib/ai";
import type { MemoryState, SessionFact } from "@/lib/ai";

export interface PrologueChoice {
  id: string;
  text: string;
  affinities: Readonly<Record<number, number>>;
}

export interface PrologueScene {
  id: string;
  title: string;
  setting: string;
  narrative: string;
  choices: PrologueChoice[];
}

export interface PrologueSelection {
  sceneId: string;
  choiceId: string;
}

export interface PathwayScore {
  pathwayId: number;
  score: number;
}

export interface PrologueRecommendation {
  pathwayId: number;
  score: number;
  maxPossible: number;
  justification: string;
}

export interface PrologueState {
  currentScene: number;
  selections: PrologueSelection[];
  isComplete: boolean;
}

// Pathway IDs: 1=Fool, 2=Visionary, 3=Sun, 4=Death
export const PROLOGUE_SCENES: readonly PrologueScene[] = [
  {
    id: "scene-1",
    title: "The Widow's Misfortune",
    setting: "Tingen City Market District, Early Autumn",
    narrative:
      "A cold autumn morning in Tingen City. The market district hums with commerce — coal smoke drifting from factory chimneys, vendors crying their wares, the distant clank of a steam tram. You have paused at a pie stall when you witness it: a nimble-fingered youth in a grey coat lifts a small purse from an elderly widow's shawl pocket. The old woman is still counting out coins for a loaf of bread. The thief has already begun to walk away.",
    choices: [
      {
        id: "s1-fool",
        text: "Follow the thief at a distance. He didn't act alone — someone is directing these young pickpockets.",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s1-sun",
        text: "Call out and plant yourself in the thief's path. The widow needs her money back.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s1-visionary",
        text: "Go to the widow first. She looks frightened and confused — that matters more right now.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s1-death",
        text: "Study the thief's face. His eyes are sunken and empty — the look of someone haunted, or hollow.",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
  {
    id: "scene-2",
    title: "The Sealed Basement",
    setting: "An Abandoned Warehouse, East Tingen",
    narrative:
      "You have taken a shortcut through a derelict industrial block when you notice it: a heavy iron door set flush with the ground, secured by a padlock as large as your fist. A faint smell — chemical, with something organic beneath it — seeps through the gap. Whatever is stored here, the owners do not want it found. The street is empty. No one will see what you do next.",
    choices: [
      {
        id: "s2-fool",
        text: "Examine the lock and the hinges. Patterns in the rust and scratch marks reveal when this was last used.",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s2-sun",
        text: "If someone is trapped down there, waiting is not an option. You look for something to break the padlock.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s2-visionary",
        text: "Press your ear to the door and hold very still. Beneath the chemical smell — yes. A soft, rhythmic sound.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s2-death",
        text: "The smell reminds you of something you once encountered at a mortuary. You have learned to recognise the dead.",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
  {
    id: "scene-3",
    title: "The Veteran's Orders",
    setting: "The Iron Anchor Tavern, Dockside District",
    narrative:
      "Rain drums against the tavern windows. A soldier sits across the room, alone with a pewter mug and a letter bearing an unfamiliar seal. His hands shake, though not from the cold. He reads the letter again. And again. The regulars ignore him — they know better than to notice an officer reading orders in a place like this. But you notice. And you notice that the seal is not one issued by the Loen military.",
    choices: [
      {
        id: "s3-fool",
        text: "Watch him. His reactions tell you more than the letter ever could. Who gave him this, and why does it frighten him?",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s3-sun",
        text: "Move to his table. Whatever he is facing, he should not face it without someone at his side.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s3-visionary",
        text: "Catch his eye for a moment — a steady, unhurried look. You want him to know someone sees him.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s3-death",
        text: "You find yourself wondering — if those orders lead him somewhere fatal, what will remain of him afterward?",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
  {
    id: "scene-4",
    title: "The Old Book",
    setting: "Falser's Second-Hand Books, Upper Tingen",
    narrative:
      "A browsing afternoon turns strange when a waterlogged volume slides from an overpacked shelf and falls open at your feet. The pages show a circular diagram — geometric lines radiating from a central symbol you cannot quite focus on. The ink is faded brown, but the central glyph seems to absorb light rather than reflect it. The bookseller doesn't notice. The diagram looks like something drawn by a very careful, very frightened person.",
    choices: [
      {
        id: "s4-fool",
        text: "Copy the diagram into your notebook before touching anything else. You have a feeling you should not close this book.",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s4-sun",
        text: "Bring it to the counter immediately. This is not something for idle hands — the bookseller should know.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s4-visionary",
        text: "Place your hand on the page without thinking. The paper feels faintly warm, like a palm pressed flat just a moment ago.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s4-death",
        text: "The central glyph reminds you of runes you saw carved on a grave marker in Old Tingen cemetery, years ago.",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
] as const;

export const PATHWAY_JUSTIFICATIONS: Readonly<Record<number, string>> = {
  1: "Your instinct is to observe before you act — to see the shape of a thing before naming it. You are drawn to patterns hidden beneath the surface, to questions that most people don't think to ask. The Fool pathway calls to those who prefer the long view, who understand that knowledge carefully gathered is its own form of power.",
  2: "You read people the way others read books. Before intellect or action, you reach for understanding — of what a person feels, of what they fear, of what they carry. The Visionary pathway calls to those who believe the world is moved more by the weight of inner lives than by any physical force.",
  3: "When something is wrong, you act. Not recklessly — but with a clear sense that standing by is itself a choice, and not one you're willing to make. The Sun pathway calls to those who carry a light inside them, who protect without being asked, who know that courage is ordinary kindness made extraordinary by circumstance.",
  4: "You see the edges others avoid. You notice when someone is hollow-eyed, when a smell carries the wrong weight, when stillness is not peace but absence. The Death pathway calls to those who look unflinching at what lies beneath the surface of living — curious, rather than afraid, about what persists when the rest is gone.",
};

export const POTION_HEADINGS: Readonly<Record<number, string>> = {
  1: "The First Vision",
  2: "The First Dream",
  3: "The First Light",
  4: "The First Cold",
};

export const FIRST_POTION_NARRATIVE: Readonly<Record<number, string>> = {
  1: `The Seer potion is the colour of dark water.\n\nYou have prepared the ingredients with care — Dragon Blood Grass, Night Vale Flower, Stellar Aqua Crystal — following the formula precisely. The ritual is brief. You drink.\n\nThe cold spreads from your throat before the glass is down. The world does not change; your perception of it does. Shapes sharpen at their edges. Shadows develop textures you cannot name. And in the corner of the room — faint, translucent, watching you with ancient curiosity — something that was not there before.\n\nA spirit. It sees that you can see it. And something in your mind opens, like a key turning in a lock you didn't know was there.\n\nYou are a Seer now. The world will never be quite opaque again.`,
  2: `The Prophet potion arrives as a vial of layered liquid — two colours that refuse to mix, orbiting each other in slow spirals. The smell is of ozone and old paper and something you can't identify but almost remember. You drink.\n\nIt is not painful. It is disorienting in a way that pain never is. The room expands without moving. Other people's emotions arrive in your chest before you understand why — a landlady three floors down, worried about rent; a child in the street, delighted by something small. You feel them all, briefly, like radio signals catching on wire.\n\nThen it settles. The world goes quiet. And you understand — you always understood, on some level. You were reading people long before tonight. This simply makes it legible.\n\nYou are a Prophet now. What others keep hidden, you will find.`,
  3: `The Redeemer potion is warm to the touch before you drink it. Amber-coloured, faintly luminous. The ingredients were difficult to source — components associated with radiance, with consecrated things. The formula is old, and feels as though it was written by someone who believed in what they were doing.\n\nYou drink. And the warmth travels outward, not inward. Not into you, but through you — into the air around you, into the walls, into the floor. The darkness in the room doesn't exactly retreat. It makes room.\n\nYou set down the glass and look at your hands. They look the same. But when you press your palm flat and focus — just a little — a soft, steady light collects beneath your skin, waiting.\n\nYou are a Redeemer now. What has been broken, you can begin to mend.`,
  4: `The Reaper potion is cold before you touch it. The vial seems to pull warmth from your fingers. The components speak for themselves — things associated with endings, with transitions, with the borderlands between states of being. You drink.\n\nThe cold spreads not through your body but around it, as though a second skin of still air has settled over you. The candle flame does not flicker, but something in your peripheral vision does — a flicker in reverse, shapes coalescing where there should be none.\n\nYou set down the glass. The room is the same. But now you can feel it: the places where something has ended, where presence has departed and left its outline. The house is full of such places.\n\nYou are a Reaper now. What has passed, you can perceive.`,
};

export function scoreSelections(selections: PrologueSelection[]): PathwayScore[] {
  const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const selection of selections) {
    const scene = PROLOGUE_SCENES.find((s) => s.id === selection.sceneId);
    if (!scene) continue;
    const choice = scene.choices.find((c) => c.id === selection.choiceId);
    if (!choice) continue;
    for (const [idStr, score] of Object.entries(choice.affinities)) {
      const pathwayId = Number(idStr);
      totals[pathwayId] = (totals[pathwayId] ?? 0) + score;
    }
  }

  return Object.entries(totals)
    .map(([id, score]) => ({ pathwayId: Number(id), score }))
    .sort((a, b) => b.score - a.score);
}

export function recommendPathway(
  selections: PrologueSelection[],
): PrologueRecommendation {
  const scores = scoreSelections(selections);
  const top = scores[0] ?? { pathwayId: 1, score: 0 };
  const maxPossible = PROLOGUE_SCENES.length * 2;
  return {
    pathwayId: top.pathwayId,
    score: top.score,
    maxPossible,
    justification: PATHWAY_JUSTIFICATIONS[top.pathwayId] ?? "",
  };
}

export function createPrologueState(): PrologueState {
  return {
    currentScene: 0,
    selections: [],
    isComplete: false,
  };
}

export function createPrologueMemory(
  selections: PrologueSelection[],
  characterName: string,
  background: string,
): MemoryState {
  const memory = createMemoryState();

  const facts: SessionFact[] = [
    {
      type: "event",
      description: `Character created: ${characterName}${background ? `. Background: ${background}` : ""}`,
      turnNumber: 0,
    },
    ...(selections.length > 0
      ? [
          {
            type: "event" as const,
            description: `Completed the Beyonder prologue. Narrative choices revealed ${selections.length} defining moments.`,
            turnNumber: 0,
          },
        ]
      : []),
    ...selections.map((sel): SessionFact => {
      const scene = PROLOGUE_SCENES.find((s) => s.id === sel.sceneId);
      const choice = scene?.choices.find((c) => c.id === sel.choiceId);
      return {
        type: "event",
        description: `Prologue — "${scene?.title ?? sel.sceneId}": ${choice?.text ?? sel.choiceId}`,
        turnNumber: 0,
      };
    }),
  ];

  return { ...memory, sessionFacts: [...memory.sessionFacts, ...facts] };
}
