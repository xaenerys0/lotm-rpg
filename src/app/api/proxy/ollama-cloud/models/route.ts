import { type NextRequest, NextResponse } from "next/server";

// Server-side proxy for ollama.com's model catalog. ollama.com does not send
// CORS headers, so a browser fetch receives a status 0 network error. This
// route forwards the OpenAI-compatible GET /v1/models with the caller's Bearer
// token so the provider-config UI can list available cloud models.

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://ollama.com/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }

  const responseText = await upstream.text();
  return new NextResponse(responseText, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
