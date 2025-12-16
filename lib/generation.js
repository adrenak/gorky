// ============================================================================
// GENERATION.JS
//
// This file handles markdown file collection and HTML content generation:
//
// File Collection:
//   - collectMarkdownFiles: Recursively collects all markdown files from content
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

// Configure marked to properly handle code blocks
marked.setOptions({
    breaks: false,
    gfm: true,
});

// ============================================================================
// MARKDOWN FILE COLLECTION
// ============================================================================

/**
 * Recursively collects all markdown files from content directory
 * @param {string} userContentPath - Path to the content directory
 * @param {string} contentDir - Content directory name (e.g., 'content')
 * @returns {Map} Map of markdown file paths
 */
function collectMarkdownFiles(userContentPath, contentDir = 'content') {
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
                const normalizedPath = `${contentDir}/${relativePath}`;
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
 * @param {string} defaultFile - Default file to display (e.g., 'content/home.md')
 * @param {string} cwd - Current working directory
 * @param {string} contentDir - Content directory name (e.g., 'content')
 * @returns {string} HTML string containing all content sections
 */
function generateContentSections(markdownFiles, defaultFile = 'content/home.md', cwd = process.cwd(), contentDir = 'content') {
    let contentHTML = '';
    const postsFolderPrefix = `${contentDir}/posts/`;
    
    markdownFiles.forEach((filePath) => {
        try {
            const fullPath = path.join(cwd, filePath);
            if (!fs.existsSync(fullPath)) return;
            
            // Parse frontmatter if present, otherwise use content as-is
            const parsed = parseFrontmatter(fullPath);
            if (!parsed) return;
            const markdownContent = parsed.content;
            let htmlContent = marked.parse(markdownContent);
            
            const metadata = extractPostMetadata(filePath, postsFolderPrefix, cwd);
            
            // Skip unpublished posts - don't generate HTML for them (only applies to posts)
            if (metadata && metadata.slug && metadata.published === false) {
                return;
            }
            
            const isDefault = filePath === defaultFile;
            const displayStyle = isDefault ? 'block' : 'none';
            
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

