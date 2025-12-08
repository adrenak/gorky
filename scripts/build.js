const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { generatePostsMd, extractPostMetadata, isPostFile, normalizePath, checkDuplicateSlugs, generatePostAttributes } = require('./posts');
const { isURLParameter } = require('./utils');
const { generateSidebarNav } = require('./sidebar');

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
// MARKDOWN FILE COLLECTION
// ============================================================================

/**
 * Collects all markdown files referenced in sidebar and posts folder
 */
function collectMarkdownFiles(sidebarData) {
    const markdownFiles = new Map();
    
    // Default home.md
    markdownFiles.set('user-content/home.md', 'user-content/home.md');
    
    // Traverse sidebar data to find URL parameters
    Object.values(sidebarData).forEach(items => {
        Object.values(items).forEach(config => {
            if (isURLParameter(config.target)) {
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
