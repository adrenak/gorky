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

### Building Your Site

Build your site using the Gorky CLI:

```bash
gorky build
```

Or use npm:

```bash
npm run build
```

This generates HTML pages in the `deliver/` directory from your markdown files.

## Configuration

### Site-Wide Configuration

Edit `site-config.js` in your project root to customize site-wide settings:

```javascript
module.exports = {
    baseUrl: 'https://yourusername.github.io/your-repo/deliver',  // Include /deliver
    siteName: 'My Site',                                   // Your site name
    authorName: 'Your Name',                               // Default author name
    defaultDescription: 'Your site description...',       // Default meta description
    defaultKeywords: 'keyword1, keyword2',                 // Default meta keywords
    favicon: 'favicon.ico',                                // Optional: path to favicon
    appleTouchIcon: 'apple-touch-icon.png'                 // Optional: path to Apple touch icon
};
```

This configuration is automatically injected into your site during the build process.

### Theming

- Set **`theme`** in `site-config.js` to a palette id: the file **`styles/themes/<theme>.css`** (no `.css` suffix in config). Gorky ships many built‑in palettes; you can add your own `.css` file next to them.
- Optional **`themeOptions`**: an array of palette ids. When set, a **Theme** dropdown appears above the sidebar footer. The visitor’s choice is stored in **`localStorage`** under **`gorky-theme`** and reapplied on later visits if that id is still allowed (see the Customization guide for rules).

For carousel/code palette variables, Prism behaviour, and **`npm run build:docs`** / **`template/styles`** in the Gorky repo, read **[Customization](customization/)**.

**Important:** Set `baseUrl` to your published site URL, including the `/deliver` path:

- Repo `username/my-site`: `https://username.github.io/my-site/deliver`
- User site repo `username.github.io`: `https://username.github.io/deliver`

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
        // Sidebar header text (displayed at top of sidebar)
        header: 'My Site',
        
        // Display names for main navigation items
        homeDisplayName: '🏠 Home',
        postsDisplayName: '✍️ Posts',
        
        // Sidebar footer items (array of text items or links)
        footer: [
            {
                text: '2025 © Your Name',
                target: 'https://yourusername.github.io'
            }
        ],
        
        // Navigation sections (object where keys are section titles, values are navigation items)
        sections: {
            // Empty section name creates items without a section header
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

Gorky builds a multi-page site inside `deliver/`:

| Page | URL path |
|------|----------|
| Home | `/` |
| Posts list | `posts/` |
| Single post | `post/{slug}/` |
| Custom page (`content/about.md`) | `about/` |

Filter posts by tag on the posts listing: **`posts/?tag=your-tag`** (same path with a query string).

Example if your published site lives at `https://username.github.io/repo/deliver/`:

```text
https://username.github.io/repo/deliver/posts/?tag=tutorial
```

Tag names use the lowercase form for matching (`tutorial` matches `Tutorial` in frontmatter). Share that full URL to open the posts page already filtered.

Legacy `?page=`, `?post=`, and `?tag=` URLs still redirect to these paths.

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
2. Place it in your site root (same directory as `deliver/`)
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

After `gorky build`, `deliver/` includes generated HTML plus copied **`styles/`** and **`content/`** assets (images and other non-markdown files from your source `content/` folder). You can serve the project root or open `deliver/` directly:

```bash
cd deliver && python -m http.server 8000
```

Or serve the parent folder and browse to `/deliver/`.

**Any static host:** After `gorky build`, upload the entire **`deliver/`** directory (everything inside it). No other project files are required on the server. Set `baseUrl` in `site-config.js` to match where that folder is served (site root vs subpath).

## Project Structure

```
my-site/
├── deliver/                 # Generated HTML (auto-generated, don't edit)
│   ├── index.html           # Home page
│   ├── styles/              # Copied from your styles/ at build time
│   ├── content/             # Copied non-.md assets only (e.g. images)
│   ├── posts/               # Posts listing
│   ├── post/                # Individual posts
│   └── {page}/              # Other content pages
├── content/
│   ├── home.md              # Your home page content
│   ├── posts-intro.md       # Optional intro for the posts listing (YAML + markdown)
│   ├── posts/               # Blog posts directory
│   │   └── *.md             # Posts with YAML frontmatter (any filename)
│   ├── images/              # Images directory
│   └── posts.md             # Auto-generated posts listing (don't edit)
├── styles/                  # CSS styling files
├── base.html                # HTML template
├── site-config.js           # Site settings and navigation
├── gorky.config.js          # Optional configuration file
├── package.json             # Optional (add your own for npm scripts / dependencies)
└── README.md                # Optional (your repo documentation)
```

## Deployment to GitHub Pages

1. Push your code to a GitHub repository
2. Go to your repository Settings → Pages
3. Select the branch that contains your site (usually `main` or `gh-pages`)
4. Your site will be available at `https://yourusername.github.io/repository-name/deliver/`

**Tip:** Set `baseUrl` in `site-config.js` to include the `/deliver` path (for example `https://yourusername.github.io/repository-name/deliver`).

**Self-contained output:** The `deliver/` folder from `gorky build` is all you need to upload — HTML, `styles/`, and copied assets under `content/` (see `deliver/README.txt`).

## Optional Configuration

Create a `gorky.config.js` file to customize paths:

```javascript
module.exports = {
  contentDir: 'content',
  outputDir: 'deliver',
  outputFile: 'index.html',
  templateFile: 'base.html',
  stylesDir: 'styles'
};
```