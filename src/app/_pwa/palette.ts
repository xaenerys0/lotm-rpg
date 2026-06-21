// Shared PWA palette — mirrors the theme tokens in `globals.css`. These literal
// hex values are needed in the places CSS custom properties can't reach:
// `ImageResponse` (Satori) icon rendering, inline SVG fills, and the web app
// manifest. Keep in sync with `--color-background/-amber/-gaslight`.
export const PWA_COLORS = {
  background: "#e8e1d0", // --color-background
  amber: "#a81f17", // --color-amber
  gaslight: "#14110a", // --color-gaslight
} as const;
