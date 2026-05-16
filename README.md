# Gorky

**Gorky** is a lightweight, markdown-powered static site generator designed for creating beautiful blogs and personal websites that can be easily deployed to GitHub Pages.

Gorky is named after [Maxim Gorky](https://en.wikipedia.org/wiki/Maxim_Gorky)

The layout and design is inspired from [garry.net](https://garry.net)  

## Installation

```bash
npm install -g gorky
```

Or install locally in your project:

```bash
npm install --save-dev gorky
```

## Quick Start

### 1. Initialize a new site

```bash
gorky init my-site
cd my-site
```

This creates a new Gorky site with example content and template files.

### 2. Customize your site

- Edit `site-config.js` to configure site settings and navigation
- Add your markdown files to `content/`
- Create blog posts in `content/posts/`

### 3. Build your site

```bash
gorky build
```

If you add your own `package.json` with a `"build": "gorky build"` script, you can use `npm run build` instead.

### 4. Deploy to GitHub Pages

GitHub Pages publishes from the **branch root** or the **`/docs` folder** only—not from a nested folder like `deliver/` inside an otherwise unpublished tree.

1. Set **`outputDir: ''`** in `gorky.config.js` to build into your site root (typical: run the site from a `docs/` folder and enable **Pages → `/docs`**).
2. Push to GitHub → **Settings → Pages** → choose branch and **root** or **`/docs`**.
3. Set **`baseUrl`** in `site-config.js` to the live URL (e.g. `https://yourusername.github.io/your-repo`—no `/deliver`).

See **[Get Started](template/content/getstarted.md)** for full deployment options. Use **`outputDir: 'deliver'`** only if you upload that subfolder to another host or want a separate preview directory.

## Why Gorky?

Gorky makes it incredibly simple to create and maintain a static website using **markdown files**. No complex build tools, no database setup, just write your content in markdown and Gorky handles the rest.

### Markdown-First Approach

All your content lives in markdown files. Whether it's blog posts, documentation, or custom pages, you write everything in familiar markdown syntax. Gorky automatically:
- Converts markdown to beautiful HTML
- Generates navigation from your sidebar configuration
- Creates a posts listing page
- Handles tags and filtering
- Provides syntax highlighting for code blocks

### Flexible Content Management

- **Blog Posts**: Create posts in the `content/posts/` folder with YAML frontmatter for metadata
- **Custom Pages**: Add any markdown file and link to it from your sidebar
- **Dynamic Navigation**: Configure your sidebar through `site-config.js`
- **Tag System**: Organize posts with tags and filter by them
- **Analytics Ready**: Built-in support for GoatCounter analytics

### Features

- ✅ **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- ✅ **Syntax Highlighting**: Code blocks automatically highlighted with Prism.js
- ✅ **Tag Filtering**: Filter posts by tag at `posts/?tag=name`
- ✅ **Multi-page URLs**: Clean paths for home, posts, and individual posts
- ✅ **SEO Friendly**: Meta tags and canonical URLs included
- ✅ **Easy Theming**: Palettes in `styles/themes/*.css` and `theme` / optional `themeOptions` in `site-config.js` (visitor picks persist in `localStorage` per site via `themeStorageId` or `baseUrl`; carousel & code colors use `--color-*` variables in each palette)
- ✅ **Lightweight**: Minimal dependencies, fast load times

## Repository layout

This repo contains three parts:

| Path | Role |
|------|------|
| `lib/`, `bin/` | The SSG engine published to npm |
| `template/` | Canonical starter kit — same shape as a site root: `content/`, `styles/`, `base.html`, configs |
| `docs/` | Showcase site — **`npm run build:docs`** syncs **`template/styles` → `docs/styles`**, then **`gorky build`** with **`outputDir: ''`** writes HTML into **`docs/`** for GitHub Pages **/docs** |

Edit the canonical starter under **`template/`** for `gorky init` / upgrades. For shared CSS, change **`template/styles/`** and run **`npm run build:docs`** so both the published template and the docs site stay in sync (**`docs/styles/`** is overwritten by that step). Edit **`docs/content/`** and **`docs/site-config.js`** for showcase-only text and navigation.

**Deploying:** Point your host at the folder `gorky build` writes (site root with `outputDir: ''`, or **`deliver/`** with the default). That output is self-contained—HTML, `styles/`, and non-markdown assets from `content/` (see `README.txt` there).

- `gorky init [project-name]` - Initialize a new Gorky site
- `gorky upgrade [project-name]` - Refresh `base.html` and `styles/` from the Gorky template (leaves README, configs, and `content/` untouched). By default your current template and `styles/` are moved into `backup_<timestamp>/` first; use `--no-backup` to overwrite in place. Use `--to <version>` to pull the template from a specific npm version or tag (e.g. `latest`, `1.0.0`) via a temporary install.
- `gorky build` - Build the static site

## Configuration

### Site Configuration

Edit `site-config.js` to customize site-wide settings, sidebar navigation, and analytics:

```javascript
module.exports = {
  // Basic site settings
  baseUrl: 'https://yourusername.github.io/your-repo',
  siteName: 'My Site',
  authorName: 'Your Name',
  defaultDescription: 'Your site description...',
  defaultKeywords: 'keyword1, keyword2',
  favicon: 'favicon.ico',
  appleTouchIcon: 'apple-touch-icon.png',
  // Optional portrait (og:image when a page has no thumbnail). Root-relative or https URL.
  avatar: '',

  // Built-in color palette (files in styles/themes/): default, thematrix, desert, candy, simple-light, simple-dark, hacker, dollhouse, pulpfiction, earthy, typewriter, magazine, frost, forest, futurism, cyberpunk, fallout, rustpunk, utopia, hellhole, vicecity, ocean, underwater, coralreef, finding-nemo
  theme: 'default',

  // Optional: sidebar theme dropdown (above footer). Same ids as `styles/themes/<id>.css`.
  themeStorageId: 'my-site', // scopes localStorage so / and /gorky on one domain stay independent
  // Choice stored per site when the visitor changes the theme select.
  themeOptions: ['default', 'simple-dark', 'ocean'],

  // GoatCounter Analytics (optional)
  goatCounterEnabled: false,
  goatCounterCode: 'yourcode',
  allowLocal: false,
  allowFrame: false,
  noOnload: false,
  
  // Sidebar Configuration
  sidebar: {
    header: 'My Site',
    homeDisplayName: '🏠 Home',
    postsDisplayName: '✍️ Posts',
    footer: [
      {
        text: '2025 © Your Name',
        target: 'https://yoursite.com'
      }
    ],
    sections: {
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

Configure **avatar** in `site-config.js` with a root-relative image path or a full `https://` URL. Link previews use each page’s **`thumbnail`** frontmatter when set; otherwise they use **avatar**, then favicon, then Apple touch icon. This applies to every page type (home, posts list, markdown pages, and posts).

The sidebar configuration includes:
- `header`: Text displayed at the top of the sidebar
- `homeDisplayName` / `postsDisplayName`: Display names for main navigation items
- `footer`: Array of footer items (text or links)
- `sections`: Navigation sections with items. Use `?page=filename` for internal pages in `site-config.js` (resolved to path URLs at build time), or full URLs for external links.

Published URLs use paths: `posts/`, `post/{slug}/`, and `{page}/` for custom markdown pages.

### Build Configuration

Create a `gorky.config.js` file to customize paths (optional):

```javascript
module.exports = {
  contentDir: 'content',
  outputDir: 'deliver',  // or '' / '.' to build at site root (GitHub Pages /docs or root)
  outputFile: 'index.html',
  templateFile: 'base.html',
  stylesDir: 'styles'
};
```

CLI: `gorky build -d ''` overrides `outputDir` for a one-off build.

## License

MIT