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
      className="flex min-h-screen items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-tight text-foreground transition-colors hover:text-amber"
          >
            Lord of the{" "}
            <span className="bg-gradient-to-r from-gold to-amber bg-clip-text text-transparent">
              Mysteries
            </span>
          </Link>
        </div>

        <div className="grimoire-frame animate-fade-in-up rounded-2xl p-7 sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Sign in to continue your chronicle.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-medium text-amber hover:text-gold">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
