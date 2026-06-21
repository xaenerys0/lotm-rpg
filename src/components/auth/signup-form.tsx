"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const labelClass =
  "block font-mono text-xs font-semibold tracking-[0.15em] text-muted uppercase";
const inputClass =
  "mt-2 block w-full border-2 border-border bg-surface-raised px-3.5 py-2.5 font-sans text-foreground placeholder:text-muted focus:border-amber focus:outline-none";

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
      <div role="status" className="border-2 border-amber bg-amber/10 p-5 text-center">
        <p className="font-serif text-2xl font-bold tracking-tight text-foreground uppercase">
          Check your email
        </p>
        <p className="mt-1 font-sans text-sm text-muted">
          Confirm your account, then return here to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <p id="signup-error" role="alert" className="font-mono text-sm text-crimson">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full border-2 border-border bg-amber px-4 py-3 font-mono text-sm font-bold tracking-[0.15em] text-surface uppercase shadow-[5px_5px_0_0_var(--color-border)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-border)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[5px_5px_0_0_var(--color-border)]"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
