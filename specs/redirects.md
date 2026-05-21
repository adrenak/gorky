# Short link redirects

**Status:** Implemented  
**Config file:** `redirects.json` (project root)  
**Public URL prefix:** `/r/` (fixed in v1; *r* for redirect)

## Overview

Gorky sites can expose short redirect URLs under **`/r/{slug}/`** (e.g. `mywebsite.com/r/discord/`) that send visitors to external destinations. Entries are defined in `redirects.json` with a target URL, optional delay, and optional hopping-page message.

Using the `/r/` prefix keeps redirects separate from normal site pages, so you can later add `content/discord.md` at **`/discord/`** without conflicting with a short link.

See **`template/content/getstarted.md`** (section “Short link redirects”) for a flowchart and examples.

## Goals

- Map config keys like `discord` → `https://discord.gg/abcdefgh` at public path **`/r/discord/`**.
- Configurable redirect delay in milliseconds.
- `delay: 0` — instant browser redirect (themed page; immediate `location.replace`).
- `delay > 0` — show a hopping page for the configured duration, then redirect.
- `proxy: true` — fetch `url` at build time and emit a **plain file** at `r/{slug}` (for `curl`; not a browser redirect).
- Shorthand URL + `delay: 0` + raw-looking URL (gist `/raw/`, `.sh`, `raw.githubusercontent.com`, etc.) → auto proxy unless `"proxy": false`.
- **Optional** per-link `message` on the hopping page (omit entirely for built-in copy).
- Optional GoatCounter event per short-link hit.

## URL layout

| Config key (example) | Built output | Public URL |
|----------------------|--------------|------------|
| `discord` (`delay > 0`) | `r/discord/index.html` | `mywebsite.com/r/discord/` |
| `script` (`proxy: true`) | `r/script` (file) | `mywebsite.com/r/script` |
| `repo` (`delay > 0`) | `r/repo/index.html` | `mywebsite.com/r/repo/` |

- The **`r`** segment is fixed in v1 (not a configurable key in `redirects.json`).
- Slug is the redirect name only (e.g. `discord`), not a full site path.
- Normal content routes (`discord.md` → `/discord/`) are unrelated and may coexist.

## Configuration

### Location

`redirects.json` at the project root (next to `site-config.js` / `gorky.config.js`).

### Schema

```json
{
  "defaults": {
    "delay": 0
  },
  "redirects": {
    "/discord": {
      "url": "https://discord.gg/abcdefgh",
      "delay": 1500,
      "message": "Taking you to our Discord server…"
    },
    "github": {
      "url": "https://github.com/you/repo",
      "delay": 1000
    }
  }
}
```

(`message` on `/discord` is optional; `github` omits it and uses the built-in default line.)

| Field | Required | Description |
|--------|----------|-------------|
| `redirects` | Yes | Map of slug → destination |
| Slug key | Yes | Redirect name: `discord` or `/discord` (normalized to `discord`) |
| `url` | Yes | Target URL (see normalization) |
| `delay` | No | Ms before redirect. Falls back to `defaults.delay`. Default `0`. Ignored when `proxy` is `true`. |
| `proxy` | No | `true` = static file; `false` = force browser redirect even for raw URLs; omit to auto-detect raw URLs when `delay` is `0`. |
| `message` | **No (optional)** | Custom hopping-page text for this link only. Omit to use `defaults.message` or the built-in default. Ignored when `delay` is `0` or `proxy` is `true`. |
| `defaults.delay` | No | Default for shorthand entries. Default `0`. |
| `defaults.message` | **No (optional)** | Site-wide default hopping text. Omit to use the built-in default when `delay > 0`. |

**Shorthand:** A string value expands to:

```json
{
  "url": "<string>",
  "delay": "<defaults.delay or 0>",
  "message": "<defaults.message if set>"
}
```

### Slug rules

- Keys are normalized to a single path segment (strip leading/trailing `/`).
- Allowed characters: letters, digits, hyphen, underscore (same spirit as post slugs); reject empty or invalid slugs.
- Reserved slug: **`r`** — cannot be used as a redirect name (conflicts with the URL prefix directory).

### Message text (optional)

**You never need to set `message`.** Only `url` is required per redirect. Message fields are for customizing the hopping screen when `delay > 0`.

| You provide | Hopping page shows (`delay > 0`) |
|-------------|----------------------------------|
| Per-link `message` | That text (`{url}` expanded) |
| Only `defaults.message` | The default line for all delayed redirects |
| Neither | Built-in: `Redirecting you to {url}…` |
| Any `message` with `delay: 0` | *(ignored)* — build warns; instant redirect has no UI |

- Plain text only; HTML-escaped when embedded in the generated page.
- Placeholder **`{url}`** — optional in your copy; replaced at build time with a readable display URL (host + path).
- `defaults.message` in the schema example is illustrative, not required.

### URL normalization

