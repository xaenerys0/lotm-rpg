import { describe, expect, it } from "vitest";

import type { GameState } from "@/lib/ai/types";
import {
  addProfileNote,
  applyProfileChange,
  applyProfileEdits,
  createProfileState,
  editProfileNote,
  isDrasticChange,
  isValidProfileStateShape,
  openRecognitionGap,
  pierceRecognition,
  profilePromptContext,
  proposalToChange,
  recognitionPromptContext,
  recordRecognition,
  removeProfileNote,
  renameTrueSelf,
  resolveProfileState,
  validateSelfChangeProposal,
  type ProfileState,
  type TrueSelfProfile,
} from "./profile";

function gs(overrides: Partial<GameState> = {}): GameState {
  return {
    characterId: "char-1",
    characterName: "Sean",
    pathwayId: 15,
    sequenceLevel: 8,
    sanity: 80,
    maxSanity: 100,
    inventory: [],
    location: "Backlund",
    npcsPresent: [],
    activeQuests: [],
    ...overrides,
  };
}

function profile(overrides: Partial<TrueSelfProfile> = {}): TrueSelfProfile {
  return { demeanor: [], notes: [], formerNames: [], ...overrides };
}

describe("createProfileState / resolveProfileState", () => {
  it("creates an empty profile with no recognition gap", () => {
    const state = createProfileState();
    expect(state.profile).toEqual({ demeanor: [], notes: [], formerNames: [] });
    expect(state.recognition).toBeNull();
  });

  it("resolves a missing profile to a fresh one, passes an existing one through", () => {
    const existing = createProfileState();
    expect(resolveProfileState(undefined)).toEqual(createProfileState());
    expect(resolveProfileState(null)).toEqual(createProfileState());
    expect(resolveProfileState(existing)).toBe(existing);
  });
});

describe("applyProfileEdits", () => {
  it("merges scalar fields, trims, and clears on blank", () => {
    let state = createProfileState();
    state = applyProfileEdits(state, {
      gender: "  woman ",
      pronouns: "she/her",
      appearance: "striking",
      epithet: "the Witch",
      age: "27",
      marks: "a crescent scar",
    });
    expect(state.profile).toMatchObject({
      gender: "woman",
      pronouns: "she/her",
      appearance: "striking",
      epithet: "the Witch",
      age: "27",
      marks: "a crescent scar",
    });
    const cleared = applyProfileEdits(state, { epithet: "  " });
    expect(cleared.profile.epithet).toBeUndefined();
  });

  it("replaces the demeanor list wholesale", () => {
    const state = applyProfileEdits(createProfileState(), {
      demeanor: [{ id: "a", label: "  heightened allure " }],
    });
    expect(state.profile.demeanor).toEqual([{ id: "a", label: "heightened allure" }]);
  });

  it("leaves fields untouched when not in the edit", () => {
    const start = applyProfileEdits(createProfileState(), { gender: "man" });
    const next = applyProfileEdits(start, { age: "30" });
    expect(next.profile.gender).toBe("man");
  });
});

describe("renameTrueSelf", () => {
  it("swaps the name and records the former name", () => {
    const { profileState, gameState } = renameTrueSelf(
      createProfileState(),
      gs(),
      "Selena",
    );
    expect(gameState.characterName).toBe("Selena");
    expect(profileState.profile.formerNames).toEqual(["Sean"]);
  });

  it("does not record a former name on a case-only rename or when unnamed", () => {
    const same = renameTrueSelf(createProfileState(), gs(), "  sean ");
    expect(same.profileState.profile.formerNames).toEqual([]);
    const unnamed = renameTrueSelf(
      createProfileState(),
      gs({ characterName: undefined }),
      "Mara",
    );
    expect(unnamed.profileState.profile.formerNames).toEqual([]);
  });

  it("rejects a blank name", () => {
    expect(() => renameTrueSelf(createProfileState(), gs(), "   ")).toThrow(
      /cannot be empty/,
    );
  });
});

