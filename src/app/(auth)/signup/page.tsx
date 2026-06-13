import type { Metadata } from "next";
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
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8"
    >
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-surface p-6 shadow-lg sm:p-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-amber">
            Lord of the Mysteries
          </h1>
          <p className="mt-2 text-sm text-muted">Begin your journey as a Beyonder</p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <a href="/login" className="text-amber hover:text-gold underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
