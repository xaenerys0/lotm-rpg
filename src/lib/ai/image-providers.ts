import { AIError } from "./errors";
import { fetchWithErrorHandling } from "./providers";

// ---------------------------------------------------------------------------
// Image providers (image model selection) — a provider/model choice for scene
// art that is INDEPENDENT of the text provider. The text narrator may run on
// Ollama while illustrations come from OpenAI (or vice versa, or not at all):
// the player configures images separately, with their own key/base URL/model.
//
// Browser-direct, BYOK — exactly like the text providers (`providers.ts`). The
// key never touches our servers; only Ollama Cloud is proxied (for CORS), the
// same workaround the text adapter uses.
//
// Supported backends and their transports:
//   - openai        → OpenAI Images `/images/generations` (dall-e-3 / gpt-image-1)
//   - ollama        → local Ollama's OpenAI-compatible `/v1/images/generations`
//                     (experimental image generation, e.g. z-image / flux2-klein)
//   - ollama-cloud  → same OpenAI-compatible shape, via the CORS proxy
//   - local-sd      → a local Stable Diffusion WebUI (Automatic1111/Forge)
//                     `/sdapi/v1/txt2img`, returning base64 PNGs
// ---------------------------------------------------------------------------

export type ImageProviderId = "openai" | "ollama" | "ollama-cloud" | "local-sd";

export interface ImageProviderConfig {
  providerId: ImageProviderId;
  apiKey: string;
  baseUrl?: string;
  /**
   * The image model id. Required for the OpenAI-compatible transports; optional
   * for `local-sd`, where the WebUI uses its currently-loaded checkpoint unless
   * a name is given.
   */
  model: string;
}

export interface ImageModelOption {
  id: string;
  name: string;
}

/** The request/response shape an image provider speaks. */
type ImageTransport = "openai-images" | "sd-txt2img";

interface ImageProviderMeta {
  /** A browser-direct key is mandatory (and the UI shows the field). */
  requiresKey: boolean;
  /** The endpoint is user-hosted, so a base URL field is shown. */
  needsBaseUrl: boolean;
  /** Where requests go when the user leaves the base URL blank. */
  defaultBaseUrl: string;
  transport: ImageTransport;
}

const IMAGE_PROVIDERS: Record<ImageProviderId, ImageProviderMeta> = {
  openai: {
    requiresKey: true,
    needsBaseUrl: false,
    defaultBaseUrl: "https://api.openai.com/v1",
    transport: "openai-images",
  },
  ollama: {
    requiresKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: "http://localhost:11434/v1",
    transport: "openai-images",
  },
  "ollama-cloud": {
    requiresKey: true,
    needsBaseUrl: false,
    // Same-origin proxy — ollama.com sends no CORS headers (see the text
    // adapter's `/api/proxy/ollama-cloud` workaround).
    defaultBaseUrl: "/api/proxy/ollama-cloud",
    transport: "openai-images",
  },
  "local-sd": {
    requiresKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: "http://localhost:7860",
    transport: "sd-txt2img",
  },
};

/** Curated starting model lists per provider. The UI also allows a free-form id
 * for the local/cloud diffusion backends, whose catalogs vary per install. */
export const IMAGE_PROVIDER_MODELS: Record<ImageProviderId, ImageModelOption[]> = {
  openai: [
    { id: "dall-e-3", name: "DALL·E 3" },
    { id: "gpt-image-1", name: "GPT Image 1" },
    { id: "dall-e-2", name: "DALL·E 2" },
  ],
  ollama: [
    { id: "z-image-turbo", name: "Z-Image Turbo" },
    { id: "x/flux2-klein:4b", name: "FLUX.2 Klein 4B" },
    { id: "x/flux2-klein:9b", name: "FLUX.2 Klein 9B" },
  ],
  "ollama-cloud": [
    { id: "z-image-turbo", name: "Z-Image Turbo" },
    { id: "x/flux2-klein:9b", name: "FLUX.2 Klein 9B" },
  ],
  // The WebUI uses its loaded checkpoint; the model field is an optional override.
  "local-sd": [],
};

export function imageProviderRequiresKey(id: ImageProviderId): boolean {
  return IMAGE_PROVIDERS[id].requiresKey;
}

export function imageProviderNeedsBaseUrl(id: ImageProviderId): boolean {
  return IMAGE_PROVIDERS[id].needsBaseUrl;
}

