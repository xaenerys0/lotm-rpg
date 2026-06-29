import Link from "next/link";
import type { Route } from "next";
import type { CSSProperties, ReactNode } from "react";

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
      "Your dossier, kept in tabs — Overview, Self & Allies, Powers, Holdings, and a Codex. The powers earned across the Sequences and the role each demands, your condition, your True Self and the false faces you wear, the companions and pursuers at your heels, powers copied or stolen from other Beyonders, the anchors that steady a rising god, and everything in your pockets. The Codex keeps a running register of the people, places, and threads your story has raised, so a long chronicle never loses the thread.",
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
      "A street-level gazetteer of your current city, marking where you stand and the districts and farther cities you can set out for — your companions and pursuers travel with you when you move. More of the world, and the atlases of earlier eras, unfold as your story does.",
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
    title: "Guide",
    blurb:
      "This almanac. The first steps, how a turn unfolds, a map of every screen, and the core concepts of the world — always one click away in the sidebar.",
    href: "/guide",
  },
  {
    title: "Settings",
    blurb:
      "Bind your AI narrator (provider, key, model) and — separately — an image provider for optional scene art. Then tune what you see: narration length, the sanity and digestion meters, scene art, movement realism, and high-contrast mode. Every key stays in this browser, never on our servers.",
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
      "Climbing a Sequence is a deliberate ascent — secure the potion's formula (trade for it or seek it through the story), gather its ingredients (bought or hunted), perform the ritual from Sequence 5 on, then drink. Reach too far unprepared and the attempt can break you.",
  },
  {
    term: "Secrecy",
    meaning:
      "Beyonders hide in plain sight. Craft identities, switch faces, and mind who might recognise the self beneath the mask — exposure has consequences.",
  },
  {
    term: "Combat",
    meaning:
      "Fights are half-won before the first blow. Gather intel, ready the right ground, abilities, and artifacts, then trade tactical decisions. Push too hard and you risk losing control — but a measured line can subdue, free, or talk a foe down instead of killing.",
  },
  {
    term: "Anchors",
    meaning:
      "As you near godhood your power strains against your mind. Anchors — a treasured object, a place, or a congregation of believers — hold you steady. The higher Sequences demand them before you can rise.",
  },
  {
    term: "Acquired powers",
    meaning:
      "Some pathways and sealed relics let you copy, borrow, or outright steal another Beyonder's power. Most copies fade with time; a rare few can be bound for good. Manage them on the Character sheet.",
  },
  {
    term: "Companions & pursuers",
    meaning:
      "You never travel alone. Allies you recruit follow you across the map; pursuers the story sets on your trail follow too — until you shake them off. Tend the cast on the Character sheet.",
  },
];

// A small diamond glyph used as a list/summary marker — purely decorative.
function Ornament() {
  return (
    <span className="text-amber/70" aria-hidden="true">
      ◆
    </span>
  );
}

// The almanac's table of contents — also the in-page jump nav in the lede.
const CONTENTS: { id: string; numeral: string; label: string }[] = [
  { id: "guide-first-steps", numeral: "I", label: "First steps" },
  { id: "guide-turn", numeral: "II", label: "How a turn works" },
  { id: "guide-where", numeral: "III", label: "Where to find things" },
  { id: "guide-active", numeral: "IV", label: "One active character" },
  { id: "guide-concepts", numeral: "V", label: "Concepts & tips" },
];

// One consistent editorial section heading: a roman-numeral plate, a serif
// title, and the shared gilt hairline — matching the page's PageHeader voice.
function SectionHeading({
  id,
  numeral,
  children,
}: {
  id: string;
  numeral: string;
  children: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-end gap-3.5">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber/40 font-serif text-sm font-semibold text-amber"
      >
        {numeral}
      </span>
      <h2
        id={id}
        className="font-serif text-2xl font-semibold tracking-tight text-foreground"
      >
        {children}
      </h2>
      <span aria-hidden="true" className="gilt-rule mb-2.5 flex-1" />
    </header>
  );
}

