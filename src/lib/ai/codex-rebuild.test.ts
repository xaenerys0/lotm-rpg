import { describe, it, expect } from "vitest";
import {
  buildCodexRebuildPrompt,
  parseCodexRebuild,
  MAX_REBUILD_ENTITIES,
  type CodexRebuildInput,
} from "./codex-rebuild";

const baseInput = (over: Partial<CodexRebuildInput> = {}): CodexRebuildInput => ({
  characterName: "Andrew Abraham",
  runningSummary: "Who: Andrew, Sequence 4.\nTies: Captain Edwina Edwards.",
  journal: [
    {
      turnNumber: 12,
      eventType: "combat",
      summary: "Fought the Stagnation Entity",
      npcs: ["Stagnation Entity"],
    },
    { turnNumber: 40, eventType: "discovery", summary: "Found the Gilded Eye" },
  ],
  facts: ["Met Danitz Dubois at the docks"],
  currentTurn: 235,
  ...over,
});

describe("buildCodexRebuildPrompt", () => {
  it("builds a system + user message embedding the digest", () => {
    const messages = buildCodexRebuildPrompt(baseInput());
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("CODEX");
    const user = messages[1].content;
    expect(user).toContain("Andrew Abraham");
    expect(user).toContain("Captain Edwina Edwards");
    expect(user).toContain("Turn 12 (combat)");
    expect(user).toContain("present: Stagnation Entity");
    expect(user).toContain("Found the Gilded Eye");
    expect(user).toContain("Danitz Dubois");
  });

  it("omits empty sections gracefully", () => {
    const messages = buildCodexRebuildPrompt({
      journal: [],
      facts: [],
      currentTurn: 0,
    });
    expect(messages[1].content).not.toContain("# Journal");
    expect(messages[1].content).not.toContain("# Recorded facts");
    expect(messages[1].content).not.toContain("# Story So Far");
  });
});

describe("parseCodexRebuild", () => {
  it("parses an {entities:[...]} object", () => {
    const raw = JSON.stringify({
      entities: [
        {
          kind: "person",
          name: "Captain Edwina Edwards",
          status: "tense ally",
          importance: "pivotal",
          aliases: ["The Captain", ""],
        },
        { kind: "thread", name: "Debt settled", resolved: true },
      ],
    });
    const out = parseCodexRebuild(raw);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({
      kind: "person",
      name: "Captain Edwina Edwards",
      status: "tense ally",
      importance: "pivotal",
      aliases: ["The Captain"],
    });
    expect(out[1]).toEqual({ kind: "thread", name: "Debt settled", resolved: true });
  });

  it("parses a bare array and a fenced block", () => {
    expect(parseCodexRebuild('[{"kind":"object","name":"Gilded Eye"}]')).toHaveLength(1);
    expect(
      parseCodexRebuild(
        '```json\n{"entities":[{"kind":"group","name":"The Sect"}]}\n```',
      ),
    ).toEqual([{ kind: "group", name: "The Sect" }]);
  });

  it("extracts JSON embedded in prose", () => {
    const raw =
      'Here is the codex: {"entities":[{"kind":"location","name":"Backlund"}]} done.';
    expect(parseCodexRebuild(raw)).toEqual([{ kind: "location", name: "Backlund" }]);
  });

  it("drops malformed entries and ignores bad importance", () => {
    const raw = JSON.stringify({
      entities: [
        { kind: "alien", name: "X" },
        { kind: "person" },
        { name: "Nameless" },
        { kind: "person", name: "Klein", importance: "vital" },
      ],
    });
    const out = parseCodexRebuild(raw);
    expect(out).toEqual([{ kind: "person", name: "Klein" }]);
  });

  it("returns [] on unparseable output", () => {
    expect(parseCodexRebuild("not json at all")).toEqual([]);
    expect(parseCodexRebuild("{ broken")).toEqual([]);
    expect(parseCodexRebuild(JSON.stringify({ nope: true }))).toEqual([]);
    expect(parseCodexRebuild(JSON.stringify("a string"))).toEqual([]);
  });

  it("caps the number of entities", () => {
    const entities = Array.from({ length: MAX_REBUILD_ENTITIES + 20 }, (_, i) => ({
      kind: "person",
      name: `P${i}`,
    }));
    expect(parseCodexRebuild(JSON.stringify({ entities }))).toHaveLength(
      MAX_REBUILD_ENTITIES,
    );
  });
});
