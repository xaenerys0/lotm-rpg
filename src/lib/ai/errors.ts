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

  constructor(code: AIErrorCode, message: string, providerMessage?: string) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.providerMessage = providerMessage;
    this.retryable =
      code === "RATE_LIMITED" || code === "PROVIDER_ERROR" || code === "MALFORMED_OUTPUT";
  }
}

export function classifyHttpError(status: number, body: string): AIError {
  if (status === 401 || status === 403) {
    return new AIError(
      "AUTH_ERROR",
      "Invalid or expired API key. Please check your provider settings.",
      body,
    );
  }
  if (status === 429) {
    return new AIError(
      "RATE_LIMITED",
      "Rate limited by provider. Retrying with backoff.",
      body,
    );
  }
  if (status === 402) {
    return new AIError(
      "QUOTA_EXCEEDED",
      "API quota exceeded. Check your provider billing dashboard.",
      body,
    );
  }
  if (status >= 500) {
    return new AIError(
      "PROVIDER_ERROR",
      "Provider is experiencing issues. Retrying.",
      body,
    );
  }
  return new AIError("PROVIDER_ERROR", `Unexpected HTTP ${status}`, body);
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
