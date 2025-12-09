const fs = require('fs');
const path = require('path');
const { generatePostsMd, checkDuplicateSlugs } = require('./posts');
const { generateSidebarNav } = require('./sidebar');
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
        
        // Generate sidebar navigation
        const sidebarNavHTML = generateSidebarNav(sidebarData, PATHS.postsMd);
        
        // Collect and generate content
        const userContentPath = path.join(__dirname, '..', 'user-content');
        const markdownFiles = collectMarkdownFiles(userContentPath);
        const DEFAULT_CONTENT_FILE = 'user-content/home.md';
        const contentHTML = generateContentSections(markdownFiles, DEFAULT_CONTENT_FILE);
        
        // Read template and replace placeholders
        let template = fs.readFileSync(PATHS.template, 'utf8');
        template = template
            .replace('{{SIDEBAR_NAV}}', sidebarNavHTML)
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
