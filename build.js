const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// ============================================================================
// CONSTANTS
// ============================================================================

const PATHS = {
    sidebar: path.join(__dirname, config.paths.sidebar),
    template: path.join(__dirname, 'index-template.html'),
    output: path.join(__dirname, 'index.html'),
    posts: path.join(__dirname, config.paths.posts),
    postsMd: path.join(__dirname, config.paths.postsMd),
    homeMd: path.join(__dirname, 'user-content', 'home.md'),
};

// POSTS_FOLDER_PREFIX is derived from config.paths.posts
const POSTS_FOLDER_PREFIX = config.paths.posts.replace(/\\/g, '/') + '/';
const POST_FILENAME_PARTS = 5; // DATE--slug--(tags)--Title--preview.md
const POST_FILENAME_SEPARATOR = '--';
const REQUIRED_DASHES = 4; // Number of '--' separators in post filename

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes a file path to use forward slashes
 */
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}

/**
 * Checks if a path is a post file
 */
function isPostFile(filePath) {
    return normalizePath(filePath).startsWith(POSTS_FOLDER_PREFIX);
}

/**
 * Checks if a target is a markdown file
 */
function isMarkdownFile(target) {
    return target.endsWith('.md') && !target.startsWith('http');
}

/**
 * Checks if a target is a URL parameter (internal navigation)
 */
function isURLParameter(target) {
    return target.startsWith('?');
}

// ============================================================================
// POST FILENAME PARSING
// ============================================================================

/**
 * Parses a post filename and returns all parts
 * Format: DATE--slug--(tags)--Title--preview.md
 * @returns {Object|null} Object with date, slug, tags, title, preview or null if invalid
 */
function parsePostFilename(filename) {
    const withoutExt = filename.replace(/\.md$/, '');
    const parts = withoutExt.split(POST_FILENAME_SEPARATOR);
    
    if (parts.length !== POST_FILENAME_PARTS) {
        return null;
    }
    
    const [date, slug, tagsPart, title, preview] = parts;
    
    // Extract tags from parentheses
    let tags = null;
    if (tagsPart.startsWith('(') && tagsPart.endsWith(')')) {
        tags = tagsPart.slice(1, -1);
    }
    
    return { date, slug, tags, title, preview };
}

/**
 * Validates post filename format
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePostFilename(filename) {
    const matches = filename.match(/--/g);
    const dashCount = matches ? matches.length : 0;
    
    if (dashCount !== REQUIRED_DASHES) {
        return {
            valid: false,
            error: `Post file "${filename}" must have exactly ${REQUIRED_DASHES} '--' separators. Found ${dashCount}. Expected format: DATE--slug--(tags)--Title--preview.md`
        };
    }
    
    return { valid: true };
}

/**
 * Formats date from "2025-12-8" to "8 Dec 2025"
 */
function formatDate(dateString) {
    if (!dateString) return null;
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12) return null;
    
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Extracts post metadata from a file path
 * @returns {Object} Object with slug, date, tags, title (or null for non-post files)
 */