describe("applyProfileChange / proposalToChange", () => {
  it("renames, edits, and opens a recognition gap in one call", () => {
    const { profileState, gameState } = applyProfileChange(
      createProfileState(),
      gs({ npcsPresent: ["Audrey"] }),
      { name: "Selena", edits: { gender: "woman" } },
      { createGap: true, npcsPresent: ["Audrey", "Dunn"] },
    );
    expect(gameState.characterName).toBe("Selena");
    expect(profileState.profile.gender).toBe("woman");
    expect(profileState.recognition?.pendingNpcs).toEqual(["Audrey", "Dunn"]);
    expect(profileState.recognition?.priorName).toBe("Sean");
  });

  it("applies edits only, no gap, when not requested", () => {
    const { profileState } = applyProfileChange(createProfileState(), gs(), {
      edits: { age: "40" },
    });
    expect(profileState.profile.age).toBe("40");
    expect(profileState.recognition).toBeNull();
  });

  it("maps a proposal to a change (name → rename, else → edit)", () => {
    expect(proposalToChange({ field: "name", value: "Mara" })).toEqual({ name: "Mara" });
    expect(proposalToChange({ field: "appearance", value: "tall" })).toEqual({
      edits: { appearance: "tall" },
    });
  });
});

describe("isDrasticChange", () => {
  it("is true when the character has flawless capability", () => {
    expect(isDrasticChange(profile(), profile(), { flawlessCapable: true })).toBe(true);
  });

  it("is true when gender changes", () => {
    expect(
      isDrasticChange(profile({ gender: "man" }), profile({ gender: "woman" }), {
        flawlessCapable: false,
      }),
    ).toBe(true);
  });

  it("is true when demeanor changes", () => {
    expect(
      isDrasticChange(profile(), profile({ demeanor: [{ id: "a", label: "allure" }] }), {
        flawlessCapable: false,
      }),
    ).toBe(true);
  });

  it("is false for a plain rename (no gender/demeanor change, not flawless)", () => {
    expect(
      isDrasticChange(profile({ gender: "woman" }), profile({ gender: "woman" }), {
        flawlessCapable: false,
      }),
    ).toBe(false);
  });
});

describe("recognition gap", () => {
  it("opens a gap from the present NPCs and snapshots the prior name", () => {
    const state = openRecognitionGap(
      createProfileState(),
      ["A", "B", "A", " "],
      "Sean",
      5,
    );
    expect(state.recognition).toEqual({
      pendingNpcs: ["A", "B"],
      priorName: "Sean",
      openedAt: 5,
    });
  });

  it("opens no gap when nobody is around", () => {
    expect(openRecognitionGap(createProfileState(), [], "Sean").recognition).toBeNull();
  });

  it("records a deliberate reveal to specific NPCs and closes when empty", () => {
    let state = openRecognitionGap(createProfileState(), ["A", "B"], "Sean");
    state = recordRecognition(state, ["A"]);
    expect(state.recognition?.pendingNpcs).toEqual(["B"]);
    state = recordRecognition(state, ["B"]);
    expect(state.recognition).toBeNull();
  });

  it("reveals to everyone when no list is given, and is a no-op with no gap", () => {
    const open = openRecognitionGap(createProfileState(), ["A"], "Sean");
    expect(recordRecognition(open).recognition).toBeNull();
    expect(recordRecognition(createProfileState())).toEqual(createProfileState());
  });

  it("pierces present NPCs deterministically under the injected random source", () => {
    let state = openRecognitionGap(createProfileState(), ["A", "B"], "Sean");
    // Absent NPCs are never pierced; present ones are when the roll is low.
    const miss = pierceRecognition(state, ["A"], () => 0.99);
    expect(miss.pierced).toEqual([]);
    expect(miss.state.recognition?.pendingNpcs).toEqual(["A", "B"]);
    const hit = pierceRecognition(state, ["A"], () => 0);
    expect(hit.pierced).toEqual(["A"]);
    expect(hit.state.recognition?.pendingNpcs).toEqual(["B"]);
    // Piercing everyone closes the gap.
    state = openRecognitionGap(createProfileState(), ["A"], "Sean");
    expect(pierceRecognition(state, ["A"], () => 0).state.recognition).toBeNull();
    // No gap → no-op.
    expect(pierceRecognition(createProfileState(), ["A"]).pierced).toEqual([]);
  });
});

describe("notes log", () => {
  it("adds, edits, and removes notes; rejects blanks", () => {
    let state = addProfileNote(createProfileState(), "  took an oath ", 5, "n-1");
    expect(state.profile.notes).toEqual([{ id: "n-1", text: "took an oath", at: 5 }]);
    state = editProfileNote(state, "n-1", "broke the oath");
    expect(state.profile.notes[0].text).toBe("broke the oath");
    state = removeProfileNote(state, "n-1");
    expect(state.profile.notes).toEqual([]);
    expect(() => addProfileNote(createProfileState(), "  ")).toThrow(/cannot be empty/);
    expect(() =>
      editProfileNote(addProfileNote(createProfileState(), "x", 1, "i"), "i", " "),
    ).toThrow(/cannot be empty/);
  });
});

