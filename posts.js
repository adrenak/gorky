const fs = require('fs');
const path = require('path');
const { formatDate } = require('./utils');

// ============================================================================
// CONSTANTS
// ============================================================================

const POST_FILENAME_PARTS = 5; // DATE--slug--(tags)--Title--preview.md
const POST_FILENAME_SEPARATOR = '--';
const REQUIRED_DASHES = 4; // Number of '--' separators in post filename

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
 * @param {string} filePath - The file path to check
 * @param {string} postsFolderPrefix - The prefix path for posts folder (e.g., 'user-content/posts/')
 * @returns {boolean} True if the path is a post file
 */
function isPostFile(filePath, postsFolderPrefix) {
    return normalizePath(filePath).startsWith(postsFolderPrefix);
}

// ============================================================================
// POST FILENAME PARSING
// ============================================================================

/**
 * Parses a post filename and returns all parts
 * Format: DATE--slug--(tags)--Title--preview.md
 * @param {string} filename - The post filename
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
 * @param {string} filename - The filename to validate
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
 * Extracts post metadata from a file path
 * @param {string} filePath - The file path
 * @param {string} postsFolderPrefix - The prefix path for posts folder (e.g., 'user-content/posts/')
 * @returns {Object} Object with slug, date, tags, title (or null for non-post files)
 */
function extractPostMetadata(filePath, postsFolderPrefix) {
    if (!isPostFile(filePath, postsFolderPrefix)) {
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

/**
 * Checks for duplicate slugs in posts folder
 * @param {string} postsPath - The path to the posts directory
 */
function checkDuplicateSlugs(postsPath) {
    if (!fs.existsSync(postsPath)) {
        return;
    }
    
    const files = fs.readdirSync(postsPath);
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

module.exports = {
    parsePostFilename,
    validatePostFilename,
    extractPostMetadata,
    isPostFile,
    normalizePath,
    checkDuplicateSlugs,
};

