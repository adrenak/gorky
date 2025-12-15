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
const { generatePostsMd, checkDuplicateSlugs } = require('./posts');
const { generateMainNav, generateSidebarNav, generateSidebarFooter } = require('./sidebar');
const { collectMarkdownFiles, generateContentSections } = require('./generation');

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
        
        // Generate sidebar navigation and footer
        const mainNavHTML = generateMainNav(sidebarData, PATHS.postsMd);
        const sidebarNavHTML = generateSidebarNav(sidebarData);
        const sidebarFooterHTML = generateSidebarFooter(sidebarData);
        
        // Collect and generate content
        const userContentPath = path.join(__dirname, '..', 'user-content');
        const markdownFiles = collectMarkdownFiles(userContentPath);
        const DEFAULT_CONTENT_FILE = 'user-content/home.md';
        const contentHTML = generateContentSections(markdownFiles, DEFAULT_CONTENT_FILE);
        
        // Read template and replace placeholders
        let template = fs.readFileSync(PATHS.template, 'utf8');
        template = template
            .replace('{{MAIN_NAV}}', mainNavHTML)
            .replace('{{SIDEBAR_NAV}}', sidebarNavHTML)
            .replace('{{SIDEBAR_FOOTER}}', sidebarFooterHTML)
            .replace('{{MARKDOWN_CONTENT}}', contentHTML);
        
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
