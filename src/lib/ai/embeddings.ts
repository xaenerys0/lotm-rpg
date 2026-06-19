import { AIError } from "./errors";
import { fetchWithErrorHandling, OllamaAdapter } from "./providers";

// ---------------------------------------------------------------------------
// The embedding seam (issue #60, sub-issue of #57)
// ---------------------------------------------------------------------------
//
// A query vector is only comparable to corpus vectors produced by the SAME
// model — each approved model is its own coordinate space ("map") in
// `chunk_embeddings` — so the embedding model is a fixed, approved choice locked
// per save, NOT a free-form pick like the chat provider.
//
// Transports:
//   - `ollama`     — the player's own Ollama (BYO, browser-direct), mirroring the
//                    BYOK chat pattern. Speaks Ollama's `/api/embed`.
//   - `operator`   — a self-hosted always-on box at `NEXT_PUBLIC_OPERATOR_EMBEDDING_URL`,
//                    also `/api/embed`. Cannot be a Vercel serverless function (no
//                    resident model) — the "Vercel wrinkle".
//   - `cloudflare` — the operator's hosted embedder on Cloudflare Workers AI,
//                    which runs the OPEN `@cf/baai/bge-m3` model (one of our
//                    approved 1024-dim models) on its free tier. Reached
//                    browser-side through the same-origin proxy at
//                    `/api/proxy/cloudflare/embed` (which injects the operator's
//                    server-held Cloudflare token); in CI (Node, no CORS) the same
//                    transport targets the Cloudflare REST endpoint directly with
//                    the token from env. This is the zero-box hosted path —
//                    Cloudflare hosts the model, not us. (Ollama Cloud was
//                    evaluated and rejected: ollama.com hosts only chat models,
//                    never embedding models, so its `/api/embed` 401s.)

/** Which transport produced a vector. */
export type EmbeddingProviderId = "ollama" | "operator" | "cloudflare";

/**
 * Same-origin path of the Cloudflare embed proxy — the browser default endpoint
 * for the `cloudflare` transport. The proxy (`src/app/api/proxy/cloudflare/embed`)
 * forwards to Cloudflare Workers AI with the operator's server-held token; CI
 * overrides this with the full Cloudflare REST URL (no proxy needed outside the
 * browser).
 */
export const CLOUDFLARE_EMBEDDING_PROXY_PATH = "/api/proxy/cloudflare/embed";

/** Every approved model is 1024-dim, so `vector(1024)` holds for the whole store. */
export const EMBEDDING_DIMS = 1024;

/**
 * An approved 1024-dim embedding model — one coordinate space ("map") in
 * `chunk_embeddings`. Pinned by an explicit Ollama tag (never `:latest`) so a
 * re-embed is an explicit, versioned event; `cloudflareModel` is the Workers AI
 * model id for models Cloudflare also hosts (so the hosted transport can serve
 * the SAME model without a new map).
 */
export interface EmbeddingModel {
  /** Stable key stored in `chunk_embeddings.model_id` and locked per save. */
  id: string;
  /** Human label for the character-creation picker. */
  name: string;
  /** Vector dimensionality — 1024 for every approved model. */
  dims: number;
  /** Pinned Ollama pull tag — the model's home on Ollama and the operator box. */
  ollamaTag: string;
  /** Cloudflare Workers AI model id, when the model is hosted there. */
  cloudflareModel?: string;
}

/** The default model. `bge-m3` is the one approved model Cloudflare Workers AI
 * hosts, so it backs the zero-setup hosted (`cloudflare`) path. */
export const DEFAULT_EMBEDDING_MODEL_ID = "bge-m3";

/**
 * The two approved 1024-dim models, each pre-embedded as a separate map:
 * `bge-m3` (default — also hosted on Cloudflare Workers AI) and
 * `qwen3-embedding-0.6b` (alt; local/operator Ollama only).
 */
export const APPROVED_EMBEDDING_MODELS: readonly EmbeddingModel[] = [
  {
    id: "bge-m3",
    name: "BGE-M3",
    dims: EMBEDDING_DIMS,
    ollamaTag: "bge-m3:567m",
    cloudflareModel: "@cf/baai/bge-m3",
  },
  {
    id: "qwen3-embedding-0.6b",
    name: "Qwen3 Embedding 0.6B",
    dims: EMBEDDING_DIMS,
    ollamaTag: "qwen3-embedding:0.6b",
  },
];

/** Resolve an approved model by id, or throw — guards against an unpinned or
 * mistyped model leaking into the model-keyed store. */
export function getEmbeddingModel(modelId: string): EmbeddingModel {
  const model = APPROVED_EMBEDDING_MODELS.find((m) => m.id === modelId);
  if (!model) {
    const approved = APPROVED_EMBEDDING_MODELS.map((m) => m.id).join(", ");
    throw new AIError(
      "VALIDATION_FAILED",
      `Unknown embedding model "${modelId}". Approved: ${approved}.`,
    );
  }
  return model;
}

/**
 * A real embedding adapter. `model_id` is the approved-model key written to
 * `chunk_embeddings`; `dims` is the produced vector length.
 */
export interface EmbeddingProvider {
  readonly id: EmbeddingProviderId;
  readonly dims: number;
  readonly model_id: string;
  /** Embed a batch of texts → one `dims`-length vector each, order-preserving. */
  embed(texts: string[]): Promise<number[][]>;
}

