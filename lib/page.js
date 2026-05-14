// ============================================================================
// PAGE.JS
//
// Renders individual markdown files and assembles complete HTML pages.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { parseFrontmatter } = require('./frontmatter');
const { extractPostMetadata } = require('./posts');
const { generateMainNav, generateSidebarNav, generateSidebarHeader, generateSidebarFooter } = require('./sidebar');
const { getBaseHref, buildCanonicalUrl, getLegacyRedirectScript, getRelativePrefix, resolveSitePath } = require('./routes');
const { escapeHtml } = require('./utils');

marked.setOptions({
    breaks: false,
    gfm: true,
});

/**
 * Renders a markdown file to HTML with metadata
 * @param {string} filePath - Relative path like content/home.md
 * @param {string} cwd
 * @param {string} contentDir
 * @returns {{ html: string, metadata: Object }|null}
 */
function renderMarkdownFile(filePath, cwd = process.cwd(), contentDir = 'content') {
    const fullPath = path.join(cwd, filePath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const parsed = parseFrontmatter(fullPath);
    if (!parsed) {
        return null;
    }

    const postsFolderPrefix = `${contentDir}/posts/`;
    const metadata = extractPostMetadata(filePath, postsFolderPrefix, cwd);

    if (metadata.slug && metadata.published === false) {
        return null;
    }

    return {
        html: marked.parse(parsed.content),
        metadata,
    };
}

/**
 * Generates static post metadata block HTML
 * @param {Object} metadata
 * @returns {string}
 */
function generatePostMetadataHtml(metadata, rootPrefix = '') {
    if (!metadata || !metadata.slug) {
        return '';
    }

    let html = '<div class="post-metadata">\n';

    if (metadata.title) {
        html += `  <h1 class="post-title">${escapeHtml(metadata.title)}</h1>\n`;
    }
    if (metadata.date) {
        html += `  <div class="post-date">${escapeHtml(metadata.date)}</div>\n`;
    }
    if (metadata.tags) {
        const tags = metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 0) {
            html += '  <div class="post-tags">Tagged: ';
            html += tags.map((tag, index) => {
                const separator = index < tags.length - 1 ? ', ' : '';
                return `<a href="${resolveSitePath(rootPrefix, `posts/?tag=${encodeURIComponent(tag)}`)}" class="tag-link">${escapeHtml(tag)}</a>${separator}`;
            }).join('');
            html += '</div>\n';
        }
    }

    html += '</div>\n';
    return html;
}

/**
 * Absolute URL for JSON-LD when thumbnail is a site-relative path
 */
function resolvePublicAssetUrl(baseUrl, assetPath) {
    if (!assetPath) {
        return null;
    }
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        return assetPath;
    }
    const base = baseUrl.replace(/\/$/, '');
    const p = String(assetPath).replace(/^\//, '');
    return `${base}/${p}`;
}

/**
 * Generates JSON-LD structured data script
 * @param {Object} options
 * @returns {string}
 */
function generateStructuredData({ title, description, url, metadata, siteConfig, isPost }) {
    let schema;

    if (isPost && metadata.date) {
        schema = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: title,
            description,
            url,
        };

        const authorName = metadata.author || siteConfig.authorName;
        if (authorName) {
            schema.author = { '@type': 'Person', name: authorName };
        }
        if (metadata.thumbnail) {
            schema.image = resolvePublicAssetUrl(siteConfig.baseUrl, metadata.thumbnail);
        }
        if (metadata.tags) {
            schema.keywords = metadata.tags;
        }
    } else {
        schema = {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: title,
            description,
            url,
        };
    }

    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Prefixes site-root content/ asset paths for pages below the site root
 * @param {string} html
 * @param {string} prefix - e.g. ../ or ../../
 * @returns {string}
 */
function prefixContentAssetPaths(html, prefix) {
    if (!prefix) {
        return html;
    }

    return html
        .replace(/src="content\//g, `src="${prefix}content/`)
        .replace(/href="content\//g, `href="${prefix}content/`);
}

/**
 * Assembles a complete HTML page from the template
 * @param {string} template
 * @param {Object} options
 * @returns {string}
 */
function assemblePage(template, options) {
    const {
        siteConfig,
        sidebarData,
        postsMdPath,
        contentHTML,
        metadata = {},
        activeNav = null,
        isPost = false,
        canonicalPath = '',
        enableTagFilter = false,
        pageDepth = 0,
    } = options;

    const rootPrefix = getRelativePrefix(pageDepth);
    const stylePrefix = rootPrefix;
    const contentPrefix = rootPrefix;
    const sitePathPrefix = getBaseHref(siteConfig.baseUrl);
    const title = metadata.title || siteConfig.siteName;
    const description = metadata.description || siteConfig.defaultDescription;
    const keywords = metadata.keywords || siteConfig.defaultKeywords;
    const canonicalUrl = buildCanonicalUrl(siteConfig.baseUrl, canonicalPath);

    const mainNavHTML = generateMainNav(sidebarData, postsMdPath, activeNav, rootPrefix);
    const sidebarNavHTML = generateSidebarNav(sidebarData, activeNav, rootPrefix);
    const sidebarHeaderHTML = generateSidebarHeader(sidebarData);
    const sidebarFooterHTML = generateSidebarFooter(sidebarData, rootPrefix);
    const postMetadataHTML = isPost ? generatePostMetadataHtml(metadata, rootPrefix) : '';
    const prefixedContentHTML = prefixContentAssetPaths(contentHTML, contentPrefix);
    const structuredData = generateStructuredData({
        title,
        description,
        url: canonicalUrl,
        metadata,
        siteConfig,
        isPost,
    });

    const siteConfigJson = JSON.stringify(siteConfig, null, 12).replace(/^/gm, '            ');
    const tagFilterAttr = enableTagFilter ? ' data-enable-tag-filter="true"' : '';

    const replaceAll = (value, search, replacement) => value.split(search).join(replacement);

    let html = template;
    html = replaceAll(html, '{{ASSET_PREFIX}}', stylePrefix);
    html = html
        .replace('{{SITE_CONFIG}}', siteConfigJson)
        .replace('{{ASSET_PREFIX_JSON}}', JSON.stringify(stylePrefix))
        .replace('{{PAGE_TITLE}}', escapeHtml(title))
        .replace('{{META_DESCRIPTION}}', escapeHtml(description))
        .replace('{{META_KEYWORDS}}', escapeHtml(keywords))
        .replace('{{CANONICAL_URL}}', escapeHtml(canonicalUrl))
        .replace('{{STRUCTURED_DATA}}', structuredData)
        .replace('{{LEGACY_REDIRECT}}', getLegacyRedirectScript(rootPrefix))
        .replace('{{TAG_FILTER_ATTR}}', tagFilterAttr)
        .replace('{{SIDEBAR_HEADER}}', sidebarHeaderHTML)
        .replace('{{MAIN_NAV}}', mainNavHTML)
        .replace('{{SIDEBAR_NAV}}', sidebarNavHTML)
        .replace('{{SIDEBAR_FOOTER}}', sidebarFooterHTML)
        .replace('{{POST_METADATA}}', postMetadataHTML)
        .replace('{{MARKDOWN_CONTENT}}', prefixedContentHTML);

    return html;
}

/**
 * Writes a rendered page to disk
 * @param {string} outputPath
 * @param {string} html
 */
function writePage(outputPath, html) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, 'utf8');
}

module.exports = {
    renderMarkdownFile,
    generatePostMetadataHtml,
    assemblePage,
    writePage,
};