function extractPostMetadata(filePath) {
    if (!isPostFile(filePath)) {
        return { slug: null, date: null, tags: null, title: null };
    }
    
    const filename = path.basename(filePath);
    const parsed = parsePostFilename(filename);
    
    if (!parsed) {
        return { slug: null, date: null, tags: null, title: null };
    }
    
    return {
        slug: parsed.slug,
        date: formatDate(parsed.date),
        tags: parsed.tags,
        title: parsed.title,
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Checks for duplicate slugs in posts folder
 */
function checkDuplicateSlugs() {
    if (!fs.existsSync(PATHS.posts)) {
        return;
    }
    
    const files = fs.readdirSync(PATHS.posts);
    const slugMap = new Map(); // slug -> array of filenames
    const invalidFiles = [];
    
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        
        const validation = validatePostFilename(file);
        if (!validation.valid) {
            invalidFiles.push(validation.error);
            return;
        }
        
        const parsed = parsePostFilename(file);
        if (parsed && parsed.slug) {
            if (!slugMap.has(parsed.slug)) {
                slugMap.set(parsed.slug, []);
            }
            slugMap.get(parsed.slug).push(file);
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

// ============================================================================
// SIDEBAR GENERATION
// ============================================================================

/**
 * Generates HTML for a single navigation item
 */
function generateNavItem(label, config, isActive = false) {
    // Extract emoji and text from label (e.g., "🏠 Home" -> emoji: "🏠", text: "Home")
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    const emoji = emojiMatch ? emojiMatch[1] : '';
    const text = emojiMatch ? emojiMatch[2] : label;
    
    const activeClass = isActive ? ' active' : '';
    const isMarkdown = isMarkdownFile(config.target);
    const isURLParam = isURLParameter(config.target);
    const isInternal = isMarkdown || (isURLParam && !config.openInNewTab);
    
    const targetAttr = config.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const dataContentAttr = isMarkdown ? ` data-content="${config.target}"` : '';
    const dataURLAttr = (isURLParam && !config.openInNewTab) ? ` data-url="${config.target}"` : '';
    const hrefValue = isInternal ? '#' : config.target;
    
    let itemHTML = `<a href="${hrefValue}" class="nav-link${activeClass}"${targetAttr}${dataContentAttr}${dataURLAttr}>\n`;
    if (emoji) {
        itemHTML += `    <span class="nav-icon">${emoji}</span>\n`;
    }
    itemHTML += `    <span>${text}</span>\n`;
    if (config.openInNewTab && !isURLParam) {
        itemHTML += `    <span class="external-icon">↗</span>\n`;
    }
    itemHTML += `</a>\n`;
    
    return itemHTML;
}

/**
 * Generates sidebar navigation HTML from JSON
 */
function generateSidebarNav(sidebarData) {
    let navHTML = '';
    let isFirstRootItem = true;
    
    Object.entries(sidebarData).forEach(([sectionName, items]) => {
        if (sectionName === '') {
            // Root navigation items
            Object.entries(items).forEach(([label, config]) => {
                if (config.target === '#' || config.target === '') {
                    config.target = 'user-content/home.md';
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

// ============================================================================
// MARKDOWN FILE COLLECTION
// ============================================================================

/**
 * Collects all markdown files referenced in sidebar and posts folder
 */
function collectMarkdownFiles(sidebarData) {
    const markdownFiles = new Map();
    
    // Default home.md
    markdownFiles.set('user-content/home.md', 'user-content/home.md');
    
    // Traverse sidebar data to find all .md files and URL parameters
    Object.values(sidebarData).forEach(items => {
        Object.values(items).forEach(config => {
            if (isMarkdownFile(config.target)) {
                markdownFiles.set(config.target, config.target);
            } else if (isURLParameter(config.target)) {
                const urlParams = new URLSearchParams(config.target.substring(1));
                const pageParam = urlParams.get('page');
                if (pageParam && (pageParam === 'home' || pageParam === 'posts')) {
                    const mdFile = `user-content/${pageParam}.md`;
                    markdownFiles.set(mdFile, mdFile);
                }
            }
        });
    });
    
    // Load all post files from user-content/posts folder
    if (fs.existsSync(PATHS.posts)) {
        const postFiles = fs.readdirSync(PATHS.posts);
        postFiles.forEach(file => {
            if (file.endsWith('.md')) {
                const filePath = path.join('user-content', 'posts', file);
                markdownFiles.set(filePath, filePath);
            }
        });
    }
    
    return markdownFiles;
}

// ============================================================================
// POSTS.MD GENERATION (imported from process-posts.js)
// ============================================================================

const { generatePostsMd } = require('./process-posts');

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Fixes image paths in HTML for post files
 * Converts relative image paths to user-content/posts/images/ paths
 */
function fixImagePaths(htmlContent, filePath) {
    if (!isPostFile(filePath)) {
        return htmlContent;
    }
    
    // Replace image src attributes that are relative paths
    return htmlContent.replace(
        /src=["'](\.\/)?images\//g,
        'src="user-content/posts/images/'
    );
}

/**
 * Generates HTML attributes for post metadata
 */
function generatePostAttributes(metadata) {
    const attrs = [];
    if (metadata.slug) attrs.push(`data-slug="${metadata.slug}"`);
    if (metadata.date) attrs.push(`data-date="${metadata.date}"`);
    if (metadata.tags) attrs.push(`data-tags="${metadata.tags}"`);
    if (metadata.title) {
        const escapedTitle = metadata.title.replace(/"/g, '&quot;');
        attrs.push(`data-title="${escapedTitle}"`);
    }
    return attrs.join(' ');
}

/**
 * Generates content sections for all markdown files
 */
function generateContentSections(markdownFiles, defaultFile = 'user-content/home.md') {
    let contentHTML = '';
    
    markdownFiles.forEach((filePath, key) => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (!fs.existsSync(fullPath)) return;
            
            const markdown = fs.readFileSync(fullPath, 'utf8');
            let htmlContent = marked.parse(markdown);
            htmlContent = fixImagePaths(htmlContent, filePath);
            
            const isDefault = filePath === defaultFile;
            const displayStyle = isDefault ? 'block' : 'none';
            const metadata = extractPostMetadata(filePath);
            const attributes = generatePostAttributes(metadata);
            const contentId = `content-${key.replace(/\./g, '-')}`;
            
            contentHTML += `<div id="${contentId}" class="content-section"${attributes ? ' ' + attributes : ''} style="display: ${displayStyle};">\n`;
            contentHTML += htmlContent;
            contentHTML += `</div>\n`;
        } catch (error) {
            console.warn(`Warning: Could not load ${filePath}:`, error.message);
        }
    });
    
    return contentHTML;
}

// ============================================================================
// MAIN BUILD PROCESS
// ============================================================================

function build() {
    try {
        // Validation
        checkDuplicateSlugs();
        
        // Generate posts.md
        generatePostsMd();
        
        // Read sidebar JSON
        const sidebarData = JSON.parse(fs.readFileSync(PATHS.sidebar, 'utf8'));
        
        // Generate sidebar navigation
        const sidebarNavHTML = generateSidebarNav(sidebarData);
        
        // Collect and generate content
        const markdownFiles = collectMarkdownFiles(sidebarData);
        const contentHTML = generateContentSections(markdownFiles, 'user-content/home.md');
        
        // Read template and replace placeholders
        let template = fs.readFileSync(PATHS.template, 'utf8');
        template = template.replace('{{SIDEBAR_NAV}}', sidebarNavHTML);
        template = template.replace('{{MARKDOWN_CONTENT}}', contentHTML);
        
        // Write output
        fs.writeFileSync(PATHS.output, template, 'utf8');
        
        console.log('✓ Successfully generated index.html from markdown files and sidebar.json');
    } catch (error) {
        console.error('Error building HTML:', error.message);
        process.exit(1);
    }
}

// Run build
build();
