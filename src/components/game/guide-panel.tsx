import Link from "next/link";
import type { Route } from "next";

// The Guide (onboarding reference): an always-available, browsable manual that
// orients a new player to where things live in the interface and how a turn
// plays out. On-demand only (reached from the sidebar) — it never auto-opens.
// A Server Component by design: all disclosures are native <details>/<summary>,
// so the page needs no client JS and gets keyboard/AT semantics for free.

type Step = { title: string; body: string; href: Route; cta: string };

const FIRST_STEPS: Step[] = [
  {
    title: "Bind a narrator",
    body: "The story is told by an AI of your choosing. Open Settings and add a provider key (yours, kept only in this browser). Without one the world stays silent.",
    href: "/settings",
    cta: "Open Settings",
  },
  {
    title: "Begin a chronicle",
    body: "From the Dashboard, start a new game. Let the prologue divine your pathway from your choices, or pick one by hand — then choose your era, name yourself, and set where the tale opens.",
    href: "/play",
    cta: "Open Dashboard",
  },
  {
    title: "Live the turn",
    body: "Read the scene, act through the offered choices or by typing your own intent, and weigh what follows. Repeat — and let the chronicle grow toward your apotheosis.",
    href: "/play",
    cta: "Open Dashboard",
  },
];

type Phase = { name: string; body: string };

const TURN_PHASES: Phase[] = [
  {
    name: "Situation",
    body: "The narrator sets the scene — a place, a tension, the people in the room.",
  },
  {
    name: "Choices",
    body: "Pick an offered action, type your own intent, parley, investigate, perform a ritual, or draw steel in combat.",
  },
  {
    name: "Consequences",
    body: "The world answers. Items, wounds, standing, and your grip on sanity all shift from what you did.",
  },
];

type Destination = { title: string; blurb: string; href: Route };

// One entry per sidebar destination — the "where do I find things" map. Order
// mirrors the sidebar so the reference reads the same way the nav does.
const DESTINATIONS: Destination[] = [
  {
    title: "Dashboard",
    blurb:
      "Your starting hall. Begin a new chronicle, continue a saved one, or manage and delete characters. The live game loop — situation, choices, consequences, combat, advancement — also plays out here.",
    href: "/play",
  },
  {
    title: "Character",
    blurb:
      "Your dossier. Powers earned across the Sequences, the acting method your potion demands, your condition, your True Self and the false faces you wear, the companions and pursuers at your heels, and everything in your pockets.",
    href: "/character",
  },
  {
    title: "Journal",
    blurb:
      "A chronicle that writes itself as you play. Add private annotations the narrator never sees, filter by event, and export the whole record as Markdown.",
    href: "/journal",
  },
  {
    title: "Map",
    blurb:
      "A street-level gazetteer of your current city, marking where you stand and where you might travel. More of the world unfolds as your story moves.",
    href: "/map",
  },
  {
    title: "Glossary",
    blurb:
      "An in-world lexicon. Entries unseal as you advance — deeper truths stay hidden until you are ready to know them, so it never spoils the road ahead.",
    href: "/glossary",
  },
  {
    title: "Market",
    blurb:
      "A trading post between timelines. List reagents for other players, buy what your next potion needs, or sell mundane belongings to the fence for quick funds.",
    href: "/market",
  },
  {
    title: "Profile",
    blurb:
      "Your showcase — achievements, divergence from canon, and public stats. Private by default; publish it deliberately when you want to be seen.",
    href: "/profile",
  },
  {
    title: "Leaderboard",
    blurb:
      "The standings of published showcases, ranked by sequence reached, achievements earned, or how far your timeline has diverged. Filterable by pathway.",
    href: "/leaderboard",
  },
  {
    title: "Society",
    blurb:
      "The Gathering — find a pathway-fitting secret society, extend invitations, and convene above the gray fog to trade intel, favours, and goods.",
    href: "/society",
  },
  {
    title: "Settings",
    blurb:
      "Bind your AI narrator (provider, key, model) and tune what you see — the sanity and digestion meters, scene art, movement realism, and high-contrast mode.",
    href: "/settings",
  },
];

type Concept = { term: string; meaning: string };

const CONCEPTS: Concept[] = [
  {
    term: "Sanity",
    meaning:
      "Your mind's hold against the uncanny. It is felt before it is numbered — the screen itself distorts as it frays. Lose it entirely and you lose control. Reveal the meter in Settings if you prefer hard figures.",
  },
  {
    term: "Digestion",
    meaning:
      "A drunk potion must be digested before you can climb again — fed by acting in the manner your Sequence demands. The meter stays hidden until you discover your acting method.",
  },
  {
    term: "Advancement",
    meaning:
      "Climbing a Sequence needs the right potion fully digested, its ingredients in hand, and — from Sequence 5 — a ritual. Reach too far unprepared and the attempt can break you.",
  },
  {
    term: "Secrecy",
    meaning:
      "Beyonders hide in plain sight. Craft identities, switch faces, and mind who might recognise the self beneath the mask — exposure has consequences.",
  },
];

function Ornament() {
  return (
    <span className="text-muted/40" aria-hidden="true">
      ◆
    </span>
  );
}

