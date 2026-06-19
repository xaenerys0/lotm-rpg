import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Server-side proxy for ollama.com's embedding endpoint. Two reasons it exists,
// both distinct from the sibling chat/models/images proxies:
//
//  1. ollama.com sends no CORS headers, so a browser fetch gets a status 0
//     network error (the shared "CORS workaround").
//  2. Unlike the chat proxy — which forwards the CALLER's own Bearer key (BYOK)
//     — query embedding spends the OPERATOR's key so EVERY signed-in player gets
//     RAG retrieval regardless of their chat provider. That key lives only here
//     (`OLLAMA_CLOUD_API_KEY`, server-only, never `NEXT_PUBLIC_`); the browser
//     sends no key. Because it spends the operator's key, the route is gated to
//     authenticated Supabase users (a baseline abuse limit; rate-limiting is a
//     future hardening).

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth gate: only signed-in players may spend the operator's key.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const apiKey = process.env.OLLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    // Cloud embedding isn't configured — the caller falls back to [] retrieval.
    return NextResponse.json({ error: "Cloud embedding disabled" }, { status: 503 });
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch("https://ollama.com/api/embed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }

  const responseText = await upstream.text();

  // Surface upstream failures in Vercel logs (status + requested model) without
  // ever logging the operator key. See the chat/completions route.
  if (upstream.status >= 400) {
    console.error(
      "[ollama-cloud proxy] api/embed upstream error",
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

// Best-effort pull of the requested model id from the request body, for log
// correlation. Never throws — a missing/unparseable body logs as null.
function extractModel(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { model?: unknown };
    return typeof parsed.model === "string" ? parsed.model : null;
  } catch {
    return null;
  }
}
