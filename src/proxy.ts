import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();

  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "script-src",
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com https://openrouter.ai http://localhost:* http://127.0.0.1:*`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const response = await updateSession(request);

  response.headers.set("Content-Security-Policy", cspDirectives);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  // Run on every route except Next internals and static files — i.e. any path
  // whose last segment ends in a file extension (favicon, manifest, service
  // worker, images, …). This generalizes the bypass so new static assets never
  // need to be added to an explicit exclusion list. App/API routes have no
  // extension and so still pass through the auth-refresh + CSP middleware.
  matcher: ["/((?!_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
