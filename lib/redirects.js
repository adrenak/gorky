// ============================================================================
// REDIRECTS.JS
//
// Short-link redirects from redirects.json under /r/:
//   proxy: true  → r/{slug} plain file (remote body fetched at build; for curl)
//   delay === 0  → r/{slug}/index.html instant browser redirect
//   delay > 0    → r/{slug}/index.html themed hopping page
// ============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { escapeHtml, escapeHtmlAttribute } = require('./utils');
const { getRelativePrefix } = require('./routes');
const { resolveThemeStylesheet } = require('./page');

const REDIRECT_DIR = 'r';
const RESERVED_SLUG = 'r';
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_DELAY_MS = 30000;
const BUILTIN_MESSAGE = 'Redirecting you to {url}…';
const REDIRECT_PAGE_DEPTH = 2;
const MAX_PROXY_BYTES = 5 * 1024 * 1024;
const MAX_PROXY_REDIRECTS = 8;
const PROXY_FETCH_TIMEOUT_MS = 30000;

/**
 * Returns true when redirects.json exists and has at least one redirect entry.
 */
function hasActiveRedirects(cwd) {
    const configPath = path.join(cwd, 'redirects.json');
    if (!fs.existsSync(configPath)) {
        return false;
    }

    try {
        const raw = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(raw);
        const redirects = config && config.redirects;
        return redirects && typeof redirects === 'object' && Object.keys(redirects).length > 0;
    } catch {
        return false;
    }
}

function normalizeSlug(key) {
    const slug = String(key).trim().replace(/^\/+|\/+$/g, '');
    if (!slug) {
        throw new Error('Redirect slug cannot be empty');
    }
    if (!SLUG_PATTERN.test(slug)) {
        throw new Error(
            `Invalid redirect slug "${slug}": use letters, digits, hyphens, and underscores only`
        );
    }
    if (slug === RESERVED_SLUG) {
        throw new Error(`Redirect slug "${RESERVED_SLUG}" is reserved (conflicts with /r/ URL prefix)`);
    }
    return slug;
}

