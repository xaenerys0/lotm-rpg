import { AIError } from "./errors";
import { OllamaAdapter } from "./providers";

// ---------------------------------------------------------------------------
// The embedding seam (issue #60, sub-issue of #57)
// ---------------------------------------------------------------------------
//
// Local-only by design (resolved in #57's comment thread): no third-party
// vendor, no operator API key. A query vector is only comparable to corpus
// vectors produced by the SAME model — each approved model is its own
// coordinate space ("map") in `chunk_embeddings` — so the embedding model is a
// fixed, approved choice locked per save, NOT a free-form pick like the chat
// provider.
//
// Both transports speak Ollama's `/api/embed`:
//   - `ollama`   — the player's own Ollama (BYO, browser-direct), mirroring the
//                  existing BYOK chat pattern;
//   - `operator` — the always-on CPU box the operator runs as the zero-setup
//                  default/fallback for players whose chat provider isn't
//                  Ollama. It cannot live in a Vercel serverless function (no
//                  resident model) — the persistent "Vercel wrinkle".

/** Which transport produced a vector. Both use the same `/api/embed` route. */
export type EmbeddingProviderId = "ollama" | "operator";

/** Every approved model is 1024-dim, so `vector(1024)` holds for the whole store. */
export const EMBEDDING_DIMS = 1024;

/**
 * An approved, CPU-friendly embedding model — one coordinate space ("map") in
 * `chunk_embeddings`. Pinned by an explicit Ollama tag (never `:latest`) so a
 * re-embed is an explicit, versioned event; operators may pin further by digest
 * (`<tag>@sha256:…`) for byte-level determinism.
 */
export interface EmbeddingModel {
  /** Stable key stored in `chunk_embeddings.model_id` and locked per save. */
  id: string;
  /** Human label for the character-creation picker. */
  name: string;
  /** Vector dimensionality — 1024 for every approved model. */
  dims: number;
  /** Pinned Ollama pull tag — the model's home on both Ollama and the operator box. */
  ollamaTag: string;
}

/** The zero-setup default model. */
export const DEFAULT_EMBEDDING_MODEL_ID = "qwen3-embedding-0.6b";

/**
 * The two approved 1024-dim CPU models, each pre-embedded as a separate map:
 * `qwen3-embedding-0.6b` (default) and `bge-m3` (alt/fallback).
 */
export const APPROVED_EMBEDDING_MODELS: readonly EmbeddingModel[] = [
  {
    id: "qwen3-embedding-0.6b",
    name: "Qwen3 Embedding 0.6B",
    dims: EMBEDDING_DIMS,
    ollamaTag: "qwen3-embedding:0.6b",
  },
  {
    id: "bge-m3",
    name: "BGE-M3",
    dims: EMBEDDING_DIMS,
    ollamaTag: "bge-m3:567m",
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
 * A real embedding adapter (the "OpenAI-compatible drop-in" premise is moot
 * under local-only). `model_id` is the approved-model key written to
 * `chunk_embeddings`; `dims` is the produced vector length.
 */
export interface EmbeddingProvider {
  readonly id: EmbeddingProviderId;
  readonly dims: number;
  readonly model_id: string;
  /** Embed a batch of texts → one `dims`-length vector each, order-preserving. */
  embed(texts: string[]): Promise<number[][]>;
}

/** The operator's always-on endpoint URL, from a public env var (query
 * embedding is browser-direct on the hot path). It points at the operator's
 * resident-model box — never a Vercel serverless function. */
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

/** Shared implementation: both transports call Ollama's `/api/embed`, differing
 * only in which base URL hosts the model (the player's vs the operator's box). */
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
    if (vectors.length !== texts.length) {
      throw new AIError(
        "MALFORMED_OUTPUT",
        `Embedder returned ${vectors.length} vectors for ${texts.length} inputs.`,
      );
    }
    for (const vector of vectors) {
      if (vector.length !== this.dims) {
        throw new AIError(
          "MALFORMED_OUTPUT",
          `Expected ${this.dims}-dim vectors, got ${vector.length}.`,
        );
      }
    }
    return vectors;
  }
}

export interface CreateEmbeddingProviderOptions {
  id: EmbeddingProviderId;
  /** Approved model key; defaults to the zero-setup default. */
  modelId?: string;
  /** Transport base URL — the player's Ollama URL, or the operator endpoint.
   * Falls back to the Ollama default (`ollama`) or the env URL (`operator`). */
  baseUrl?: string;
  /** Optional bearer key (e.g. a secured operator box or Ollama behind auth). */
  apiKey?: string;
}

/** Build an {@link EmbeddingProvider} for one transport + approved model. */
export function createEmbeddingProvider(
  options: CreateEmbeddingProviderOptions,
): EmbeddingProvider {
  const model = getEmbeddingModel(options.modelId ?? DEFAULT_EMBEDDING_MODEL_ID);
  const baseUrl =
    options.baseUrl ??
    (options.id === "operator"
      ? operatorBaseUrl()
      : new OllamaAdapter().getDefaultBaseUrl());
  return new OllamaEmbeddingProvider({
    id: options.id,
    model,
    baseUrl,
    apiKey: options.apiKey,
  });
}
