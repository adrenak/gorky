// ============================================================================
// POSTS.JS
//
// This file handles all post-related operations:
//
// Validation:
//   - validatePostFilename: Validates post filenames
//   - checkDuplicateSlugs: Checks for duplicate slugs across posts
//
// Metadata Extraction:
//   - extractPostMetadata: Extracts metadata from post files (slug, date, tags, etc.)
//
// Generation:
//   - generatePostsMd: Generates the posts.md listing file from all posts
//   - generatePostAttributes: Generates HTML data attributes for posts
//
// Used by: build.js, generation.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const { formatDate, parseDateForSorting, dateToString, isPostFile, escapeHtmlAttribute } = require('./utils');
const { parseFrontmatter, extractTags, tagsToString, processThumbnailPath } = require('./frontmatter');

// ============================================================================
// POST VALIDATION
// ============================================================================

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
 * Extracts keywords from frontmatter (can be string or array)
 * @param {any} keywords - Keywords from frontmatter
 * @returns {string|null} Comma-separated keywords string or null
 */
function extractKeywords(keywords) {
    if (!keywords) return null;
    
    if (Array.isArray(keywords)) {
        return keywords.join(',');
    } else if (typeof keywords === 'string') {
        return keywords;
    }
    
    return null;
}

/**
 * Checks if a post is published (defaults to true if field doesn't exist)
 * @param {any} published - Published field from frontmatter
 * @returns {boolean} true if published, false otherwise
 */
function isPostPublished(published) {
    // If field doesn't exist, default to true (published)
    if (published === undefined || published === null) {
        return true;
    }
    
    // Handle boolean values
    if (typeof published === 'boolean') {
        return published;
    }
    
    // Handle string values (case-insensitive)
    if (typeof published === 'string') {
        const lower = published.toLowerCase().trim();
        return lower === 'true' || lower === 'yes' || lower === '1';
    }
    
    // For other types, default to true
    return true;
}

/**
 * Extracts post metadata from a file path
 * @param {string} filePath - The file path
 * @param {string} postsFolderPrefix - The prefix path for posts folder (e.g., 'content/posts/')
 * @returns {Object} Object with slug, date, tags, title, description (or null for non-post files)
 */
