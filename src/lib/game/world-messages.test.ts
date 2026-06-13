import { describe, expect, it, vi } from "vitest";

import {
  composeMessage,
  getMessageTemplate,
  selectMessagesForScene,
  MAX_MESSAGES_PER_SCENE,
  MESSAGE_TEMPLATES,
  type WorldMessage,
} from "./world-messages";
import {
  fetchLocationMessages,
  placeMessage,
  rateMessage,
  type WorldMessagesClient,
} from "./world-messages-sync";

const message = (overrides: Partial<WorldMessage>): WorldMessage => ({
  id: "m1",
  location: "Tingen City",
  templateId: "danger-ahead",
  text: "Danger ahead — a trap",
  helpful: 0,
  unhelpful: 0,
  ...overrides,
});

describe("MESSAGE_TEMPLATES", () => {
  it("covers all four categories with valid slot vocabularies", () => {
    const categories = new Set(MESSAGE_TEMPLATES.map((t) => t.category));
    for (const category of ["warning", "tip", "lore", "humor"]) {
      expect(categories.has(category as never)).toBe(true);
    }
    for (const template of MESSAGE_TEMPLATES) {
      const slots = [...template.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const slot of slots) {
        expect(template.slots[slot]?.length).toBeGreaterThan(0);
      }
    }
  });

  it("has unique ids", () => {
    const ids = MESSAGE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("composeMessage", () => {
  it("fills slots from the allowed vocabulary only", () => {
    expect(composeMessage("danger-ahead", { threat: "a trap" })).toBe(
      "Danger ahead — a trap",
    );
    expect(getMessageTemplate("danger-ahead")?.category).toBe("warning");
  });

  it("rejects arbitrary text by construction", () => {
    expect(() =>
      composeMessage("danger-ahead", { threat: "BUY GOLD AT example.test" }),
    ).toThrow(/allowed vocabulary/);
    expect(() => composeMessage("danger-ahead", {})).toThrow(/allowed vocabulary/);
    expect(() => composeMessage("nope", {})).toThrow(/Unknown message template/);
  });
});

describe("selectMessagesForScene", () => {
  it("caps the surfaced messages per scene", () => {
    const many = Array.from({ length: 10 }, (_, i) => message({ id: `m${i}` }));
    expect(selectMessagesForScene(many, () => 0)).toHaveLength(MAX_MESSAGES_PER_SCENE);
  });

  it("buries spam (heavily downvoted) and floats helpful notes", () => {
    const pool = [
      message({ id: "spam", helpful: 0, unhelpful: 5 }),
      message({ id: "gem", helpful: 9, unhelpful: 0 }),
      message({ id: "ok" }),
    ];
    const picked = selectMessagesForScene(pool, () => 0);
    expect(picked.map((m) => m.id)).not.toContain("spam");
    expect(picked[0].id).toBe("gem");
  });

  it("is deterministic for a fixed random source and handles empties", () => {
    const pool = [message({ id: "a" }), message({ id: "b" })];
    expect(selectMessagesForScene(pool, () => 0.9).map((m) => m.id)).toEqual(
      selectMessagesForScene(pool, () => 0.9).map((m) => m.id),
    );
    expect(selectMessagesForScene([], () => 0)).toEqual([]);
  });
});

describe("world-messages-sync", () => {
  function makeClient(error: { message: string } | null = null, rows: unknown[] = []) {
    const limit = vi.fn().mockResolvedValue({ data: rows, error });
    const eq = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ eq });
    const insert = vi.fn().mockResolvedValue({ error });
    const rpc = vi.fn().mockResolvedValue({ error });
    return {
      client: { from: vi.fn().mockReturnValue({ select, insert }), rpc },
      select,
      eq,
      limit,
      insert,
      rpc,
    };
  }

  it("fetches and maps a location's messages", async () => {
    const row = {
      id: "m1",
      location: "Tingen City",
      template_id: "danger-ahead",
      text: "Danger ahead — a trap",
      helpful: 2,
      unhelpful: 1,
    };
    const { client, eq } = makeClient(null, [row]);
    const result = await fetchLocationMessages(
      client as unknown as WorldMessagesClient,
      "Tingen City",
    );
    expect(eq).toHaveBeenCalledWith("location", "Tingen City");
    expect(result).toEqual([message({ helpful: 2, unhelpful: 1 })]);
  });

  it("places composed messages and rates via the RPC, surfacing failures", async () => {
    const { client, insert, rpc } = makeClient();
    await placeMessage(client as unknown as WorldMessagesClient, "u1", {
      location: "Tingen City",
      templateId: "danger-ahead",
      fills: { threat: "a trap" },
      text: "Danger ahead — a trap",
    });
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: "u1", template_id: "danger-ahead" }),
    ]);
    await rateMessage(client as unknown as WorldMessagesClient, "m1", true);
    expect(rpc).toHaveBeenCalledWith("rate_world_message", {
      p_message_id: "m1",
      p_helpful: true,
    });

    const failing = makeClient({ message: "down" });
    await expect(
      fetchLocationMessages(failing.client as unknown as WorldMessagesClient, "x"),
    ).rejects.toThrow(/Fetching messages failed/);
    await expect(
      rateMessage(failing.client as unknown as WorldMessagesClient, "m1", false),
    ).rejects.toThrow(/Rating failed/);
  });
});
