# Styling Rules

## Tailwind CSS v4

- Uses `@tailwindcss/postcss` plugin (not the v3 PostCSS plugin). Config is in `postcss.config.mjs`.
- Theme tokens are defined with `@theme inline` in `src/app/globals.css` — not in a `tailwind.config` file.
- No component libraries (no shadcn, no MUI). Use Tailwind utility classes directly.

## Theme Tokens

Victorian steampunk dark palette. Key tokens:

- `background` (#0c0a09), `surface` (#1c1917), `foreground` (#e7e5e4)
- `muted` (#8a8178) — secondary text. Tuned to clear WCAG AA (4.5:1) at full
  opacity on both `background` and `surface`.
- Accents: `amber`, `gold`, `copper`, `gaslight`
- Semantic: `crimson` (danger), `occult` (supernatural), `fog` (muted)
- `occult-bright` (#a78bfa) — use for occult-tinted **text**. Plain `occult`
  (#7c3aed) only meets the 3:1 non-text threshold (fine for bars/glyphs), so it
  fails for body text.
- `sanity-high/mid/low/critical` for game sanity meter
- Fonts: `serif` (Lora), `sans` (Geist), `mono` (Geist Mono)
- `container-game` (1200px max width)

## Conventions

- Use theme tokens (`text-foreground`, `bg-surface`) instead of raw Tailwind colors.
- Keep the dark aesthetic — backgrounds are near-black, text is warm gray, accents are amber/gold.

## Accessibility (WCAG 2.2 AA)

The app targets WCAG 2.2 AA. Keep new UI compliant:

- **Contrast (1.4.3):** readable text needs ≥4.5:1 (≥3:1 for ≥24px / ≥18.66px-bold
  large text). On the near-black background this means **don't fade meaningful
  text with low opacity** — `text-muted/40`, `text-foreground/50`, `text-amber/50`,
  etc. fail. Use solid tokens for content; reserve opacity for genuinely
  decorative, `aria-hidden` flourishes (dividers, glyphs, the ◆ ornaments).
  For occult-coloured text use `text-occult-bright`, not `text-occult`.
- **Focus (2.4.7 / 2.4.11):** `globals.css` applies one global `:focus-visible`
  ring (gaslight, 2px, offset). It uses `!important` so it always wins over
  `focus:outline-none` utilities — don't fight it with custom focus removal.
- **Reduced motion (2.2.2 / 2.3.3):** `globals.css` neutralises animations and
  transitions under `prefers-reduced-motion: reduce` globally. New looping/entry
  animations inherit this automatically.
- **Names & state (4.1.2):** every control needs an accessible name (`<label
htmlFor>`, or `aria-label`). Expose toggle/selection state with `aria-pressed`
  / `aria-checked`, progress bars with `role="progressbar"` + `aria-valuenow`,
  and announce async status/errors with `role="status"` / `role="alert"`.
- **Target size (2.5.8):** interactive controls should be ≥24×24px (or rely on
  the spacing exception). Small text buttons use `min-h-[24px]`.
- Decorative icons/SVGs/symbols carry `aria-hidden="true"`; the `<main>` on every
  page has `id="main-content"` for the root-layout skip link.

## Sanity Effects (issue #9)

- `globals.css` defines `.sanity-fx` + `.sanity-fx-{high,medium,low,critical}` (filter/animation per tier) and `.sanity-overlay` (vignette/corruption layer). These are applied by `SanityEffects` from the classes returned by `sanityEffects()` in `@/lib/game` — do not hard-code tier styling elsewhere.
- Animations honour `prefers-reduced-motion: reduce` (static colour shift retained, motion dropped). Keep any new sanity effects behind that media query too.
