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
  /** The provider's own human-readable reason, already extracted from the body
   *  (see `extractProviderMessage`). Consumers that want just the reason read
   *  this instead of re-parsing `providerMessage`. */
  readonly reason?: string;

  constructor(
    code: AIErrorCode,
    message: string,
    providerMessage?: string,
    status?: number,
    reason?: string,
  ) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.providerMessage = providerMessage;
    this.status = status;
    this.reason = reason;
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
    // Try each shape in order; a blank candidate falls through to the next so an
    // empty `error.message` never shadows a meaningful top-level `message`.
    if (typeof obj.error === "string" && obj.error.trim()) return obj.error.trim();
    if (obj.error && typeof obj.error === "object") {
      const nested = (obj.error as Record<string, unknown>).message;
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim();
  }
  return undefined;
}

export function classifyHttpError(status: number, body: string): AIError {
  // Extract the provider's reason once and carry it on every error, so consumers
  // (e.g. the model-access probe) read `err.reason` instead of re-parsing. The
  // same reason is appended to the human-readable message via `withReason` so
  // the provider's own wording surfaces in the UI — critical for the
  // browser-direct providers (Anthropic, OpenAI, …), which have no server-side
  // log to inspect, so a bare "Unexpected HTTP 400" would otherwise be a
  // dead end.
  const reason = extractProviderMessage(body);
  const withReason = (base: string): string =>
    reason ? `${base} Provider said: ${reason}` : base;

  if (status === 401) {
    return new AIError(
      "AUTH_ERROR",
      withReason("Invalid or expired API key. Please check your provider settings."),
      body,
      status,
      reason,
    );
  }
  // A 400 (bad request) or 404 (not found) is a deterministic, client-side
  // configuration problem — almost always a selected model id this provider
  // doesn't recognize, or a wrong base URL — not a transient fault. Retrying
  // sends the identical request and fails identically, so these must NOT be
  // retryable (a bare PROVIDER_ERROR would burn the full 2s/4s/8s backoff before
  // surfacing). AUTH_ERROR keeps the "Go to Settings" recovery CTA without
  // blaming the key (mirroring the 403 treatment), and the provider's own
  // wording (e.g. Anthropic's "model: … not found") is surfaced.
  if (status === 400 || status === 404) {
    return new AIError(
      "AUTH_ERROR",
      withReason(
        `The provider rejected the request (HTTP ${status}). The selected model id may be invalid or unavailable on this provider, or the base URL is wrong. Check your models and base URL in Settings.`,
      ),
      body,
      status,
      reason,
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
    return new AIError(
      "AUTH_ERROR",
      withReason(
        "The provider accepted your key but refused this request (HTTP 403). The selected model may be unavailable on your plan, or you may have hit a usage limit. Check the model in Settings or your provider's dashboard.",
      ),
      body,
      status,
      reason,
    );
  }
  if (status === 429) {
    return new AIError(
      "RATE_LIMITED",
      withReason("Rate limited by provider. Retrying with backoff."),
      body,
      status,
      reason,
    );
  }
  if (status === 402) {
    return new AIError(
      "QUOTA_EXCEEDED",
      withReason("API quota exceeded. Check your provider billing dashboard."),
      body,
      status,
      reason,
    );
  }
  if (status >= 500) {
    return new AIError(
      "PROVIDER_ERROR",
      withReason("Provider is experiencing issues. Retrying."),
      body,
      status,
      reason,
    );
  }
  return new AIError(
    "PROVIDER_ERROR",
    withReason(`Unexpected HTTP ${status}`),
    body,
    status,
    reason,
  );
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