function normalizeTargetUrl(url) {
    if (url == null || typeof url !== 'string') {
        throw new Error('Redirect url must be a non-empty string');
    }

    let trimmed = url.trim();
    if (!trimmed) {
        throw new Error('Redirect url cannot be empty');
    }

    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
        trimmed = `https://${trimmed}`;
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new Error(`Invalid redirect url: ${url}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`Redirect url must use http or https (got ${parsed.protocol})`);
    }

    return parsed.href;
}

function formatDisplayUrl(normalizedUrl) {
    const parsed = new URL(normalizedUrl);
    let display = parsed.host;
    if (parsed.pathname && parsed.pathname !== '/') {
        display += parsed.pathname;
    }
    if (parsed.search) {
        display += parsed.search;
    }
    return display;
}

function parseDelay(value, context) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        throw new Error(`${context}: delay must be a non-negative integer (milliseconds)`);
    }
    if (value > MAX_DELAY_MS) {
        throw new Error(`${context}: delay must not exceed ${MAX_DELAY_MS} ms`);
    }
    return value;
}

function expandEntry(value, defaults) {
    const defaultDelay = defaults && defaults.delay != null ? defaults.delay : 0;
    const defaultMessage = defaults && defaults.message;

    if (typeof value === 'string') {
        return {
            url: value,
            delay: defaultDelay,
            message: defaultMessage,
        };
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Each redirect entry must be a string URL or an object with a url field');
    }

    const delay = value.delay !== undefined && value.delay !== null
        ? value.delay
        : defaultDelay;

    const entry = {
        url: value.url,
        delay,
        message: value.message !== undefined ? value.message : defaultMessage,
    };
    if (value.proxy === true) {
        entry.proxy = true;
    } else if (value.proxy === false) {
        entry.proxy = false;
    }
    return entry;
}

/**
 * URLs that should be baked in as plain files (gist raw, scripts, etc.) when delay is 0.
 * @param {string} url
 * @returns {boolean}
 */
function looksLikeRawStaticUrl(url) {
    try {
        const { pathname, hostname } = new URL(url);
        if (hostname === 'raw.githubusercontent.com') {
            return true;
        }
        if (/\/raw\//i.test(pathname)) {
            return true;
        }
        return /\.(sh|bash|zsh|txt|md|json|ya?ml|sql|csv|ini|conf|plist)$/i.test(pathname);
    } catch {
        return false;
    }
}

/**
 * @returns {{ proxy: boolean, delay: number }}
 */
function resolveRedirectMode(expanded, defaults, targetUrl, slug) {
    if (expanded.proxy === true) {
        return { proxy: true, delay: 0 };
    }

    const delay = parseDelay(
        expanded.delay !== undefined && expanded.delay !== null
            ? expanded.delay
            : (defaults.delay != null ? defaults.delay : 0),
        `redirect "${slug}"`
    );

    if (expanded.proxy === false) {
        return { proxy: false, delay };
    }

    if (delay === 0 && looksLikeRawStaticUrl(targetUrl)) {
        console.log(
            `ℹ️  Redirect "${slug}": raw text URL with delay 0 → static file (use "proxy": false to force a browser redirect)`
        );
        return { proxy: true, delay: 0 };
    }

    return { proxy: false, delay };
}

/**
 * Fetches remote text at build time for proxy entries.
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetchRemoteText(url) {
    return new Promise((resolve, reject) => {
        function doRequest(currentUrl, redirectsLeft) {
            let parsed;
            try {
                parsed = new URL(currentUrl);
            } catch (error) {
                reject(new Error(`Invalid URL: ${currentUrl}`));
                return;
            }

            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                reject(new Error(`Unsupported protocol: ${parsed.protocol}`));
                return;
            }

            const lib = parsed.protocol === 'https:' ? https : http;
            const req = lib.get(
                currentUrl,
                {
                    headers: {
                        'User-Agent': 'gorky-build',
                        Accept: 'text/plain,text/*,*/*;q=0.8',
                    },
                },
                (res) => {
                    const status = res.statusCode || 0;
                    if (
                        [301, 302, 303, 307, 308].includes(status)
                        && res.headers.location
                    ) {
                        if (redirectsLeft <= 0) {
                            res.resume();
                            reject(new Error(`Too many redirects fetching ${url}`));
                            return;
                        }
                        let nextUrl;
                        try {
                            nextUrl = new URL(res.headers.location, currentUrl).href;
                        } catch (error) {
                            res.resume();
                            reject(new Error(`Invalid redirect location for ${url}`));
                            return;
                        }
                        res.resume();
                        doRequest(nextUrl, redirectsLeft - 1);
                        return;
                    }

                    if (status < 200 || status >= 300) {
                        res.resume();
                        reject(new Error(`HTTP ${status} fetching ${url}`));
                        return;
                    }

                    const chunks = [];
                    let total = 0;
                    res.on('data', (chunk) => {
                        total += chunk.length;
                        if (total > MAX_PROXY_BYTES) {
                            req.destroy();
                            reject(new Error(
                                `Response from ${url} exceeds ${MAX_PROXY_BYTES} byte limit`
                            ));
                            return;
                        }
                        chunks.push(chunk);
                    });
                    res.on('end', () => {
                        const body = Buffer.concat(chunks);
                        if (body.includes(0)) {
                            reject(new Error(
                                `Response from ${url} looks binary; proxy expects text content`
                            ));
                            return;
                        }
                        resolve(body.toString('utf8'));
                    });
                }
            );

            req.on('error', (error) => {
                reject(new Error(`Failed to fetch ${url}: ${error.message}`));
            });
            req.setTimeout(PROXY_FETCH_TIMEOUT_MS, () => {
                req.destroy();
                reject(new Error(`Timed out fetching ${url}`));
            });
        }

        doRequest(url, MAX_PROXY_REDIRECTS);
    });
}

function resolveMessage(entry, defaults, displayUrl) {
    let template = entry.message;
    if (template == null || String(template).trim() === '') {
        template = defaults && defaults.message;
    }
    if (template == null || String(template).trim() === '') {
        template = BUILTIN_MESSAGE;
    }
    const withUrl = String(template).replace(/\{url\}/g, displayUrl);
    return escapeHtml(withUrl);
}

function buildFallbackLinkHtml(targetUrl) {
    const safeHref = escapeHtmlAttribute(targetUrl);
    const safeText = escapeHtml(targetUrl);
    return `<p class="redirect-fallback">If you are not redirected automatically, click here:<br><a href="${safeHref}" rel="noopener noreferrer">${safeText}</a></p>`;
}

function buildThemeHeadLinks(assetPrefix, themeStylesheet) {
    const p = assetPrefix;
    return [
        `<link rel="stylesheet" href="${p}styles/base.css">`,
        `<link rel="stylesheet" href="${p}styles/theme-shell.css">`,
        `<link rel="stylesheet" href="${p}styles/themes/${themeStylesheet}" id="theme-palette-stylesheet">`,
    ].join('\n    ');
}

function buildRedirectPageStyles() {
    return `<style>
        body.redirect-page-body {
            margin: 0;
            min-height: 100vh;
            overflow: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background-color: var(--color-content-bg, #fafafa);
            color: var(--color-text, #333);
            font-family: var(--font-family-body, system-ui, sans-serif);
            font-size: var(--font-size-body, 1rem);
            line-height: var(--line-height-body, 1.6);
        }
        .redirect-page {
            width: min(48rem, 92vw);
            max-width: 48rem;
            text-align: center;
        }
        .redirect-page p + p {
            margin-top: 1rem;
        }
        .redirect-fallback a {
            display: inline-block;
            margin-top: 0.35rem;
        }
        .redirect-page a {
            color: var(--color-link, #06c);
            overflow-wrap: break-word;
            word-break: break-word;
        }
        .redirect-page a:hover {
            text-decoration: underline;
        }
    </style>`;
}

function buildThemeInitScript(siteConfig, assetPrefix) {
    const siteConfigJson = JSON.stringify(siteConfig);
    const assetPrefixJson = JSON.stringify(assetPrefix);

    return `<script>
        const SITE_CONFIG = ${siteConfigJson};
        const ASSET_PREFIX = ${assetPrefixJson};
        document.addEventListener('DOMContentLoaded', function () {
            (function initThemeFromStorage() {
                var opts = SITE_CONFIG.themeOptions;
                if (!Array.isArray(opts) || opts.length === 0) return;
                var link = document.getElementById('theme-palette-stylesheet');
                if (!link) return;

                function safeName(v) {
                    v = String(v || '').trim();
                    if (v.endsWith('.css')) v = v.slice(0, -4).trim();
                    if (!v || v.length > 96 || !/^[a-zA-Z0-9_-]+$/.test(v)) return '';
                    return v;
                }

                var allowed = {};
                opts.forEach(function (o) {
                    var s = safeName(o);
                    if (s) allowed[s] = true;
                });
                var buildTheme = safeName(SITE_CONFIG.theme) || 'default';
                allowed[buildTheme] = true;

                function themeStorageKey() {
                    var id = SITE_CONFIG.themeStorageId;
                    if (typeof id === 'string') {
                        id = id.trim();
                        if (id && id.length <= 96 && /^[a-zA-Z0-9_-]+$/.test(id)) {
                            return 'gorky-theme:' + id;
                        }
                    }
                    var base = SITE_CONFIG.baseUrl;
                    if (base && typeof base === 'string') {
                        try {
                            var u = new URL(base, window.location.href);
                            var pathKey = u.pathname.replace(/^\\/+|\\/+$/g, '').replace(/\\//g, '--') || 'root';
                            return 'gorky-theme:' + pathKey;
                        } catch (err) {}
                    }
                    if (SITE_CONFIG.siteName) {
                        var slug = String(SITE_CONFIG.siteName).trim().toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                        if (slug) return 'gorky-theme:' + slug;
                    }
                    var pagePath = window.location.pathname.replace(/\\/index\\.html$/i, '')
                        .replace(/^\\/+|\\/+$/g, '').replace(/\\//g, '--') || 'root';
                    return 'gorky-theme:' + pagePath;
                }

                var storageKey = themeStorageKey();
                var stored = '';
                try {
                    stored = localStorage.getItem(storageKey) || '';
                    if (!stored) {
                        var legacy = localStorage.getItem('gorky-theme') || '';
                        if (legacy && allowed[legacy]) stored = legacy;
                    }
                } catch (err) {}
                var name = stored && allowed[stored] ? stored : buildTheme;
                if (name && allowed[name]) {
                    link.setAttribute('href', ASSET_PREFIX + 'styles/themes/' + name + '.css');
                }
            })();
        });
    </script>`;
}

function buildGoatCounterCountScript(slug, siteConfig) {
    if (!siteConfig.goatCounterEnabled) {
        return '';
    }

    const eventPath = escapeHtmlAttribute(`r-${slug}`);
    const siteName = escapeHtmlAttribute(siteConfig.siteName || 'site');

    return `function recordRedirect() {
    if (typeof goatcounter !== 'undefined') {
        goatcounter.count({ path: '${eventPath}', event: true, title: 'r/${slug} (${siteName})' });
    }
}
`;
}

function buildRedirectScript({ slug, targetUrl, delay, siteConfig }) {
    const safeUrl = escapeHtmlAttribute(targetUrl);

    if (!siteConfig.goatCounterEnabled) {
        if (delay === 0) {
            return `<script>location.replace('${safeUrl}');</script>`;
        }
        return `<script>setTimeout(function () { location.replace('${safeUrl}'); }, ${delay});</script>`;
    }

    const code = escapeHtmlAttribute(siteConfig.goatCounterCode || 'yourcode');
    const settings = [];
    if (siteConfig.allowLocal) settings.push('allow_local:true');
    if (siteConfig.allowFrame) settings.push('allow_frame:true');
    if (siteConfig.noOnload) settings.push('no_onload:true');
    const settingsAttr = settings.length
        ? ` script.setAttribute('data-goatcounter-settings', '${settings.join(';')}');`
        : '';
    const goatCount = buildGoatCounterCountScript(slug, siteConfig);

    if (delay === 0) {
        return `<script>
${goatCount}(function () {
    var target = '${safeUrl}';
    function go() { location.replace(target); }
    var script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-goatcounter', 'https://${code}.goatcounter.com/count');${settingsAttr}
    script.src = 'https://gc.zgo.at/count.js';
    script.onload = function () { recordRedirect(); go(); };
    script.onerror = go;
    document.head.appendChild(script);
    setTimeout(go, 400);
})();
</script>`;
    }

    return `<script>
${goatCount}(function () {
    var target = '${safeUrl}';
    var script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-goatcounter', 'https://${code}.goatcounter.com/count');${settingsAttr}
    script.src = 'https://gc.zgo.at/count.js';
    script.onload = function () { recordRedirect(); };
    document.head.appendChild(script);
    setTimeout(function () { location.replace(target); }, ${delay});
})();
</script>`;
}

function buildRedirectHtml({ slug, targetUrl, delay, messageHtml, siteConfig }) {
    const safeUrl = escapeHtmlAttribute(targetUrl);
    const assetPrefix = getRelativePrefix(REDIRECT_PAGE_DEPTH);
    const themeStylesheet = resolveThemeStylesheet(siteConfig);
    const refreshSeconds = delay === 0 ? 0 : Math.max(1, Math.ceil(delay / 1000));
    const metaRefresh = delay === 0
        ? `<meta http-equiv="refresh" content="0;url=${safeUrl}">`
        : `<meta http-equiv="refresh" content="${refreshSeconds};url=${safeUrl}">`;

    const bodyContent = [
        `<p class="redirect-message">${messageHtml}</p>`,
        buildFallbackLinkHtml(targetUrl),
    ].join('\n        ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaRefresh}
    <title>Redirect</title>
    ${buildThemeHeadLinks(assetPrefix, themeStylesheet)}
    ${buildRedirectPageStyles()}
    ${buildThemeInitScript(siteConfig, assetPrefix)}
    ${buildRedirectScript({ slug, targetUrl, delay, siteConfig })}
</head>
<body class="redirect-page-body">
    <main class="redirect-page">
        ${bodyContent}
    </main>
</body>
</html>
`;
}

function loadRedirectsConfig(cwd) {
    const configPath = path.join(cwd, 'redirects.json');
    if (!fs.existsSync(configPath)) {
        return null;
    }

    let config;
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        throw new Error(`Invalid redirects.json: ${error.message}`);
    }

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        throw new Error('redirects.json must be a JSON object');
    }

    const redirects = config.redirects;
    if (!redirects || typeof redirects !== 'object' || Array.isArray(redirects)) {
        return null;
    }

    if (Object.keys(redirects).length === 0) {
        return null;
    }

    const defaults = config.defaults || {};
    if (defaults.delay != null) {
        parseDelay(defaults.delay, 'defaults');
    }
    if (defaults.message != null && String(defaults.message).trim() === '') {
        throw new Error('defaults.message must be a non-empty string when set');
    }

    const entries = [];
    const seenSlugs = new Map();

    Object.entries(redirects).forEach(([key, value]) => {
        const slug = normalizeSlug(key);
        if (seenSlugs.has(slug)) {
            throw new Error(
                `Duplicate redirect slug "${slug}" (keys "${seenSlugs.get(slug)}" and "${key}")`
            );
        }
        seenSlugs.set(slug, key);

        const expanded = expandEntry(value, defaults);
        if (!expanded.url) {
            throw new Error(`Redirect "${slug}" is missing required url`);
        }

        const targetUrl = normalizeTargetUrl(expanded.url);
        const { proxy, delay } = resolveRedirectMode(expanded, defaults, targetUrl, slug);

        if (proxy) {
            if (expanded.delay != null && expanded.delay !== 0) {
                console.warn(`⚠️  Redirect "${slug}": delay is ignored when proxy is true`);
            }
            if (expanded.message != null && String(expanded.message).trim() !== '') {
                console.warn(`⚠️  Redirect "${slug}": message is ignored when proxy is true`);
            }
        }

        if (!proxy && delay === 0 && expanded.message != null && String(expanded.message).trim() !== '') {
            console.warn(
                `⚠️  Redirect "${slug}": message is ignored when delay is 0 (instant redirect)`
            );
        }

        if (
            !proxy
            && expanded.message != null
            && String(expanded.message).trim() === ''
        ) {
            throw new Error(`Redirect "${slug}": message must be non-empty when set`);
        }

        entries.push({
            slug,
            targetUrl,
            delay,
            proxy,
            message: expanded.message,
            displayUrl: formatDisplayUrl(targetUrl),
        });
    });

    return { defaults, entries };
}

/**
 * Builds redirect outputs from redirects.json.
 * @returns {Promise<number>} Number of artifacts written (0 if skipped)
 */
async function buildRedirectPages({ cwd, deliverRoot, siteConfig, contentDir = 'content' }) {
    const config = loadRedirectsConfig(cwd);
    if (!config) {
        return 0;
    }

    const rMdPath = path.join(cwd, contentDir, 'r.md');
    if (fs.existsSync(rMdPath)) {
        throw new Error(
            'content/r.md cannot coexist with redirects.json: the r/ output directory is reserved for short links. Remove content/r.md or disable redirects.'
        );
    }

    const redirectRoot = path.join(deliverRoot, REDIRECT_DIR);
    if (fs.existsSync(redirectRoot)) {
        fs.rmSync(redirectRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    }
    fs.mkdirSync(redirectRoot, { recursive: true });

    let pageCount = 0;
    let proxyCount = 0;

    for (const entry of config.entries) {
        if (entry.proxy) {
            const body = await fetchRemoteText(entry.targetUrl);
            fs.writeFileSync(path.join(redirectRoot, entry.slug), body, 'utf8');
            proxyCount += 1;
            continue;
        }

        const outDir = path.join(redirectRoot, entry.slug);
        fs.mkdirSync(outDir, { recursive: true });

        const messageEntry = {
            message: entry.delay === 0 ? undefined : entry.message,
        };
        const messageHtml = resolveMessage(messageEntry, config.defaults, entry.displayUrl);

        const html = buildRedirectHtml({
            slug: entry.slug,
            targetUrl: entry.targetUrl,
            delay: entry.delay,
            messageHtml,
            siteConfig,
        });

        fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
        pageCount += 1;
    }

    const parts = [];
    if (proxyCount > 0) {
        parts.push(`${proxyCount} proxied file(s)`);
    }
    if (pageCount > 0) {
        parts.push(`${pageCount} redirect page(s)`);
    }
    console.log(`✓ Generated ${parts.join(' and ')} under /r/`);
    return proxyCount + pageCount;
}

module.exports = {
    buildRedirectPages,
    hasActiveRedirects,
};
