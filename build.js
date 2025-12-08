const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// File paths
const markdownPath = path.join(__dirname, 'home.md');
const sidebarPath = path.join(__dirname, 'sidebar.json');
const templatePath = path.join(__dirname, 'index-template.html');
const outputPath = path.join(__dirname, 'index.html');
const postsPath = path.join(__dirname, 'user-content', 'posts');

// Function to check if a target is a markdown file
function isMarkdownFile(target) {
    return target.endsWith('.md') && !target.startsWith('http');
}

// Function to check if a target is a URL parameter (internal navigation)
function isURLParameter(target) {
    return target.startsWith('?');
}

// Function to extract slug from filename
// Format: DATE--slug--(tags)--Title--preview.md (exactly 4 '--')
function extractSlug(filename) {
    // Remove .md extension
    const withoutExt = filename.replace(/\.md$/, '');
    
    // Split by '--' - should have exactly 5 parts: [DATE, slug, (tags), Title, preview]
    const parts = withoutExt.split('--');
    if (parts.length === 5) {
        return parts[1]; // Second part is the slug
    }
    
    return null; // No slug found or invalid format
}

// Function to extract date from filename
// Format: DATE--slug--(tags)--Title--preview.md
function extractDateFromFilename(filename) {
    const withoutExt = filename.replace(/\.md$/, '');
    const parts = withoutExt.split('--');
    if (parts.length === 5) {
        return parts[0]; // First part is the date (e.g., "2025-12-8")
    }
    return null;
}

// Function to format date from "2025-12-8" to "8 Dec 2025"
function formatDate(dateString) {
    if (!dateString) return null;
    
    // Parse date string (format: YYYY-M-D or YYYY-MM-DD)
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (month < 1 || month > 12) return null;
    
    return `${day} ${monthNames[month - 1]} ${year}`;
}

// Function to extract tags from filename
// Format: DATE--slug--(tags)--Title--preview.md
function extractTagsFromFilename(filename) {
    const withoutExt = filename.replace(/\.md$/, '');
    const parts = withoutExt.split('--');
    if (parts.length === 5) {
        const tagsPart = parts[2]; // Third part contains tags in parentheses
        // Remove parentheses and return tags
        if (tagsPart.startsWith('(') && tagsPart.endsWith(')')) {
            return tagsPart.slice(1, -1); // Remove parentheses
        }
    }
    return null;
}

// Function to validate post filename format
// Expected format: DATE--slug--(tags)--Title--preview.md (exactly 4 '--')
function validatePostFilename(filename) {
    // Count occurrences of '--'
    const matches = filename.match(/--/g);
    const dashCount = matches ? matches.length : 0;
    
    if (dashCount !== 4) {
        return {
            valid: false,
            error: `Post file "${filename}" must have exactly 4 '--' separators. Found ${dashCount}. Expected format: DATE--slug--(tags)--Title--preview.md`
        };
    }
    
    return { valid: true };
}

// Function to check for duplicate slugs in posts folder
function checkDuplicateSlugs() {
    if (!fs.existsSync(postsPath)) {
        return; // No posts folder, nothing to check
    }
    
    const files = fs.readdirSync(postsPath);
    const slugMap = new Map(); // slug -> array of filenames
    const invalidFiles = [];
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            // Validate filename format first
            const validation = validatePostFilename(file);
            if (!validation.valid) {
                invalidFiles.push(validation.error);
                return; // Skip this file
            }
            
            const slug = extractSlug(file);
            if (slug) {
                if (!slugMap.has(slug)) {
                    slugMap.set(slug, []);
                }
                slugMap.get(slug).push(file);
            }
        }
    });
    
    // Report invalid filenames
    if (invalidFiles.length > 0) {
        console.error('❌ Error: Invalid post filename format!');
        invalidFiles.forEach(error => {
            console.error(`   ${error}`);
        });
        throw new Error(`Found ${invalidFiles.length} post file(s) with invalid format.`);
    }
    
    // Check for duplicates
    const duplicates = [];
    slugMap.forEach((filenames, slug) => {
        if (filenames.length > 1) {
            duplicates.push({ slug, files: filenames });
        }
    });
    
    if (duplicates.length > 0) {
        console.error('❌ Error: Duplicate slugs found!');
        duplicates.forEach(({ slug, files }) => {
            console.error(`   Slug "${slug}" is used in:`);
            files.forEach(file => {
                console.error(`     - ${file}`);
            });
        });
        throw new Error(`Found ${duplicates.length} duplicate slug(s). Each slug must be unique.`);
    }
}

