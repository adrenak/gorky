# gorky

**gorky** is a lightweight, markdown-powered static site generator designed for creating beautiful blogs and personal websites that can be easily deployed to GitHub Pages.

## Why gorky?

gorky makes it incredibly simple to create and maintain a static website using **markdown files**. No complex build tools, no database setup, just write your content in markdown and gorky handles the rest.

### Perfect for GitHub Pages

gorky is optimized for GitHub Pages deployment. Simply:
1. Write your content in markdown
2. Run `npm run build`
3. Push to GitHub
4. Enable GitHub Pages

Your site is live!

### Markdown-First Approach

All your content lives in markdown files. Whether it's blog posts, documentation, or custom pages, you write everything in familiar markdown syntax. gorky automatically:
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

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Usage

1. Customize `user-content/sidebar.json` with your links
2. Edit `user-content/home.md` with your content
3. Add posts to `user-content/posts/` following the naming convention
4. Build the site:
   ```bash
   npm run build
   ```
5. Open `index.html` in your browser or deploy to GitHub Pages

## Project Structure

```
gorky/
├── user-content/
│   ├── home.md              # Your home page content
│   ├── posts/               # Blog posts directory
│   │   └── DATE--slug.md    # Posts with YAML frontmatter
│   ├── sidebar.json         # Sidebar navigation configuration
│   └── posts.md             # Auto-generated posts listing
├── scripts/
│   ├── build.js             # Main build script
│   ├── posts.js             # Post processing utilities
│   ├── sidebar.js           # Sidebar generation
│   ├── generation.js        # Content generation
│   └── utils.js             # Utility functions
├── index-template.html      # HTML template
├── index.html               # Generated HTML (auto-generated)
├── styles.css               # CSS styling
├── package.json             # Node.js dependencies
└── README.md                # This file
```

## Post Naming Convention

Posts must follow this filename format:

```
DATE--slug.md
```

Example:
```
2025-12-15--my-first-post.md
```

The filename provides:
- **Date**: 2025-12-15 (for sorting)
- **Slug**: my-first-post (for URLs)

### Frontmatter

Post metadata (title, tags, preview, etc.) is defined in YAML frontmatter at the top of each markdown file:

```markdown
---
title: My First Post
date: 2025-12-15
tags: blog,tutorial
preview: This is a preview of my first post
---

# My First Post

Your content here...
```

**Required fields:**
- `title` - The post title

**Optional fields:**
- `date` - Override the date from filename (format: YYYY-MM-DD or YYYY-M-D)
- `tags` - Comma-separated tags (e.g., `blog,tutorial`) or array format (e.g., `[blog, tutorial]`)
- `preview` - Preview text shown in the posts listing
- Any other custom fields you want to add

**Note:** The `date` field in frontmatter overrides the date in the filename. If omitted, the filename date is used.

## Sidebar Configuration

Edit `user-content/sidebar.json` to customize your navigation:

```json
{
    "": {
        "🏠 Home": {
            "target": "?page=home",
            "openInNewTab": false
        },
        "✍️ Posts": {
            "target": "?page=posts",
            "openInNewTab": false
        }
    },
    "Socials": {
        "Twitter": {
            "target": "https://x.com",
            "openInNewTab": true
        }
    }
}
```

## Customization

### Styling

Edit `styles.css` to customize:
- Colors and themes
- Layout and spacing
- Typography
- Responsive breakpoints

### Template

Edit `index-template.html` to modify:
- Page structure
- Meta tags
- Additional scripts or styles

## GitHub Pages Deployment

1. Build your site: `npm run build`
2. Commit and push to GitHub
3. Go to repository Settings → Pages
4. Select source branch (usually `main` or `master`)
5. Your site will be available at `https://yourusername.github.io/gorky`

## Dependencies

- **marked** (^9.1.6) - Markdown parser
- **html-minifier-terser** (dev) - HTML minification

## Workflow

1. **Edit Content**: Write or edit markdown files in `user-content/`
2. **Build**: Run `npm run build`
3. **Preview**: Open `index.html` locally or push to GitHub Pages
4. **Repeat**: Continue editing and building as needed

## Features in Detail

### Tag System

Posts can have multiple tags. Filter posts by tag using URL parameters:
- `?tag=blog` - Shows all posts tagged "blog"
- `?tag=tutorial` - Shows all posts tagged "tutorial"

### Custom Pages

Add any markdown file to `user-content/` and link to it from your sidebar:
- Create `user-content/about.md`
- Add link in `sidebar.json`: `"target": "?page=about"`

### Responsive Design

gorky automatically adapts to different screen sizes:
- Desktop: Two-column layout with sidebar
- Mobile: Hamburger menu with slide-out sidebar

## Troubleshooting

### Build fails
**Solution**: Make sure all dependencies are installed with `npm install`

### Posts not appearing
**Solution**: Check that post filenames follow the exact naming convention

### Sidebar not updating
**Solution**: Ensure `sidebar.json` is valid JSON and run `npm run build` again

## License

This project is open source and available for personal or commercial use.

## Contributing

Feel free to fork, modify, and use this project for your own needs. If you make improvements, consider sharing them back!

---

**Happy writing!** 📝
