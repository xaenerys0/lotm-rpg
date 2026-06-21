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
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      {/* Soft accent aura — clean, single, subtle. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(224,167,60,0.12), transparent 65%)",
        }}
      />

      <div className="animate-fade-in-up w-full max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium tracking-wide text-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber" />
          AI-narrated · Single-player · One timeline
        </span>

        <h1 className="mt-8 font-serif text-5xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-7xl">
          Lord of the{" "}
          <span className="bg-gradient-to-r from-gold to-amber bg-clip-text text-transparent">
            Mysteries
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          Draw the potion, act the part, and author an alternative timeline. A browser RPG
          where every choice is yours alone — and permanent.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-lg bg-amber px-7 py-3.5 text-base font-semibold text-background transition-all duration-200 hover:bg-gold hover:shadow-[0_12px_32px_-12px_rgba(224,167,60,0.6)] sm:w-auto"
          >
            Begin your chronicle
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface/50 px-7 py-3.5 text-base font-medium text-foreground transition-colors duration-200 hover:border-amber/50 hover:bg-surface sm:w-auto"
          >
            Sign in
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border text-center"
        >
          {[
            ["22", "Pathways"],
            ["5", "Epochs"],
            ["∞", "Timelines"],
          ].map(([n, label]) => (
            <div key={label} className="bg-surface px-4 py-5">
              <div className="font-serif text-2xl font-semibold text-amber">{n}</div>
              <div className="mt-1 text-xs tracking-wide text-muted uppercase">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
