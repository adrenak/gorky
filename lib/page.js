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
 * Safe basename for `styles/themes/<id>.css`. Letters, digits, `-`, `_` only.
 * @param {unknown} raw
 * @returns {string} normalized id or ''
 */
function sanitizeThemeBasename(raw) {
    if (raw == null) {
        return '';
    }
    let t = String(raw).trim();
    if (t === '') {
        return '';
    }
    if (t.endsWith('.css')) {
        t = t.slice(0, -4).trim();
    }
    if (t === '' || t.length > 96 || !/^[a-zA-Z0-9_-]+$/.test(t)) {
        return '';
    }
    return t;
}

/**
 * Safe theme stylesheet filename for the initial `<link>` (invalid → default).
 * @param {Object} siteConfig
 * @returns {string} e.g. `default.css`
 */
function resolveThemeStylesheet(siteConfig) {
    const t = sanitizeThemeBasename(siteConfig && siteConfig.theme);
    return `${t || 'default'}.css`;
}

/**
 * HTML for optional sidebar theme `<select>` (above footer). Empty if no `themeOptions`.
 * @param {Object} siteConfig
 * @returns {string}
 */
function generateThemeSwitcherHtml(siteConfig) {
    const opts = siteConfig && siteConfig.themeOptions;
    if (!Array.isArray(opts) || opts.length === 0) {
        return '';
    }
    const seen = new Set();
    const ordered = [];
    for (const raw of opts) {
        const s = sanitizeThemeBasename(raw);
        if (s && !seen.has(s)) {
            seen.add(s);
            ordered.push(s);
        }
    }
    const buildTheme = sanitizeThemeBasename(siteConfig.theme) || 'default';
    if (!seen.has(buildTheme)) {
        ordered.unshift(buildTheme);
        seen.add(buildTheme);
    }
    if (ordered.length === 0) {
        return '';
    }
    let html = '<div class="sidebar-theme-switcher">\n';
    html += '  <label class="theme-switcher-label" for="gorky-theme-select">Theme</label>\n';
    html += '  <select id="gorky-theme-select" class="theme-select" aria-label="Color theme">\n';
    for (const name of ordered) {
        const sel = name === buildTheme ? ' selected' : '';
        html += `    <option value="${escapeHtml(name)}"${sel}>${escapeHtml(name)}</option>\n`;
    }
    html += '  </select>\n</div>\n';
    return html;
}

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
 * Resolve site-config asset string to absolute URL (relative to baseUrl or full URL).
 */
function resolveConfiguredAssetUrl(siteConfig, key) {
    const val = siteConfig[key];
    if (val === undefined || val === null || !String(val).trim()) {
        return null;
    }
    const s = String(val).trim();
    if (s.startsWith('http://') || s.startsWith('https://')) {
        return s;
    }
    return resolvePublicAssetUrl(siteConfig.baseUrl, s.replace(/^\//, ''));
}

/**
 * Image for link previews: page/post thumbnail, else site avatar, else favicon, else apple touch.
 * @returns {{ url: string, kind: 'thumbnail'|'avatar'|'favicon'|'apple' }|null}
 */
function resolveShareImage(siteConfig, metadata) {
    if (metadata && metadata.thumbnail) {
        const url = resolvePublicAssetUrl(siteConfig.baseUrl, metadata.thumbnail);
        if (url) {
            return { url, kind: 'thumbnail' };
        }
    }

    const avatarUrl = resolveConfiguredAssetUrl(siteConfig, 'avatar');
    if (avatarUrl) {
        return { url: avatarUrl, kind: 'avatar' };
    }

    const favUrl = resolveConfiguredAssetUrl(siteConfig, 'favicon');
    if (favUrl) {
        return { url: favUrl, kind: 'favicon' };
    }

    const appleUrl = resolveConfiguredAssetUrl(siteConfig, 'appleTouchIcon');
    if (appleUrl) {
        return { url: appleUrl, kind: 'apple' };
    }

    return null;
}

/**
 * Open Graph + Twitter Card tags for Discord, Twitter/X, Slack, etc.
 */
function generateSocialMetaTags({
    title,
    description,
    canonicalUrl,
    siteConfig,
    isPost,
    metadata,
}) {
    const siteName = siteConfig.siteName || 'Site';
    const ogType = isPost ? 'article' : 'website';
    const lines = [
        `<meta property="og:title" content="${escapeHtml(title)}">`,
        `<meta property="og:description" content="${escapeHtml(description)}">`,
        `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
        `<meta property="og:site_name" content="${escapeHtml(siteName)}">`,
        `<meta property="og:type" content="${escapeHtml(ogType)}">`,
    ];

    const imagePick = resolveShareImage(siteConfig, metadata);
    if (imagePick) {
        lines.push(`<meta property="og:image" content="${escapeHtml(imagePick.url)}">`);
        const twitterCard =
            imagePick.kind === 'thumbnail' ? 'summary_large_image' : 'summary';
        lines.push(`<meta name="twitter:card" content="${escapeHtml(twitterCard)}">`);
        lines.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
        lines.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);
        lines.push(`<meta name="twitter:image" content="${escapeHtml(imagePick.url)}">`);
    } else {
        lines.push('<meta name="twitter:card" content="summary">');
        lines.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
        lines.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);
    }

    return lines.join('\n    ');
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
        const sharePick = resolveShareImage(siteConfig, metadata);
        if (sharePick) {
            schema.image = sharePick.url;
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
        const sharePick = resolveShareImage(siteConfig, metadata);
        if (sharePick) {
            schema.image = sharePick.url;
        }
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

    const socialMeta = generateSocialMetaTags({
        title,
        description,
        canonicalUrl,
        siteConfig,
        isPost,
        metadata,
    });

    const siteConfigJson = JSON.stringify(siteConfig, null, 12).replace(/^/gm, '            ');
    const tagFilterAttr = enableTagFilter ? ' data-enable-tag-filter="true"' : '';
    const themeStylesheet = resolveThemeStylesheet(siteConfig);
    const themeSwitcherHTML = generateThemeSwitcherHtml(siteConfig);

    const replaceAll = (value, search, replacement) => value.split(search).join(replacement);

    let html = template;
    html = replaceAll(html, '{{ASSET_PREFIX}}', stylePrefix);
    html = html
        .replace('{{THEME_STYLESHEET}}', themeStylesheet)
        .replace('{{SITE_CONFIG}}', siteConfigJson)
        .replace('{{ASSET_PREFIX_JSON}}', JSON.stringify(stylePrefix))
        .replace('{{PAGE_TITLE}}', escapeHtml(title))
        .replace('{{META_DESCRIPTION}}', escapeHtml(description))
        .replace('{{META_KEYWORDS}}', escapeHtml(keywords))
        .replace('{{CANONICAL_URL}}', escapeHtml(canonicalUrl))
        .replace('{{SOCIAL_META}}', socialMeta)
        .replace('{{STRUCTURED_DATA}}', structuredData)
        .replace('{{LEGACY_REDIRECT}}', getLegacyRedirectScript(rootPrefix))
        .replace('{{TAG_FILTER_ATTR}}', tagFilterAttr)
        .replace('{{SIDEBAR_HEADER}}', sidebarHeaderHTML)
        .replace('{{MAIN_NAV}}', mainNavHTML)
        .replace('{{SIDEBAR_NAV}}', sidebarNavHTML)
        .replace('{{THEME_SWITCHER}}', themeSwitcherHTML)
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
