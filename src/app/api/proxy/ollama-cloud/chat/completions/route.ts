import { type NextRequest, NextResponse } from "next/server";

// Server-side proxy for ollama.com — the cloud service does not send CORS
// headers, so browser fetch calls receive a status 0 network error. This
// route accepts the same OpenAI-compatible request body, forwards it to
// ollama.com with the caller's Bearer token, and returns the response.

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

  const responseText = await upstream.text();

  // Surface the upstream failure in Vercel logs. The route otherwise relays
  // ollama.com's status verbatim, so a 403/401/429 arrives with no reason —
  // log the status, requested model, and upstream body (the real message, e.g.
  // "model not found" / quota exceeded). The Authorization header is never
  // logged, so the key stays out of the logs.
  if (upstream.status >= 400) {
    console.error(
      "[ollama-cloud proxy] chat/completions upstream error",
      JSON.stringify({
        status: upstream.status,
        model: extractModel(body),
        body: responseText.slice(0, 1000),
      }),
    );
  } else {
    // Diagnostic for reasoning models (gpt-oss / Harmony): ollama.com returns 200
    // but the body may not be the strict game JSON the client parses — reasoning
    // can pollute `content`, land in a separate `reasoning`/`thinking` field, or
    // eat the token budget and truncate the answer (finish_reason "length"). When
    // a 2xx body doesn't look like our JSON, log a structured summary so the real
    // shape is visible in Vercel logs. Logs only the AI's own output (never the
    // Authorization header/key or the player's request text), and only on the
    // failing turns (a clean, parseable body logs nothing).
    const diag = summarizeUnparseableChat(responseText);
    if (diag) {
      console.error(
        "[ollama-cloud proxy] chat/completions unparseable 2xx body",
        JSON.stringify({ model: extractModel(body), ...diag }),
      );
    }
  }

  return new NextResponse(responseText, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
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
