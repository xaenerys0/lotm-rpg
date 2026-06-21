import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign Up" };

export default async function SignupPage() {
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
            Begin as a Beyonder
          </h1>
          <div aria-hidden="true" className="gilt-rule my-5" />
          <SignupForm />
        </div>

        <p className="mt-6 font-mono text-xs tracking-wide text-muted uppercase">
          Already on the path?{" "}
          <Link href="/login" className="text-amber underline hover:text-gold">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
