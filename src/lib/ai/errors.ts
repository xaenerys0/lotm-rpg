export type AIErrorCode =
  | "AUTH_ERROR"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "PROVIDER_ERROR"
  | "MALFORMED_OUTPUT"
  | "VALIDATION_FAILED"
  | "NETWORK_ERROR"
  | "TOKEN_LIMIT_EXCEEDED";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly retryable: boolean;
  readonly providerMessage?: string;
  /** The upstream HTTP status, when this error originated from one (see
   *  `classifyHttpError`). Lets callers distinguish 401 (bad key) from 403
   *  (key fine, request/model refused) without string-matching the message. */
  readonly status?: number;

  constructor(
    code: AIErrorCode,
    message: string,
    providerMessage?: string,
    status?: number,
  ) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.providerMessage = providerMessage;
    this.status = status;
    this.retryable =
      code === "RATE_LIMITED" || code === "PROVIDER_ERROR" || code === "MALFORMED_OUTPUT";
  }
}

// Pull a human-readable reason out of a provider's error body. Handles the
// common JSON shapes — `{ error: "..." }`, `{ error: { message: "..." } }`,
// `{ message: "..." }` — and falls back to the raw (capped) text otherwise.
// Used to surface the provider's actual wording (e.g. ollama.com's "this model
// requires a subscription, upgrade for access: …") instead of a generic guess.
export function extractProviderMessage(body?: string): string | undefined {
  if (!body) return undefined;
  const trimmed = body.trim();
  if (!trimmed) return undefined;
  try {
    // Structured error JSON: return its message, or undefined if it carries no
    // recognizable one (don't echo a whole opaque JSON blob back as a "reason").
    return pluckMessage(JSON.parse(trimmed) as unknown);
  } catch {
    // Not JSON — surface the raw (capped) text.
    return trimmed.slice(0, 300);
  }
}

function pluckMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.error === "string") return obj.error.trim() || undefined;
    if (obj.error && typeof obj.error === "object") {
      const nested = (obj.error as Record<string, unknown>).message;
      if (typeof nested === "string") return nested.trim() || undefined;
    }
    if (typeof obj.message === "string") return obj.message.trim() || undefined;
  }
  return undefined;
}

export function classifyHttpError(status: number, body: string): AIError {
  if (status === 401) {
    return new AIError(
      "AUTH_ERROR",
      "Invalid or expired API key. Please check your provider settings.",
      body,
      status,
    );
  }
  // A 403 is distinct from a 401: the provider accepted the key but refused
  // this specific request — most often the selected model is unavailable on the
  // account/plan, or a usage quota was hit (some providers return 403, not 429,
  // for quota). Reusing AUTH_ERROR keeps the "Go to Settings" recovery CTA, but
  // the message no longer wrongly blames the key. When the provider gave a
  // reason (e.g. ollama.com's "this model requires a subscription, upgrade for
  // access: …"), surface it verbatim instead of guessing.
  if (status === 403) {
    const reason = extractProviderMessage(body);
    const base =
      "The provider accepted your key but refused this request (HTTP 403). The selected model may be unavailable on your plan, or you may have hit a usage limit. Check the model in Settings or your provider's dashboard.";
    return new AIError(
      "AUTH_ERROR",
      reason ? `${base} Provider said: ${reason}` : base,
      body,
      status,
    );
  }
  if (status === 429) {
    return new AIError(
      "RATE_LIMITED",
      "Rate limited by provider. Retrying with backoff.",
      body,
      status,
    );
  }
  if (status === 402) {
    return new AIError(
      "QUOTA_EXCEEDED",
      "API quota exceeded. Check your provider billing dashboard.",
      body,
      status,
    );
  }
  if (status >= 500) {
    return new AIError(
      "PROVIDER_ERROR",
      "Provider is experiencing issues. Retrying.",
      body,
      status,
    );
  }
  return new AIError("PROVIDER_ERROR", `Unexpected HTTP ${status}`, body, status);
}

export function createMalformedOutputError(rawOutput: string): AIError {
  return new AIError(
    "MALFORMED_OUTPUT",
    "Failed to parse structured JSON from AI response.",
    rawOutput.slice(0, 500),
  );
}

export function createNetworkError(cause: unknown): AIError {
  const message = cause instanceof Error ? cause.message : "Unknown network error";
  return new AIError("NETWORK_ERROR", `Network error: ${message}`);
}
