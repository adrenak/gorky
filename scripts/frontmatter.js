// ============================================================================
// FRONTMATTER.JS
//
// This file handles parsing and processing of YAML frontmatter from markdown files:
//
//   - parseFrontmatter: Parses frontmatter from a markdown file
//   - extractTags: Extracts tags from frontmatter (handles array/string formats)
//   - tagsToString: Converts tags to comma-separated string
//   - processThumbnailPath: Processes thumbnail paths from frontmatter
//
// Used by: posts.js, generation.js
// ============================================================================

const fs = require('fs');
const matter = require('gray-matter');

/**
 * Parses frontmatter from a markdown file
 * @param {string} filePath - The full path to the markdown file
 * @returns {Object|null} Object with frontmatter data and content, or null if invalid
 */
function parseFrontmatter(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(fileContent);
        return {
            data: parsed.data || {},
            content: parsed.content
        };
    } catch (error) {
        console.warn(`Warning: Could not parse frontmatter from ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Extracts tags from frontmatter (handles both array and comma-separated string formats)
 * @param {Array|string|any} tags - Tags from frontmatter
 * @returns {Array} Array of tag strings
 */
function extractTags(tags) {
    if (!tags) return [];
    
    if (Array.isArray(tags)) {
        return tags.filter(tag => tag && typeof tag === 'string');
    }
    
    if (typeof tags === 'string') {
        return tags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    return [];
}

/**
 * Converts tags to a comma-separated string
 * @param {Array|string|any} tags - Tags from frontmatter
 * @returns {string|null} Comma-separated tags string or null
 */
function tagsToString(tags) {
    const tagsArray = extractTags(tags);
    return tagsArray.length > 0 ? tagsArray.join(',') : null;
}

/**
 * Processes thumbnail path from frontmatter
 * @param {string} thumbnail - Thumbnail value from frontmatter
 * @param {string} defaultPath - Default path prefix if thumbnail is just a filename
 * @returns {string|null} Full thumbnail path or null
 */
function processThumbnailPath(thumbnail, defaultPath = 'user-content/posts/') {
    if (!thumbnail) return null;
    
    if (thumbnail.includes('/')) {
        // Full path provided
        return thumbnail;
    } else {
        // Just filename, prepend default path
        return `${defaultPath}${thumbnail}`;
    }
}

module.exports = {
    parseFrontmatter,
    extractTags,
    tagsToString,
    processThumbnailPath,
};

