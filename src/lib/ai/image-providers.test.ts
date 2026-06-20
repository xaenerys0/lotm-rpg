import { describe, expect, it, vi } from "vitest";

import { AIError } from "./errors";
import {
  defaultImageBaseUrl,
  generateImage,
  IMAGE_PROVIDER_MODELS,
  imageArtSupported,
  imageProviderNeedsBaseUrl,
  imageProviderNeedsModel,
  imageProviderRequiresKey,
  type ImageProviderConfig,
  type ImageProviderId,
} from "./image-providers";

const config = (overrides: Partial<ImageProviderConfig> = {}): ImageProviderConfig => ({
  providerId: "openai",
  apiKey: "sk-test",
  model: "gpt-image-1",
  ...overrides,
});

const ok = (payload: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

describe("image provider metadata", () => {
  it("classifies key/base-url/model requirements per provider", () => {
    expect(imageProviderRequiresKey("openai")).toBe(true);
    expect(imageProviderRequiresKey("ollama")).toBe(false);
    expect(imageProviderRequiresKey("local-sd")).toBe(false);

    expect(imageProviderNeedsBaseUrl("ollama")).toBe(true);
    expect(imageProviderNeedsBaseUrl("local-sd")).toBe(true);
    expect(imageProviderNeedsBaseUrl("openai")).toBe(false);

    // Only the Stable Diffusion WebUI runs without a chosen model id.
    expect(imageProviderNeedsModel("local-sd")).toBe(false);
    expect(imageProviderNeedsModel("openai")).toBe(true);
  });

  it("exposes sensible default base URLs", () => {
    expect(defaultImageBaseUrl("openai")).toBe("https://api.openai.com/v1");
    expect(defaultImageBaseUrl("ollama")).toBe("http://localhost:11434/v1");
    expect(defaultImageBaseUrl("local-sd")).toBe("http://localhost:7860");
  });

  it("ships a starting model catalog for the OpenAI-compatible backends", () => {
    expect(IMAGE_PROVIDER_MODELS.openai.map((m) => m.id)).toContain("gpt-image-1");
    expect(IMAGE_PROVIDER_MODELS.ollama.length).toBeGreaterThan(0);
    expect(IMAGE_PROVIDER_MODELS["local-sd"]).toEqual([]);
  });
});

describe("imageArtSupported", () => {
  it("requires a key when the provider needs one", () => {
    expect(imageArtSupported(config())).toBe(true);
    expect(imageArtSupported(config({ apiKey: "" }))).toBe(false);
  });

  it("requires a model for the OpenAI-compatible backends, not for local-sd", () => {
    expect(
      imageArtSupported(config({ providerId: "ollama", apiKey: "", model: "" })),
    ).toBe(false);
    expect(
      imageArtSupported(
        config({ providerId: "ollama", apiKey: "", model: "z-image-turbo" }),
      ),
    ).toBe(true);
    // local Stable Diffusion runs against its loaded checkpoint with no model id.
    expect(
      imageArtSupported(config({ providerId: "local-sd", apiKey: "", model: "" })),
    ).toBe(true);
  });

  it("rejects a null or unknown provider", () => {
    expect(imageArtSupported(null)).toBe(false);
    expect(imageArtSupported(config({ providerId: "bogus" as ImageProviderId }))).toBe(
      false,
    );
  });
});

describe("generateImage — OpenAI", () => {
  it("returns a data URL from the b64 payload and sends size (not response_format)", async () => {
    const fetchFn = ok({ data: [{ b64_json: "QUJD" }] });
    await expect(generateImage(config(), "a foggy street", fetchFn)).resolves.toBe(
      "data:image/png;base64,QUJD",
    );
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent).toMatchObject({ model: "gpt-image-1", size: "1024x1024", n: 1 });
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer sk-test",
    });
  });

  it("never sends response_format — gpt-image rejects it (and dall-e is gone)", async () => {
    const fetchFn = ok({ data: [{ b64_json: "QUJD" }] });
    await generateImage(config({ model: "gpt-image-1-mini" }), "p", fetchFn);
    const sent = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.response_format).toBeUndefined();
    expect(sent.size).toBe("1024x1024");
  });

  it("falls back to a hosted URL when no inline base64 is present", async () => {
    const fetchFn = ok({ data: [{ url: "https://img.example/x.png" }] });
    await expect(generateImage(config(), "p", fetchFn)).resolves.toBe(
      "https://img.example/x.png",
    );
  });

  it("maps provider failures onto the shared error codes", async () => {
    const status = (code: number) =>
      vi.fn().mockResolvedValue(new Response("{}", { status: code }));
    await expect(generateImage(config(), "p", status(401))).rejects.toMatchObject({
      code: "AUTH_ERROR",
    });
    await expect(generateImage(config(), "p", status(429))).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryable: true,
    });
    await expect(generateImage(config(), "p", status(500))).rejects.toMatchObject({
      code: "PROVIDER_ERROR",
    });
  });

  it("rejects an empty data array and a non-JSON body", async () => {
    await expect(generateImage(config(), "p", ok({ data: [] }))).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
    const notJson = vi
      .fn()
      .mockResolvedValue(new Response("<html>nope</html>", { status: 200 }));
    await expect(generateImage(config(), "p", notJson)).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });

  it("wraps a network failure as NETWORK_ERROR", async () => {
    const boom = vi.fn().mockRejectedValue(new TypeError("offline"));
    await expect(generateImage(config(), "p", boom)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});

describe("generateImage — Ollama (local)", () => {
  it("posts a minimal body to the local OpenAI-compatible endpoint", async () => {
    const fetchFn = ok({ data: [{ b64_json: "QUJD" }] });
    const cfg = config({ providerId: "ollama", apiKey: "", model: "z-image-turbo" });
    await expect(generateImage(cfg, "p", fetchFn)).resolves.toBe(
      "data:image/png;base64,QUJD",
    );
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("http://localhost:11434/v1/images/generations");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent).toEqual({ model: "z-image-turbo", prompt: "p", n: 1 });
    // No key → no Authorization header.
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });

  it("honours a custom base URL and trims a trailing slash", async () => {
    const fetchFn = ok({ data: [{ b64_json: "QUJD" }] });
    const cfg = config({
      providerId: "ollama",
      apiKey: "",
      model: "z-image-turbo",
      baseUrl: "http://box:11434/v1/",
    });
    await generateImage(cfg, "p", fetchFn);
    expect(fetchFn.mock.calls[0][0]).toBe("http://box:11434/v1/images/generations");
  });

  it("sends a bearer header when the local endpoint is key-protected", async () => {
    const fetchFn = ok({ data: [{ b64_json: "QUJD" }] });
    const cfg = config({
      providerId: "ollama",
      apiKey: "secret",
      model: "z-image-turbo",
    });
    await generateImage(cfg, "p", fetchFn);
    const [, init] = fetchFn.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer secret",
    });
  });
});

