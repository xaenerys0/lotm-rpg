import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/play");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-surface p-8 shadow-lg">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-amber">
            Lord of the Mysteries
          </h1>
          <p className="mt-2 text-sm text-muted">
            Enter the world of Beyonders
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted">
          No account?{" "}
          <a href="/signup" className="text-amber hover:text-gold underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
