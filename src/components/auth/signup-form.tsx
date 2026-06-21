"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const labelClass = "block text-sm font-medium text-foreground";
const inputClass =
  "mt-1.5 block w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-foreground placeholder:text-muted transition-colors focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30";

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
        className="rounded-lg border border-amber/30 bg-amber/5 p-4 text-center"
      >
        <p className="font-medium text-foreground">
          Check your email to confirm your account.
        </p>
        <p className="mt-1 text-sm text-muted">Then return here to sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
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
          className={inputClass}
          placeholder="beyonder@tingen.city"
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
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
          className={inputClass}
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p id="signup-error" role="alert" className="text-sm text-crimson">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber px-4 py-2.5 font-semibold text-background transition-colors hover:bg-gold disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
