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
//                    which runs BOTH our approved open models (`@cf/baai/bge-m3`
//                    and `@cf/qwen/qwen3-embedding-0.6b`) on its free tier — no
//                    Worker to deploy, just an account id + a Workers-AI-scoped
//                    token. Reached browser-side through the same-origin proxy at
//                    `/api/proxy/cloudflare/embed` (which injects the operator's
//                    server-held token and maps the locked model id → Cloudflare
//                    model id); in CI (Node, no CORS) the transport targets the
//                    Cloudflare REST run base directly with the token from env.
//                    This is the zero-box hosted path — Cloudflare hosts the
//                    models, not us. (Ollama Cloud was evaluated and rejected:
//                    ollama.com hosts only chat models, never embedding models,
//                    so its `/api/embed` 401s.)

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
  /** Cloudflare Workers AI model id — every approved model is CF-hosted (the
   * hosted fallback), so this is required, not optional. */
  cloudflareModel: string;
}

/** The zero-setup default model. */
export const DEFAULT_EMBEDDING_MODEL_ID = "qwen3-embedding-0.6b";

/**
 * The two approved 1024-dim models, each pre-embedded as a separate map.
 * BOTH are hosted on Cloudflare Workers AI (so the hosted transport can serve
 * either) AND pullable into a local/operator Ollama.
 */
export const APPROVED_EMBEDDING_MODELS: readonly EmbeddingModel[] = [
  {
    id: "qwen3-embedding-0.6b",
    name: "Qwen3 Embedding 0.6B",
    dims: EMBEDDING_DIMS,
    ollamaTag: "qwen3-embedding:0.6b",
    cloudflareModel: "@cf/qwen/qwen3-embedding-0.6b",
  },
  {
    id: "bge-m3",
    name: "BGE-M3",
    dims: EMBEDDING_DIMS,
    ollamaTag: "bge-m3:567m",
    cloudflareModel: "@cf/baai/bge-m3",
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

/** Cloudflare Workers AI transport, supporting either approved model.
 *  - Browser: POSTs `{ text, model }` (the approved model id) to the same-origin
 *    proxy, which injects the token and maps the model id → Cloudflare model id.
 *  - CI: POSTs `{ text }` directly to `<run base>/<cloudflareModel>` with the
 *    token (the model id rides in the URL path, as Cloudflare's REST API expects).
 * Reads `result.data`. */
class CloudflareEmbeddingProvider implements EmbeddingProvider {
  readonly id: EmbeddingProviderId = "cloudflare";
  readonly dims: number;
  readonly model_id: string;
  private readonly endpoint: string;
  private readonly cloudflareModel: string;
  private readonly apiKey: string;

  constructor(args: { model: EmbeddingModel; endpoint: string; apiKey?: string }) {
    this.model_id = args.model.id;
    this.dims = args.model.dims;
    this.cloudflareModel = args.model.cloudflareModel;
    this.endpoint = args.endpoint;
    this.apiKey = args.apiKey ?? "";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Browser sends no key — the same-origin proxy injects the operator token.
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
    // A same-origin proxy path is relative; the CI run base is an absolute URL.
    const direct = /^https?:\/\//.test(this.endpoint);
    const url = direct ? `${this.endpoint}/${this.cloudflareModel}` : this.endpoint;
    const body = direct ? { text: texts } : { text: texts, model: this.model_id };
    const raw = await fetchWithErrorHandling(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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
