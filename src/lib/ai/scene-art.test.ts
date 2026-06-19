import { describe, expect, it } from "vitest";

import {
  buildSceneArtPrompt,
  sceneArtKey,
  shouldGenerateSceneArt,
  SCENE_ART_STYLE,
} from "./scene-art";

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

describe("sceneArtKey", () => {
  it("identifies a moment by session and turn", () => {
    expect(sceneArtKey("s1", 7)).toBe("s1:7");
  });
});
