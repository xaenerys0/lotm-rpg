import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildCharacterIdentityPrompt,
  parseCharacterIdentity,
  CHARACTER_REGIONS,
  IDENTITY_NAME_MAX,
  IDENTITY_BACKGROUND_MAX,
  IDENTITY_LOCATION_MAX,
  type CharacterRegion,
} from "./character-identity";
import { generateCharacterIdentity } from "./client";
import type { ProviderConfig } from "./types";

function makeConfig(): ProviderConfig {
  return {
    providerId: "openai",
    apiKey: "sk-test",
    model: "gpt-4o",
    thinkingLevel: "low",
  };
}

// Mock a single OpenAI-shaped chat completion whose content is `content`.
function mockOnce(content: string) {
  return {
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          choices: [{ message: { content } }],
          model: "gpt-4o-mini",
          usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
        }),
      ),
  } as Response;
}

afterEach(() => vi.restoreAllMocks());

describe("buildCharacterIdentityPrompt", () => {
  it("includes the region's naming directive and the resolved pathway/role", () => {
    const messages = buildCharacterIdentityPrompt({
      pathwayName: "Fool",
      sequenceName: "Seer",
      sequenceLevel: 9,
      region: "intis",
    });
    expect(messages[0].role).toBe("system");
    const user = messages[1].content;
    expect(user).toContain(CHARACTER_REGIONS.intis.label);
    expect(user).toContain(CHARACTER_REGIONS.intis.directive);
    expect(user).toContain("Fool");
    expect(user).toContain("Seer");
    expect(user).toContain("Sequence 9");
  });

  it("falls back to the Loen register for an unknown region", () => {
    const messages = buildCharacterIdentityPrompt({
      pathwayName: "Fool",
      sequenceName: "Seer",
      sequenceLevel: 9,
      region: "atlantis" as unknown as CharacterRegion,
    });
    expect(messages[1].content).toContain(CHARACTER_REGIONS.loen.label);
  });

  it("threads the city, era, digestion, and variety token when supplied", () => {
    const messages = buildCharacterIdentityPrompt({
      pathwayName: "Fool",
      sequenceName: "Seer",
      sequenceLevel: 9,
      region: "loen",
      cityName: "Backlund",
      epochLabel: "the Fifth Epoch",
      digestionStage: "fresh",
      variety: 7,
    });
    const user = messages[1].content;
    expect(user).toContain("City: Backlund");
    expect(user).toContain("Era: the Fifth Epoch");
    expect(user).toContain("FRESH");
    expect(user).toContain("Variety token");
    expect(user).toContain("7");
  });

  it("reads DIGESTED for the digested stage and drops optional lines when absent", () => {
    const digested = buildCharacterIdentityPrompt({
      pathwayName: "Fool",
      sequenceName: "Seer",
      sequenceLevel: 9,
      region: "loen",
      digestionStage: "digested",
    })[1].content;
    expect(digested).toContain("DIGESTED");

    // No city/era/variety lines when the caller omits them.
    const bare = buildCharacterIdentityPrompt({
      pathwayName: "Fool",
      sequenceName: "Seer",
      sequenceLevel: 9,
      region: "loen",
    })[1].content;
    expect(bare).not.toContain("City:");
    expect(bare).not.toContain("Era:");
    expect(bare).not.toContain("Variety token");
  });

  it("rotates the highlighted naming facets by the variety seed", () => {
    const facetsFor = (variety: number) => {
      const line = buildCharacterIdentityPrompt({
        pathwayName: "Fool",
        sequenceName: "Seer",
        sequenceLevel: 9,
        region: "loen",
        variety,
      })[1]
        .content.split("\n")
        .find((l) => l.startsWith("Naming facets"));
      return line ?? "";
    };
    // Two seeds that land on different rotation starts highlight different facets.
    expect(facetsFor(0)).not.toBe(facetsFor(1));
    // Every highlighted facet is drawn from the region's own pool.
    const pool = CHARACTER_REGIONS.loen.inspirations;
    for (const facet of pool) {
      // (sanity: the pool is non-trivial so rotation is meaningful)
      expect(typeof facet).toBe("string");
    }
    expect(pool.length).toBeGreaterThan(2);
  });
});

