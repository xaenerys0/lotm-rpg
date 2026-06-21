"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/play");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium tracking-[0.15em] text-muted uppercase"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className="mt-1.5 block w-full rounded-sm border border-border bg-background/60 px-3.5 py-2.5 text-foreground transition-colors placeholder:text-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="beyonder@tingen.city"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium tracking-[0.15em] text-muted uppercase"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className="mt-1.5 block w-full rounded-sm border border-border bg-background/60 px-3.5 py-2.5 text-foreground transition-colors placeholder:text-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p id="login-error" role="alert" className="text-sm text-sanity-low">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm border border-gold/40 bg-gradient-to-b from-amber to-copper px-4 py-2.5 font-serif text-base font-semibold text-background shadow-[0_8px_24px_-12px_rgba(200,154,60,0.7)] transition-all hover:from-gold hover:to-amber disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
