import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // Reading auth cookies makes this route dynamic. A signed-in player lands
  // straight in the game.
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
      className="fog-overlay flex min-h-screen flex-col px-5 py-8 sm:px-10 sm:py-12"
    >
      {/* Masthead rule */}
      <div className="flex items-center justify-between border-b-2 border-border pb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">
        <span>No. V — Fifth Epoch</span>
        <span className="hidden sm:inline">A Beyonder Field Manual</span>
        <span>Est. Tingen</span>
      </div>

      <div className="flex flex-1 flex-col justify-center py-12">
        <div className="animate-fade-in-up max-w-4xl">
          <p className="mb-4 inline-block border-2 border-amber px-3 py-1 font-mono text-[0.7rem] font-semibold tracking-[0.25em] text-amber uppercase">
            An AI-narrated RPG
          </p>

          <h1 className="font-serif leading-[0.82] font-black tracking-tight text-foreground uppercase">
            <span className="block text-6xl sm:text-8xl lg:text-9xl">Lord of</span>
            <span className="block text-6xl sm:text-8xl lg:text-9xl">the</span>
            <span className="block text-6xl text-amber sm:text-8xl lg:text-9xl">
              Mysteries
            </span>
          </h1>

          <div aria-hidden="true" className="gilt-rule my-8 max-w-2xl" />

          <p className="max-w-xl font-sans text-lg leading-relaxed text-foreground sm:text-xl">
            Draw the potion. Act the part. Endure the digestion. Every choice carves an
            alternative timeline that no other Beyonder will ever read — and a single
            misstep can end the chronicle for good.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center border-2 border-border bg-amber px-8 py-3.5 font-mono text-sm font-bold tracking-[0.15em] text-surface uppercase shadow-[6px_6px_0_0_var(--color-border)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_var(--color-border)]"
            >
              Begin Your Chronicle
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border-2 border-border bg-surface px-8 py-3.5 font-mono text-sm font-bold tracking-[0.15em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-surface"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer rule */}
      <div className="border-t-2 border-border pt-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">
        Twenty-two Pathways · One Timeline · Permadeath
      </div>
    </main>
  );
}
