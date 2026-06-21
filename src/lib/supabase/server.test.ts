import { afterEach, describe, expect, it, vi } from "vitest";

type CookieConfig = {
  cookies: {
    getAll: () => unknown;
    setAll: (cookies: { name: string; value: string; options?: unknown }[]) => void;
  };
};
let lastConfig: CookieConfig | undefined;
const createServerClient = vi.fn((_url: string, _key: string, config: CookieConfig) => {
  lastConfig = config;
  return { tag: "server-client" };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (u: string, k: string, c: CookieConfig) =>
    createServerClient(u, k, c),
}));

// next/headers cookies() — the store can be swapped per test.
const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb", value: "v" }]),
  set: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

import { createClient } from "./server";

afterEach(() => {
  vi.clearAllMocks();
  cookieStore.set.mockReset();
});

describe("server supabase client", () => {
  it("builds a server client wired to the request cookie store", async () => {
    const client = await createClient();
    expect(client).toEqual({ tag: "server-client" });
    expect(lastConfig!.cookies.getAll()).toEqual([{ name: "sb", value: "v" }]);
  });

  it("writes cookies through the store in setAll", async () => {
    await createClient();
    lastConfig!.cookies.setAll([{ name: "a", value: "1", options: { path: "/" } }]);
    expect(cookieStore.set).toHaveBeenCalledWith("a", "1", { path: "/" });
  });

  it("swallows the Server-Component setAll error (middleware refreshes instead)", async () => {
    cookieStore.set.mockImplementation(() => {
      throw new Error("called from a Server Component");
    });
    await createClient();
    expect(() => lastConfig!.cookies.setAll([{ name: "a", value: "1" }])).not.toThrow();
  });
});
