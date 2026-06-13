import { describe, expect, it } from "vitest";

import type { Choice } from "@/lib/ai";

import {
  composeDeduction,
  composeDialogueAction,
  composeRitualAction,
  detectInputMode,
  gatherClues,
  INPUT_MODE_LABELS,
  RITUAL_STEPS,
} from "./input-modes";
import { createDefaultGameState } from "./session";

const choice = (type: Choice["type"], id: string = type): Choice => ({
  id,
  text: `do ${type}`,
  type,
});

describe("detectInputMode", () => {
  it("defaults to exploration with no choices", () => {
    expect(detectInputMode([])).toBe("exploration");
  });

  it("follows the plurality of the AI's choice mix", () => {
    expect(
      detectInputMode([choice("ritual", "a"), choice("ritual", "b"), choice("action")]),
    ).toBe("ritual");
    expect(
      detectInputMode([
        choice("dialogue", "a"),
        choice("dialogue", "b"),
        choice("action"),
      ]),
    ).toBe("dialogue");
    expect(
      detectInputMode([
        choice("investigation", "a"),
        choice("investigation", "b"),
        choice("dialogue"),
      ]),
    ).toBe("investigation");
  });

  it("uses narrative cues only as a tiebreaker", () => {
    const mixed = [
      choice("action", "a"),
      choice("dialogue", "b"),
      choice("investigation", "c"),
      choice("ritual", "d"),
    ];
    expect(detectInputMode(mixed, "The altar waits for the proper ritual.")).toBe(
      "ritual",
    );
    expect(detectInputMode(mixed, "She asks what brought you here.")).toBe("dialogue");
    expect(detectInputMode(mixed, "Rain on the docks.")).toBe("exploration");
  });

  it("labels every mode", () => {
    for (const label of Object.values(INPUT_MODE_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("guided composition", () => {
  it("composes a ritual action from steps + materials + intent", () => {
    expect(RITUAL_STEPS.length).toBe(4);
    const action = composeRitualAction(
      ["Night Vanilla", "a silver coin"],
      "show me the thief's face ",
    );
    expect(action).toBe(
      "I prepare the ritual ground carefully using Night Vanilla, a silver coin, speak the proper honorific, and petition: show me the thief's face",
    );
    expect(composeRitualAction([], "guard my sleep")).toContain("with what I carry");
  });

  it("composes dialogue and deduction actions", () => {
    expect(composeDialogueAction("Dunn Smith", " the missing sailor ")).toBe(
      "I ask Dunn Smith about the missing sailor",
    );
    const deduction = composeDeduction("the torn glove", "the canal mud");
    expect(deduction).toContain('"the torn glove"');
    expect(deduction).toContain('"the canal mud"');
  });
});

describe("gatherClues", () => {
  it("collects witnesses, items, quests, and the place in stable order", () => {
    const state = {
      ...createDefaultGameState(1, "c1"),
      npcsPresent: ["Dunn Smith"],
      inventory: [
        {
          name: "Torn glove",
          description: "",
          category: "supplementary-ingredient" as const,
        },
      ],
      activeQuests: ["Find the missing sailor"],
    };
    expect(gatherClues(state)).toEqual([
      "Dunn Smith (witness)",
      "Torn glove",
      "Find the missing sailor",
      "Tingen City",
    ]);
  });
});
