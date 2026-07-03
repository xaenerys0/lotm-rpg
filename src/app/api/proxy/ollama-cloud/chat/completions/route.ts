import { type NextRequest, NextResponse } from "next/server";

// Server-side proxy for ollama.com — the cloud service does not send CORS
// headers, so browser fetch calls receive a status 0 network error. This
// route accepts the same OpenAI-compatible request body, forwards it to
// ollama.com with the caller's Bearer token, and returns the response.

// The whole cost of a chat turn is ollama.com's generation time (P75 ~18s,
// higher at the tail). Pin an explicit ceiling so a slow generation streams to
// completion instead of hitting a shorter platform default and 504-ing.
export const maxDuration = 60;
// Streaming through the upstream body is supported on the Node runtime; keep it
// explicit so a future default flip can't move this to Edge (where the
// tee-and-log diagnostic below and the higher duration budget don't apply).
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch("https://ollama.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body,
    });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }

  const headers = { "Content-Type": "application/json" };

  // Stream the upstream body straight through instead of waiting for the whole
  // generation before the first byte reaches the browser — this collapses the
  // time-to-first-byte (the buffered path made TTFB == full generation time).
  // The diagnostic still needs the full text, so the passthrough below
  // accumulates it as a string and logs once at the end; that's a string, not a
  // second copy of the raw bytes, and it's only inspected on a non-clean body.
  // When there's no body to stream (rare — an empty error), fall back to
  // buffering.
  if (upstream.body === null) {
    const responseText = await upstream.text();
    logUpstream(upstream.status, body, responseText);
    return new NextResponse(responseText, { status: upstream.status, headers });
  }

  // Pipe the body through a passthrough that forwards each chunk to the client
  // as it arrives AND accumulates the full text for the diagnostic. The log runs
  // once, in `flush` (when the stream completes) — so a chunk reaches the browser
  // without waiting for the whole generation, but the diagnostic still sees the
  // complete body. `flush` never throws into the stream.
  const decoder = new TextDecoder();
  let collected = "";
  const status = upstream.status;
  const passthrough = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      collected += decoder.decode(chunk, { stream: true });
      controller.enqueue(chunk);
    },
    flush() {
      collected += decoder.decode();
      try {
        logUpstream(status, body, collected);
      } catch {
        // The response already streamed; a failed diagnostic is harmless.
      }
    },
  });

  return new NextResponse(upstream.body.pipeThrough(passthrough), {
    status,
    headers,
  });
}

// Surface the upstream failure in Vercel logs. The route otherwise relays
// ollama.com's status verbatim, so a 403/401/429 arrives with no reason — log
// the status, requested model, and upstream body (the real message, e.g. "model
// not found" / quota exceeded). On a 2xx, run the reasoning-model diagnostic and
// log only when the body doesn't look like the game's JSON. The Authorization
// header/key and the player's request text are never logged.
function logUpstream(status: number, requestBody: string, responseText: string): void {
  if (status >= 400) {
    console.error(
      "[ollama-cloud proxy] chat/completions upstream error",
      JSON.stringify({
        status,
        model: extractModel(requestBody),
        body: responseText.slice(0, 1000),
      }),
    );
    return;
  }
  // Diagnostic for reasoning models (gpt-oss / Harmony): ollama.com returns 200
  // but the body may not be the strict game JSON the client parses — reasoning
  // can pollute `content`, land in a separate `reasoning`/`thinking` field, or
  // eat the token budget and truncate the answer (finish_reason "length").
  const diag = summarizeUnparseableChat(responseText);
  if (diag) {
    console.error(
      "[ollama-cloud proxy] chat/completions unparseable 2xx body",
      JSON.stringify({ model: extractModel(requestBody), ...diag }),
    );
  }
}

interface ChatDiag {
  finishReason: string | null;
  contentLength: number;
  contentEmpty: boolean;
  hasNarrativeKey: boolean;
  reasoningField: "none" | "reasoning" | "thinking";
  reasoningLength: number;
  contentHead: string;
  contentTail: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Summarize a 2xx chat body when it does NOT look like the game's structured
// JSON, so the real gpt-oss/Harmony output shape surfaces in logs. Returns null
// for a clean body (non-empty content carrying a `"narrative"` key and not
// truncated) so working turns log nothing. Never throws.
function summarizeUnparseableChat(responseText: string): ChatDiag | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Upstream returned non-JSON entirely — definitely unparseable.
    return {
      finishReason: null,
      contentLength: responseText.length,
      contentEmpty: responseText.trim().length === 0,
      hasNarrativeKey: false,
      reasoningField: "none",
      reasoningLength: 0,
      contentHead: responseText.slice(0, 400),
      contentTail: responseText.slice(-200),
    };
  }

  const choices = isRecord(parsed) && Array.isArray(parsed.choices) ? parsed.choices : [];
  const choice: unknown = choices[0];
  const message = isRecord(choice) && isRecord(choice.message) ? choice.message : {};
  const content = typeof message.content === "string" ? message.content : "";
  const reasoning = typeof message.reasoning === "string" ? message.reasoning : undefined;
  const thinking = typeof message.thinking === "string" ? message.thinking : undefined;
  const finishReason =
    isRecord(choice) && typeof choice.finish_reason === "string"
      ? choice.finish_reason
      : null;
  const hasNarrativeKey = content.includes('"narrative"');

  // Looks fine: real content, carries our JSON key, finished normally.
  if (content.length > 0 && hasNarrativeKey && finishReason !== "length") {
    return null;
  }

  return {
    finishReason,
    contentLength: content.length,
    contentEmpty: content.trim().length === 0,
    hasNarrativeKey,
    reasoningField:
      reasoning !== undefined
        ? "reasoning"
        : thinking !== undefined
          ? "thinking"
          : "none",
    reasoningLength: (reasoning ?? thinking ?? "").length,
    contentHead: content.slice(0, 400),
    contentTail: content.slice(-200),
  };
}

// Best-effort pull of the requested model id from the OpenAI-style request body,
// for log correlation. Never throws — a missing/unparseable body logs as null.
function extractModel(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { model?: unknown };
    return typeof parsed.model === "string" ? parsed.model : null;
  } catch {
    return null;
  }
}