// Function to generate a single nav item HTML
function generateNavItem(label, config, isActive = false) {
    // Extract emoji and text from label (e.g., "🏠 Home" -> emoji: "🏠", text: "Home")
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    const emoji = emojiMatch ? emojiMatch[1] : '';
    const text = emojiMatch ? emojiMatch[2] : label;
    
    // Determine if this is the active link
    const activeClass = isActive ? ' active' : '';
    
    // Check if it's a markdown file (internal content switch)
    const isMarkdown = isMarkdownFile(config.target);
    // Check if it's a URL parameter (internal navigation)
    const isURLParam = isURLParameter(config.target);
    // Internal navigation (markdown files or URL parameters that don't open in new tab)
    const isInternal = isMarkdown || (isURLParam && !config.openInNewTab);
    
    // Build target attribute - for external links or URL params that should open in new tab
    const targetAttr = (config.openInNewTab) ? ' target="_blank" rel="noopener noreferrer"' : '';
    
    // Build data attribute for content switching (markdown files)
    const dataContentAttr = isMarkdown ? ` data-content="${config.target}"` : '';
    // Build data attribute for URL parameter navigation (only if not opening in new tab)
    const dataURLAttr = (isURLParam && !config.openInNewTab) ? ` data-url="${config.target}"` : '';
    
    // Generate HTML for this nav item
    // If it's a URL param that opens in new tab, use the full URL; otherwise use # for internal
    const hrefValue = isInternal ? '#' : config.target;
    let itemHTML = `<a href="${hrefValue}" class="nav-link${activeClass}"${targetAttr}${dataContentAttr}${dataURLAttr}>\n`;
    if (emoji) {
        itemHTML += `    <span class="nav-icon">${emoji}</span>\n`;
    }
    itemHTML += `    <span>${text}</span>\n`;
    // Show external icon for links that open in new tab, but not for URL parameter links
    if (config.openInNewTab && !isURLParam) {
        itemHTML += `    <span class="external-icon">↗</span>\n`;
    }
    itemHTML += `</a>\n`;
    
    return itemHTML;
}

// Function to generate sidebar navigation HTML from JSON
function generateSidebarNav(sidebarData) {
    let navHTML = '';
    let isFirstRootItem = true;
    
    // Process sections in order
    Object.entries(sidebarData).forEach(([sectionName, items]) => {
        if (sectionName === '') {
            // Root navigation items (no section header)
            Object.entries(items).forEach(([label, config]) => {
                // If target is "#" or empty, treat as home.md
                if (config.target === '#' || config.target === '') {
                    config.target = 'home.md';
                }
                navHTML += generateNavItem(label, config, isFirstRootItem);
                isFirstRootItem = false;
            });
        } else {
            // Section with header
            navHTML += `<div class="sidebar-section">\n`;
            navHTML += `    <h3 class="section-title">${sectionName}</h3>\n`;
            navHTML += `    <ul class="section-list">\n`;
            
            Object.entries(items).forEach(([label, config]) => {
                navHTML += `        <li>\n`;
                // Indent the nav item HTML
                const itemHTML = generateNavItem(label, config, false);
                navHTML += itemHTML.split('\n').map(line => line ? `            ${line}` : line).join('\n');
                navHTML += `        </li>\n`;
            });
            
            navHTML += `    </ul>\n`;
            navHTML += `</div>\n`;
        }
    });
    
    return navHTML;
}

