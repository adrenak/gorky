const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { extractPostMetadata, generatePostAttributes } = require('./posts');
const { isURLParameter } = require('./utils');

// ============================================================================
// CONSTANTS
// ============================================================================

const POSTS_FOLDER_PREFIX = 'user-content/posts/';

// ============================================================================
// MARKDOWN FILE COLLECTION
// ============================================================================

/**
 * Collects all markdown files referenced in sidebar and posts folder
 * @param {Object} sidebarData - Sidebar configuration data
 * @param {string} postsPath - Path to the posts directory
 * @returns {Map} Map of markdown file paths
 */
function collectMarkdownFiles(sidebarData, postsPath) {
    const DEFAULT_HOME_FILE = 'user-content/home.md';
    const markdownFiles = new Map();
    
    // Default home.md
    markdownFiles.set(DEFAULT_HOME_FILE, DEFAULT_HOME_FILE);
    
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

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generates content sections for all markdown files
 * @param {Map} markdownFiles - Map of markdown file paths
 * @param {string} defaultFile - Default file to display (default: 'user-content/home.md')
 * @returns {string} HTML string containing all content sections
 */
function generateContentSections(markdownFiles, defaultFile = 'user-content/home.md') {
    let contentHTML = '';
    
    markdownFiles.forEach((filePath) => {
        try {
            const fullPath = path.join(__dirname, '..', filePath);
            if (!fs.existsSync(fullPath)) return;
            
            const markdown = fs.readFileSync(fullPath, 'utf8');
            let htmlContent = marked.parse(markdown);
            
            const isDefault = filePath === defaultFile;
            const displayStyle = isDefault ? 'block' : 'none';
            const metadata = extractPostMetadata(filePath, POSTS_FOLDER_PREFIX);
            const attributes = generatePostAttributes(metadata);
            const contentId = `content-${filePath.replace(/\./g, '-')}`;
            
            contentHTML += `<div id="${contentId}" class="content-section"${attributes ? ' ' + attributes : ''} style="display: ${displayStyle};">\n`;
            contentHTML += htmlContent;
            contentHTML += `</div>\n`;
        } catch (error) {
            console.warn(`Warning: Could not load ${filePath}:`, error.message);
        }
    });
    
    return contentHTML;
}

module.exports = {
    collectMarkdownFiles,
    generateContentSections,
};

