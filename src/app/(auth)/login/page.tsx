import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/play");
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="fog-overlay flex min-h-screen items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="font-mono text-xs tracking-[0.2em] text-amber uppercase hover:underline"
          >
            ← Lord of the Mysteries
          </Link>
        </div>

        <div className="grimoire-frame animate-fade-in-up p-7 sm:p-9">
          <h1 className="font-serif text-4xl font-black tracking-tight text-foreground uppercase">
            Resume Chronicle
          </h1>
          <div aria-hidden="true" className="gilt-rule my-5" />
          <LoginForm />
        </div>

        <p className="mt-6 font-mono text-xs tracking-wide text-muted uppercase">
          No account?{" "}
          <Link href="/signup" className="text-amber underline hover:text-gold">
            Draw your first potion
          </Link>
        </p>
      </div>
    </main>
  );
}
