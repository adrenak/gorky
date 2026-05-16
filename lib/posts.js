// ============================================================================
// POSTS.JS
//
// This file handles all post-related operations:
//
// Validation:
//   - validatePostFilename: Validates post filenames
//   - checkDuplicateSlugs: Checks for duplicate slugs across posts
//   - checkReservedPostTags: Fails build if a post uses a reserved tag (e.g. "all")
//
// Metadata Extraction:
//   - extractPostMetadata: Extracts metadata from post files (slug, date, tags, etc.)
//
// Generation:
//   - collectPosts: Scans and sorts posts for listing generation
//   - generatePostsMd: Generates the posts.md listing file (page 1 when paginated)
//   - buildPostsListingPages: Extra listing + tag archive HTML for build.js
//   - generatePostAttributes: Generates HTML data attributes for posts
//
// Used by: build.js, generation.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { formatDate, parseDateForSorting, dateToString, isPostFile, escapeHtmlAttribute, escapeHtml } = require('./utils');
const { parseFrontmatter, extractTags, tagsToString, processThumbnailPath } = require('./frontmatter');

/** Tags reserved for posts-page UI; must not appear in post frontmatter */
const RESERVED_POST_TAGS = new Set(['all']);

const POSTS_PER_PAGE_MAX = 100;

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
 * Checks if a post is archived (defaults to false if field doesn't exist)
 * @param {any} archived - Archived field from frontmatter
 * @returns {boolean} true if archived, false otherwise
 */
function isPostArchived(archived) {
    if (archived === undefined || archived === null) {
        return false;
    }

    if (typeof archived === 'boolean') {
        return archived;
    }

    if (typeof archived === 'string') {
        const lower = archived.toLowerCase().trim();
        return lower === 'true' || lower === 'yes' || lower === '1';
    }

    return false;
}

/**
 * Listing sort order: higher priority appears first. Missing or invalid → 0.
 * @param {any} value - frontmatter `priority`
 * @returns {number}
 */
function parsePriority(value) {
    if (value === undefined || value === null || value === '') {
        return 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Extracts post metadata from a file path
 * @param {string} filePath - The file path (relative to cwd)
 * @param {string} postsFolderPrefix - The prefix path for posts folder (e.g., 'content/posts/')
 * @param {string} cwd - Current working directory
 * @returns {Object} Object with slug, date, tags, title, description (or null for non-post files)
 */
function extractPostMetadata(filePath, postsFolderPrefix, cwd = process.cwd()) {
    // Parse frontmatter - all metadata comes from here
    const fullPath = path.join(cwd, filePath);
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
    const thumbnail = processThumbnailPath(frontmatter.data.thumbnail, postsFolderPrefix);
    
    return {
        slug: frontmatter.data.slug,
        date: formatDate(frontmatter.data.date),
        tags: tagsString,
        thumbnail: thumbnail,
        author: frontmatter.data.author || null,
        published: true,
        archived: isPostArchived(frontmatter.data.archived),
        ...seoMetadata
    };
}

/**
 * Reads optional posts-intro.md from the content directory
 * @param {string} postsMdPath - Path to posts.md (intro lives alongside it)
 * @returns {Object|null} Parsed frontmatter and content, or null if missing
 */
function readPostsIntro(postsMdPath) {
    const introPath = path.join(path.dirname(postsMdPath), 'posts-intro.md');
    if (!fs.existsSync(introPath)) {
        return null;
    }

    return parseFrontmatter(introPath);
}

/**
 * Builds frontmatter for generated posts.md from posts-intro metadata
 * @param {Object} introData - Frontmatter from posts-intro.md
 * @returns {Object} Frontmatter for posts.md
 */
function buildPostsPageFrontmatter(introData = {}) {
    const frontmatter = { title: 'Posts' };

    if (introData.description) {
        frontmatter.description = introData.description;
    }
    if (introData.keywords) {
        frontmatter.keywords = introData.keywords;
    }
    if (introData.author) {
        frontmatter.author = introData.author;
    }

    return frontmatter;
}

/**
 * @param {Object} siteConfig
 * @returns {number} 0 = single listing page (default)
 */
function parsePostsPerPage(siteConfig) {
    const raw = siteConfig && siteConfig.postsPerPage;
    if (raw === undefined || raw === null || raw === '') {
        return 0;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) {
        return 0;
    }
    return Math.min(Math.floor(n), POSTS_PER_PAGE_MAX);
}

/**
 * URL path segment for a tag (letters, digits, hyphen, underscore).
 * @param {string} tag
 * @returns {string}
 */
function encodeTagForPath(tag) {
    const t = String(tag).trim();
    if (!t || t.length > 96 || !/^[a-zA-Z0-9_-]+$/.test(t)) {
        return encodeURIComponent(t).replace(/%/g, '').slice(0, 96) || 'tag';
    }
    return t;
}

/**
 * Canonical path under site root for a posts listing page (no leading/trailing slash).
 * @param {number} pageIndex - 1-based
 * @param {string|null} tagSlug - encoded tag segment, or null for main listing
 */
function getListingCanonicalPath(pageIndex, tagSlug = null) {
    if (tagSlug) {
        const base = `posts/tag/${tagSlug}`;
        return pageIndex <= 1 ? base : `${base}/page/${pageIndex}`;
    }
    return pageIndex <= 1 ? 'posts' : `posts/page/${pageIndex}`;
}

/**
 * Page depth for assemblePage (posts/ = 1, posts/page/2 = 2, posts/tag/x = 3, …).
 */
function getListingPageDepth(pageIndex, tagSlug = null) {
    const canonical = getListingCanonicalPath(pageIndex, tagSlug);
    return canonical.split('/').length;
}

/**
 * Relative href from a listing page to another site path (e.g. post/slug, posts/tags/x).
 */
function relativeFromListingToSitePath(fromListingPath, toSitePath) {
    const fromParts = fromListingPath.split('/').filter(Boolean);
    const toParts = toSitePath.split('/').filter(Boolean);
    let i = 0;
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
        i += 1;
    }
    const ups = fromParts.length - i;
    const prefix = ups > 0 ? '../'.repeat(ups) : '';
    const down = toParts.slice(i).join('/');
    if (!down) {
        return prefix || './';
    }
    return `${prefix}${down}/`;
}

function sortDistinctTags(tagCounts) {
    return Array.from(tagCounts.keys()).sort((a, b) => {
        const countA = tagCounts.get(a);
        const countB = tagCounts.get(b);
        if (countB !== countA) {
            return countB - countA;
        }
        return a.localeCompare(b);
    });
}

function chunkPosts(posts, postsPerPage) {
    if (!postsPerPage || postsPerPage < 1) {
        return [posts];
    }
    const chunks = [];
    for (let i = 0; i < posts.length; i += postsPerPage) {
        chunks.push(posts.slice(i, i + postsPerPage));
    }
    return chunks;
}

/**
 * Scans posts directory and returns sorted posts + tag counts.
 * @returns {{ posts: Object[], tagCounts: Map }|null}
 */
function collectPosts(postsPath, contentDir = 'content') {
    if (!fs.existsSync(postsPath)) {
        return null;
    }

    const mdFiles = fs.readdirSync(postsPath).filter((file) => file.endsWith('.md'));
    if (mdFiles.length === 0) {
        return null;
    }

    const posts = [];
    const tagCounts = new Map();

    mdFiles.forEach((file) => {
        const validation = validatePostFilename(file);
        if (!validation.valid) {
            console.warn(`⚠️  Skipping invalid post file: ${file}`);
            if (validation.error) {
                console.warn(`   ${validation.error}`);
            }
            return;
        }

        const filePath = path.join(postsPath, file);
        const frontmatter = parseFrontmatter(filePath);
        if (!frontmatter) {
            console.warn(`⚠️  Skipping post file without valid frontmatter: ${file}`);
            return;
        }

        if (!frontmatter.data.slug || !frontmatter.data.title) {
            console.warn(`⚠️  Skipping post file without required frontmatter (slug and title): ${file}`);
            return;
        }

        if (!isPostPublished(frontmatter.data.published)) {
            return;
        }

        if (isPostArchived(frontmatter.data.archived)) {
            return;
        }

        const tagsArray = extractTags(frontmatter.data.tags);
        tagsArray.forEach((tag) => {
            if (tag) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
        });

        const thumbnailPath = processThumbnailPath(
            frontmatter.data.thumbnail,
            `${contentDir}/posts/`
        );
        const dateString = dateToString(frontmatter.data.date);

        if (!dateString) {
            console.warn(`⚠️  Skipping post file without date in frontmatter: ${file}`);
            return;
        }

        posts.push({
            title: frontmatter.data.title,
            slug: frontmatter.data.slug,
            dateString,
            description: frontmatter.data.description || '',
            thumbnail: thumbnailPath,
            tags: tagsArray.join(','),
            tagsArray,
            priority: parsePriority(frontmatter.data.priority),
        });
    });

    if (posts.length === 0) {
        return null;
    }

    posts.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        const dateA = parseDateForSorting(a.dateString);
        const dateB = parseDateForSorting(b.dateString);
        return dateB - dateA;
    });

    return { posts, tagCounts };
}

