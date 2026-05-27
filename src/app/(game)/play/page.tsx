import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PlayPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="font-serif text-4xl font-bold text-amber">
          Welcome, Beyonder
        </h1>
        <p className="text-muted">
          The game world is being constructed. Your journey will begin soon.
        </p>
        <p className="text-sm text-fog">
          Signed in as {data.user.email}
        </p>
      </div>
    </main>
  );
}
