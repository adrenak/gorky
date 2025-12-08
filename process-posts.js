const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// ============================================================================
// CONSTANTS
// ============================================================================

const PATHS = {
    posts: path.join(__dirname, config.paths.posts),
    postsMd: path.join(__dirname, config.paths.postsMd),
};

const POST_FILENAME_PARTS = 5; // DATE--slug--(tags)--Title--preview.md
const POST_FILENAME_SEPARATOR = '--';
const REQUIRED_DASHES = 4; // Number of '--' separators in post filename

// ============================================================================
// POST FILENAME PARSING
// ============================================================================

/**
 * Parses a post filename and returns all parts
 * Format: DATE--slug--(tags)--Title--preview.md
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

// ============================================================================
// POSTS.MD GENERATION
// ============================================================================

/**
 * Parses a date string for sorting
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
 */
function generatePostsMd() {
    if (!fs.existsSync(PATHS.posts)) {
        return;
    }
    
    const files = fs.readdirSync(PATHS.posts);
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
    fs.writeFileSync(PATHS.postsMd, postsMd, 'utf8');
    console.log(`✓ Generated posts.md with ${posts.length} post(s)`);
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
    generatePostsMd();
}

module.exports = { generatePostsMd };

