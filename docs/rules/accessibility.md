# Accessibility Rules

The UI targets **WCAG 2.2 Level AA**. Treat accessibility as a requirement, not
a polish step — keep it in mind whenever you add or modify frontend code
(components, pages, layouts, `globals.css`).

## Non-negotiables when writing/editing UI

- **Accessible names (4.1.2).** Every interactive control needs an accessible
  name. Prefer a visible `<label htmlFor>`; otherwise use `aria-label`. Inputs
  inside a `<fieldset>`/`<legend>` still need their own name. Icon-only buttons
  must have `aria-label`.
- **State (4.1.2).** Don't signal state with colour/position alone. Use
  `aria-pressed` (toggles), `aria-checked` + `role="switch"` (switches),
  `aria-current="page"` (active nav), `aria-expanded`/`aria-controls`
  (disclosure), `role="progressbar"` + `aria-valuenow/min/max/valuetext`
  (meters/bars).
- **Status & errors (4.1.3 / 3.3.1).** Announce async changes and validation:
  wrap transient status in `role="status"` (polite) and errors in
  `role="alert"` (assertive). Associate field errors with `aria-describedby`
  and set `aria-invalid` on the field.
- **Forms (1.3.5 / 3.3.8).** Set `autocomplete` (`email`, `current-password`,
  `new-password`, …). Never block paste on password fields.
- **Contrast (1.4.3).** Readable text ≥ 4.5:1 (≥ 3:1 for large text ≥ 24px or
  ≥ 18.66px bold). On the near-black theme this means **don't fade meaningful
  text with low opacity** (`text-muted/40`, `text-foreground/50`,
  `text-amber/50`, …). Use solid tokens for content; use `text-occult-bright`
  (not `text-occult`) for occult-coloured text. See `docs/rules/styling.md`.
- **Decorative content (1.1.1).** Mark purely decorative icons, glyphs,
  dividers, ornaments, dots, and loader visuals with `aria-hidden="true"` so
  screen readers skip them. Adjacent real text must carry the meaning.
- **Focus (2.4.7 / 2.4.11).** Never remove focus indicators. A global
  `:focus-visible` ring lives in `globals.css` (and uses `!important` to beat
  `focus:outline-none` utilities) — rely on it; don't reintroduce
  `outline: none` on `:focus-visible`.
- **Motion (2.2.2 / 2.3.3).** `globals.css` neutralises animation/transition
  under `prefers-reduced-motion: reduce` globally; new animations inherit this.
  Don't add motion that bypasses it.
- **Target size (2.5.8).** Interactive controls ≥ 24×24px (or satisfy the
  spacing exception). Small text buttons use `min-h-[24px]`.
- **Structure (1.3.1 / 2.4.x).** One `<h1>` per page with a logical heading
  order (don't use heading tags for branding/chrome). Use landmarks (`<main
id="main-content">`, `<nav>`, `<aside>`); the root layout's skip link targets
  `#main-content`. Give each route a descriptive `<title>` via page `metadata`.

## Testing

- An axe-core suite renders key components/pages in jsdom and asserts no
  WCAG A/AA violations: `src/test/a11y.test.tsx` via the `expectNoAxeViolations`
  helper in `src/test/axe.ts`. Add a case there when you add a new screen or a
  significant interactive component.
- jsdom can't compute layout/colour, so axe's `color-contrast` rule is disabled
  in that harness — verify contrast against the tokens, and spot-check new
  colour combinations with a real-browser tool (axe DevTools / Lighthouse).
