---
title: Get Started
description: Learn how to set up and customize your Gorky website template
keywords: getting started, setup, configuration, tutorial, guide
---

# Get started with Gorky

Welcome to **Gorky** - a lightweight, markdown-powered static site generator designed for creating beautiful blogs and personal websites that can be easily deployed to GitHub Pages.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Basic Usage

1. Customize `content/sidebar.json` with your links
2. Edit `content/home.md` with your content
3. Add posts to `content/posts/` following the frontmatter format (see below)
4. Build the site:
   ```bash
   npm run build
   ```
5. Open `index.html` in your browser or deploy to GitHub Pages

## Configuration

### Site-Wide Configuration

Before deploying your site, you need to update the site configuration in `index-template.html`. Look for the `SITE_CONFIG` object (around line 59) and customize these values:

```javascript
const SITE_CONFIG = {
    baseUrl: 'https://yourusername.github.io/gorky',  // Your GitHub Pages URL
    siteName: 'Gorky',                                 // Your site name
    authorName: 'Your Name',                           // Default author name
    defaultDescription: 'Your site description...',    // Default meta description
    defaultKeywords: 'keyword1, keyword2'              // Default meta keywords
};
```

**Important:** Update `baseUrl` to match your GitHub Pages URL. For example:
- If your repo is `username/gorky`, use: `https://username.github.io/gorky`
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
        "header": "Gorky",
        "homeDisplayName": "🐥 Home",
        "postsDisplayName": "🪶 Blog",
        "footer": [
            {
                "text": "2025 © Your Name"
            }
        ]
    }
}
```

Beyond the defaults, you can also create custom elements and group them together. See `sidebar.json` for an example.

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
thumbnail: my-image.jpg
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

Link to custom pages from your sidebar by referencing them with `?page=filename` (without the `.md` extension).

## Project Structure

```
Gorky/
├── content/
│   ├── home.md              # Your home page content
│   ├── posts/               # Blog posts directory
│   │   └── *.md             # Posts with YAML frontmatter (any filename)
│   ├── sidebar.json         # Sidebar navigation configuration
│   └── posts.md             # Auto-generated posts listing
├── scripts/
│   ├── build.js             # Main build script
│   ├── posts.js             # Post processing utilities
│   ├── sidebar.js           # Sidebar generation
│   ├── generation.js        # Content generation
│   └── utils.js             # Utility functions
├── index-template.html      # HTML template (update SITE_CONFIG here!)
├── index.html               # Generated HTML (auto-generated)
├── styles/                  # CSS styling files
├── package.json             # Node.js dependencies
└── README.md                # Documentation
```

## Deployment to GitHub Pages

1. Push your code to a GitHub repository
2. Go to your repository Settings → Pages
3. Select the branch that contains your `index.html` (usually `main` or `gh-pages`)
4. Your site will be available at `https://yourusername.github.io/repository-name`

**Tip:** If you want your site at `username.github.io`, create a repository named exactly `username.github.io` and set `baseUrl` in `SITE_CONFIG` to `https://username.github.io`.

## Next Steps

- Create your first blog post in `content/posts/`
- Customize the sidebar in `content/sidebar.json`
- Edit your home page content in `content/home.md`
- Customize the styling in the `styles/` directory
- Build and test locally with `npm run build`

Happy blogging! 🚀