export function defaultImageBaseUrl(id: ImageProviderId): string {
  return IMAGE_PROVIDERS[id].defaultBaseUrl;
}

/** Whether a model id must be chosen for this provider (false for local-sd). */
export function imageProviderNeedsModel(id: ImageProviderId): boolean {
  return IMAGE_PROVIDERS[id].transport !== "sd-txt2img";
}

/**
 * Is scene art generatable with this config? Mirrors `sceneArtSupported`'s old
 * role but across every image backend: the provider must be known, carry a key
 * when it needs one, and a model when the transport needs one.
 */
export function imageArtSupported(config: ImageProviderConfig | null): boolean {
  if (!config) return false;
  const meta = IMAGE_PROVIDERS[config.providerId];
  if (!meta) return false;
  if (meta.requiresKey && !config.apiKey) return false;
  if (imageProviderNeedsModel(config.providerId) && !config.model) return false;
  return true;
}

/** The base URL a request actually hits (user value, else the default). */
function effectiveBaseUrl(config: ImageProviderConfig): string {
  const meta = IMAGE_PROVIDERS[config.providerId];
  const raw = meta.needsBaseUrl
    ? config.baseUrl?.trim() || meta.defaultBaseUrl
    : meta.defaultBaseUrl;
  return raw.replace(/\/+$/, "");
}

/** POST a JSON body through the shared fetch/parse/AIError seam (`providers.ts`),
 * with an injectable `fetchFn` for tests. */
function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  fetchFn: typeof fetch,
): Promise<unknown> {
  return fetchWithErrorHandling(
    url,
    { method: "POST", headers, body: JSON.stringify(body) },
    fetchFn,
  );
}

/** Read an OpenAI-style images reply, preferring inline base64 over a URL. */
function readOpenAIImagePayload(payload: unknown): string {
  const data = (payload as { data?: { b64_json?: string; url?: string }[] }).data;
  const first = Array.isArray(data) ? data[0] : undefined;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new AIError("MALFORMED_OUTPUT", "The image provider returned no image data.");
}

async function generateViaOpenAIImages(
  config: ImageProviderConfig,
  prompt: string,
  fetchFn: typeof fetch,
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  // A minimal, widely-accepted body. OpenAI honours `size`/`response_format`
  // (and gpt-image-1 rejects `response_format`, so it is scoped to dall-e);
  // Ollama's diffusion endpoint takes the prompt and ignores the extras.
  const body: Record<string, unknown> = { model: config.model, prompt, n: 1 };
  if (config.providerId === "openai") {
    body.size = "1024x1024";
    if (config.model.startsWith("dall-e")) body.response_format = "b64_json";
  }

  const payload = await postJson(
    `${effectiveBaseUrl(config)}/images/generations`,
    headers,
    body,
    fetchFn,
  );
  return readOpenAIImagePayload(payload);
}

async function generateViaStableDiffusion(
  config: ImageProviderConfig,
  prompt: string,
  fetchFn: typeof fetch,
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  const body: Record<string, unknown> = { prompt, steps: 20, width: 1024, height: 1024 };
  // An optional checkpoint override; otherwise the WebUI's loaded model is used.
  if (config.model) body.override_settings = { sd_model_checkpoint: config.model };

  const payload = await postJson(
    `${effectiveBaseUrl(config)}/sdapi/v1/txt2img`,
    headers,
    body,
    fetchFn,
  );
  const images = (payload as { images?: unknown }).images;
  const b64 =
    Array.isArray(images) && typeof images[0] === "string" ? images[0] : undefined;
  if (!b64) {
    throw new AIError("MALFORMED_OUTPUT", "The image provider returned no image data.");
  }
  return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
}

/**
 * Generate one illustration, returning a value ready for an `<img src>` (a
 * `data:` URL for inline base64, or a hosted URL). Browser-direct; errors map
 * onto the shared `AIError` codes so the UI's existing handling applies.
 */
export async function generateImage(
  config: ImageProviderConfig,
  prompt: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  if (!imageArtSupported(config)) {
    throw new AIError(
      "VALIDATION_FAILED",
      "Configure an image provider (and model/key) before generating art.",
    );
  }
  return IMAGE_PROVIDERS[config.providerId].transport === "sd-txt2img"
    ? generateViaStableDiffusion(config, prompt, fetchFn)
    : generateViaOpenAIImages(config, prompt, fetchFn);
}
