import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidDraftShape, isActivePrologueDraft, clearDraft } from "./prologue-draft";
import { PROLOGUE_DRAFT_KEY } from "./constants";

const validDraft = {
  step: "ai-prologue" as const,
  characterName: "Klein Moretti",
  characterBackground: "Unemployed man in Tingen City",
  prologueHistory: [],
  selectedPathwayId: null,
};

describe("isValidDraftShape", () => {
  it("accepts a valid ai-prologue draft", () => {
    expect(isValidDraftShape(validDraft)).toBe(true);
  });

  it("accepts a valid first-potion draft with selectedPathwayId", () => {
    expect(
      isValidDraftShape({ ...validDraft, step: "first-potion", selectedPathwayId: 1 }),
    ).toBe(true);
  });

  it("accepts non-empty prologueHistory", () => {
    const draft = {
      ...validDraft,
      prologueHistory: [
        {
          narrative: "You find a letter.",
          choices: [{ id: "a", text: "Read it" }],
          selectedChoiceText: "Read it",
          rawResponse: "{}",
        },
      ],
    };
    expect(isValidDraftShape(draft)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidDraftShape(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidDraftShape("ai-prologue")).toBe(false);
    expect(isValidDraftShape(42)).toBe(false);
  });

  it("rejects an invalid step value", () => {
    expect(isValidDraftShape({ ...validDraft, step: "mode-select" })).toBe(false);
    expect(isValidDraftShape({ ...validDraft, step: "" })).toBe(false);
  });

  it("rejects when characterName is not a string", () => {
    expect(isValidDraftShape({ ...validDraft, characterName: 99 })).toBe(false);
  });

  it("rejects when characterBackground is not a string", () => {
    expect(isValidDraftShape({ ...validDraft, characterBackground: null })).toBe(false);
  });

  it("rejects when prologueHistory is not an array", () => {
    expect(isValidDraftShape({ ...validDraft, prologueHistory: {} })).toBe(false);
  });

  it("rejects when selectedPathwayId is not null or number", () => {
    expect(isValidDraftShape({ ...validDraft, selectedPathwayId: "1" })).toBe(false);
  });
});

describe("isActivePrologueDraft", () => {
  it("returns true for ai-prologue step", () => {
    expect(isActivePrologueDraft({ step: "ai-prologue" })).toBe(true);
  });

  it("returns true for first-potion step", () => {
    expect(isActivePrologueDraft({ step: "first-potion" })).toBe(true);
  });

  it("returns false for mode-select step", () => {
    expect(isActivePrologueDraft({ step: "mode-select" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isActivePrologueDraft(null)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(isActivePrologueDraft("ai-prologue")).toBe(false);
  });

  it("returns false when step is missing", () => {
    expect(isActivePrologueDraft({})).toBe(false);
  });
});

describe("clearDraft", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      removeItem: vi.fn(),
    });
  });

  it("removes the draft key from localStorage", () => {
    clearDraft();
    expect(localStorage.removeItem).toHaveBeenCalledWith(PROLOGUE_DRAFT_KEY);
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      removeItem: vi.fn(() => {
        throw new Error("unavailable");
      }),
    });
    expect(() => clearDraft()).not.toThrow();
  });
});
