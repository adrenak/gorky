---
slug: writing-a-post
title: Writing a post
date: 2025-12-10
tags: tutorial, writing
thumbnail: content/images/gorky.jpg
description: Learn how to write posts in Gorky using markdown and HTML
---

Posts in Gorky are written in Markdown, which makes it easy to format your content with simple syntax. However, you can also use HTML tags when you need more control or want to embed rich content like videos or create advanced layouts.

## Basic Markdown

Markdown provides a simple way to format text with headers, lists, links, and more. For example:

- **Bold text** with `**bold**`
- *Italic text* with `*italic*`
- [Links](https://www.google.com) with `[text](url)`
- Code blocks with triple backticks

> Blockquotes are also handled

[Here's a Markdown cheatsheet](https://www.markdownguide.org/cheat-sheet/)  

## Embedding YouTube Videos

You can embed YouTube videos using HTML iframes. Here's an example:

<iframe width="560" height="315" src="https://www.youtube.com/embed/aqz-KE-bpKQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

To embed a video, use this HTML format:

```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

Replace `VIDEO_ID` with the video ID from the YouTube URL. For example, if the URL is `https://www.youtube.com/watch?v=aqz-KE-bpKQ`, the video ID is `aqz-KE-bpKQ`.

## Adding Images with Markdown

You can add images using standard Markdown syntax:

![Gorky](content/images/gorky.jpg)

The syntax is:

```markdown
![Alt text](path/to/image.jpg)
```

The alt text is displayed if the image can't be loaded and helps with accessibility.

## Adding Images with HTML (Floating)

For more control over image positioning, you can use HTML tags. Here's how to float an image to the right:

<img src="content/images/gorky.jpg" alt="Gorky" style="float: right; margin: 0 0 1rem 1rem; max-width: 300px;">

You can see this image is floating to the right side of the text. This is useful when you want images to flow alongside your content rather than breaking into a new block. The HTML syntax gives you full control over styling, including margins, sizing, and positioning.

Here's the HTML code to float an image to the right:

```html
<img src="content/images/gorky.jpg" alt="Gorky" style="float: right; margin: 0 0 1rem 1rem; max-width: 300px;">
```

The CSS properties used:
- `float: right` - Floats the image to the right
- `margin: 0 0 1rem 1rem` - Adds space around the image (top, right, bottom, left)
- `max-width: 300px` - Limits the maximum width of the image

You can adjust these values to suit your needs. For example, use `float: left` to float the image to the left side instead.

## Archiving posts

Over time your `posts/` list can get crowded with older writing you no longer want front and center. Archiving hides a post from that page and from tag listings while keeping its URL working.

Add `archived: true` to a post's frontmatter:

```yaml
---
slug: my-old-post
title: My Old Post
date: 2024-01-15
archived: true
---
```

If `archived:` is not set, the post is treated as not archived.

[Look at this archived sample post](../archived-post/) — it won't show up on the posts page, but the URL still works.

## Collapsible sections

Use HTML `<details>` and `<summary>` tags to create collapsible sections:

<details>
<summary>Click to expand</summary>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

</details>

## Combining Markdown and HTML

Remember, you can freely mix Markdown and HTML in your posts. Use Markdown for simple formatting, and switch to HTML when you need more advanced features like videos, custom layouts, or specific styling.

