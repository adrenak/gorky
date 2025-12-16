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

This generates `index.html` from your markdown files.

## Configuration

### Site-Wide Configuration

Update the site configuration in `index-template.html`. Look for the `SITE_CONFIG` object (around line 60) and customize these values:

```javascript
const SITE_CONFIG = {
    baseUrl: 'https://yourusername.github.io/your-repo',  // Your GitHub Pages URL
    siteName: 'My Site',                                   // Your site name
    authorName: 'Your Name',                               // Default author name
    defaultDescription: 'Your site description...',       // Default meta description
    defaultKeywords: 'keyword1, keyword2'                   // Default meta keywords
};
```

**Important:** Update `baseUrl` to match your GitHub Pages URL. For example:
- If your repo is `username/my-site`, use: `https://username.github.io/my-site`
- If your repo is `username/username.github.io`, use: `https://username.github.io`

These settings are used for:
- SEO meta tags (title, description, keywords)
- Open Graph tags for social media sharing
- Canonical URLs
- JSON-LD structured data
- Author attribution (fallback if posts don't specify an author)

### Sidebar Configuration

Edit `content/sidebar.json` to customize your navigation. The sidebar header, home/posts display names, and footer can be customized in the `_defaults` section:

```json
{
    "_defaults": {
        "header": "My Site",
        "homeDisplayName": "🏠 Home",
        "postsDisplayName": "✍️ Posts",
        "footer": [
            {
                "text": "2025 © Your Name",
                "target": "https://yourusername.github.io"
            }
        ]
    }
}
```

Beyond the defaults, you can create custom navigation sections. See `sidebar.json` for examples.

## Post Format

Post files can have **any filename** you want - there are no naming requirements! All metadata is defined in YAML frontmatter at the top of each markdown file.

### Frontmatter

Post metadata is defined in YAML frontmatter at the top of each markdown file:

```markdown
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
- `slug` - Unique identifier for the post (used in URLs like `?post=my-first-post`)
- `title` - The post title
- `date` - Publication date (format: YYYY-MM-DD or YYYY-M-D)

**Optional fields:**
- `tags` - Comma-separated tags (e.g., `blog,tutorial`) or array format
- `description` - Description text shown in the posts listing (also used as meta description for SEO)
- `thumbnail` - Thumbnail image path (relative to content root, e.g., `content/images/thumb.jpg`)
- `keywords` - Comma-separated keywords for SEO meta tags
- `author` - Author name for the post (falls back to `SITE_CONFIG.authorName` if not provided)
- `published` - Set to `false` to hide a post (defaults to `true`)

### Custom Pages

Any markdown file in the `content/` directory (not in `posts/`) can be a custom page. Add frontmatter for SEO:

```markdown
---
title: About
description: Learn more about this site
keywords: about, information
---

# About

Your page content...
```

Link to custom pages from your sidebar by referencing them with `?page=filename` (without the `.md` extension). For example, to link to `content/about.md`, use `?page=about`.

## Project Structure

```
my-site/
├── content/
│   ├── home.md              # Your home page content
│   ├── posts/               # Blog posts directory
│   │   └── *.md             # Posts with YAML frontmatter (any filename)
│   ├── images/              # Images directory
│   ├── sidebar.json         # Sidebar navigation configuration
│   └── posts.md             # Auto-generated posts listing (don't edit)
├── styles/                  # CSS styling files
├── index-template.html      # HTML template (update SITE_CONFIG here!)
├── index.html               # Generated HTML (auto-generated, don't edit)
├── gorky.config.js          # Optional configuration file
├── package.json             # Node.js dependencies
└── README.md                # Documentation
```

## Deployment to GitHub Pages

1. Push your code to a GitHub repository
2. Go to your repository Settings → Pages
3. Select the branch that contains your `index.html` (usually `main` or `gh-pages`)
4. Your site will be available at `https://yourusername.github.io/repository-name`

**Tip:** If you want your site at `username.github.io`, create a repository named exactly `username.github.io` and set `baseUrl` in `SITE_CONFIG` to `https://username.github.io`.

## Optional Configuration

Create a `gorky.config.js` file to customize paths:

```javascript
module.exports = {
  contentDir: 'content',
  outputFile: 'index.html',
  templateFile: 'index-template.html',
  stylesDir: 'styles'
};
```

## Next Steps

- ✅ Customize the sidebar in `content/sidebar.json`
- ✅ Edit your home page content in `content/home.md`
- ✅ Update `SITE_CONFIG` in `index-template.html`
- ✅ Create your first blog post in `content/posts/`
- ✅ Customize the styling in the `styles/` directory
- ✅ Build and test locally with `gorky build`

Happy blogging! 🚀
