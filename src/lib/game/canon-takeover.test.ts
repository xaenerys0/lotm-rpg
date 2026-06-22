import { describe, expect, it } from "vitest";
import {
  addTurn,
  buildGameStatePrompt,
  buildTurnRecord,
  createMemoryState,
  trimMemoryForBudget,
  type AIResponse,
} from "@/lib/ai";
import { getCanonCharacter, matchCanonCharacter } from "@/lib/lore";
import { createCanonCharacterSession, stripSelfFromNpcs } from "./canon-takeover";
import { createDigestionState } from "./digestion";

const klein = getCanonCharacter("klein-moretti")!;
const dunn = getCanonCharacter("dunn-smith")!;
const derrick = getCanonCharacter("derrick-berg")!;

describe("createCanonCharacterSession", () => {
  it("applies the canon preset (pathway, sequence, location, currentCity, id)", () => {
    const session = createCanonCharacterSession(klein, createMemoryState());
    const gs = session.gameState;
    expect(gs.pathwayId).toBe(klein.pathwayId);
    expect(gs.sequenceLevel).toBe(klein.startSequence);
    expect(gs.location).toBe(klein.startLocation);
    expect(gs.currentCity).toBe("tingen");
    expect(gs.canonCharacterId).toBe("klein-moretti");
    expect(gs.characterName).toBe("Klein Moretti");
  });

  it("seeds the timeline gate at the character's introduction chapter", () => {
    expect(createCanonCharacterSession(klein, createMemoryState()).canonPosition).toBe(1);
    expect(createCanonCharacterSession(dunn, createMemoryState()).canonPosition).toBe(12);
  });

  it("re-seeds digestion for a NON-9 canon start sequence", () => {
    const session = createCanonCharacterSession(dunn, createMemoryState());
    expect(session.gameState.sequenceLevel).toBe(7);
    expect(session.gameState.digestion).toEqual(createDigestionState(dunn.pathwayId, 7));
  });

  it("keeps identity/relationships in the DURABLE background, not only session facts", () => {
    const session = createCanonCharacterSession(klein, createMemoryState());
    // Family relationships live in the never-trimmed game-state background.
    expect(session.gameState.characterBackground).toContain("Benson");
    expect(session.gameState.characterBackground).toContain("Melissa");
    // The opening recap rides the distinct durable prologueRecap slot.
    expect(session.gameState.prologueRecap).toBe(klein.openingRecap);
  });

  it("seeds early-salience facts as ordinary (ageable) session facts", () => {
    const session = createCanonCharacterSession(klein, createMemoryState());
    const facts = session.memory.sessionFacts.map((f) => f.description);
    expect(facts.some((d) => d.includes("Sequence 9 Seer"))).toBe(true);
  });

  it("seeds origin access flags + the sealed-continent start for a Forsaken native", () => {
    const session = createCanonCharacterSession(derrick, createMemoryState());
    expect(session.gameState.location).toBe("Silver City");
    expect(session.gameState.currentCity).toBe("silver-city");
    expect(session.gameState.accessFlags).toEqual([
      "dream-world-passage",
      "silver-city-passage",
    ]);
    expect(session.gameState.sequenceLevel).toBe(9);
    expect(session.gameState.pathwayId).toBe(3); // Sun
  });

  it("leaves accessFlags unset for a mainland character", () => {
    expect(
      createCanonCharacterSession(klein, createMemoryState()).gameState.accessFlags,
    ).toBeUndefined();
  });

  it("honors an explicit start scenario location when one is passed", () => {
    const session = createCanonCharacterSession(klein, createMemoryState(), {
      id: "scn",
      epoch: 5,
      location: "Backlund",
      blurb: "",
      openingBeat: "An opening beat.",
    });
    expect(session.gameState.location).toBe("Backlund");
    expect(session.gameState.currentCity).toBe("backlund");
  });

  it("DURABILITY: canon relationships survive ~50 memory turns of eviction", () => {
    const session = createCanonCharacterSession(klein, createMemoryState());
    let memory = session.memory;
    const filler: AIResponse = { narrative: "Time passes in Tingen, uneventfully." };
    for (let turn = 1; turn <= 50; turn++) {
      memory = addTurn(memory, buildTurnRecord(turn, "wait", filler));
      memory = trimMemoryForBudget(memory, 400);
    }
    // The game-state layer is never trimmed, so the family is still grounded.
    const prompt = buildGameStatePrompt({ ...session.gameState }).content;
    expect(prompt).toContain("Benson");
    expect(prompt).toContain("Melissa");
  });
});

describe("buildGameStatePrompt self directive", () => {
  it("adds the 'you ARE this character' guard for a canon takeover", () => {
    const session = createCanonCharacterSession(klein, createMemoryState());
    const prompt = buildGameStatePrompt(session.gameState).content;
    expect(prompt).toContain("You Are This Character");
    expect(prompt).toContain("Klein Moretti");
  });

  it("omits the directive for an ordinary character", () => {
    const session = createCanonCharacterSession(klein, createMemoryState());
    const ordinary = { ...session.gameState };
    delete ordinary.canonCharacterId;
    expect(buildGameStatePrompt(ordinary).content).not.toContain(
      "You Are This Character",
    );
  });
});

describe("stripSelfFromNpcs", () => {
  it("removes the player's own display name and aliases (normalized)", () => {
    const out = stripSelfFromNpcs(
      ["Klein Moretti", "  mr. fool ", "Dunn Smith", "Old Neil"],
      "klein-moretti",
    );
    expect(out).toEqual(["Dunn Smith", "Old Neil"]);
  });

  it("preserves genuine other NPCs unchanged", () => {
    const npcs = ["Dunn Smith", "Leonard Mitchell"];
    expect(stripSelfFromNpcs(npcs, "klein-moretti")).toEqual(npcs);
  });

  it("is a no-op when canonCharacterId is absent", () => {
    const npcs = ["Klein Moretti", "Dunn Smith"];
    expect(stripSelfFromNpcs(npcs, undefined)).toEqual(npcs);
  });

  it("is a no-op for an unknown canonCharacterId", () => {
    const npcs = ["Klein Moretti"];
    expect(stripSelfFromNpcs(npcs, "not-a-character")).toEqual(npcs);
  });
});

describe("matchCanonCharacter → createCanonCharacterSession integration", () => {
  it("a Fool named Klein becomes the canon Klein", () => {
    const preset = matchCanonCharacter("Klein Moretti", 1);
    expect(preset).not.toBeNull();
    const session = createCanonCharacterSession(preset!, createMemoryState());
    expect(session.gameState.canonCharacterId).toBe("klein-moretti");
  });
});
