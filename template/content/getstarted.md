---
title: Get Started
description: Learn how to set up and customize your Gorky website
keywords: getting started, setup, configuration, tutorial, guide
---

# Get Started with Gorky

Welcome! This guide will help you set up and customize your Gorky site.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)

### Installation

If you haven't already, install Gorky:

```bash
npm install -g gorky
```

Or install locally in your project:

```bash
npm install --save-dev gorky
```

### Create a new site

Scaffold a project with example content, styles, and config files:

```bash
gorky init my-site
cd my-site
```

That creates a folder with `content/`, `styles/`, `base.html`, `site-config.js`, `gorky.config.js`, and optional GitHub Actions workflow. To initialize in the current directory instead:

```bash
gorky init
```

Skip this step if you already have a Gorky project (for example you cloned a repo that already contains those files).

### Building Your Site

Build your site using the Gorky CLI:

```bash
gorky build
```

Or use npm:

```bash
npm run build
```

This generates HTML from your markdown. Paths and output location come from **`gorky.config.js`** (see below).

## Configuration

Gorky uses two config files at your site root:

| File | Purpose |
|------|---------|
| **`gorky.config.js`** | Build paths — where sources live and where HTML is written |
| **`site-config.js`** | Site identity — `baseUrl`, navigation, themes, analytics |

Both are created by **`gorky init`**. You can omit `gorky.config.js`; Gorky then uses built-in defaults.

### Build configuration (`gorky.config.js`)

Controls how **`gorky build`** finds your template, content, and styles, and where it writes the static site.

```javascript
module.exports = {
  contentDir: 'content',      // Markdown pages and posts
  outputDir: 'deliver',       // '' or '.' = build into site root (GitHub Pages)
  outputFile: 'index.html',     // Home page filename inside outputDir
  templateFile: 'base.html',    // HTML shell with {{placeholders}}
  stylesDir: 'styles'           // CSS directory (copied into output)
};
```

| Option | Default | Description |
|--------|---------|-------------|
| `contentDir` | `'content'` | Folder with `home.md`, custom pages, and `posts/` |
| `outputDir` | `'deliver'` | Folder for generated HTML, or `''` / `'.'` for site root |
| `outputFile` | `'index.html'` | Home page filename (inside `outputDir`, or at root when `outputDir` is empty) |
| `templateFile` | `'base.html'` | Page template at the site root |
| `stylesDir` | `'styles'` | Stylesheets; theme palettes live in `styles/themes/` |

**CLI overrides** (useful in CI or one-off builds; otherwise `gorky.config.js` wins):

```bash
gorky build -c content -d '' -o index.html -t base.html -s styles
```

| Flag | Config key |
|------|------------|
| `-c, --content` | `contentDir` |
| `-d, --output-dir` | `outputDir` |
| `-o, --output` | `outputFile` |
| `-t, --template` | `templateFile` |
| `-s, --styles` | `stylesDir` |

Run **`gorky build`** from the directory that contains `gorky.config.js` (your site root, or `docs/` if the site lives there).

#### Output directory

| `outputDir` | Build writes to | Typical use |
|-------------|-----------------|-------------|
| `'deliver'` | `deliver/index.html`, … | Local preview; upload **`deliver/`** to hosts that accept a publish subfolder |
| `''` or `'.'` | `index.html` next to `content/` | **GitHub Pages** from **`/docs`** or **branch root** |

When `outputDir` is empty, Gorky only removes previous **generated** files (HTML routes, `README.txt`), not your source `content/` or config files.

**GitHub Pages example** — site under `docs/`:

```javascript
// docs/gorky.config.js
module.exports = {
  contentDir: 'content',
  outputDir: '',
  outputFile: 'index.html',
  templateFile: 'base.html',
  stylesDir: 'styles'
};
```

Then from `docs/`: `gorky build`. Enable **Settings → Pages → `/docs`**.

### Site-wide configuration (`site-config.js`)

Edit `site-config.js` in your project root to customize site-wide settings:

```javascript
module.exports = {
    baseUrl: 'https://yourusername.github.io/your-repo',  // Public URL of the built site (no /deliver)
    siteName: 'My Site',
    authorName: 'Your Name',
    defaultDescription: 'Your site description...',
    defaultKeywords: 'keyword1, keyword2',
    favicon: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png'
};
```

This configuration is automatically injected into your site during the build process.

### Theming

