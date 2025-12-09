# GWeb

**GWeb** is a lightweight, markdown-powered static site generator designed for creating beautiful blogs and personal websites that can be easily deployed to GitHub Pages.

## Why GWeb?

GWeb makes it incredibly simple to create and maintain a static website using **markdown files**. No complex build tools, no database setup, just write your content in markdown and GWeb handles the rest.

### Perfect for GitHub Pages

GWeb is optimized for GitHub Pages deployment. Simply:
1. Write your content in markdown
2. Run `npm run build`
3. Push to GitHub
4. Enable GitHub Pages

Your site is live!

### Markdown-First Approach

All your content lives in markdown files. Whether it's blog posts, documentation, or custom pages, you write everything in familiar markdown syntax. GWeb automatically:
- Converts markdown to beautiful HTML
- Generates navigation from your sidebar configuration
- Creates a posts listing page
- Handles tags and filtering
- Provides syntax highlighting for code blocks

### Flexible Content Management

- **Blog Posts**: Create posts in the `user-content/posts/` folder with automatic date, tags, and slug extraction
- **Custom Pages**: Add any markdown file and link to it from your sidebar
- **Dynamic Navigation**: Configure your sidebar through a simple JSON file
- **Tag System**: Organize posts with tags and filter by them

### Features

- ✅ **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- ✅ **Syntax Highlighting**: Code blocks automatically highlighted with Prism.js
- ✅ **Tag Filtering**: Filter posts by tags with a simple URL parameter
- ✅ **Client-Side Routing**: Fast navigation without page reloads
- ✅ **SEO Friendly**: Meta tags and canonical URLs included
- ✅ **Lightweight**: Minimal dependencies, fast load times

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Customize `user-content/sidebar.json` with your links
4. Edit `user-content/home.md` with your content
5. Add posts to `user-content/posts/` following the naming convention: `DATE--slug--(tags)--Title--preview.md`
6. Build: `npm run build`
7. Deploy to GitHub Pages

## Example Post Format

```
2025-12-15--my-first-post--(blog,tutorial)--My First Post--This is a preview of my first post.md
```

GWeb extracts:
- **Date**: 2025-12-15
- **Slug**: my-first-post
- **Tags**: blog, tutorial
- **Title**: My First Post
- **Preview**: This is a preview of my first post

Start writing in markdown and let GWeb handle the rest!