function buildPostEntryHtml(post, postHref, listingIndex = null) {
    const safeDataTags = post.tags ? escapeHtml(post.tags) : '';
    const indexAttr = listingIndex !== null ? ` data-listing-index="${listingIndex}"` : '';
    const dataTagsAttr = safeDataTags ? ` data-tags="${safeDataTags}"` : '';
    let html = `<div class="post-entry"${dataTagsAttr}${indexAttr}>\n`;

    if (post.thumbnail) {
        html += `<img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}" class="post-thumbnail" />\n`;
    }

    html += `<div class="post-content">\n`;
    html += `<h2><a href="${escapeHtml(postHref)}">${escapeHtml(post.title)}</a></h2>\n`;
    if (post.description) {
        html += `<p>${escapeHtml(post.description)}</p>\n`;
    }
    html += `</div>\n</div>\n\n`;
    return html;
}

function buildTagsSectionHtml({ tagCounts, totalPosts, listingPath }) {
    const distinctTags = sortDistinctTags(tagCounts);
    if (distinctTags.length === 0) {
        return '';
    }

    const allHref = relativeFromListingToSitePath(listingPath, 'posts');
    const allLink = `[All (${totalPosts})](${allHref})`;
    const tagLinks = distinctTags.map((tag) => {
        const count = tagCounts.get(tag);
        const displayTag = count > 0 ? `${tag} (${count})` : tag;
        const tagPath = `posts/tag/${encodeTagForPath(tag)}`;
        const href = relativeFromListingToSitePath(listingPath, tagPath);
        return `[${displayTag}](${href})`;
    }).join(' • ');

    return `## Tags\n\n${allLink} • ${tagLinks}\n\n---\n\n`;
}