/** Validate a batch result against the input count and expected dimensionality. */
function assertEmbeddingShape(
  vectors: number[][],
  count: number,
  dims: number,
): number[][] {
  if (vectors.length !== count) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      `Embedder returned ${vectors.length} vectors for ${count} inputs.`,
    );
  }
  for (const vector of vectors) {
    if (vector.length !== dims) {
      throw new AIError(
        "MALFORMED_OUTPUT",
        `Expected ${dims}-dim vectors, got ${vector.length}.`,
      );
    }
  }
  return vectors;
}

/** The operator's always-on endpoint URL, from a public env var. */
function operatorBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_OPERATOR_EMBEDDING_URL;
  if (!url) {
    throw new AIError(
      "VALIDATION_FAILED",
      "No operator embedding endpoint configured (set NEXT_PUBLIC_OPERATOR_EMBEDDING_URL).",
    );
  }
  return url;
}

/** Shared implementation for the Ollama-shaped transports (`ollama`, `operator`):
 * both call Ollama's `/api/embed`, differing only in which base URL hosts the
 * model (the player's vs the operator's box). */
class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly id: EmbeddingProviderId;
  readonly dims: number;
  readonly model_id: string;
  private readonly adapter: OllamaAdapter;
  private readonly ollamaTag: string;
  private readonly apiKey: string;

  constructor(args: {
    id: EmbeddingProviderId;
    model: EmbeddingModel;
    baseUrl: string;
    apiKey?: string;
  }) {
    this.id = args.id;
    this.model_id = args.model.id;
    this.dims = args.model.dims;
    this.ollamaTag = args.model.ollamaTag;
    this.adapter = new OllamaAdapter(args.baseUrl);
    this.apiKey = args.apiKey ?? "";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const vectors = await this.adapter.embed(this.ollamaTag, texts, this.apiKey);
    return assertEmbeddingShape(vectors, texts.length, this.dims);
  }
}

/** Pull the vector rows out of a Cloudflare Workers AI embeddings response,
 * shape `{ result: { data: number[][], shape }, success, errors }`. */
function parseCloudflareEmbeddings(raw: unknown): number[][] {
  const data =
    typeof raw === "object" && raw !== null
      ? (raw as { result?: { data?: unknown } }).result?.data
      : undefined;
  if (!Array.isArray(data)) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Cloudflare embedding response missing `result.data`.",
    );
  }
  return data.map((row) => {
    if (!Array.isArray(row) || row.some((n) => typeof n !== "number")) {
      throw new AIError("MALFORMED_OUTPUT", "Cloudflare embedding row is not numeric.");
    }
    return row as number[];
  });
}

/** Cloudflare Workers AI transport. POSTs `{ text }` to the Workers AI run
 * endpoint (browser → the injecting proxy; CI → the REST URL directly with the
 * token) and reads `result.data`. */
class CloudflareEmbeddingProvider implements EmbeddingProvider {
  readonly id: EmbeddingProviderId = "cloudflare";
  readonly dims: number;
  readonly model_id: string;
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(args: { model: EmbeddingModel; endpoint: string; apiKey?: string }) {
    this.model_id = args.model.id;
    this.dims = args.model.dims;
    this.endpoint = args.endpoint;
    this.apiKey = args.apiKey ?? "";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Browser sends no key — the same-origin proxy injects the operator token.
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
    const raw = await fetchWithErrorHandling(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: texts }),
    });
    return assertEmbeddingShape(parseCloudflareEmbeddings(raw), texts.length, this.dims);
  }
}

export interface CreateEmbeddingProviderOptions {
  id: EmbeddingProviderId;
  /** Approved model key; defaults to the zero-setup default. */
  modelId?: string;
  /** Transport base URL / endpoint. Falls back to the transport default. */
  baseUrl?: string;
  /** Optional bearer key (the operator's Cloudflare token in CI, or an Ollama
   * box behind auth). Never set in the browser — the proxy injects it. */
  apiKey?: string;
}

/** Resolve a transport's default base URL / endpoint when the caller doesn't pin one. */
function defaultBaseUrlFor(id: EmbeddingProviderId): string {
  switch (id) {
    case "operator":
      return operatorBaseUrl();
    case "cloudflare":
      // Browser default: the same-origin proxy. CI overrides with --base-url.
      return CLOUDFLARE_EMBEDDING_PROXY_PATH;
    case "ollama":
      return new OllamaAdapter().getDefaultBaseUrl();
  }
}

/** Build an {@link EmbeddingProvider} for one transport + approved model. */
export function createEmbeddingProvider(
  options: CreateEmbeddingProviderOptions,
): EmbeddingProvider {
  const model = getEmbeddingModel(options.modelId ?? DEFAULT_EMBEDDING_MODEL_ID);
  const baseUrl = options.baseUrl ?? defaultBaseUrlFor(options.id);
  if (options.id === "cloudflare") {
    // Guard correctness: a save locked to a model Cloudflare doesn't host (e.g.
    // qwen3-embedding-0.6b) must NOT silently get bge-m3 vectors under its id.
    if (!model.cloudflareModel) {
      throw new AIError(
        "VALIDATION_FAILED",
        `Model "${model.id}" is not hosted on Cloudflare Workers AI.`,
      );
    }
    return new CloudflareEmbeddingProvider({
      model,
      endpoint: baseUrl,
      apiKey: options.apiKey,
    });
  }
  return new OllamaEmbeddingProvider({
    id: options.id,
    model,
    baseUrl,
    apiKey: options.apiKey,
  });
}
