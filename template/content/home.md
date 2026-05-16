---
title: Gorky
description: A lightweight, markdown-powered static site generator
keywords: gorky, static site generator, markdown, blog
---

# Gorky

**Gorky** is a lightweight, markdown-powered static site generator designed for creating beautiful blogs and personal websites that can be easily deployed to GitHub Pages.

Gorky is named after [Maxim Gorky](https://en.wikipedia.org/wiki/Maxim_Gorky)

The layout and design is inspired from [garry.net](https://garry.net)  

## Why Gorky?

Gorky makes it incredibly simple to create and maintain a static website using **markdown files**. No complex build tools, no database setup, just write your content in markdown and Gorky handles the rest.

### Perfect for GitHub Pages

Gorky fits GitHub Pages’ **root** or **`/docs`** publish folders. Set **`outputDir: ''`** in `gorky.config.js` to build into your site root (e.g. the `docs/` folder), then:

1. Write your content in markdown  
2. Run `gorky build`  
3. Push to GitHub  
4. Enable **Settings → Pages** (branch + **root** or **`/docs`**)  
5. Set **`baseUrl`** in `site-config.js` to your live URL (no `/deliver` path)

Your site is live!

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
- **Dynamic Navigation**: Configure your sidebar through a simple JSON file
- **Tag System**: Organize posts with tags and filter by them

### Features

- ✅ **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- ✅ **Syntax Highlighting**: Code blocks automatically highlighted with Prism.js
- ✅ **Tag Filtering**: Filter posts by tags with a simple URL parameter
- ✅ **Multi-page URLs**: Clean paths for home, posts, and individual posts
- ✅ **SEO Friendly**: Meta tags and canonical URLs included
- ✅ **Analytics Ready**: Built-in support for GoatCounter analytics
- ✅ **Easy Theming**: Palettes in `styles/themes/*.css` via `theme` in `site-config.js`; each palette sets **`--color-*`**, **fonts**, and **font sizes**. Optional visitor **Theme** dropdown (`themeOptions`) with choice persisted in **`localStorage`** per site (`themeStorageId` / `baseUrl`).
- ✅ **Lightweight**: Minimal dependencies, fast load times

