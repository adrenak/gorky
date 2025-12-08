# GWebX

A simple static site generator that converts Markdown files into a static HTML website with a two-column layout (sidebar + main content area). Write your content in Markdown, run a build script, and get a fully static HTML file that works without any server.

## High-Level Overview

**What is this?**  
GWebX is a minimal static site generator. You write content in Markdown (`home.md`), and it gets converted into a styled HTML page (`index.html`) that you can open directly in any browser.

**How does it work?**  
1. You write content in `home.md` using Markdown syntax
2. Run the build script (`node build.js`)
3. The script reads your Markdown, converts it to HTML, and injects it into a template
4. You get a static `index.html` file with your content rendered

**Why use this?**  
- No server required - just open `index.html` in your browser
- Simple workflow - edit Markdown, run build, done
- Clean separation - content (Markdown) vs. presentation (HTML/CSS)
- Fast and lightweight - generates static files only

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

1. Edit `home.md` with your content using Markdown syntax
2. Build the HTML file:
   ```bash
   npm run build
   ```
   Or directly:
   ```bash
   node build.js
   ```
3. Open `index.html` in your browser - no server needed!

## Project Structure

```
gwebx/
├── home.md              # Your Markdown content (edit this)
├── index-template.html  # HTML template with layout structure
├── index.html           # Generated HTML file (auto-generated, don't edit)
├── styles.css           # CSS styling for the layout
├── build.js             # Build script that converts Markdown to HTML
├── package.json         # Node.js dependencies and scripts
└── README.md            # This file
```

### File Descriptions

- **`home.md`** - Your source content written in Markdown. This is what you edit.
- **`index-template.html`** - The HTML template that defines the page structure. Contains a placeholder `{{MARKDOWN_CONTENT}}` where your rendered content will be inserted.
- **`index.html`** - The final output file. Generated automatically by the build script. Contains your Markdown content converted to HTML and embedded in the template.
- **`styles.css`** - Stylesheet that defines the two-column layout (sidebar + main content) and all visual styling.
- **`build.js`** - The build script that orchestrates the conversion process.
- **`package.json`** - Defines the project dependencies (currently just `marked` for Markdown parsing).

## How It Works (In-Depth)

### The Build Process

When you run `node build.js`, here's what happens step by step:

1. **Read Markdown File**
   ```javascript
   const markdown = fs.readFileSync(markdownPath, 'utf8');
   ```
   The script reads `home.md` from the file system as a UTF-8 text file.

2. **Parse Markdown to HTML**
   ```javascript
   const htmlContent = marked.parse(markdown);
   ```
   The `marked` library converts your Markdown syntax into HTML:
   - `# Heading` → `<h1>Heading</h1>`
   - `**bold**` → `<strong>bold</strong>`
   - `- item` → `<li>item</li>` (wrapped in `<ul>`)
   - And so on for all Markdown features

3. **Read HTML Template**
   ```javascript
   const template = fs.readFileSync(templatePath, 'utf8');
   ```
   The script loads `index-template.html`, which contains the page structure (HTML, head, body, sidebar, main content area).

4. **Inject Content**
   ```javascript
   const finalHTML = template.replace('{{MARKDOWN_CONTENT}}', htmlContent);
   ```
   The placeholder `{{MARKDOWN_CONTENT}}` in the template is replaced with the converted HTML content.

5. **Write Output**
   ```javascript
   fs.writeFileSync(outputPath, finalHTML, 'utf8');
   ```
   The final HTML is written to `index.html`, ready to be opened in a browser.

### The Template System

The template (`index-template.html`) uses a simple string replacement system:

- **Placeholder**: `{{MARKDOWN_CONTENT}}` marks where the rendered content should go
- **Structure**: The template defines the overall page structure (sidebar, main content area, CSS links)
- **Separation**: Content (Markdown) is completely separate from presentation (HTML/CSS)

This approach is intentionally simple - no complex templating engine, just a straightforward find-and-replace operation.

### The Layout

The page uses a two-column flexbox layout:

- **Left Sidebar** (`.sidebar`): Fixed width (250px), light gray background
- **Main Content** (`.main-content`): Flexible width, fills remaining space, contains the rendered Markdown

The CSS uses `display: flex` on the container to create this layout. The sidebar is fixed-width, and the main content area expands to fill the available space.

### Markdown Support

The build script uses the [`marked`](https://github.com/markedjs/marked) library, which supports standard Markdown features:

- Headers (`#`, `##`, `###`)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links and images
- Code blocks and inline code
- Blockquotes
- And more

See the [Markdown Guide](https://www.markdownguide.org/) for full syntax reference.

## Customization

### Changing the Layout

Edit `styles.css` to modify:
- Sidebar width: Change `width: 250px` in `.sidebar`
- Colors: Modify `background-color` values
- Spacing: Adjust `padding` values in `.main-content`
- Typography: Change `font-family`, `line-height`, etc.

### Modifying the Template

Edit `index-template.html` to:
- Change the page title
- Add meta tags
- Modify the HTML structure
- Add additional elements (navigation, footer, etc.)

**Important**: The placeholder `{{MARKDOWN_CONTENT}}` must remain in the template for the build script to work.

### Styling Markdown Content

The rendered Markdown content is wrapped in `<div id="markdown-content">`. You can style it in `styles.css`:

```css
#markdown-content h1 { /* Style for h1 headings */ }
#markdown-content p { /* Style for paragraphs */ }
#markdown-content ul { /* Style for lists */ }
/* etc. */
```

## Dependencies

- **marked** (^9.1.6) - A fast, extensible Markdown parser for JavaScript

Install with:
```bash
npm install
```

## Workflow

### Typical Workflow

1. **Edit Content**: Open `home.md` in your text editor
2. **Write Markdown**: Add or modify content using Markdown syntax
3. **Build**: Run `npm run build` or `node build.js`
4. **Preview**: Open `index.html` in your browser to see the result
5. **Repeat**: Go back to step 1 for any changes

### Tips

- Keep `index.html` in `.gitignore` if using version control (it's generated)
- Commit `home.md`, `index-template.html`, `styles.css`, and `build.js` to version control
- You can add more Markdown files and extend `build.js` to generate multiple pages
- The build is fast - typically completes in milliseconds

## Troubleshooting

### Build fails with "Cannot find module 'marked'"
**Solution**: Run `npm install` to install dependencies.

### Content doesn't appear in the browser
**Solution**: Make sure you ran the build script after editing `home.md`. The `index.html` file needs to be regenerated.

### Markdown syntax not rendering correctly
**Solution**: Check that you're using valid Markdown syntax. Refer to the [Markdown Guide](https://www.markdownguide.org/) for reference.

### Layout looks broken
**Solution**: Ensure `styles.css` is in the same directory as `index.html` and the path in the template is correct.

## Extending the Project

### Adding Multiple Pages

You could extend `build.js` to:
- Read multiple Markdown files
- Generate multiple HTML files (e.g., `about.html`, `contact.html`)
- Create a navigation system

### Adding More Features

- **Syntax highlighting**: Add a library like Prism.js or Highlight.js for code blocks
- **Table of contents**: Parse headings and generate a TOC
- **Search**: Add client-side search functionality
- **Dark mode**: Add a theme switcher

## License

This project is open source and available for personal or commercial use.

## Contributing

Feel free to fork, modify, and use this project for your own needs. If you make improvements, consider sharing them back!

---

**Happy writing!** 📝