describe("generateImage — local Stable Diffusion", () => {
  it("posts to the txt2img endpoint and wraps the raw base64", async () => {
    const fetchFn = ok({ images: ["QUJD"] });
    const cfg = config({ providerId: "local-sd", apiKey: "", model: "" });
    await expect(generateImage(cfg, "p", fetchFn)).resolves.toBe(
      "data:image/png;base64,QUJD",
    );
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("http://localhost:7860/sdapi/v1/txt2img");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent).toMatchObject({ prompt: "p", steps: 20, width: 1024, height: 1024 });
    expect(sent.override_settings).toBeUndefined();
  });

  it("passes a checkpoint override when a model is given and keeps data URLs intact", async () => {
    const fetchFn = ok({ images: ["data:image/png;base64,QUJD"] });
    const cfg = config({ providerId: "local-sd", apiKey: "", model: "dreamshaper" });
    await expect(generateImage(cfg, "p", fetchFn)).resolves.toBe(
      "data:image/png;base64,QUJD",
    );
    const sent = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.override_settings).toEqual({ sd_model_checkpoint: "dreamshaper" });
  });

  it("rejects a payload with no images", async () => {
    const fetchFn = ok({ images: [] });
    const cfg = config({ providerId: "local-sd", apiKey: "", model: "" });
    await expect(generateImage(cfg, "p", fetchFn)).rejects.toMatchObject({
      code: "MALFORMED_OUTPUT",
    });
  });
});

describe("generateImage — guard", () => {
  it("throws before any request when the config is unsupported", async () => {
    const fetchFn = vi.fn();
    await expect(
      generateImage(config({ apiKey: "" }), "p", fetchFn),
    ).rejects.toBeInstanceOf(AIError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
