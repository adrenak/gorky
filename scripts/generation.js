// ============================================================================
// GENERATION.JS
//
// This file handles markdown file collection and HTML content generation:
//
// File Collection:
//   - collectMarkdownFiles: Recursively collects all markdown files from user-content
//
// Content Generation:
//   - generateContentSections: Generates HTML sections for all markdown files
//     (converts markdown to HTML, handles frontmatter, adds metadata attributes)
//
// Used by: build.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { parseFrontmatter } = require('./frontmatter');
const { extractPostMetadata, generatePostAttributes } = require('./posts');

// ============================================================================
// CONSTANTS
// ============================================================================

const POSTS_FOLDER_PREFIX = 'user-content/posts/';

// ============================================================================
// MARKDOWN FILE COLLECTION
// ============================================================================

/**
 * Recursively collects all markdown files from user-content directory
 * @param {string} userContentPath - Path to the user-content directory
 * @returns {Map} Map of markdown file paths
 */
function collectMarkdownFiles(userContentPath) {
    const markdownFiles = new Map();
    
    if (!fs.existsSync(userContentPath)) {
        return markdownFiles;
    }
    
    /**
     * Recursively walk directory and collect markdown files
     */
    function walkDir(dir, basePath = '') {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Recursively walk subdirectories
                const subBasePath = basePath ? `${basePath}/${file}` : file;
                walkDir(fullPath, subBasePath);
            } else if (file.endsWith('.md')) {
                // Add markdown file with normalized path
                const relativePath = basePath ? `${basePath}/${file}` : file;
                const normalizedPath = `user-content/${relativePath}`;
                markdownFiles.set(normalizedPath, normalizedPath);
            }
        });
    }
    
    walkDir(userContentPath);
    
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
            
            // Parse frontmatter if present, otherwise use content as-is
            const parsed = parseFrontmatter(fullPath);
            if (!parsed) return;
            const markdownContent = parsed.content;
            let htmlContent = marked.parse(markdownContent);
            
            const isDefault = filePath === defaultFile;
            const displayStyle = isDefault ? 'block' : 'none';
            const metadata = extractPostMetadata(filePath, POSTS_FOLDER_PREFIX);
            
            // Thumbnail is now handled in extractPostMetadata via frontmatter
            
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