function buildPaginationHtml({ pageIndex, totalPages, listingPath, tagSlug = null }) {
    if (totalPages <= 1) {
        return '';
    }

    const parts = [];
    if (pageIndex > 1) {
        const prevHref = relativeFromListingToSitePath(
            listingPath,
            getListingCanonicalPath(pageIndex - 1, tagSlug)
        );
        parts.push(`<a href="${escapeHtml(prevHref)}" class="posts-pagination-link">← Previous</a>`);
    }

    parts.push(`<span class="posts-pagination-status">Page ${pageIndex} of ${totalPages}</span>`);

    if (pageIndex < totalPages) {
        const nextHref = relativeFromListingToSitePath(
            listingPath,
            getListingCanonicalPath(pageIndex + 1, tagSlug)
        );
        parts.push(`<a href="${escapeHtml(nextHref)}" class="posts-pagination-link">Next →</a>`);
    }

    return `<nav class="posts-pagination" aria-label="Posts pages">${parts.join('')}</nav>\n\n`;
}

function buildPostsListingHtml({
    postsChunk,
    allPosts,
    tagCounts,
    listingPath,
    pageIndex,
    totalPages,
    postLinkPrefix,
    introContent = '',
    heading = 'Posts',
    tagSlug = null,
    showPagination = true,
    listingStartIndex = 0,
}) {
    let html = '';
    if (introContent && introContent.trim()) {
        html += `${introContent.trim()}\n\n`;
    }

    html += `# ${heading}\n\n`;
    html += buildTagsSectionHtml({ tagCounts, totalPosts: allPosts.length, listingPath });

    postsChunk.forEach((post, i) => {
        const postHref = `${postLinkPrefix}post/${post.slug}/`;
        html += buildPostEntryHtml(post, postHref, listingStartIndex + i);
    });

    if (showPagination) {
        html += buildPaginationHtml({ pageIndex, totalPages, listingPath, tagSlug });
    }

    return html;
}