export function GuidePanel() {
  return (
    <div className="space-y-14">
      {/* Lede — a gaslit page of the almanac. */}
      <section className="parchment gaslit rounded-lg border border-amber/15 px-6 py-7 sm:px-8 sm:py-8">
        <p className="font-serif text-lg leading-relaxed text-foreground sm:text-xl">
          Welcome, would-be Beyonder. This is a single-player, AI-narrated descent into
          the world of the Mysteries — your choices spin an alternative timeline all your
          own.
        </p>
        <p className="mt-3 text-muted">
          The pages below show where everything lives and how a turn unfolds. Keep this
          guide bookmarked from the sidebar — it is always one click away.
        </p>
      </section>

      {/* First steps — illuminated, numbered. */}
      <section aria-labelledby="guide-first-steps">
        <header className="mb-5 flex items-center gap-3">
          <h2
            id="guide-first-steps"
            className="font-serif text-2xl font-bold tracking-tight text-amber"
          >
            First steps
          </h2>
          <span
            className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
            aria-hidden="true"
          />
        </header>
        <ol className="space-y-3" role="list">
          {FIRST_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-lg border border-border bg-surface/40 p-4 sm:p-5"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber/40 font-serif text-lg font-bold text-gaslight"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-lg text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                <Link
                  href={step.href}
                  className="mt-2 inline-flex min-h-[24px] items-center gap-1 text-sm font-medium text-amber hover:text-gold hover:underline"
                >
                  {step.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* How a turn works — a three-beat flow. */}
      <section aria-labelledby="guide-turn">
        <header className="mb-5 flex items-center gap-3">
          <h2
            id="guide-turn"
            className="font-serif text-2xl font-bold tracking-tight text-amber"
          >
            How a turn works
          </h2>
          <span
            className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
            aria-hidden="true"
          />
        </header>
        <ol className="grid gap-3 sm:grid-cols-3" role="list">
          {TURN_PHASES.map((phase, i) => (
            <li
              key={phase.name}
              className="relative rounded-lg border border-border bg-surface/40 p-5"
            >
              <span className="text-xs tracking-widest text-muted uppercase">
                Phase {i + 1}
              </span>
              <h3 className="mt-1 font-serif text-lg text-gaslight">{phase.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{phase.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Sanity and potion digestion are felt more than shown — the world warps and the
          prose darkens as they shift. Prefer plain numbers? Turn the meters on in{" "}
          <Link href="/settings" className="font-medium text-amber hover:underline">
            Settings
          </Link>
          .
        </p>
      </section>

      {/* Where to find things — the screen-by-screen map. */}
      <section aria-labelledby="guide-where">
        <header className="mb-5 flex items-center gap-3">
          <h2
            id="guide-where"
            className="font-serif text-2xl font-bold tracking-tight text-amber"
          >
            Where to find things
          </h2>
          <span
            className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
            aria-hidden="true"
          />
        </header>
        <p className="mb-4 text-sm text-muted">
          Every destination in the sidebar, in order. Expand a page to learn what it
          holds, then step into it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DESTINATIONS.map((dest) => (
            <details
              key={dest.href}
              className="group rounded-lg border border-border bg-surface/40 [&[open]]:border-amber/30"
            >
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-serif text-lg text-foreground">
                <span className="flex items-center gap-2.5">
                  <Ornament />
                  {dest.title}
                </span>
                <span
                  className="text-muted transition-transform duration-200 group-open:rotate-90"
                  aria-hidden="true"
                >
                  ›
                </span>
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-muted">{dest.blurb}</p>
                <Link
                  href={dest.href}
                  className="mt-3 inline-flex min-h-[24px] items-center gap-1 text-sm font-medium text-amber hover:text-gold hover:underline"
                >
                  Open {dest.title}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Active character — the single most common point of confusion. */}
      <section aria-labelledby="guide-active">
        <header className="mb-5 flex items-center gap-3">
          <h2
            id="guide-active"
            className="font-serif text-2xl font-bold tracking-tight text-amber"
          >
            One active character
          </h2>
          <span
            className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
            aria-hidden="true"
          />
        </header>
        <div className="rounded-lg border border-occult-bright/30 bg-occult/[0.06] p-5">
          <p className="leading-relaxed text-foreground">
            The selector near the top of the sidebar sets your{" "}
            <strong className="text-occult-bright">active character</strong>. Every page —
            Character, Journal, Map, Glossary, Market, Society, Profile — shows that{" "}
            <em>same</em> Beyonder. If a screen looks like the wrong person, you have
            another character selected: switch them in the sidebar and every page follows.
          </p>
        </div>
      </section>

      {/* Concepts & tips. */}
      <section aria-labelledby="guide-concepts">
        <header className="mb-5 flex items-center gap-3">
          <h2
            id="guide-concepts"
            className="font-serif text-2xl font-bold tracking-tight text-amber"
          >
            Concepts &amp; tips
          </h2>
          <span
            className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
            aria-hidden="true"
          />
        </header>
        <dl className="grid gap-3 sm:grid-cols-2">
          {CONCEPTS.map((c) => (
            <div
              key={c.term}
              className="rounded-lg border border-border bg-surface/40 p-4"
            >
              <dt className="font-serif text-lg text-gaslight">{c.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">{c.meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Want the in-world lore behind these? The{" "}
          <Link href="/glossary" className="font-medium text-amber hover:underline">
            Glossary
          </Link>{" "}
          unseals it as your character grows.
        </p>
      </section>
    </div>
  );
}
