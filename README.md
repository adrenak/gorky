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

Or use npm:

```bash
npm run build
```

### 4. Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to Settings → Pages
3. Select the branch that contains `deliver/`
4. Your site is live at `https://yourusername.github.io/your-repo/deliver/`

Set `baseUrl` in `site-config.js` to that URL (including `/deliver`).

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
- ✅ **Easy Theming**: Theme colors and fonts in `styles/theme.css`
- ✅ **Lightweight**: Minimal dependencies, fast load times

## Repository layout

This repo contains three parts:

| Path | Role |
|------|------|
| `lib/`, `bin/` | The SSG engine published to npm |
| `template/` | Canonical starter kit — styles, HTML shell, example content |
| `docs/` | Showcase site; shared files are synced from `template/` on build |

Edit shared styles, template, or docs pages in `template/`, then run `node scripts/build-docs.js` to update `docs/`.

`docs/` keeps its own `site-config.js`, posts, and images.

**Deploying:** After `gorky build`, upload only the **`deliver/`** folder to any static host — it includes HTML, `styles/`, and non-markdown files from `content/` (see `deliver/README.txt`).

- `gorky init [project-name]` - Initialize a new Gorky site
- `gorky upgrade [project-name]` - Refresh `base.html` and `styles/` from the Gorky template (leaves README, configs, and `content/` untouched). By default your current template and `styles/` are moved into `backup_<timestamp>/` first; use `--no-backup` to overwrite in place. Use `--to <version>` to pull the template from a specific npm version or tag (e.g. `latest`, `1.0.0`) via a temporary install.
- `gorky build` - Build the static site

## Configuration

### Site Configuration

Edit `site-config.js` to customize site-wide settings, sidebar navigation, and analytics:

```javascript
module.exports = {
  // Basic site settings
  baseUrl: 'https://yourusername.github.io/your-repo/deliver',
  siteName: 'My Site',
  authorName: 'Your Name',
  defaultDescription: 'Your site description...',
  defaultKeywords: 'keyword1, keyword2',
  favicon: 'favicon.ico',
  appleTouchIcon: 'apple-touch-icon.png',
  
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
  outputDir: 'deliver',
  outputFile: 'index.html',
  templateFile: 'base.html',
  stylesDir: 'styles'
};
```

## License

MIT