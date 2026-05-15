---
title: Customization
description: Learn how to customize fonts, colors, and styling to make your website unique
keywords: customization, styling, fonts, colors, CSS, theme
---

# Customization Guide

This guide will help you customize the look and feel of your Gorky website. **Colors** are driven by CSS variables in `styles/themes/<palette>.css`; **`theme`** in **`site-config.js`** selects which palette loads. **Typography and layout hooks** that consume those variables live in `styles/theme-shell.css`.

## Link previews when sharing URLs

All generated pages include **Open Graph** and **Twitter Card** meta tags for Discord, X/Twitter, Slack, etc.:

- **`title`** and **`description`** come from each page’s markdown frontmatter when set, otherwise from `site-config.js`.
- **`thumbnail`** in frontmatter (optional on posts/pages that support YAML) sets the preview image (`og:image`).
- If there is no thumbnail, previews use **`site-config.js`** **`avatar`** (your portrait/site image), then **`favicon`**, then **`appleTouchIcon`**.

Set **`baseUrl`** to your deployed site (including `/deliver` when needed) so image URLs resolve correctly for crawlers.

## Theming: palettes and `site-config.js`

**Switch built-in palettes** by setting `theme` in `site-config.js` (no `.css` suffix):

- `default` — warm paper / stone sidebar  
- `thematrix`, `hacker` — terminal / phosphor  
- `desert`, `earthy`, `candy`, `dollhouse` — earthy or playful  
- `simple-light`, `simple-dark` — minimal  
- `pulpfiction` — bold retro contrast  
- `typewriter` — aged paper & ribbon red  
- `magazine` — editorial black rail & red accent  
- `frost` — cool ice & teal  
- `forest` — evergreen rail & moss  
- `futurism` — art deco gold & espresso  
- `cyberpunk` — neon on violet black  
- `fallout` — Pip-Boy green phosphor on vault black  
- `rustpunk` — copper, rust, industrial smoke  
- `utopia` — bright white-sky calm  
- `hellhole` — ember reds on scorched black  
- `vicecity` — 80s Miami neon dusk  
- `ocean` — bright surface sea & teal rail  
- `underwater` — deep blue abyss & cyan glow  
- `coralreef` — sand shoal, reef teal, coral pink  
- `finding-nemo` — playful reef blue, orange & purple pop  

Each palette file under **`styles/themes/`** contains **only** a `:root { ... }` block (font weights and `--color-*` variables). **`styles/theme-shell.css`** applies those variables to the sidebar, content area, links, and blockquotes.

To add your own palette, copy **`styles/themes/default.css`** to **`styles/themes/mybrand.css`** (use letters, digits, hyphen, underscore only in the filename), and set **`theme: 'mybrand'`** in **`site-config.js`**. It loads automatically at build time.

Set optional **`themeOptions`** to an array of theme ids (strings). When present, a **Theme** dropdown appears **above the sidebar footer** so visitors can switch `styles/themes/<id>.css` in the browser.

- The choice is saved in **`localStorage`** under the key **`gorky-theme`** and reapplied on the next visit **only if** that id is still allowed.
- **Allowed ids** are every entry in **`themeOptions`** (after normalisation: trimmed, optional `.css` stripped, letters / digits / `-` / `_` only), **plus** the built‑in **`theme`** value from config—which is always permitted even if omitted from the array.
- If `localStorage` is unavailable or the stored id is no longer allowed, the page keeps the stylesheet from the last build (`theme` in `site-config.js`).

### Palette variables for carousels and code

Besides layout colors, palette files can define tokens used in **`styles/content.css`**:

**Image carousels** (HTML `splide` + `gorky-carousel`; see *Writing a post*):

| Variable | Role |
|----------|------|
| `--color-carousel-bg` | Carousel panel background |
| `--color-carousel-arrow-bg` | Prev/next button background |
| `--color-carousel-arrow-bg-hover` | Arrow hover background |
| `--color-carousel-arrow-icon` | Chevron `fill` (SVG) |
| `--color-carousel-arrow-shadow` | Arrow `box-shadow` color |
| `--color-carousel-pagination-dot` | Inactive Splide pagination dots |

The **active** dot uses **`--color-accent`** (not a separate variable).

**Code blocks** (Prism + `--color-code-bg`):

- Gorky loads Prism’s default CSS, then overrides it so fenced blocks use your palette’s **`--color-text`** as the base foreground (Prism otherwise forces near‑black text, which disappears on dark `--color-code-bg`).
- Prism’s light‑theme **`text-shadow`** on code is removed so it doesn’t create a halo on dark panels.
- **Syntax highlighting** still uses Prism’s token classes. Default token hues match **light** code backgrounds. **Dark** built‑in palettes therefore add explicit token variables (copy from e.g. `simple-dark` or `hellhole` if you build a custom dark theme):

  `--color-code-comment`, `--color-code-punctuation`, `--color-code-property`, `--color-code-string`, `--color-code-operator`, `--color-code-keyword`, `--color-code-function`, `--color-code-variable`

- Optionally set **`--color-code-foreground`** if code text should differ from body **`--color-text`**; otherwise the base code color follows **`--color-text`**.

### Upstream Gorky repository vs a `gorky init` project

