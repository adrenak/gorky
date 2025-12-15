const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { formatDate } = require('./utils');

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
// POST FILENAME AND FRONTMATTER PARSING
// ============================================================================

/**
 * Parses frontmatter from a markdown file
 * @param {string} filePath - The full path to the markdown file
 * @returns {Object|null} Object with frontmatter data and content, or null if invalid
 */
function parsePostFrontmatter(filePath) {
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
 * Validates post filename format
 * @param {string} filename - The filename to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePostFilename(filename) {
    // Only requirement is that it's a markdown file
    if (!filename.endsWith('.md')) {
        return {
            valid: false,
            error: `Post file "${filename}" must have .md extension`
        };
    }
    
    return { valid: true };
}

/**
 * Extracts post metadata from a file path
 * @param {string} filePath - The file path
 * @param {string} postsFolderPrefix - The prefix path for posts folder (e.g., 'user-content/posts/')
 * @returns {Object} Object with slug, date, tags, title, preview (or null for non-post files)
 */
function extractPostMetadata(filePath, postsFolderPrefix) {
    if (!isPostFile(filePath, postsFolderPrefix)) {
        return { slug: null, date: null, tags: null, title: null, preview: null, thumbnail: null };
    }
    
    // Parse frontmatter - all metadata comes from here
    const fullPath = path.join(__dirname, '..', filePath);
    const frontmatter = parsePostFrontmatter(fullPath);
    
    if (!frontmatter) {
        return { slug: null, date: null, tags: null, title: null, preview: null, thumbnail: null };
    }
    
    // Slug is required in frontmatter
    if (!frontmatter.data.slug) {
        return { slug: null, date: null, tags: null, title: null, preview: null, thumbnail: null };
    }
    
    // Get metadata from frontmatter
    const tags = frontmatter.data.tags;
    const tagsString = Array.isArray(tags) ? tags.join(',') : (typeof tags === 'string' ? tags : null);
    
    // Get thumbnail from frontmatter
    let thumbnail = null;
    if (frontmatter.data.thumbnail) {
        const thumbnailValue = frontmatter.data.thumbnail;
        if (thumbnailValue.includes('/')) {
            // Full path provided
            thumbnail = thumbnailValue;
        } else {
            // Just filename, assume it's in the posts directory
            thumbnail = `user-content/posts/${thumbnailValue}`;
        }
    }
    
    return {
        slug: frontmatter.data.slug,
        date: formatDate(frontmatter.data.date),
        tags: tagsString,
        title: frontmatter.data.title || null,
        preview: frontmatter.data.preview || null,
        thumbnail: thumbnail,
    };
}

/**
 * Parses a date string for sorting
 * @param {string|Date|any} dateStr - Date string in format "YYYY-M-D" or "YYYY-MM-DD", or a Date object
 * @returns {Date} Parsed date object
 */
function parseDateForSorting(dateStr) {
    if (!dateStr) return new Date(0);
    
    // Handle Date objects directly
    if (dateStr instanceof Date) {
        return dateStr;
    }
    
    // Convert to string if it's not already
    const dateString = typeof dateStr === 'string' ? dateStr : String(dateStr);
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date(0);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date(0);
    
    return new Date(year, month, day);
}

/**
 * Generates posts.md from files in posts folder
 * @param {string} postsPath - The path to the posts directory
 * @param {string} postsMdPath - The path where posts.md should be written
 */
function generatePostsMd(postsPath, postsMdPath) {
    // Helper to remove posts.md when no posts are present
    const deletePostsMdIfExists = () => {
        if (fs.existsSync(postsMdPath)) {
            fs.unlinkSync(postsMdPath);
            console.log('ℹ️ Removed posts.md (no posts found)');
        }
    };

    // Exit early if posts folder is missing
    if (!fs.existsSync(postsPath)) {
        deletePostsMdIfExists();
        return;
    }

    // Get all files in posts directory
    const allFiles = fs.readdirSync(postsPath);
    const mdFiles = allFiles.filter(file => file.endsWith('.md'));
    
    if (mdFiles.length === 0) {
        deletePostsMdIfExists();
        return;
    }

    const posts = [];
    const allTagsSet = new Set();

    mdFiles.forEach(file => {
        const validation = validatePostFilename(file);
        if (!validation.valid) {
            console.warn(`⚠️  Skipping invalid post file: ${file}`);
            if (validation.error) {
                console.warn(`   ${validation.error}`);
            }
            return;
        }

        // Parse frontmatter
        const filePath = path.join(postsPath, file);
        const frontmatter = parsePostFrontmatter(filePath);
        if (!frontmatter) {
            console.warn(`⚠️  Skipping post file without valid frontmatter: ${file}`);
            return;
        }

        // Require slug and title in frontmatter
        if (!frontmatter.data.slug || !frontmatter.data.title) {
            console.warn(`⚠️  Skipping post file without required frontmatter (slug and title): ${file}`);
            return;
        }

        // Extract tags from frontmatter
        const tags = frontmatter.data.tags;
        if (tags) {
            const tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []);
            tagsArray.forEach(tag => {
                if (tag) allTagsSet.add(tag);
            });
        }

        // Get thumbnail from frontmatter
        let thumbnailPath = null;
        if (frontmatter.data.thumbnail) {
            // If thumbnail is just a filename, prepend the posts directory path
            const thumbnail = frontmatter.data.thumbnail;
            if (thumbnail.includes('/')) {
                // Full path provided
                thumbnailPath = thumbnail;
            } else {
                // Just filename, assume it's in the posts directory
                thumbnailPath = `user-content/posts/${thumbnail}`;
            }
        }

        // Use date from frontmatter, ensure it's a string
        let dateString = frontmatter.data.date;
        
        if (!dateString) {
            console.warn(`⚠️  Skipping post file without date in frontmatter: ${file}`);
            return;
        }
        
        // Convert Date object to string if needed
        if (dateString instanceof Date) {
            const year = dateString.getFullYear();
            const month = dateString.getMonth() + 1;
            const day = dateString.getDate();
            dateString = `${year}-${month}-${day}`;
        } else if (dateString && typeof dateString !== 'string') {
            dateString = String(dateString);
        }

        posts.push({
            title: frontmatter.data.title,
            slug: frontmatter.data.slug,
            dateString: dateString,
            preview: frontmatter.data.preview || '',
            thumbnail: thumbnailPath,
        });
    });

    // If no valid posts found, remove posts.md and exit
    if (posts.length === 0) {
        deletePostsMdIfExists();
        return;
    }

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
        // For posts with thumbnails, generate HTML directly to avoid markdown parsing issues
        if (post.thumbnail) {
            const escapedTitle = post.title.replace(/"/g, '&quot;');
            const escapedPreview = (post.preview || '').replace(/"/g, '&quot;');
            postsMd += `<div class="post-entry">\n`;
            postsMd += `<img src="${post.thumbnail}" alt="${escapedTitle}" class="post-thumbnail" />\n`;
            postsMd += `<div class="post-content">\n`;
            postsMd += `<h2><a href="?post=${post.slug}">${post.title}</a></h2>\n`;
            if (post.preview) {
                postsMd += `<p>${post.preview}</p>\n`;
            }
            postsMd += `</div>\n</div>\n\n`;
        } else {
            // For posts without thumbnails, use markdown
            postsMd += `## [${post.title}](?post=${post.slug})\n\n`;
            if (post.preview) {
                postsMd += `${post.preview}\n\n`;
            }
        }
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
            if (validation.error) {
                invalidFiles.push(validation.error);
            }
            return;
        }
        
        // Read slug from frontmatter
        const filePath = path.join(postsPath, file);
        const frontmatter = parsePostFrontmatter(filePath);
        
        if (!frontmatter || !frontmatter.data.slug) {
            invalidFiles.push(`Post file "${file}" is missing required "slug" field in frontmatter`);
            return;
        }
        
        const slug = frontmatter.data.slug;
        if (!slugMap.has(slug)) {
            slugMap.set(slug, []);
        }
        slugMap.get(slug).push(file);
    });
    
    // Report invalid files
    if (invalidFiles.length > 0) {
        console.error('❌ Error: Invalid post files!');
        invalidFiles.forEach(error => {
            console.error(`   ${error}`);
        });
        throw new Error(`Found ${invalidFiles.length} post file(s) with invalid format or missing required fields.`);
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

/**
 * Generates HTML attributes for post metadata
 * @param {Object} metadata - Object with slug, date, tags, title
 * @returns {string} HTML attributes string
 */
function generatePostAttributes(metadata) {
    const attrs = [];
    if (metadata.slug) attrs.push(`data-slug="${metadata.slug}"`);
    if (metadata.date) attrs.push(`data-date="${metadata.date}"`);
    if (metadata.tags) attrs.push(`data-tags="${metadata.tags}"`);
    if (metadata.title) {
        const escapedTitle = metadata.title.replace(/"/g, '&quot;');
        attrs.push(`data-title="${escapedTitle}"`);
    }
    if (metadata.preview) {
        const escapedPreview = metadata.preview.replace(/"/g, '&quot;');
        attrs.push(`data-preview="${escapedPreview}"`);
    }
    if (metadata.thumbnail) {
        attrs.push(`data-thumbnail="${metadata.thumbnail}"`);
    }
    return attrs.join(' ');
}

// ============================================================================
// MAIN (for direct execution)
// ============================================================================

if (require.main === module) {
    const PATHS = {
        posts: path.join(__dirname, '..', 'user-content', 'posts'),
        postsMd: path.join(__dirname, '..', 'user-content', 'posts.md'),
    };
    generatePostsMd(PATHS.posts, PATHS.postsMd);
}

module.exports = {
    parsePostFrontmatter,
    validatePostFilename,
    extractPostMetadata,
    isPostFile,
    normalizePath,
    checkDuplicateSlugs,
    generatePostsMd,
    generatePostAttributes,
};