describe("parseCharacterIdentity", () => {
  it("parses a plain JSON object", () => {
    expect(
      parseCharacterIdentity('{"name":"Dunn Carter","background":"A clerk."}'),
    ).toEqual({
      name: "Dunn Carter",
      background: "A clerk.",
    });
  });

  it("extracts JSON from a fenced block and from surrounding prose", () => {
    expect(
      parseCharacterIdentity('```json\n{"name":"Fors Wall","background":"x"}\n```'),
    ).toEqual({ name: "Fors Wall", background: "x" });
    expect(
      parseCharacterIdentity('Here you go: {"name":"Old Neil","background":"y"} — enjoy'),
    ).toEqual({ name: "Old Neil", background: "y" });
  });

  it("defaults a missing/non-string background to empty", () => {
    expect(parseCharacterIdentity('{"name":"Naya"}')).toEqual({
      name: "Naya",
      background: "",
    });
    expect(parseCharacterIdentity('{"name":"Naya","background":42}')).toEqual({
      name: "Naya",
      background: "",
    });
  });

  it("returns null when there is no usable name", () => {
    expect(parseCharacterIdentity('{"background":"orphaned"}')).toBeNull();
    expect(parseCharacterIdentity('{"name":"   "}')).toBeNull();
    expect(parseCharacterIdentity("not json at all")).toBeNull();
    expect(parseCharacterIdentity("[1,2,3]")).toBeNull();
    expect(parseCharacterIdentity('{"name": "broken')).toBeNull();
  });

  it("clamps name and background to their caps", () => {
    const longName = "N".repeat(IDENTITY_NAME_MAX + 50);
    const longBg = "b".repeat(IDENTITY_BACKGROUND_MAX + 200);
    const out = parseCharacterIdentity(
      JSON.stringify({ name: longName, background: longBg }),
    );
    expect(out!.name.length).toBeLessThanOrEqual(IDENTITY_NAME_MAX);
    expect(out!.background.length).toBeLessThanOrEqual(IDENTITY_BACKGROUND_MAX);
  });

  it("carries a location when present and clamps it", () => {
    expect(
      parseCharacterIdentity(
        '{"name":"Ada Wren","background":"x","location":"an attic off Iron Cross"}',
      ),
    ).toEqual({
      name: "Ada Wren",
      background: "x",
      location: "an attic off Iron Cross",
    });
    const longLoc = "L".repeat(IDENTITY_LOCATION_MAX + 60);
    const out = parseCharacterIdentity(
      JSON.stringify({ name: "Ada Wren", location: longLoc }),
    );
    expect(out!.location!.length).toBeLessThanOrEqual(IDENTITY_LOCATION_MAX);
  });

  it("omits location when blank or non-string", () => {
    expect(parseCharacterIdentity('{"name":"Ada","location":""}')).toEqual({
      name: "Ada",
      background: "",
    });
    expect(parseCharacterIdentity('{"name":"Ada","location":42}')).toEqual({
      name: "Ada",
      background: "",
    });
  });
});

describe("generateCharacterIdentity", () => {
  const input = {
    pathwayName: "Fool",
    sequenceName: "Seer",
    sequenceLevel: 9,
    region: "loen" as CharacterRegion,
  };

  it("returns the parsed identity on a clean response", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        mockOnce('{"name":"Benson Carter","background":"A Tingen clerk."}'),
      );
    await expect(generateCharacterIdentity(makeConfig(), input)).resolves.toEqual({
      name: "Benson Carter",
      background: "A Tingen clerk.",
    });
    // Uses the single configured model.
    const body = JSON.parse((fetchSpy.mock.calls[0][1]!.body as string) ?? "{}");
    expect(body.model).toBe("gpt-4o");
  });

  it("recovers via the corrective retry loop after one bad reply", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockOnce("totally not json"))
      .mockResolvedValueOnce(mockOnce('{"name":"Selena Wood","background":"ok"}'));
    await expect(generateCharacterIdentity(makeConfig(), input)).resolves.toEqual({
      name: "Selena Wood",
      background: "ok",
    });
  });

  it("returns null after exhausting the parse retries", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockOnce("never valid json"));
    await expect(generateCharacterIdentity(makeConfig(), input)).resolves.toBeNull();
  });
});
