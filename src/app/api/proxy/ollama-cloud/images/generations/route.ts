import { type NextRequest, NextResponse } from "next/server";

// Server-side proxy for ollama.com image generation — the cloud service does
// not send CORS headers, so a browser fetch receives a status 0 network error.
// This route accepts the OpenAI-compatible images request body, forwards it to
// ollama.com with the caller's Bearer token, and relays the response. Mirrors
// the chat/completions and models proxies (same CORS workaround). Used only by
// the `ollama-cloud` image provider (`@/lib/ai/image-providers`).

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch("https://ollama.com/v1/images/generations", {
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

  // Surface upstream failures (status + body) in Vercel logs without ever
  // logging the Authorization header / key. See the chat/completions route.
  if (upstream.status >= 400) {
    console.error(
      "[ollama-cloud proxy] images/generations upstream error",
      JSON.stringify({ status: upstream.status, body: responseText.slice(0, 1000) }),
    );
  }

  return new NextResponse(responseText, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