**If you cloned the Gorky source repo:** `npm run build:docs` copies **`template/styles` → `docs/styles`** before building **`docs/deliver/`**. To change CSS that ships with **`gorky init`**, edit **`template/styles/`**, then run **`npm run build:docs`** to refresh the showcase. Do not rely on editing **`docs/styles/`** by itself—it is overwritten by that sync.

**If you created a site with `gorky init`:** your project only has **`styles/`** at the site root. There is no `template/` → `docs/` sync; run **`gorky build`** as usual.

## CSS File Structure

- **`styles/themes/<palette>.css`** ⭐ — Color and weight variables (`:root`) for the active `theme`
- **`styles/theme-shell.css`** — Rules that use those variables (body font, sidebar, links, etc.)
- **`styles/base.css`** — CSS reset and container layout (rarely needs editing)
- **`styles/layout.css`** — Layout structure, sidebar, navigation, and spacing
- **`styles/content.css`** — Article typography, posts list, Splide carousels, Prism/code overrides, images, blockquotes in `#markdown-content`
- **`styles/accordion.css`** — Collapsible `<details>` sections in markdown
- **`styles/responsive.css`** — Responsive breakpoints and mobile menu

## Customizing Fonts

### Main Body Font

The main font for all content is set in `styles/theme-shell.css`:

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
```

**To change it**, edit `styles/theme-shell.css` and replace with your preferred font:

```css
body {
    font-family: 'Your Font Name', sans-serif;
}
```

**Using Google Fonts:**

1. Add the font link in `base.html` (in the `<head>` section):
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
   ```

2. Update `styles/theme-shell.css`:
   ```css
   body {
       font-family: 'Inter', sans-serif;
   }
   ```

**Popular font choices:**
- `'Inter', sans-serif` - Modern, clean sans-serif
- `'Merriweather', serif` - Readable serif font
- `'Playfair Display', serif` - Elegant serif

### Code Font

Code blocks and inline code use a monospace font. Edit `styles/theme-shell.css`:

```css
#markdown-content code,
#markdown-content pre {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
}
```

**Popular monospace fonts:**
- `'JetBrains Mono'` - Modern monospace (already included via Google Fonts)
- `'Fira Code'` - Programming font with ligatures
- `'Source Code Pro'` - Clean code font

## Customizing Colors

Palette files only define **CSS variables** on `:root`. Set **`theme`** in **`site-config.js`** to the filename without `.css` (e.g. `simple-dark`).

**Built-in values:** `default`, `thematrix`, `desert`, `candy`, `simple-light`, `simple-dark`, `hacker`, `dollhouse`, `pulpfiction`, `earthy`, `typewriter`, `magazine`, `frost`, `forest`, `futurism`, `cyberpunk`, `fallout`, `rustpunk`, `utopia`, `hellhole`, `vicecity`, `ocean`, `underwater`, `coralreef`, `finding-nemo`.

Edit the corresponding file under **`styles/themes/`** (for example **`styles/themes/default.css`**) to change `--color-sidebar-bg`, `--color-accent`, `--color-content-bg`, `--color-code-bg`, `--color-carousel-bg`, carousel arrow / pagination variables, and (on dark themes) **`--color-code-*`** syntax tokens. **`--font-weight-*`** entries control heading/nav weights. Layout components read most colors in **`styles/theme-shell.css`**; carousels, code/Prism overrides, and article typography use **`styles/content.css`** — edit **`theme-shell.css`** / **`content.css`** when you need different selectors or structure, not just different color values.

Example (abbreviated):

```css
:root {
    --color-content-bg: #ECE3D4;
    --color-text: #000;
    --color-accent: #006703;
    --color-sidebar-bg: rgb(225, 214, 194);
    --color-sidebar-active: #846e4c;
    /* ... see styles/themes/default.css for the full set */
}
```

## Quick theme switching

In `site-config.js`:

```js
theme: 'simple-dark',
```

Other one-line tries: `'ocean'`, `'underwater'`, `'coralreef'`, `'finding-nemo'`, `'fallout'`, etc. Rebuild with `gorky build` and open `deliver/` to preview.

Themes are **not** whitelisted in Gorky: any safe basename maps to **`styles/themes/<theme>.css`**. Use letters, digits, **`-`**, **`_`** only; invalid values fall back to **`default`**.

## Content spacing

### Line spacing

Line height for the reading column is set in `styles/theme-shell.css` on `.main-content` (default `1.7`). Increase or decrease for tighter or roomier paragraphs.

## Tips

1. **Start with `theme` and a palette file** — pick a built-in `theme`, then tweak variables in the matching `styles/themes/<theme>.css` before editing `theme-shell.css`.

2. **Test your changes**: After modifying CSS, run `gorky build` and check pages in `deliver/`.

3. **Browser DevTools**: Use your browser's developer tools (F12) to inspect elements and test color changes in real-time before editing files.

4. **Keep it organized**: Colors and weights belong in palette CSS; shared rules belong in `theme-shell.css`.

5. **Other files**: Layout, content, accordion, and responsive styles live in their named CSS files under `styles/`.

## Need Help?

- **Colors** — your active `styles/themes/<theme>.css` and `site-config.js` `theme`  
- **Carousels / fenced code (Prism)** — `styles/content.css` + variables in `styles/themes/<theme>.css`  
- **Fonts / layout shell** — `styles/theme-shell.css` first  
- Read the comments in each CSS file - they describe what each section controls  
- Use browser DevTools to inspect elements and see which CSS file controls them  
- Test changes incrementally - change one thing at a time to see the effect
