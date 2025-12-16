---
slug: markdown-cheatsheet
title: Markdown Cheatsheet
date: 2025-12-10
tags: markdown, tutorial
description: A quick reference guide for all markdown syntax
---

A comprehensive reference guide for Markdown syntax. Bookmark this page for quick access to all Markdown formatting options.

## Headers

```markdown
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
```

## Emphasis

```markdown
*italic text* or _italic text_
**bold text** or __bold text__
***bold italic*** or ___bold italic___
~~strikethrough~~
```

## Lists

### Unordered Lists

```markdown
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

* Alternative bullet
* Another item
```

### Ordered Lists

```markdown
1. First item
2. Second item
3. Third item
   1. Nested numbered item
   2. Another nested item
```

## Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title text")
<https://example.com>
[Reference link][ref-id]

[ref-id]: https://example.com "Optional title"
```

## Images

```markdown
![Alt text](image-url.jpg)
![Alt text](image-url.jpg "Image title")
![Reference image][img-ref]

[img-ref]: image-url.jpg "Image title"
```

## Code

### Inline Code

```markdown
Use `backticks` for inline code.
```

### Code Blocks

````markdown
```language
function example() {
    return "code block";
}
```
````

Supported languages: `javascript`, `python`, `java`, `csharp`, `html`, `css`, `json`, `bash`, and many more.

## Blockquotes

```markdown
> This is a blockquote.
> It can span multiple lines.
>
> > Nested blockquote
```

## Horizontal Rules

```markdown
---
***
___
```

## Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

| Left Align | Center Align | Right Align |
|:-----------|:------------:|------------:|
| Left       | Center       | Right       |
```

## Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
```

## Escaping Characters

Use backslash `\` to escape special characters:

```markdown
\*not italic\*
\#not a header
\[not a link\](
```

## Line Breaks

```markdown
End a line with two spaces for a line break.

Or use a blank line for a paragraph break.
```

## HTML

You can use raw HTML in Markdown:

```markdown
<button>Click me</button>
<details>
<summary>Click to expand</summary>
Hidden content here
</details>
```

## Common Patterns

### Definition Lists

```markdown
Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b
```

### Footnotes

```markdown
Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.
```

### Abbreviations

```markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

The HTML and CSS are used for web development.
```

## Tips

1. **Consistency**: Use consistent formatting throughout your document
2. **Readability**: Add blank lines between sections for better readability
3. **Preview**: Always preview your markdown before publishing
4. **Syntax Highlighting**: Use appropriate language tags in code blocks
5. **Links**: Use descriptive link text instead of raw URLs

## Markdown Flavors

Different platforms support different Markdown features:

- **GitHub Flavored Markdown (GFM)**: Tables, task lists, strikethrough
- **CommonMark**: Standardized Markdown specification
- **MultiMarkdown**: Footnotes, tables, definition lists
- **Pandoc Markdown**: Extended features for academic writing

Happy writing! 📝