// Function to collect all markdown files referenced in sidebar and posts folder
function collectMarkdownFiles(sidebarData) {
    const markdownFiles = new Map();
    
    // Default home.md
    markdownFiles.set('home.md', 'home.md');
    
    // Traverse sidebar data to find all .md files and URL parameters
    Object.values(sidebarData).forEach(items => {
        Object.values(items).forEach(config => {
            if (isMarkdownFile(config.target)) {
                markdownFiles.set(config.target, config.target);
            } else if (isURLParameter(config.target)) {
                // Extract page name from URL parameter (e.g., ?page=posts -> posts.md)
                const urlParams = new URLSearchParams(config.target.substring(1)); // Remove '?'
                const pageParam = urlParams.get('page');
                if (pageParam && (pageParam === 'home' || pageParam === 'posts')) {
                    const mdFile = pageParam + '.md';
                    markdownFiles.set(mdFile, mdFile);
                }
            }
        });
    });
    
    // Also load all post files from user-content/posts folder
    if (fs.existsSync(postsPath)) {
        const postFiles = fs.readdirSync(postsPath);
        postFiles.forEach(file => {
            if (file.endsWith('.md')) {
                const filePath = path.join('user-content', 'posts', file);
                markdownFiles.set(filePath, filePath);
            }
        });
    }
    
    return markdownFiles;
}

// Function to get slug from a markdown file path
function getSlugFromFilePath(filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // If it's a post file, extract slug from filename
    if (normalizedPath.startsWith('user-content/posts/')) {
        const filename = path.basename(filePath);
        return extractSlug(filename);
    }
    // For non-post files like home.md, return null (no slug)
    return null;
}

// Function to get formatted date from a markdown file path
function getDateFromFilePath(filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // If it's a post file, extract and format date from filename
    if (normalizedPath.startsWith('user-content/posts/')) {
        const filename = path.basename(filePath);
        const dateString = extractDateFromFilename(filename);
        return formatDate(dateString);
    }
    // For non-post files, return null (no date)
    return null;
}

// Function to get tags from a markdown file path
function getTagsFromFilePath(filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // If it's a post file, extract tags from filename
    if (normalizedPath.startsWith('user-content/posts/')) {
        const filename = path.basename(filePath);
        return extractTagsFromFilename(filename);
    }
    // For non-post files, return null (no tags)
    return null;
}

// Function to extract title from post filename
// Format: DATE--slug--(tags)--Title--preview.md
function extractTitleFromFilename(filename) {
    const withoutExt = filename.replace(/\.md$/, '');
    const parts = withoutExt.split('--');
    if (parts.length === 5) {
        return parts[3]; // Title is the fourth part (index 3)
    }
    return null;
}

// Function to generate posts.md from files in posts folder
function generatePostsMd() {
    if (!fs.existsSync(postsPath)) {
        return; // No posts folder, nothing to generate
    }
    
    const files = fs.readdirSync(postsPath);
    const posts = [];
    const allTagsSet = new Set(); // Use Set to automatically handle distinct tags
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            // Validate filename format first
            const validation = validatePostFilename(file);
            if (!validation.valid) {
                return; // Skip invalid files
            }
            
            const title = extractTitleFromFilename(file);
            const slug = extractSlug(file);
            const dateString = extractDateFromFilename(file);
            const tags = extractTagsFromFilename(file);
            
            // Collect all tags
            if (tags) {
                const tagList = tags.split(',').map(t => t.trim());
                tagList.forEach(tag => {
                    if (tag) {
                        allTagsSet.add(tag);
                    }
                });
            }
            
            if (title && slug) {
                posts.push({ title, slug, filename: file, dateString });
            }
        }
    });
    
    // Convert Set to sorted array
    const distinctTags = Array.from(allTagsSet).sort();
    
    // Sort posts by date - newest first
    posts.sort((a, b) => {
        // Parse dates from date strings (format: YYYY-M-D or YYYY-MM-DD)
        const parseDate = (dateStr) => {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return new Date(0);
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        };
        
        const dateA = parseDate(a.dateString);
        const dateB = parseDate(b.dateString);
        
        // Sort descending (newest first)
        return dateB - dateA;
    });
    
    // Generate markdown content
    let postsMd = '# Posts\n\n';
    
    // Add tags section if there are any tags
    if (distinctTags.length > 0) {
        postsMd += '## Tags\n\n';
        distinctTags.forEach((tag, index) => {
            postsMd += `[${tag}](?tag=${encodeURIComponent(tag)})`;
            if (index < distinctTags.length - 1) {
                postsMd += ' • '; // Add bullet separator between tags
            }
        });
        postsMd += '\n\n---\n\n';
    }
    
    // Add posts list
    posts.forEach(post => {
        postsMd += `## [${post.title}](?post=${post.slug})\n\n`;
    });
    
    // Write to posts.md
    const postsMdPath = path.join(__dirname, 'posts.md');
    fs.writeFileSync(postsMdPath, postsMd, 'utf8');
    
    console.log(`✓ Generated posts.md with ${posts.length} post(s)`);
}

