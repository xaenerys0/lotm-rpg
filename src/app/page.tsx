import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // Reading auth cookies makes this route dynamic (no extra `headers()` call
  // needed). An already-signed-in player should land straight in the game.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/play");
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="fog-overlay relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      {/* Faint sigil ring behind the title — decorative gaslight bloom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.5]"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(242,207,107,0.10), transparent 60%)",
        }}
      />

      <div className="animate-fade-in-up w-full max-w-2xl text-center">
        <p className="mb-6 text-[0.7rem] font-medium tracking-[0.5em] text-amber uppercase">
          A Chronicle of the Beyond
        </p>

        <h1 className="gaslit relative font-serif text-5xl leading-[0.95] font-semibold tracking-tight text-foreground sm:text-7xl">
          <span className="block text-2xl font-normal tracking-[0.2em] text-muted uppercase sm:text-3xl">
            Lord of the
          </span>
          <span className="candle-flicker mt-2 block bg-gradient-to-b from-gold via-amber to-copper bg-clip-text text-transparent">
            Mysteries
          </span>
        </h1>

        <div aria-hidden="true" className="mx-auto my-9 flex max-w-xs items-center gap-4">
          <span className="gilt-rule flex-1" />
          <span className="text-base text-amber">✦</span>
          <span className="gilt-rule flex-1" />
        </div>

        <p className="mx-auto max-w-md font-serif text-lg leading-relaxed text-muted sm:text-xl">
          A single-player, AI-narrated RPG. Draw the potion, act the part, and author an
          alternative timeline that no other Beyonder will ever read.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center rounded-sm border border-gold/40 bg-gradient-to-b from-amber to-copper px-8 py-3.5 font-serif text-base font-semibold text-background shadow-[0_10px_30px_-12px_rgba(200,154,60,0.7)] transition-all duration-200 hover:from-gold hover:to-amber hover:shadow-[0_14px_36px_-12px_rgba(231,197,115,0.8)]"
          >
            Begin Your Chronicle
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-sm border border-border px-8 py-3.5 font-serif text-base text-foreground transition-colors duration-200 hover:border-amber/60 hover:text-amber"
          >
            Return to the Fog
          </Link>
        </div>

        <p className="mt-10 text-xs tracking-[0.3em] text-muted uppercase">
          Fifth Epoch · Backlund · Tingen
        </p>
      </div>
    </main>
  );
}
