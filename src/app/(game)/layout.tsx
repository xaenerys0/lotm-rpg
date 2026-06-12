import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameSidebar } from "@/components/game/game-sidebar";
import { PreferenceEffects } from "@/components/game/preference-effects";
import { MobileNav } from "@/components/game/mobile-nav";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="fog-overlay flex min-h-screen">
      <PreferenceEffects />
      <GameSidebar userEmail={data.user.email ?? ""} />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 pt-14 pb-20 md:ml-64 md:pt-0 md:pb-0"
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