// Function to fix image paths in HTML for post files
// Converts relative image paths to user-content/posts/images/ paths
function fixImagePaths(htmlContent, filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Only fix paths for post files
    if (normalizedPath.startsWith('user-content/posts/')) {
        // Replace image src attributes that are relative paths
        // Matches: src="images/..." or src='images/...' or src="./images/..."
        htmlContent = htmlContent.replace(
            /src=["'](\.\/)?images\//g,
            'src="user-content/posts/images/'
        );
    }
    
    return htmlContent;
}

// Function to generate content sections for all markdown files
function generateContentSections(markdownFiles, defaultFile = 'home.md') {
    let contentHTML = '';
    
    markdownFiles.forEach((filePath, key) => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const markdown = fs.readFileSync(fullPath, 'utf8');
                let htmlContent = marked.parse(markdown);
                
                // Fix image paths for post files
                htmlContent = fixImagePaths(htmlContent, filePath);
                
                const isDefault = filePath === defaultFile;
                const displayStyle = isDefault ? 'block' : 'none';
                const slug = getSlugFromFilePath(filePath);
                const formattedDate = getDateFromFilePath(filePath);
                const tags = getTagsFromFilePath(filePath);
                const slugAttr = slug ? ` data-slug="${slug}"` : '';
                const dateAttr = formattedDate ? ` data-date="${formattedDate}"` : '';
                const tagsAttr = tags ? ` data-tags="${tags}"` : '';
                contentHTML += `<div id="content-${key.replace(/\./g, '-')}" class="content-section"${slugAttr}${dateAttr}${tagsAttr} style="display: ${displayStyle};">\n`;
                contentHTML += htmlContent;
                contentHTML += `</div>\n`;
            }
        } catch (error) {
            console.warn(`Warning: Could not load ${filePath}:`, error.message);
        }
    });
    
    return contentHTML;
}

try {
    // Check for duplicate slugs in posts folder
    checkDuplicateSlugs();
    
    // Generate posts.md from files in posts folder
    generatePostsMd();
    
    // Read sidebar JSON
    const sidebarData = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'));
    
    // Generate sidebar navigation HTML
    const sidebarNavHTML = generateSidebarNav(sidebarData);
    
    // Collect all markdown files referenced in sidebar
    const markdownFiles = collectMarkdownFiles(sidebarData);
    
    // Generate content sections for all markdown files
    const contentHTML = generateContentSections(markdownFiles, 'home.md');
    
    // Read template
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace('{{SIDEBAR_NAV}}', sidebarNavHTML);
    template = template.replace('{{MARKDOWN_CONTENT}}', contentHTML);
    
    // Write output
    fs.writeFileSync(outputPath, template, 'utf8');
    
    console.log('✓ Successfully generated index.html from markdown files and sidebar.json');
} catch (error) {
    console.error('Error building HTML:', error.message);
    process.exit(1);
}