function filterPostsByTag(posts, tag) {
    const normalized = String(tag).toLowerCase();
    return posts.filter((post) =>
        (post.tagsArray || []).some((t) => t.toLowerCase() === normalized)
    );
}

function buildExtraPostsPages({ posts, tagCounts, postsPerPage, deliverRoot, intro }) {
    if (!postsPerPage || postsPerPage < 1 || posts.length <= postsPerPage) {
        return [];
    }

    const chunks = chunkPosts(posts, postsPerPage);
    const pages = [];

    for (let pageIndex = 2; pageIndex <= chunks.length; pageIndex += 1) {
        const chunk = chunks[pageIndex - 1];
        const listingPath = getListingCanonicalPath(pageIndex, null);
        const pageDepth = getListingPageDepth(pageIndex, null);
        const postLinkPrefix = '../'.repeat(pageDepth);
        const html = buildPostsListingHtml({
            postsChunk: chunk,
            allPosts: posts,
            tagCounts,
            listingPath,
            pageIndex,
            totalPages: chunks.length,
            postLinkPrefix,
            showPagination: true,
            listingStartIndex: (pageIndex - 1) * postsPerPage,
        });

        pages.push({
            outputPath: path.join(deliverRoot, ...listingPath.split('/'), 'index.html'),
            canonicalPath: listingPath,
            pageDepth,
            metadata: {
                title: `Posts — page ${pageIndex}`,
                description: intro && intro.data ? intro.data.description : undefined,
                keywords: intro && intro.data ? intro.data.keywords : undefined,
            },
            html,
        });
    }

    return pages;
}

function buildTagArchivePages({ posts, tagCounts, postsPerPage, deliverRoot, intro }) {
    const pages = [];
    const distinctTags = sortDistinctTags(tagCounts);

    distinctTags.forEach((tag) => {
        const tagged = filterPostsByTag(posts, tag);
        if (tagged.length === 0) {
            return;
        }

        const tagSlug = encodeTagForPath(tag);
        const perPage = postsPerPage > 0 ? postsPerPage : tagged.length;
        const chunks = chunkPosts(tagged, perPage);

        chunks.forEach((chunk, chunkIndex) => {
            const pageIndex = chunkIndex + 1;
            const listingPath = getListingCanonicalPath(pageIndex, tagSlug);
            const pageDepth = getListingPageDepth(pageIndex, tagSlug);
            const postLinkPrefix = '../'.repeat(pageDepth);
            const html = buildPostsListingHtml({
                postsChunk: chunk,
                allPosts: posts,
                tagCounts,
                listingPath,
                pageIndex,
                totalPages: chunks.length,
                postLinkPrefix,
                heading: `Posts tagged “${tag}”`,
                tagSlug,
                showPagination: chunks.length > 1,
                listingStartIndex: chunkIndex * perPage,
            });

            pages.push({
                outputPath: path.join(deliverRoot, ...listingPath.split('/'), 'index.html'),
                canonicalPath: listingPath,
                pageDepth,
                metadata: {
                    title: `Posts tagged “${tag}”${chunks.length > 1 ? ` — page ${pageIndex}` : ''}`,
                    description: intro && intro.data ? intro.data.description : undefined,
                },
                html,
            });
        });
    });

    return pages;
}

/**
 * Generates posts.md and returns build artifacts for extra listing pages.
 * @returns {Object|null}
 */
