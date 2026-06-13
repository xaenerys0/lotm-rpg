import { describe, expect, it, vi } from "vitest";

import { AIError } from "./errors";
import {
  buildSceneArtPrompt,
  generateSceneArt,
  sceneArtKey,
  sceneArtSupported,
  shouldGenerateSceneArt,
  SCENE_ART_STYLE,
} from "./scene-art";
import type { ProviderConfig } from "./types";

const config = (overrides: Partial<ProviderConfig> = {}): ProviderConfig =>
  ({
    providerId: "openai",
    apiKey: "sk-test",
    routineModel: "gpt-4o-mini",
    premiumModel: "gpt-4o",
    ...overrides,
  }) as ProviderConfig;

describe("shouldGenerateSceneArt", () => {
  it("triggers only for key journal events", () => {
    for (const trigger of ["advancement", "death", "combat", "major-event"]) {
      expect(shouldGenerateSceneArt(trigger)).toBe(true);
    }
    expect(shouldGenerateSceneArt("discovery")).toBe(false);
    expect(shouldGenerateSceneArt("npc-encounter")).toBe(false);
  });
});

describe("buildSceneArtPrompt", () => {
  it("leads with the fixed style and appends the moment", () => {
    const prompt = buildSceneArtPrompt({
      summary: "Advanced to Sequence 8 Clown.",
      location: "Tingen City",
      pathwayName: "Clown of the Fool pathway",
    });
    expect(prompt.startsWith(SCENE_ART_STYLE)).toBe(true);
    expect(prompt).toContain("Advanced to Sequence 8 Clown.");
    expect(prompt).toContain("Setting: Tingen City.");
    expect(prompt).toContain("Clown of the Fool pathway");
  });

  it("caps the scene description length", () => {
    const prompt = buildSceneArtPrompt({
      summary: "x".repeat(1000),
      location: "Backlund",
    });
    expect(prompt.length).toBeLessThan(SCENE_ART_STYLE.length + 450);
  });
});

describe("sceneArtSupported", () => {
  it("requires an OpenAI key (the only browser-reachable image endpoint)", () => {
    expect(sceneArtSupported(config())).toBe(true);
    expect(sceneArtSupported(config({ providerId: "anthropic" }))).toBe(false);
    expect(sceneArtSupported(config({ apiKey: "" }))).toBe(false);
    expect(sceneArtSupported(null)).toBe(false);
  });
});

describe("generateSceneArt", () => {
  it("returns a data URL from the provider's b64 payload", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [{ b64_json: "QUJD" }] }), { status: 200 }),
      );
    await expect(
      generateSceneArt(config(), "a foggy street", fetchFn as typeof fetch),
    ).resolves.toBe("data:image/png;base64,QUJD");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      model: "dall-e-3",
      size: "1024x1024",
      response_format: "b64_json",
    });
  });

  it("maps provider failures onto the shared error codes", async () => {
    const status = (code: number) =>
      vi.fn().mockResolvedValue(new Response("{}", { status: code }));
    await expect(
      generateSceneArt(config(), "p", status(401) as unknown as typeof fetch),
    ).rejects.toMatchObject({ code: "AUTH_ERROR" });
    await expect(
      generateSceneArt(config(), "p", status(429) as unknown as typeof fetch),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", retryable: true });
    await expect(
      generateSceneArt(config(), "p", status(500) as unknown as typeof fetch),
    ).rejects.toMatchObject({ code: "PROVIDER_ERROR" });
  });

  it("rejects unsupported configs and empty payloads", async () => {
    await expect(
      generateSceneArt(config({ providerId: "ollama" }), "p"),
    ).rejects.toBeInstanceOf(AIError);
    const empty = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    await expect(
      generateSceneArt(config(), "p", empty as unknown as typeof fetch),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });
});

describe("sceneArtKey", () => {
  it("identifies a moment by session and turn", () => {
    expect(sceneArtKey("s1", 7)).toBe("s1:7");
  });
});