- Accept `https://` and `http://` URLs.
- Bare hosts (e.g. `discord.gg/abcdefgh`) get `https://` prepended.
- Reject non-http(s) schemes (`javascript:`, `data:`, etc.).

### Build-time validation

- Unique slug keys after normalization.
- Slug must not be `r`.
- Slug must not collide with an existing redirect output path under `r/<slug>/` (trivial if keys are unique).
- **`content/r.md`:** if present, build **fails** — the `r/` output directory is reserved for redirects.
- Other `content/*.md` pages are unaffected; only avoid naming a top-level page `r.md` unless redirects are disabled.
- `delay`: non-negative integer; cap recommended (e.g. 30_000 ms).
- `message`: non-empty string when present (after trim).
- Fail the build on invalid JSON, missing `url`, or validation errors.

## User experience

### Static proxy (`proxy: true`)

- Gorky downloads `url` during `gorky build` and writes **`r/{slug}`** (a single file, not `index.html`).
- `curl https://mywebsite.com/r/png2jpg-ffmpeg` returns that file’s body (e.g. a raw gist script).
- Requires network at build time; not a browser redirect. Use `delay` / hopping pages for human visitors.

### Instant (`delay: 0`, not `proxy`)

- Visitor opens `https://mywebsite.com/r/discord/` (see Hosting).
- Themed standalone page (same `theme` / `themeOptions` localStorage as the rest of the site; no sidebar).
- Shows the built-in `Redirecting you to {url}…` line (custom `message` is ignored when `delay` is `0`).
- On the next line: “If you are not redirected automatically, click here:” with a link to the full target URL.
- Immediate `location.replace` to the target (plus `<meta http-equiv="refresh">` when JS is disabled).

### Hopping page (`delay > 0`)

- Themed standalone page under `/r/` (no site sidebar or top bar).
- **Message is optional:** if you set one, it is shown; otherwise Gorky picks `defaults.message` or the built-in `Redirecting you to {url}…` line.
- On the next line: manual redirect fallback link (same wording as instant).
- After `delay` ms, redirect to the normalized target.
- Meta refresh fallback for no-JS clients.

### Display URL

- `{url}` in messages uses a human-readable form (host + path).
- The actual redirect always uses the full normalized URL.

## Build output

- Read `redirects.json` during `gorky build`; skip if missing or empty.
- **`proxy: true`:** `<outputDir>/r/<slug>` with fetched body.
- **Otherwise:** `<outputDir>/r/<slug>/index.html` (themed via `styles/base.css`, `theme-shell.css`, `styles/themes/<theme>.css`).
  - **Instant** (`delay === 0`) — built-in message + fallback link + immediate redirect.
  - **Hopping** (`delay > 0`) — resolved message + fallback link + timed redirect.
- Resolve `{url}` and escape HTML at build time.
- On rebuild, clean the entire `<outputDir>/r/` tree and regenerate from config (avoid stale short links).
- Do not publish `redirects.json` to output unless documented later.

## Analytics

When `goatCounterEnabled` is true in `site-config.js`:

- Load GoatCounter on redirect pages.
- Record hits as events, e.g. `goatcounter.count({ path: 'r-discord', event: true })`, separate from normal page views.
- `delay > 0` — reliable (page visible long enough for JS).
- `delay === 0` — count fires before `location.replace`; no visible hopping page required.

## Hosting

- Static hosts serve `r/discord/index.html` at **`/r/discord/`** (trailing slash).
- **`/r/discord`** without a trailing slash is host-dependent; **`/r/discord/`** is the canonical short URL.

## Non-goals (v1)

- Configurable URL prefix (always `r` in v1).
- Server-side HTTP 302 (CDN / Netlify / Cloudflare rules only).
- Analytics without an HTML redirect page.
- Editing redirects at runtime without rebuild.
- HTML or Markdown in `message` (plain text + `{url}` only).
- Nested redirect paths (e.g. `/r/social/discord`); slugs are a single segment only.

## Example

```json
{
  "defaults": {
    "delay": 0
  },
  "redirects": {
    "/discord": {
      "url": "discord.gg/abcdefgh",
      "delay": 2000,
      "message": "Taking you to our Discord. See you there!"
    },
    "/repo": {
      "url": "https://github.com/you/project",
      "delay": 1000
    },
    "/twitter": "https://twitter.com/you"
  }
}
```

| Config key | `message` set? | Delay | What the visitor sees |
|------------|----------------|-------|------------------------|
| `discord` | Yes (custom) | 2000 ms | “Taking you to our Discord. See you there!” |
| `repo` | **No** | 1000 ms | Built-in: “Redirecting you to github.com/you/project…” |
| `twitter` | **No** | 0 ms | Instant redirect (built-in message + fallback link; no custom message) |

You can still add `content/discord.md` later; it would be served at **`mywebsite.com/discord/`**, separate from **`mywebsite.com/r/discord/`**.
