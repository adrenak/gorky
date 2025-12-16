---
title: Customization
description: Learn how to customize fonts, colors, and styling to make your website unique
keywords: customization, styling, fonts, colors, CSS, theme
---

# Customization Guide

This guide will help you customize the look and feel of your gorky website by modifying fonts and colors. All styling is controlled through CSS files in the `styles/` directory.

## CSS File Structure

The styles are organized into several files, each controlling different aspects:

- **`styles/base.css`** - Global font family and base styles
- **`styles/layout.css`** - Main layout, sidebar, and background colors
- **`styles/navigation.css`** - Navigation links, hover states, and active states
- **`styles/content.css`** - Content typography, headings, links, and code blocks
- **`styles/mobile.css`** - Mobile-specific styles
- **`styles/responsive.css`** - Responsive breakpoints and adjustments

## Changing Fonts

### Main Body Font

The main font for all content is set in `styles/base.css`. By default, it uses a system font stack:

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
```

**To change it**, edit `styles/base.css` and replace with your preferred font:

```css
body {
    font-family: 'Your Font Name', sans-serif;
}
```

**Using Google Fonts:**

1. Add the font link in `index-template.html` (in the `<head>` section):
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
   ```

2. Update `styles/base.css`:
   ```css
   body {
       font-family: 'Inter', sans-serif;
   }
   ```

**Popular font choices:**
- `'Inter', sans-serif` - Modern, clean sans-serif
- `'Merriweather', serif` - Readable serif font
- `'Fira Code', monospace` - For a monospace feel
- `'Playfair Display', serif` - Elegant serif

### Heading Fonts

Headings use the same font as the body by default. To change heading fonts, edit `styles/content.css`:

```css
#markdown-content h1 {
    font-family: 'Your Heading Font', sans-serif;
    font-size: 2rem;
    font-weight: 600;
}

#markdown-content h2 {
    font-family: 'Your Heading Font', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
}
```

### Code Font

Code blocks and inline code use a monospace font. Edit `styles/content.css`:

```css
#markdown-content code {
    font-family: 'Courier New', monospace;
    /* Or use a custom monospace font */
    /* font-family: 'Fira Code', 'Courier New', monospace; */
}
```

**Popular monospace fonts:**
- `'Fira Code'` - Programming font with ligatures
- `'JetBrains Mono'` - Modern monospace
- `'Source Code Pro'` - Clean code font

## Changing Colors

### Sidebar Background

The sidebar background color is in `styles/layout.css`:

```css
.sidebar {
    background-color: #f5f5f5;  /* Light gray */
}
```

**Color suggestions:**
- `#ffffff` - Pure white
- `#f8f9fa` - Very light gray
- `#2d3748` - Dark gray/charcoal
- `#1a202c` - Very dark (dark mode)

### Main Content Background

The main content area background is also in `styles/layout.css`:

```css
.main-content {
    background-color: #ffffff;  /* White */
}
```

### Navigation Link Colors

Navigation link colors are in `styles/navigation.css`:

**Default link color:**
```css
.nav-link {
    color: rgba(0, 0, 0, 0.6);  /* 60% opacity black */
}
```

**Hover state:**
```css
.nav-link:hover {
    background-color: rgb(188, 188, 188);  /* Light gray background */
    color: rgba(0, 0, 0, 0.8);  /* Darker text */
}
```

**Active/selected link:**
```css
.nav-link.active {
    background-color: #000000;  /* Black background */
    color: rgb(255, 255, 255);  /* White text */
}
```

**To customize**, change these values in `styles/navigation.css`. For example, a blue theme:

```css
.nav-link {
    color: rgba(0, 0, 0, 0.7);
}

.nav-link:hover {
    background-color: #e3f2fd;  /* Light blue */
    color: #1976d2;  /* Blue text */
}

.nav-link.active {
    background-color: #1976d2;  /* Blue background */
    color: rgb(255, 255, 255);  /* White text */
}
```

### Content Link Colors

Content links (in blog posts and pages) are styled in `styles/content.css`:

```css
#markdown-content a {
    color: #0066cc;  /* Blue */
}

#markdown-content a:hover {
    color: #0052a3;  /* Darker blue */
}
```

**To change**, edit `styles/content.css`:

```css
#markdown-content a {
    color: #your-color;  /* Your preferred link color */
}

#markdown-content a:hover {
    color: #your-hover-color;  /* Darker shade for hover */
}
```

### Code Block Background

Code block backgrounds are in `styles/content.css`:

```css
#markdown-content code {
    background-color: #f4f4f4;  /* Light gray */
}

#markdown-content pre {
    background-color: #f4f4f4;  /* Light gray */
}
```

**To change**, use any color you prefer:

```css
#markdown-content code {
    background-color: #f8f9fa;  /* Lighter gray */
}

#markdown-content pre {
    background-color: #282c34;  /* Dark background for code blocks */
    color: #abb2bf;  /* Light text */
}
```

### Sidebar Footer

Footer colors are in `styles/navigation.css`:

```css
.sidebar-footer {
    background-color: #f5f5f5;  /* Light gray */
}

.footer-text,
.footer-link {
    color: rgba(0, 0, 0, 0.6);  /* 60% opacity black */
}
```

## Quick Color Theme Examples

### Light Theme (Default)
- Sidebar: `#f5f5f5`
- Content: `#ffffff`
- Links: `#0066cc`
- Active nav: `#000000` with white text

### Dark Theme
Edit `styles/layout.css`:
```css
.sidebar {
    background-color: #1a202c;
    color: white;
}

.main-content {
    background-color: #2d3748;
    color: #e2e8f0;
}
```

Edit `styles/navigation.css`:
```css
.nav-link {
    color: rgba(255, 255, 255, 0.7);
}

.nav-link.active {
    background-color: #4a5568;
    color: rgb(255, 255, 255);
}
```

Edit `styles/content.css`:
```css
#markdown-content {
    color: #e2e8f0;
}

#markdown-content a {
    color: #63b3ed;
}
```

### Blue Theme
- Sidebar: `#e3f2fd`
- Active nav: `#1976d2`
- Links: `#1565c0`

## Tips

1. **Use CSS variables** (optional): For easier theming, you can define CSS custom properties in `styles/base.css`:
   ```css
   :root {
       --primary-color: #0066cc;
       --sidebar-bg: #f5f5f5;
       --content-bg: #ffffff;
   }
   ```
   Then use them throughout: `color: var(--primary-color);`

2. **Test your changes**: After modifying CSS, run `npm run build` and check `index.html` in your browser.

3. **Keep backups**: Before making major changes, consider committing your current state to git.

4. **Browser DevTools**: Use your browser's developer tools (F12) to inspect elements and test color changes in real-time before editing files.

## Need Help?

- Check the comments in each CSS file - they describe what each section controls
- Use browser DevTools to inspect elements and see which CSS file controls them
- Test changes incrementally - change one thing at a time to see the effect

Happy customizing! 🎨

