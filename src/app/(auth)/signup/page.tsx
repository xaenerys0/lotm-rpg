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
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-tight text-foreground transition-colors hover:text-amber"
          >
            Lord of the Mysteries
          </Link>
          <div
            aria-hidden="true"
            className="mx-auto mt-4 flex max-w-[12rem] items-center gap-3"
          >
            <span className="gilt-rule flex-1" />
            <span className="text-sm text-amber">✦</span>
            <span className="gilt-rule flex-1" />
          </div>
        </div>

        <div className="grimoire-frame animate-fade-in-up rounded-md p-7 sm:p-9">
          <h1 className="font-serif text-2xl font-semibold text-amber">
            Begin as a Beyonder
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Your choices will carve an alternative timeline.
          </p>
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already walking the path?{" "}
          <Link href="/login" className="text-amber underline hover:text-gold">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
