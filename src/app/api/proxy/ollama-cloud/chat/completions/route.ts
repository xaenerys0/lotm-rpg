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
  }

  return new NextResponse(responseText, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
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