function extractPostMetadata(filePath, postsFolderPrefix) {
    // Parse frontmatter - all metadata comes from here
    const fullPath = path.join(__dirname, '..', filePath);
    const frontmatter = parseFrontmatter(fullPath);
    
    // Extract SEO metadata that applies to all files (title, description, keywords)
    const seoMetadata = {
        title: frontmatter?.data?.title || null,
        description: frontmatter?.data?.description || null,
        keywords: extractKeywords(frontmatter?.data?.keywords) || null,
    };
    
    // For non-post files, return only SEO metadata (no published field check)
    if (!isPostFile(filePath, postsFolderPrefix)) {
        return { 
            slug: null, 
            date: null, 
            tags: null, 
            thumbnail: null, 
            author: null,
            published: true, // Non-post files are always "published"
            ...seoMetadata
        };
    }
    
    if (!frontmatter) {
        return { slug: null, date: null, tags: null, thumbnail: null, keywords: null, author: null, published: false, ...seoMetadata };
    }
    
    // Slug is required in frontmatter for posts
    if (!frontmatter.data.slug) {
        return { slug: null, date: null, tags: null, thumbnail: null, keywords: null, author: null, published: false, ...seoMetadata };
    }
    
    // Check if post is published - if not, return null-like object to indicate it should be ignored
    const published = isPostPublished(frontmatter.data.published);
    if (!published) {
        return { slug: null, date: null, tags: null, thumbnail: null, keywords: null, author: null, published: false, ...seoMetadata };
    }
    
    // Get post-specific metadata from frontmatter
    const tagsString = tagsToString(frontmatter.data.tags);
    const thumbnail = processThumbnailPath(frontmatter.data.thumbnail, 'content/posts/');
    
    return {
        slug: frontmatter.data.slug,
        date: formatDate(frontmatter.data.date),
        tags: tagsString,
        thumbnail: thumbnail,
        author: frontmatter.data.author || null,
        published: true,
        ...seoMetadata
    };
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
    const tagCounts = new Map(); // tag -> count

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
        const frontmatter = parseFrontmatter(filePath);
        if (!frontmatter) {
            console.warn(`⚠️  Skipping post file without valid frontmatter: ${file}`);
            return;
        }

        // Require slug and title in frontmatter
        if (!frontmatter.data.slug || !frontmatter.data.title) {
            console.warn(`⚠️  Skipping post file without required frontmatter (slug and title): ${file}`);
            return;
        }

        // Skip unpublished posts
        if (!isPostPublished(frontmatter.data.published)) {
            return; // Silently skip - treat as if file doesn't exist
        }

        // Extract tags from frontmatter and count them
        const tagsArray = extractTags(frontmatter.data.tags);
        tagsArray.forEach(tag => {
            if (tag) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
        });

        // Get thumbnail from frontmatter
        const thumbnailPath = processThumbnailPath(frontmatter.data.thumbnail, 'content/posts/');

        // Use date from frontmatter, ensure it's a string
        const dateString = dateToString(frontmatter.data.date);
        
        if (!dateString) {
            console.warn(`⚠️  Skipping post file without date in frontmatter: ${file}`);
            return;
        }

        posts.push({
            title: frontmatter.data.title,
            slug: frontmatter.data.slug,
            dateString: dateString,
            description: frontmatter.data.description || '',
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
    // Sort tags by count (descending), then alphabetically for ties
    const distinctTags = Array.from(tagCounts.keys()).sort((a, b) => {
        const countA = tagCounts.get(a);
        const countB = tagCounts.get(b);
        if (countB !== countA) {
            return countB - countA; // Descending order by count
        }
        return a.localeCompare(b); // Alphabetical for ties
    });
    let postsMd = '# Posts\n\n';

    // Add tags section with counts
    if (distinctTags.length > 0) {
        postsMd += '## Tags\n\n';
        postsMd += distinctTags.map(tag => {
            const count = tagCounts.get(tag);
            const displayTag = count > 0 ? `${tag} (${count})` : tag;
            return `[${displayTag}](?tag=${encodeURIComponent(tag)})`;
        }).join(' • ');
        postsMd += '\n\n---\n\n';
    }

    // Add posts list
    posts.forEach(post => {
        // For posts with thumbnails, generate HTML directly to avoid markdown parsing issues
        if (post.thumbnail) {
            const escapedTitle = escapeHtmlAttribute(post.title);
            const escapedDescription = escapeHtmlAttribute(post.description || '');
            postsMd += `<div class="post-entry">\n`;
            postsMd += `<img src="${post.thumbnail}" alt="${escapedTitle}" class="post-thumbnail" />\n`;
            postsMd += `<div class="post-content">\n`;
            postsMd += `<h2><a href="?post=${post.slug}">${post.title}</a></h2>\n`;
            if (post.description) {
                postsMd += `<p>${post.description}</p>\n`;
            }
            postsMd += `</div>\n</div>\n\n`;
        } else {
            // For posts without thumbnails, use markdown
            postsMd += `## [${post.title}](?post=${post.slug})\n\n`;
            if (post.description) {
                postsMd += `${post.description}\n\n`;
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
        const frontmatter = parseFrontmatter(filePath);
        
        if (!frontmatter || !frontmatter.data.slug) {
            invalidFiles.push(`Post file "${file}" is missing required "slug" field in frontmatter`);
            return;
        }
        
        // Skip unpublished posts - they shouldn't count for duplicate checking
        if (!isPostPublished(frontmatter.data.published)) {
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
 * @param {Object} metadata - Object with slug, date, tags, title, description, thumbnail, keywords
 * @returns {string} HTML attributes string
 */
function generatePostAttributes(metadata) {
    const attrs = [];
    if (metadata.slug) attrs.push(`data-slug="${metadata.slug}"`);
    if (metadata.date) attrs.push(`data-date="${metadata.date}"`);
    if (metadata.tags) attrs.push(`data-tags="${metadata.tags}"`);
    if (metadata.title) {
        attrs.push(`data-title="${escapeHtmlAttribute(metadata.title)}"`);
    }
    if (metadata.description) {
        attrs.push(`data-description="${escapeHtmlAttribute(metadata.description)}"`);
    }
    if (metadata.thumbnail) {
        attrs.push(`data-thumbnail="${metadata.thumbnail}"`);
    }
    if (metadata.keywords) {
        attrs.push(`data-keywords="${escapeHtmlAttribute(metadata.keywords)}"`);
    }
    if (metadata.author) {
        attrs.push(`data-author="${escapeHtmlAttribute(metadata.author)}"`);
    }
    return attrs.join(' ');
}

// ============================================================================
// MAIN (for direct execution)
// ============================================================================

if (require.main === module) {
    const PATHS = {
        posts: path.join(__dirname, '..', 'content', 'posts'),
        postsMd: path.join(__dirname, '..', 'content', 'posts.md'),
    };
    generatePostsMd(PATHS.posts, PATHS.postsMd);
}

module.exports = {
    validatePostFilename,
    extractPostMetadata,
    checkDuplicateSlugs,
    generatePostsMd,
    generatePostAttributes,
};