- Set **`theme`** in `site-config.js` to a palette id: the file **`styles/themes/<theme>.css`** (no `.css` suffix in config). Gorky ships many built‑in palettes; you can add your own `.css` file next to them.
- Optional **`themeOptions`**: an array of palette ids. When set, a **Theme** dropdown appears above the sidebar footer. The visitor’s choice is stored in **`localStorage`** per site (**`themeStorageId`** in `site-config.js`, or derived from **`baseUrl`**) and reapplied on later visits if that id is still allowed (see the Customization guide for rules).

For carousel/code palette variables, Prism behaviour, and (in the Gorky source repo) **`npm run build:docs`** / **`template/styles`**, read **[Customization](customization/)**.

**Important:** Set **`baseUrl`** to the URL where visitors open your **built** site—the path GitHub Pages (or your host) actually serves. Do **not** append `/deliver` unless that folder is literally your public root (unusual on GitHub Pages).

| Hosting | Example `baseUrl` |
|---------|-------------------|
| Project repo, Pages from **`/docs`** | `https://yourusername.github.io/your-repo` |
| Project repo, Pages from **branch root** | `https://yourusername.github.io/your-repo` |
| User/org site repo `username.github.io` | `https://yourusername.github.io` |

These settings are used for:
- SEO meta tags (title, description, keywords)
- Open Graph tags for social media sharing
- Canonical URLs
- JSON-LD structured data
- Author attribution (fallback if posts don't specify an author)

### Sidebar Configuration

Edit `site-config.js` to customize your navigation. The sidebar configuration is in the `sidebar` property:

```javascript
module.exports = {
    // ... other config ...
    sidebar: {
        header: 'My Site',
        homeDisplayName: '🏠 Home',
        postsDisplayName: '✍️ Posts',
        footer: [
            {
                text: '2025 © Your Name',
                target: 'https://yourusername.github.io'
            }
        ],
        sections: {
            '': {
                '📝 About': {
                    target: '?page=about',
                    openInNewTab: false
                }
            },
            'Links': {
                'GitHub': {
                    target: 'https://github.com/yourusername',
                    openInNewTab: true
                }
            }
        }
    }
};
```

Navigation items in `sections` have the format: `label: { target: 'url', openInNewTab: boolean }`. For internal pages, use `?page=filename` (without the `.md` extension). Gorky resolves these to the correct relative paths at build time. Use full URLs for external links.

## Site URLs

Gorky builds a multi-page static site. URL paths are always relative to wherever you published the build (site root):

| Page | URL path |
|------|----------|
| Home | `/` |
| Posts list | `posts/` |
| Single post | `post/{slug}/` |
| Custom page (`content/about.md`) | `about/` |

Filter posts by tag at **`posts/tag/your-tag/`**. With pagination enabled (`postsPerPage` in `site-config.js`), additional pages use **`posts/tag/your-tag/page/N/`**.

Example if your site is `https://username.github.io/my-repo/`:

```text
https://username.github.io/my-repo/posts/tag/tutorial/
```

Legacy **`?tag=your-tag`** URLs (on any page) redirect to `posts/tag/your-tag/`. Use **`?tag=all`** to open the full posts list at `posts/`.

Legacy `?page=` and `?post=` URLs also redirect to path URLs.

## Post Format

Post files can have any filename. All metadata is defined in YAML frontmatter at the top of each file:

```
---
slug: my-first-post
title: My First Post
date: 2025-12-15
tags: blog,tutorial
description: This is a preview of my first post
thumbnail: content/images/my-image.jpg
keywords: keyword1, keyword2
author: Author Name
---

# My First Post

Your content here...
```

**Required fields:**
- `slug` - Unique identifier for the post (URL path: `post/my-first-post/`)
- `title` - The post title
- `date` - Publication date (format: YYYY-MM-DD or YYYY-M-D)

**Optional fields:**
- `tags` - Comma-separated tags (e.g., `blog,tutorial`) or array format
- `description` - Description text shown in the posts listing (also used as meta description for SEO)
- `thumbnail` - Thumbnail image path (relative to content root, e.g., `content/images/thumb.jpg`)
- `keywords` - Comma-separated keywords for SEO meta tags
- `author` - Author name for the post (falls back to `authorName` in `site-config.js` if not provided)
- `published` - Set to `false` to hide a post (defaults to `true`)
- `archived` - Set to `true` to hide from the posts list and tag views while keeping the post URL working
- `priority` - Number; higher values sort first on the posts list and when filtering by tag (default `0` if omitted)

> 💡 Open a post directly at `post/slug/` (for example `post/my-first-post/`).

## Favicon

Add a favicon to your site:

1. Create or obtain a `favicon.ico` file (16x16 or 32x32 pixels)
2. Place it in your **site root** (same directory as `base.html` / `gorky.config.js`)
3. Optionally create `apple-touch-icon.png` (180x180 pixels) for iOS devices
4. The favicon will be automatically used (defaults to `favicon.ico`)

To customize the favicon path, edit `site-config.js` in your project root:

```javascript
module.exports = {
    // ... other config
    favicon: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png',
};
```

## Custom Pages

Any markdown file in the `content/` directory (not in `posts/`) can be a custom page. Add frontmatter for SEO:

```
---
title: About
description: Learn more about this site
keywords: about, information

---

# About

Your page content...
```

Link to custom pages from your sidebar with `?page=filename` in `site-config.js` (for `content/about.md`, use `?page=about`). Visitors reach the page at `about/`.

## Local preview

After `gorky build`, your output folder contains generated HTML plus copied **`styles/`** and non-markdown files under **`content/`** (images, etc.).

**If `outputDir` is `deliver`:**

```bash
cd deliver && python -m http.server 8000
```

**If `outputDir` is `''` (build at site root):**

```bash
python -m http.server 8000
```

Open `http://localhost:8000/` and browse the site. Set **`baseUrl`** in `site-config.js` to match how you serve it in production.

## Project structure

**GitHub Pages from `/docs`** (recommended for a repo that also holds engine code or other files):

```
my-repo/
├── docs/                    # Gorky site root — enable Pages: Branch main, folder /docs
│   ├── index.html           # Generated (outputDir: '')
│   ├── posts/, post/, …
│   ├── content/             # Markdown sources
│   ├── styles/
│   ├── base.html
│   ├── site-config.js
│   └── gorky.config.js
└── (other repo files)
```

**Default `gorky init` layout** (`outputDir: 'deliver'`):

```
my-site/
├── deliver/                 # Generated HTML (don't edit)
│   ├── index.html
│   ├── styles/              # Copied at build time
│   ├── content/             # Copied non-.md assets only
│   ├── posts/, post/, …
│   └── README.txt
├── content/
│   ├── home.md
│   ├── posts-intro.md
│   ├── posts/
│   └── posts.md             # Auto-generated (don't edit)
├── styles/
├── base.html
├── site-config.js
├── gorky.config.js
└── README.md
```

## Deployment to GitHub Pages

GitHub Pages publishes only from:

1. **The root of a branch** (e.g. `main` or `gh-pages`), or  
2. The **`/docs` folder** on a branch.

It does **not** treat a subfolder like `deliver/` as the site root while the rest of the repo is published as-is. Plan your **`outputDir`** and **`baseUrl`** accordingly.

### Option A — `/docs` folder (common for project sites)

1. Put your Gorky site under **`docs/`** (or build into `docs/` with `outputDir: ''` and run `gorky build` from `docs/`).
2. In **`gorky.config.js`**: `outputDir: ''` (or `'.'`).
3. In **`site-config.js`**: `baseUrl: 'https://yourusername.github.io/your-repo'` (no `/deliver`).
4. Push to GitHub → **Settings → Pages** → Source: deploy from branch **`main`**, folder **`/docs`**.
5. Site URL: `https://yourusername.github.io/your-repo/`

### Option B — Repository root

1. Keep the site at the repo root with `outputDir: ''`.
2. **Settings → Pages** → folder **`/` (root)**.
3. For a **user site** repo named `yourusername.github.io`, use `baseUrl: 'https://yourusername.github.io'`.

### Option C — `deliver/` subfolder (other hosts)

`outputDir: 'deliver'` is fine for local work or hosts where you upload only that folder (Netlify “publish directory”, etc.). For GitHub Pages on the same repo, prefer Option A or B instead of serving `/deliver/` as a path.

### Optional: GitHub Actions

The template includes `.github/workflows/gorky-build.yml`. Adjust the commit step to match your `outputDir` (see comments in that file).

**Self-contained output:** Whatever directory you build into is all you need on the server—HTML, copied `styles/`, and non-markdown assets under `content/` (see `README.txt` in the output folder).