// Stagger the page-load reveal: each section fades up a beat after the last,
// on the shared expo curve. Reduced-motion is neutralised globally (globals.css).
function revealAt(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

export function GuidePanel() {
  return (
    <div className="space-y-16">
      {/* Lede — the almanac's frontispiece, with a jump-to-section nav. */}
      <section
        className="parchment gaslit animate-fade-in-up relative overflow-hidden rounded-xl border border-border px-6 py-8 sm:px-10 sm:py-10"
        style={revealAt(40)}
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-amber uppercase">
          An almanac for the newly awakened
        </p>
        <p className="max-w-2xl font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
          Welcome, would-be Beyonder. This is a single-player, AI-narrated descent into
          the world of the Mysteries — your choices spin an alternative timeline all your
          own.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          The pages below show where everything lives and how a turn unfolds. Keep this
          guide bookmarked from the sidebar — it is always one click away.
        </p>
        <nav aria-label="In this guide" className="mt-7">
          <ul className="flex flex-wrap gap-2" role="list">
            {CONTENTS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="inline-flex min-h-[24px] items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-amber/40 hover:text-amber"
                >
                  <span aria-hidden="true" className="font-serif text-amber/80">
                    {c.numeral}
                  </span>
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* First steps — illuminated, numbered. */}
      <section
        aria-labelledby="guide-first-steps"
        className="animate-fade-in-up"
        style={revealAt(120)}
      >
        <SectionHeading id="guide-first-steps" numeral="I">
          First steps
        </SectionHeading>
        <ol className="space-y-3" role="list">
          {FIRST_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="grimoire-frame flex gap-4 rounded-xl p-4 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-amber/40 sm:p-5"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber/40 font-serif text-lg font-semibold text-gaslight"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                <Link
                  href={step.href}
                  className="mt-2.5 inline-flex min-h-[24px] items-center gap-1 text-sm font-medium text-amber hover:text-gold hover:underline"
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
      <section
        aria-labelledby="guide-turn"
        className="animate-fade-in-up"
        style={revealAt(200)}
      >
        <SectionHeading id="guide-turn" numeral="II">
          How a turn works
        </SectionHeading>
        <ol className="grid gap-3 sm:grid-cols-3" role="list">
          {TURN_PHASES.map((phase, i) => (
            <li
              key={phase.name}
              className="grimoire-frame relative overflow-hidden rounded-xl p-5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber/60 to-transparent"
              />
              <span className="text-xs tracking-widest text-muted uppercase">
                Phase {i + 1}
              </span>
              <h3 className="mt-1 font-serif text-lg font-semibold text-gaslight">
                {phase.name}
              </h3>
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
      <section
        aria-labelledby="guide-where"
        className="animate-fade-in-up"
        style={revealAt(280)}
      >
        <SectionHeading id="guide-where" numeral="III">
          Where to find things
        </SectionHeading>
        <p className="mb-4 text-sm text-muted">
          Every destination in the sidebar, in order. Expand a page to learn what it
          holds, then step into it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DESTINATIONS.map((dest) => (
            <details
              key={dest.href}
              className="group rounded-xl border border-border bg-surface transition-colors [&[open]]:border-amber/30"
            >
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-serif text-lg font-semibold text-foreground">
                <span className="flex items-center gap-2.5">
                  <Ornament />
                  {dest.title}
                </span>
                <span
                  className="text-amber transition-transform duration-200 group-open:rotate-90"
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
      <section
        aria-labelledby="guide-active"
        className="animate-fade-in-up"
        style={revealAt(360)}
      >
        <SectionHeading id="guide-active" numeral="IV">
          One active character
        </SectionHeading>
        <div className="relative overflow-hidden rounded-xl border border-occult-bright/30 bg-occult/[0.06] p-5 sm:p-6">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 bg-occult-bright/50"
          />
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
      <section
        aria-labelledby="guide-concepts"
        className="animate-fade-in-up"
        style={revealAt(440)}
      >
        <SectionHeading id="guide-concepts" numeral="V">
          Concepts &amp; tips
        </SectionHeading>
        <dl className="grid gap-3 sm:grid-cols-2">
          {CONCEPTS.map((c) => (
            <div
              key={c.term}
              className="rounded-xl border border-border border-l-2 border-l-amber/40 bg-surface p-4 transition-colors hover:border-l-amber"
            >
              <dt className="font-serif text-lg font-semibold text-gaslight">{c.term}</dt>
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
