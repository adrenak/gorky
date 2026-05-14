// ============================================================================
// ROUTES.JS
//
// URL helpers for the multi-page site structure.
// ============================================================================

/**
 * Returns the path prefix for <base href> from a site baseUrl
 * @param {string} baseUrl
 * @returns {string}
 */
function getBaseHref(baseUrl) {
    const url = new URL(baseUrl);
    let pathname = url.pathname;
    if (!pathname.endsWith('/')) {
        pathname += '/';
    }
    return pathname || '/';
}

/**
 * Returns a relative path prefix based on page depth from site root
 * @param {number} depth - 0 for index.html, 1 for posts/, 2 for post/slug/, etc.
 * @returns {string}
 */
function getRelativePrefix(depth) {
    if (depth <= 0) {
        return '';
    }
    return '../'.repeat(depth);
}

/**
 * Resolves a site-root path relative to the current page depth
 * @param {string} rootPrefix - e.g. ../ or ../../
 * @param {string} sitePath - e.g. posts/, post/slug/, ./
 * @returns {string}
 */
function resolveSitePath(rootPrefix, sitePath) {
    if (!sitePath || sitePath === './') {
        return rootPrefix || './';
    }
    return `${rootPrefix}${sitePath}`;
}

/**
 * Converts legacy ?page= / ?post= nav targets to path URLs
 * @param {string} target
 * @returns {string}
 */
function normalizeNavTarget(target) {
    if (!target.startsWith('?')) {
        return target;
    }

    const params = new URLSearchParams(target.slice(1));

    if (params.has('post')) {
        return `post/${params.get('post')}/`;
    }

    const page = params.get('page');
    if (!page || page === 'home') {
        return './';
    }
    if (page === 'posts') {
        return 'posts/';
    }

    return `${page}/`;
}

/**
 * Builds an absolute canonical URL for a site path
 * @param {string} baseUrl
 * @param {string} sitePath - e.g. '', 'posts', 'post/my-slug', 'customization'
 * @returns {string}
 */
function buildCanonicalUrl(baseUrl, sitePath = '') {
    const base = baseUrl.replace(/\/$/, '');
    if (!sitePath) {
        return `${base}/`;
    }
    return `${base}/${sitePath.replace(/^\/|\/$/g, '')}/`;
}

/**
 * Inline script that redirects legacy query-string URLs to path URLs.
 * Uses relative paths from the current page so local and deployed sites both work.
 * @param {string} rootPrefix - Relative path to site root, e.g. '' or '../' or '../../'
 * @returns {string}
 */
function getLegacyRedirectScript(rootPrefix) {
    return `<script>
(function () {
    var search = window.location.search;
    if (!search) return;

    var params = new URLSearchParams(search);
    var root = ${JSON.stringify(rootPrefix)};
    var path = window.location.pathname;
    var onPostsPage = /\\/posts\\/?$/.test(path) || /\\/posts\\/index\\.html$/.test(path);
    var target = null;

    if (params.has('post')) {
        target = root + 'post/' + encodeURIComponent(params.get('post')) + '/';
    } else if (params.get('page') === 'posts') {
        target = root + 'posts/';
    } else if (params.get('page') === 'home') {
        target = root || './';
    } else if (params.has('page')) {
        target = root + params.get('page') + '/';
    } else if (params.has('tag') && !onPostsPage) {
        target = root + 'posts/?tag=' + encodeURIComponent(params.get('tag'));
    }

    if (target) {
        window.location.replace(target);
    }
})();
</script>`;
}

module.exports = {
    getBaseHref,
    getRelativePrefix,
    resolveSitePath,
    normalizeNavTarget,
    buildCanonicalUrl,
    getLegacyRedirectScript,
};
