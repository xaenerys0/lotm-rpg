---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### Anti-Convergence (READ THIS FIRST)

You naturally converge toward generic, "on distribution" outputs. In frontend design this creates what users call the "AI slop" aesthetic. This is the single most important thing to fight against.

**Banned font families** — never use these: Inter, Roboto, Arial, system-ui, -apple-system, or any other system/sans-serif fallback as a primary typeface. **Also avoid Space Grotesk** and other fonts that have become AI-generation clichés.

**Banned color patterns** — never use these: purple-on-white gradients, teal/coral "startup" palettes, generic blue primary + grey secondary, or any palette that looks like a SaaS landing page template.

**Banned layouts** — never use: hero-with-centered-text-then-three-cards, generic navbar+content+footer with no personality, default shadcn/Tailwind component styling without significant visual transformation.

Every generation must feel like it was designed by a human with a specific point of view, not assembled from a template.

### Typography

Choose fonts that are **beautiful, unique, and interesting**. Unexpected, characterful font choices are a primary differentiator. Guidelines:
- Pair a distinctive **display font** (for headings/UI chrome) with a refined **body font** (for readable text)
- Draw from the full spectrum: slab serifs, geometric display, condensed grotesque, humanist serif, monospace, variable, hand-lettered, editorial
- Consider the cultural or historical register of the font — does it match the tone?
- Load from Google Fonts, Adobe Fonts, or use @font-face declarations

### Color & Theme

Commit fully to a **cohesive aesthetic**. Use CSS custom properties (`--color-*` variables) for consistency across the design.

Guidelines:
- **Dominant + sharp accent** outperforms timid evenly-distributed palettes. Pick 1–2 dominant colors and 1 unexpected accent.
- Draw from **IDE themes** (Dracula, Nord, Gruvbox, Tokyo Night, Catppuccin, Solarized, Monokai) for dark theme inspiration
- Draw from **cultural aesthetics** (brutalism, Swiss grid, Y2K, vaporwave, risograph print, Wabi-sabi, De Stijl, Bauhaus) for unexpected combinations
- Vary between light and dark themes — don't default to dark because it feels "techy"
- High contrast between foreground and background creates clarity and drama

### Motion

Use animations for effects and micro-interactions. Guidelines:
- **Prioritize CSS-only** solutions for HTML artifacts
- Use the **Motion library** for React when available (`import { motion } from "motion/react"`)
- Focus on **high-impact moments**: one well-orchestrated page load with staggered reveals (`animation-delay`) creates more delight than scattered micro-interactions everywhere
- Use scroll-triggered animations and hover states that genuinely surprise
- Timing functions matter: `cubic-bezier` curves over `ease` or `linear` defaults
- Match motion intensity to overall aesthetic — a brutalist design gets sharp snaps; a luxury design gets slow, weighty transitions

### Backgrounds & Visual Atmosphere

Create **depth and atmosphere** rather than defaulting to flat solid colors. Options:
- CSS gradient meshes and radial gradients layered with `mix-blend-mode`
- Geometric SVG patterns tiled via `background-image`
- Grain/noise overlays using CSS `filter` or SVG `feTurbulence`
- Contextual effects that match the aesthetic (scanlines for retro, paper texture for editorial, etc.)
- Dramatic shadows (`box-shadow` with large spreads and color) to create depth

### Spatial Composition

- **Asymmetry** and overlap over rigid grid alignment
- **Diagonal flow**, rotated elements, off-canvas bleeds
- Generous negative space OR controlled density — never the mushy middle
- Grid-breaking elements that escape their containers
- Unexpected proportions (very tall headers, very narrow sidebars, full-bleed imagery)

## Implementation Notes

**Match complexity to vision**: Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well — not from adding more.

**No design should be the same.** Each generation is a new creative problem. Resist the pull toward familiar solutions. The goal is that someone looking at 10 outputs side-by-side should see 10 genuinely different design sensibilities.

Remember: extraordinary creative work is possible. Don't hold back — show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