function generatePostsMd(postsPath, postsMdPath, contentDir = 'content', siteConfig = {}, deliverRoot = null) {
    const deletePostsMdIfExists = () => {
        if (fs.existsSync(postsMdPath)) {
            fs.unlinkSync(postsMdPath);
            console.log('ℹ️ Removed posts.md (no posts found)');
        }
    };

    const collected = collectPosts(postsPath, contentDir);
    if (!collected) {
        deletePostsMdIfExists();
        return null;
    }

    const { posts, tagCounts } = collected;
    const postsPerPage = parsePostsPerPage(siteConfig);
    const paginated = postsPerPage > 0 && posts.length > postsPerPage;
    const intro = readPostsIntro(postsMdPath);
    const introContent = intro && intro.content ? intro.content.trim() : '';
    const listingPath = getListingCanonicalPath(1, null);
    const indexChunks = paginated ? chunkPosts(posts, postsPerPage) : [posts];
    const totalPages = indexChunks.length;

    const indexBody = buildPostsListingHtml({
        postsChunk: indexChunks[0],
        allPosts: posts,
        tagCounts,
        listingPath,
        pageIndex: 1,
        totalPages,
        postLinkPrefix: '../',
        introContent,
        showPagination: paginated,
        listingStartIndex: 0,
    });

    const postsMd = intro
        ? matter.stringify(indexBody, buildPostsPageFrontmatter(intro.data))
        : indexBody;

    fs.writeFileSync(postsMdPath, postsMd, 'utf8');

    let logMsg = `✓ Generated posts.md with ${posts.length} post(s)`;
    if (paginated) {
        logMsg += ` (${totalPages} listing pages)`;
    }
    console.log(logMsg);

    const artifacts = {
        posts,
        tagCounts,
        postsPerPage,
        paginated,
        intro,
        extraListingPages: [],
        tagArchivePages: [],
    };

    if (!deliverRoot) {
        return artifacts;
    }

    artifacts.extraListingPages = buildExtraPostsPages({
        posts,
        tagCounts,
        postsPerPage,
        deliverRoot,
        intro,
    });

    artifacts.tagArchivePages = buildTagArchivePages({
        posts,
        tagCounts,
        postsPerPage,
        deliverRoot,
        intro,
    });

    const extraCount = artifacts.extraListingPages.length + artifacts.tagArchivePages.length;
    if (extraCount > 0) {
        console.log(
            `✓ Posts listings: ${artifacts.extraListingPages.length} numbered page(s), ${artifacts.tagArchivePages.length} tag archive page(s)`
        );
    }

    return artifacts;
}

/**
 * Fails the build if any post uses a reserved tag (case-insensitive).
 * @param {string} postsPath - The path to the posts directory
 */
function checkReservedPostTags(postsPath) {
    if (!fs.existsSync(postsPath)) {
        return;
    }

    const violations = [];

    fs.readdirSync(postsPath).forEach((file) => {
        if (!file.endsWith('.md')) return;

        const validation = validatePostFilename(file);
        if (!validation.valid) return;

        const filePath = path.join(postsPath, file);
        const frontmatter = parseFrontmatter(filePath);
        if (!frontmatter) return;

        const reservedUsed = extractTags(frontmatter.data.tags).filter((tag) =>
            RESERVED_POST_TAGS.has(tag.toLowerCase())
        );
        if (reservedUsed.length > 0) {
            violations.push({ file, tags: reservedUsed });
        }
    });

    if (violations.length > 0) {
        console.error('❌ Error: Reserved post tag(s) found!');
        violations.forEach(({ file, tags }) => {
            console.error(`   "${file}" uses reserved tag(s): ${tags.join(', ')}`);
        });
        console.error('   The tag "all" is reserved for the posts page filter. Use a different tag name.');
        throw new Error(
            `Found ${violations.length} post(s) with reserved tag(s). Remove tag "all" from frontmatter.`
        );
    }
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
    if (metadata.archived) {
        attrs.push('data-archived="true"');
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
    encodeTagForPath,
    checkDuplicateSlugs,
    checkReservedPostTags,
    generatePostsMd,
    generatePostAttributes,
};
