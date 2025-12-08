const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { generatePostsMd, extractPostMetadata, isPostFile, normalizePath, checkDuplicateSlugs, generatePostAttributes } = require('./posts');
const { isMarkdownFile, isURLParameter } = require('./utils');

// ============================================================================
// CONSTANTS
// ============================================================================

const PATHS = {
    sidebar: path.join(__dirname, '..', 'user-content', 'sidebar.json'),
    template: path.join(__dirname, '..', 'index-template.html'),
    output: path.join(__dirname, '..', 'index.html'),
    posts: path.join(__dirname, '..', 'user-content', 'posts'),
    postsMd: path.join(__dirname, '..', 'user-content', 'posts.md'),
    homeMd: path.join(__dirname, '..', 'user-content', 'home.md'),
};

const POSTS_FOLDER_PREFIX = 'user-content/posts/';

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
                if (pageParam) {
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
// CONTENT GENERATION
// ============================================================================

/**
 * Generates content sections for all markdown files
 */
function generateContentSections(markdownFiles, defaultFile = 'user-content/home.md') {
    let contentHTML = '';
    
    markdownFiles.forEach((filePath, key) => {
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            if (!fs.existsSync(fullPath)) return;
            
            const markdown = fs.readFileSync(fullPath, 'utf8');
            let htmlContent = marked.parse(markdown);
            
            const isDefault = filePath === defaultFile;
            const displayStyle = isDefault ? 'block' : 'none';
            const metadata = extractPostMetadata(filePath, POSTS_FOLDER_PREFIX);
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
        checkDuplicateSlugs(PATHS.posts);
        
        // Generate posts.md
        generatePostsMd(PATHS.posts, PATHS.postsMd);
        
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
