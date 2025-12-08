const fs = require('fs');
const path = require('path');
const { parsePostFilename, validatePostFilename } = require('./posts');

// ============================================================================
// CONSTANTS
// ============================================================================

const PATHS = {
    posts: path.join(__dirname, 'user-content', 'posts'),
    postsMd: path.join(__dirname, 'user-content', 'posts.md'),
};


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

