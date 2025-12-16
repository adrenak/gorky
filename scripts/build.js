// ============================================================================
// BUILD.JS
//
// This is the main build script that orchestrates the entire build process:
//
// 1. Validates posts (checks for duplicate slugs)
// 2. Generates posts.md from all post files
// 3. Reads sidebar configuration
// 4. Generates sidebar navigation HTML
// 5. Collects all markdown files
// 6. Generates content sections HTML
// 7. Reads template and replaces placeholders
// 8. Writes final index.html
//
// Entry point: Run with `npm run build`
// ============================================================================

const fs = require('fs');
const path = require('path');
const { generatePostsMd, checkDuplicateSlugs, extractPostMetadata } = require('./posts');
const { generateMainNav, generateSidebarNav, generateSidebarHeader, generateSidebarFooter } = require('./sidebar');
const { collectMarkdownFiles, generateContentSections } = require('./generation');

// ============================================================================
// CONSTANTS
// ============================================================================

const PATHS = {
    sidebar: path.join(__dirname, '..', 'content', 'sidebar.json'),
    template: path.join(__dirname, '..', 'index-template.html'),
    output: path.join(__dirname, '..', 'index.html'),
    posts: path.join(__dirname, '..', 'content', 'posts'),
    postsMd: path.join(__dirname, '..', 'content', 'posts.md'),
    homeMd: path.join(__dirname, '..', 'content', 'home.md'),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Extracts SITE_CONFIG from template file
 * @param {string} templateContent - Template file content
 * @returns {Object} SITE_CONFIG object
 */
function extractSiteConfig(templateContent) {
    const configMatch = templateContent.match(/const SITE_CONFIG = \{([\s\S]*?)\};/);
    if (!configMatch) {
        // Fallback defaults
        return {
            baseUrl: 'https://yourusername.github.io/gorky',
            siteName: 'gorky',
            defaultDescription: 'gorky - A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
            defaultKeywords: 'gorky, static site generator, markdown, blog, GitHub Pages, JAMstack, static website, markdown blog'
        };
    }
    
    const configBlock = configMatch[1];
    const config = {};
    
    // Extract baseUrl
    const baseUrlMatch = configBlock.match(/baseUrl:\s*['"`]([^'"`]+)['"`]/);
    if (baseUrlMatch) config.baseUrl = baseUrlMatch[1];
    
    // Extract siteName
    const siteNameMatch = configBlock.match(/siteName:\s*['"`]([^'"`]+)['"`]/);
    if (siteNameMatch) config.siteName = siteNameMatch[1];
    
    // Extract defaultDescription
    const descMatch = configBlock.match(/defaultDescription:\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) config.defaultDescription = descMatch[1];
    
    // Extract defaultKeywords
    const keywordsMatch = configBlock.match(/defaultKeywords:\s*['"`]([^'"`]+)['"`]/);
    if (keywordsMatch) config.keywords = keywordsMatch[1];
    
    return {
        baseUrl: config.baseUrl || 'https://yourusername.github.io/gorky',
        siteName: config.siteName || 'gorky',
        defaultDescription: config.defaultDescription || 'gorky - A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
        defaultKeywords: config.keywords || 'gorky, static site generator, markdown, blog, GitHub Pages, JAMstack, static website, markdown blog'
    };
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
        
        // Generate sidebar navigation, header, and footer
        const mainNavHTML = generateMainNav(sidebarData, PATHS.postsMd);
        const sidebarNavHTML = generateSidebarNav(sidebarData);
        const sidebarHeaderHTML = generateSidebarHeader(sidebarData);
        const sidebarFooterHTML = generateSidebarFooter(sidebarData);
        
        // Collect and generate content
        const userContentPath = path.join(__dirname, '..', 'content');
        const markdownFiles = collectMarkdownFiles(userContentPath);
        const DEFAULT_CONTENT_FILE = 'content/home.md';
        const contentHTML = generateContentSections(markdownFiles, DEFAULT_CONTENT_FILE);
        
        // Read template
        let template = fs.readFileSync(PATHS.template, 'utf8');
        
        // Extract SITE_CONFIG from template
        const siteConfig = extractSiteConfig(template);
        
        // Extract default page metadata for initial meta tags
        const defaultMetadata = extractPostMetadata(DEFAULT_CONTENT_FILE, 'content/posts/');
        const defaultTitle = defaultMetadata.title || siteConfig.siteName;
        const defaultDescription = defaultMetadata.description || siteConfig.defaultDescription;
        const defaultKeywords = defaultMetadata.keywords || siteConfig.defaultKeywords;
        const defaultCanonicalUrl = `${siteConfig.baseUrl}?page=home`;
        
        // Replace placeholders
        template = template
            .replace('{{SIDEBAR_HEADER}}', sidebarHeaderHTML)
            .replace('{{MAIN_NAV}}', mainNavHTML)
            .replace('{{SIDEBAR_NAV}}', sidebarNavHTML)
            .replace('{{SIDEBAR_FOOTER}}', sidebarFooterHTML)
            .replace('{{MARKDOWN_CONTENT}}', contentHTML)
            // Pre-populate meta tags with default values for SEO
            .replace('<meta name="description" content="" id="meta-description">', 
                     `<meta name="description" content="${escapeHtml(defaultDescription)}" id="meta-description">`)
            .replace('<meta name="keywords" content="" id="meta-keywords">', 
                     `<meta name="keywords" content="${escapeHtml(defaultKeywords)}" id="meta-keywords">`)
            .replace('<link rel="canonical" href="" id="canonical-link">', 
                     `<link rel="canonical" href="${escapeHtml(defaultCanonicalUrl)}" id="canonical-link">`)
            .replace('<title id="page-title"></title>', 
                     `<title id="page-title">${escapeHtml(defaultTitle)}</title>`);
        
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
