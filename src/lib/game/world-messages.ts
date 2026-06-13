// ---------------------------------------------------------------------------
// Shared world messages (issue #17)
// ---------------------------------------------------------------------------
//
// Dark Souls-style asynchronous notes other players left at a location, in
// other timelines. Safety comes from construction: a message is a TEMPLATE
// plus slot fills chosen from fixed lists — arbitrary text cannot exist.
// Pure functions here; Supabase glue in world-messages-sync.ts.

export type MessageCategory = "warning" | "tip" | "lore" | "humor";

export interface MessageTemplate {
  id: string;
  category: MessageCategory;
  /** Display text with `{slot}` placeholders. */
  text: string;
  /** Allowed fills per slot — the whole vocabulary a player can use. */
  slots: Record<string, readonly string[]>;
}

export const MESSAGE_TEMPLATES: readonly MessageTemplate[] = [
  {
    id: "danger-ahead",
    category: "warning",
    text: "Danger ahead — {threat}",
    slots: {
      threat: [
        "a Beyonder creature",
        "cultists",
        "a trap",
        "something that wears a face",
        "the Nighthawks",
        "mad whispering",
      ],
    },
  },
  {
    id: "ingredient-nearby",
    category: "tip",
    text: "Potion ingredient {where}",
    slots: {
      where: ["nearby", "hidden", "guarded", "already taken", "beneath your feet"],
    },
  },
  {
    id: "npc-read",
    category: "tip",
    text: "This one {verdict}",
    slots: {
      verdict: [
        "lies",
        "is trustworthy",
        "has a secret",
        "knows more than they say",
        "is not what they appear",
      ],
    },
  },
  {
    id: "acting-opportunity",
    category: "tip",
    text: "{role} acting opportunity ahead",
    slots: {
      role: ["Seer", "Clown", "Spectator", "Bard", "Corpse Collector", "Any diviner's"],
    },
  },
  {
    id: "if-only",
    category: "humor",
    text: "If only I had {lack}…",
    slots: {
      lack: [
        "caution",
        "courage",
        "a ritual",
        "more sanity",
        "listened to the cards",
        "stayed home",
      ],
    },
  },
  {
    id: "lore-whisper",
    category: "lore",
    text: "Remember: {truth}",
    slots: {
      truth: [
        "the fog keeps its own ledger",
        "above the gray fog, someone listens",
        "every potion was a person once",
        "the bells count more than hours",
        "do not answer the second knock",
      ],
    },
  },
  {
    id: "praise",
    category: "humor",
    text: "{exclaim}",
    slots: {
      exclaim: [
        "Visions required ahead",
        "Try acting",
        "I survived this place. Barely.",
        "Gorgeous view of the abyss",
        "Praise the Evernight",
      ],
    },
  },
] as const;

export function getMessageTemplate(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((template) => template.id === id);
}

/**
 * Compose a message from a template and slot fills. Throws when the template
 * is unknown or any fill is not in the allowed list — by construction no
 * arbitrary text can ever reach another player.
 */
export function composeMessage(
  templateId: string,
  fills: Record<string, string>,
): string {
  const template = getMessageTemplate(templateId);
  if (!template) throw new Error(`Unknown message template "${templateId}".`);
  return template.text.replace(/\{(\w+)\}/g, (_, slot: string) => {
    const allowed = template.slots[slot];
    const fill = fills[slot];
    if (!allowed || fill === undefined || !allowed.includes(fill)) {
      throw new Error(`Fill for slot "${slot}" is not in the allowed vocabulary.`);
    }
    return fill;
  });
}

/** One discovered message, as stored/fetched. */
export interface WorldMessage {
  id: string;
  location: string;
  templateId: string;
  text: string;
  helpful: number;
  unhelpful: number;
}

/** At most this many messages surface per scene — atmosphere, not spam. */
export const MAX_MESSAGES_PER_SCENE = 2;

/**
 * Pick which discovered messages actually surface: helpfulness-weighted
 * sampling (helpful votes float, buried spam sinks), capped per scene, and
 * deterministic given the injected random source.
 */
export function selectMessagesForScene(
  messages: readonly WorldMessage[],
  random: () => number = Math.random,
  max: number = MAX_MESSAGES_PER_SCENE,
): WorldMessage[] {
  const pool = messages
    .map((message) => ({
      message,
      weight: Math.max(0.2, 1 + message.helpful - message.unhelpful),
    }))
    .filter(({ message }) => message.helpful - message.unhelpful > -3);

  const picked: WorldMessage[] = [];
  while (picked.length < max && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = random() * total;
    let index = 0;
    for (; index < pool.length - 1; index++) {
      roll -= pool[index].weight;
      if (roll <= 0) break;
    }
    picked.push(pool[index].message);
    pool.splice(index, 1);
  }
  return picked;
}
