import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Server-side proxy for Cloudflare Workers AI embeddings (the hosted RAG query
// embedder). It exists for two reasons:
//
//  1. The operator's Cloudflare token must stay server-side (never NEXT_PUBLIC_),
//     and a browser can't reach the Cloudflare REST API cross-origin anyway.
//  2. It spends the OPERATOR's free-tier quota on behalf of every signed-in
//     player, so it is auth-gated AND per-user rate-limited (one account can't
//     exhaust the operator's allowance).
//
// It forwards the embedder's `{ text: [...] }` body to Cloudflare's `@cf/baai/bge-m3`
// run endpoint with the operator's token and relays Cloudflare's response
// (`{ result: { data }, success }`) verbatim. The corpus is embedded with the SAME
// bge-m3 model in CI, so query and corpus vectors are comparable.

/** The only approved model Cloudflare Workers AI hosts (1024-dim, free tier). */
const CLOUDFLARE_EMBEDDING_MODEL = "@cf/baai/bge-m3";

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
  // Auth gate: only signed-in players may spend the operator's quota.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  if (!accountId || !apiToken) {
    // Cloud embedding isn't configured — the caller falls back to [] retrieval.
    // Surface it: with NEXT_PUBLIC_CLOUDFLARE_EMBEDDING on but the server creds
    // missing, EVERY player silently loses retrieval, so log the misconfig.
    console.error(
      "[cloudflare proxy] embed disabled — CF_ACCOUNT_ID / CF_API_TOKEN not set",
    );
    return NextResponse.json({ error: "Cloud embedding disabled" }, { status: 503 });
  }

  // Per-user rate limit: bound the operator's quota before the token is used.
  // Atomic in Postgres (keyed by auth.uid()), shared across serverless instances.
  // Fails CLOSED — if the limit can't be verified we don't spend the quota. A
  // 4xx/5xx here is swallowed best-effort by `retrieveLoreForTurn`, so a throttled
  // turn just runs on curated lore.
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
        "[cloudflare proxy] embed rate-limit check failed",
        JSON.stringify({ error: error?.message ?? "no decision row" }),
      );
      return NextResponse.json({ error: "Rate limit unavailable" }, { status: 503 });
    }
    if (!decision.allowed) {
      // Fall back to the window length if reset_at is somehow unparseable, so
      // Retry-After is always a valid delay-seconds integer (never "NaN").
      const resetMs = new Date(decision.reset_at).getTime();
      const retryAfter = Number.isFinite(resetMs)
        ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000))
        : windowSeconds;
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_EMBEDDING_MODEL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body,
      },
    );
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }

  const responseText = await upstream.text();

  // Surface upstream failures in Vercel logs (status only) without ever logging
  // the token or the request text.
  if (upstream.status >= 400) {
    console.error(
      "[cloudflare proxy] embed upstream error",
      JSON.stringify({ status: upstream.status, body: responseText.slice(0, 1000) }),
    );
  }

  return new NextResponse(responseText, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
