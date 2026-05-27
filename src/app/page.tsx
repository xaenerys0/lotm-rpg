import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl space-y-8 text-center">
        <h1 className="font-serif text-5xl font-bold tracking-tight text-amber md:text-6xl">
          Lord of the Mysteries
        </h1>
        <p className="font-serif text-xl text-muted">
          A single-player, AI-narrated browser RPG.
          <br />
          Your choices create an alternative timeline.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded bg-amber px-6 py-3 font-medium text-background transition-colors hover:bg-gold"
          >
            Begin Your Journey
          </Link>
          <Link
            href="/login"
            className="rounded border border-border px-6 py-3 font-medium text-foreground transition-colors hover:border-amber hover:text-amber"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
