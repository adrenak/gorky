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
 * Parses a date string for sorting
 * @param {string} dateStr - Date string in format "YYYY-M-D" or "YYYY-MM-DD"
 * @returns {Date} Parsed date object
 */
function parseDateForSorting(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(0);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
}

/**
 * Generates posts.md from files in posts folder
 * @param {string} postsPath - The path to the posts directory
 * @param {string} postsMdPath - The path where posts.md should be written
 */
function generatePostsMd(postsPath, postsMdPath) {
    if (!fs.existsSync(postsPath)) {
        return;
    }
    
    const files = fs.readdirSync(postsPath);
    const posts = [];
    const allTagsSet = new Set();
    
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        
        const validation = validatePostFilename(file);
        if (!validation.valid) return;
        
        const parsed = parsePostFilename(file);
        if (!parsed || !parsed.title || !parsed.slug) return;
        
        // Collect tags
        if (parsed.tags) {
            parsed.tags.split(',').map(t => t.trim()).forEach(tag => {
                if (tag) allTagsSet.add(tag);
            });
        }
        
        posts.push({
            title: parsed.title,
            slug: parsed.slug,
            dateString: parsed.date,
        });
    });
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => {
        const dateA = parseDateForSorting(a.dateString);
        const dateB = parseDateForSorting(b.dateString);
        return dateB - dateA;
    });
    
    // Generate markdown content
    const distinctTags = Array.from(allTagsSet).sort();
    let postsMd = '# Posts\n\n';
    
    // Add tags section
    if (distinctTags.length > 0) {
        postsMd += '## Tags\n\n';
        postsMd += distinctTags.map(tag => `[${tag}](?tag=${encodeURIComponent(tag)})`).join(' • ');
        postsMd += '\n\n---\n\n';
    }
    
    // Add posts list
    posts.forEach(post => {
        postsMd += `## [${post.title}](?post=${post.slug})\n\n`;
    });
    
    // Write to posts.md
    fs.writeFileSync(postsMdPath, postsMd, 'utf8');
    console.log(`✓ Generated posts.md with ${posts.length} post(s)`);
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

// ============================================================================
// MAIN (for direct execution)
// ============================================================================

if (require.main === module) {
    const PATHS = {
        posts: path.join(__dirname, 'user-content', 'posts'),
        postsMd: path.join(__dirname, 'user-content', 'posts.md'),
    };
    generatePostsMd(PATHS.posts, PATHS.postsMd);
}

module.exports = {
    parsePostFilename,
    validatePostFilename,
    extractPostMetadata,
    isPostFile,
    normalizePath,
    checkDuplicateSlugs,
    generatePostsMd,
};

