import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameSidebar } from "@/components/game/game-sidebar";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <GameSidebar userEmail={data.user.email ?? ""} />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-14 md:ml-64 md:pt-0">
        {children}
      </main>
    </div>
  );
}
