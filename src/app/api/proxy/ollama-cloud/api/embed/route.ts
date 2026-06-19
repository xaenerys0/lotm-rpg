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
//     authenticated Supabase users AND a per-user rate limit (below), so one
//     account can't run up the operator's bill.

/** The shared `rate_limits` bucket this route counts under. */
const RATE_LIMIT_BUCKET = "embed";

/**
 * Per-user limit, env-tunable (server-only). `EMBED_RATE_LIMIT_MAX=0` disables
 * the check entirely (operator opt-out). Defaults: 30 requests / 60s.
 */
function rateLimitConfig(): { max: number; windowSeconds: number } {
  const max = Number(process.env.EMBED_RATE_LIMIT_MAX ?? "30");
  const windowSeconds = Number(process.env.EMBED_RATE_LIMIT_WINDOW_SECONDS ?? "60");
  return {
    max: Number.isFinite(max) ? max : 30,
    windowSeconds:
      Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 60,
  };
}

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
    // Surface it: with NEXT_PUBLIC_OLLAMA_CLOUD_EMBEDDING on but the server key
    // missing, EVERY player silently loses retrieval, so log the misconfig (the
    // client swallows the 503 best-effort and shows nothing).
    console.error(
      "[ollama-cloud proxy] api/embed disabled — OLLAMA_CLOUD_API_KEY is not set",
    );
    return NextResponse.json({ error: "Cloud embedding disabled" }, { status: 503 });
  }

  // Per-user rate limit: bound the operator's spend before the key is used. The
  // counter is atomic in Postgres (keyed by auth.uid() inside the RPC), shared
  // across all serverless instances. Fails CLOSED — if the limit can't be
  // verified we don't spend the key. A 4xx/5xx here is swallowed best-effort by
  // `retrieveLoreForTurn`, so a throttled turn just runs on curated lore.
  const { max, windowSeconds } = rateLimitConfig();
  if (max > 0) {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: RATE_LIMIT_BUCKET,
      p_max_requests: max,
      p_window_seconds: windowSeconds,
    });
    const decision = data?.[0];
    if (error || !decision) {
      console.error(
        "[ollama-cloud proxy] api/embed rate-limit check failed",
        JSON.stringify({ error: error?.message ?? "no decision row" }),
      );
      return NextResponse.json({ error: "Rate limit unavailable" }, { status: 503 });
    }
    if (!decision.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((new Date(decision.reset_at).getTime() - Date.now()) / 1000),
      );
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
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