describe("prompt context", () => {
  it("renders self facts as ground truth, null when empty", () => {
    expect(profilePromptContext(createProfileState(), gs())).toBeNull();
    const state = applyProfileEdits(createProfileState(), {
      gender: "woman",
      pronouns: "she/her",
      appearance: "striking",
      epithet: "the Witch",
      age: "27",
      marks: "a scar",
      demeanor: [{ id: "a", label: "allure" }],
    });
    const ctx = profilePromptContext(state, gs({ characterName: "Selena" }))!;
    expect(ctx).toContain("Selena");
    expect(ctx).toContain("she/her");
    expect(ctx).toContain("the Witch");
    expect(ctx).toContain("allure");
    expect(ctx).toContain("who they truly are");
  });

  it("falls back to a generic name when unnamed", () => {
    const state = applyProfileEdits(createProfileState(), { gender: "woman" });
    expect(profilePromptContext(state, gs({ characterName: undefined }))!).toContain(
      "the character",
    );
  });

  it("renders the recognition gap, null when none", () => {
    expect(recognitionPromptContext(createProfileState())).toBeNull();
    const state = openRecognitionGap(createProfileState(), ["Audrey", "Dunn"], "Sean");
    const ctx = recognitionPromptContext(state)!;
    expect(ctx).toContain("Audrey, Dunn");
    expect(ctx).toContain('"Sean"');
    // Without a prior name the framing still renders.
    const noName = openRecognitionGap(createProfileState(), ["Audrey"], "");
    expect(recognitionPromptContext(noName)!).toContain("Audrey");
  });
});

describe("validateSelfChangeProposal", () => {
  it("accepts a well-formed proposal and trims", () => {
    expect(
      validateSelfChangeProposal({ field: "name", value: "  Selena ", reason: "  why " }),
    ).toEqual({
      field: "name",
      value: "Selena",
      reason: "why",
    });
    expect(validateSelfChangeProposal({ field: "gender", value: "woman" })).toEqual({
      field: "gender",
      value: "woman",
    });
  });

  it("drops malformed proposals without throwing", () => {
    expect(validateSelfChangeProposal(null)).toBeNull();
    expect(validateSelfChangeProposal("nope")).toBeNull();
    expect(validateSelfChangeProposal({ field: "pathway", value: "x" })).toBeNull();
    expect(validateSelfChangeProposal({ field: "name", value: "   " })).toBeNull();
    expect(validateSelfChangeProposal({ field: "name", value: 5 })).toBeNull();
    expect(
      validateSelfChangeProposal({ field: "name", value: "Mara", reason: "  " }),
    ).toEqual({
      field: "name",
      value: "Mara",
    });
  });
});

describe("isValidProfileStateShape", () => {
  const valid: ProfileState = {
    profile: {
      gender: "woman",
      demeanor: [{ id: "a", label: "allure" }],
      notes: [{ id: "n", text: "t", at: 1 }],
      formerNames: ["Sean"],
    },
    recognition: { pendingNpcs: ["A"], priorName: "Sean", openedAt: 1 },
  };

  it("accepts persisted state", () => {
    expect(isValidProfileStateShape(valid)).toBe(true);
    expect(isValidProfileStateShape({ profile: profile(), recognition: null })).toBe(
      true,
    );
  });

  it("rejects malformed payloads", () => {
    expect(isValidProfileStateShape(null)).toBe(false);
    expect(isValidProfileStateShape([])).toBe(false);
    expect(isValidProfileStateShape({ profile: null, recognition: null })).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), gender: 5 },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), demeanor: [{ id: "a" }] },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), demeanor: "nope" },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), demeanor: [null] },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), notes: "nope" },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), notes: [null] },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), notes: [{ id: "n", text: "t" }] },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: { ...profile(), formerNames: [5] },
        recognition: null,
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: profile(),
        recognition: { pendingNpcs: ["A"], priorName: 5, openedAt: 1 },
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: profile(),
        recognition: { pendingNpcs: [5], priorName: "x", openedAt: 1 },
      }),
    ).toBe(false);
    expect(
      isValidProfileStateShape({
        profile: profile(),
        recognition: { pendingNpcs: ["A"], priorName: "x", openedAt: "no" },
      }),
    ).toBe(false);
    expect(isValidProfileStateShape({ profile: profile(), recognition: [] })).toBe(false);
  });
});
