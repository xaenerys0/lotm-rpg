import { afterEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClient(...args),
}));

import { createBrowserClientSafe, createClient } from "./client";

afterEach(() => vi.clearAllMocks());

describe("browser supabase client", () => {
  it("constructs a persistent-session browser client", () => {
    createBrowserClient.mockReturnValue({ tag: "browser" });
    const client = createClient();
    expect(client).toEqual({ tag: "browser" });
    const authConfig = createBrowserClient.mock.calls[0][2] as {
      auth: { persistSession: boolean; autoRefreshToken: boolean };
    };
    expect(authConfig.auth.persistSession).toBe(true);
    expect(authConfig.auth.autoRefreshToken).toBe(true);
  });

  it("createBrowserClientSafe returns the client when construction succeeds", () => {
    createBrowserClient.mockReturnValue({ tag: "browser" });
    expect(createBrowserClientSafe<{ tag: string }>()).toEqual({ tag: "browser" });
  });

  it("createBrowserClientSafe returns null when construction throws", () => {
    createBrowserClient.mockImplementation(() => {
      throw new Error("missing env");
    });
    expect(createBrowserClientSafe()).toBeNull();
  });
});
