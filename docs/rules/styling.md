# Styling Rules

## Tailwind CSS v4

- Uses `@tailwindcss/postcss` plugin (not the v3 PostCSS plugin). Config is in `postcss.config.mjs`.
- Theme tokens are defined with `@theme inline` in `src/app/globals.css` — not in a `tailwind.config` file.
- No component libraries (no shadcn, no MUI). Use Tailwind utility classes directly.

## Theme Tokens

Victorian steampunk dark palette. Key tokens:

- `background` (#0c0a09), `surface` (#1c1917), `foreground` (#e7e5e4)
- Accents: `amber`, `gold`, `copper`, `gaslight`
- Semantic: `crimson` (danger), `occult` (supernatural), `fog` (muted)
- `sanity-high/mid/low/critical` for game sanity meter
- Fonts: `serif` (Lora), `sans` (Geist), `mono` (Geist Mono)
- `container-game` (1200px max width)

## Conventions

- Use theme tokens (`text-foreground`, `bg-surface`) instead of raw Tailwind colors.
- Keep the dark aesthetic — backgrounds are near-black, text is warm gray, accents are amber/gold.
