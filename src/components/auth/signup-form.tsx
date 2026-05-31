"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded border border-amber/30 bg-amber/5 p-4 text-center"
      >
        <p className="text-foreground">Check your email to confirm your account.</p>
        <p className="mt-1 text-sm text-muted">Then return here to sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
          aria-describedby={error ? "signup-error" : undefined}
          className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="beyonder@tingen.city"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "signup-error" : undefined}
          className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p id="signup-error" role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-amber px-4 py-2 font-medium text-background transition-colors hover:bg-gold disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
