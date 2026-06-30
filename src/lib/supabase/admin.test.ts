import { describe, expect, it, vi } from "vitest";

import { isAdmin } from "./admin";

type AdminClient = Parameters<typeof isAdmin>[0];

// A minimal client whose maybeSingle() resolves to the given row/error.
function clientReturning(result: {
  data: { is_admin: boolean } | null;
  error: unknown;
}): { client: AdminClient; eq: ReturnType<typeof vi.fn> } {
  const maybeSingle = vi.fn(() => Promise.resolve(result));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as unknown as AdminClient, eq };
}

describe("isAdmin", () => {
  it("is true only when the profile row flags is_admin", async () => {
    const { client, eq } = clientReturning({ data: { is_admin: true }, error: null });
    await expect(isAdmin(client, "user-1")).resolves.toBe(true);
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("is false when is_admin is false", async () => {
    const { client } = clientReturning({ data: { is_admin: false }, error: null });
    await expect(isAdmin(client, "user-1")).resolves.toBe(false);
  });

  it("is false on a missing row", async () => {
    const { client } = clientReturning({ data: null, error: null });
    await expect(isAdmin(client, "user-1")).resolves.toBe(false);
  });

  it("is false on a query error", async () => {
    const { client } = clientReturning({ data: null, error: { message: "boom" } });
    await expect(isAdmin(client, "user-1")).resolves.toBe(false);
  });

  it("is false (never throws) when the client rejects", async () => {
    const maybeSingle = vi.fn(() => Promise.reject(new Error("network")));
    const client = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    } as unknown as AdminClient;
    await expect(isAdmin(client, "user-1")).resolves.toBe(false);
  });
});
