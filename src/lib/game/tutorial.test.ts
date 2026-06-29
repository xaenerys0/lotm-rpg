import { describe, expect, it } from "vitest";

import { TUTORIAL_REQUIRED_TOPICS, TUTORIAL_SCENES } from "./tutorial";

describe("TUTORIAL_SCENES", () => {
  it("covers every required onboarding topic", () => {
    const taught = new Set(TUTORIAL_SCENES.flatMap((scene) => scene.teaches));
    for (const topic of TUTORIAL_REQUIRED_TOPICS) {
      expect(taught.has(topic)).toBe(true);
    }
  });

  it("teaches through narrative with a plain takeaway per scene", () => {
    expect(TUTORIAL_SCENES.length).toBeGreaterThanOrEqual(4);
    for (const scene of TUTORIAL_SCENES) {
      expect(scene.id).toMatch(/^[a-z0-9-]+$/);
      expect(scene.title.length).toBeGreaterThan(0);
      // Substantial fiction, not a tooltip…
      expect(scene.body.length).toBeGreaterThan(200);
      // …with one explicit lesson line.
      expect(scene.lesson.length).toBeGreaterThan(40);
      expect(scene.teaches.length).toBeGreaterThan(0);
    }
  });

  it("has unique scene ids", () => {
    const ids = TUTORIAL_SCENES.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("introduces the advancement climb", () => {
    const climb = TUTORIAL_SCENES.find((s) => s.id === "the-long-climb");
    expect(climb).toBeDefined();
    expect(climb!.teaches).toContain("advancement");
  });

  it("does not tutorialize the acting-method mechanic (issue #95)", () => {
    const acting = TUTORIAL_SCENES.find((s) => s.id === "the-method-of-acting");
    expect(acting).toBeDefined();
    // Still teaches "acting" so TUTORIAL_REQUIRED_TOPICS stays satisfied…
    expect(acting!.teaches).toContain("acting");
    // …but never names the secret digestion mechanic.
    const text = `${acting!.body} ${acting!.lesson}`.toLowerCase();
    expect(text).not.toContain("digest");
    expect(text).not.toContain("potion");
    expect(text).not.toContain("score");
  });
});
