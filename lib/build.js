// ============================================================================
// BUILD.JS
//
// Multi-page static site build (default output: deliver/):
//   deliver/index.html          <- home.md
//   deliver/posts/index.html    <- generated posts.md
//   deliver/post/{slug}/        <- individual posts
//   deliver/{page}/index.html   <- other content/*.md pages
// ============================================================================

const fs = require('fs');
const path = require('path');
const { generatePostsMd, checkDuplicateSlugs } = require('./posts');
const { renderMarkdownFile, assemblePage, writePage } = require('./page');

/**
 * Extracts SITE_CONFIG from template file (fallback)
 */
function extractSiteConfig(templateContent) {
    const configMatch = templateContent.match(/const SITE_CONFIG = \{([\s\S]*?)\};/);
    if (!configMatch) {
        return {
            baseUrl: 'https://yourusername.github.io/gorky',
            siteName: 'gorky',
            defaultDescription: 'gorky - A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
            defaultKeywords: 'gorky, static site generator, markdown, blog, GitHub Pages, JAMstack, static website, markdown blog',
        };
    }

    const configBlock = configMatch[1];
    const config = {};

    const baseUrlMatch = configBlock.match(/baseUrl:\s*['"`]([^'"`]+)['"`]/);
    if (baseUrlMatch) config.baseUrl = baseUrlMatch[1];

    const siteNameMatch = configBlock.match(/siteName:\s*['"`]([^'"`]+)['"`]/);
    if (siteNameMatch) config.siteName = siteNameMatch[1];

    const descMatch = configBlock.match(/defaultDescription:\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) config.defaultDescription = descMatch[1];

    const keywordsMatch = configBlock.match(/defaultKeywords:\s*['"`]([^'"`]+)['"`]/);
    if (keywordsMatch) config.keywords = keywordsMatch[1];

    return {
        baseUrl: config.baseUrl || 'https://yourusername.github.io/gorky',
        siteName: config.siteName || 'gorky',
        defaultDescription: config.defaultDescription || 'gorky - A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
        defaultKeywords: config.keywords || 'gorky, static site generator, markdown, blog, GitHub Pages, JAMstack, static website, markdown blog',
    };
}

/**
 * Builds one page and writes it to disk
 */
function buildAndWritePage(template, outputPath, options) {
    const html = assemblePage(template, options);
    writePage(outputPath, html);
}

/**
 * Recursively copies a directory
 */
function copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }

    fs.mkdirSync(dest, { recursive: true });

    fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

/**
 * Copies non-markdown assets from content into deliver
 */
function copyContentAssets(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        return;
    }

    fs.mkdirSync(destDir, { recursive: true });

    fs.readdirSync(srcDir, { withFileTypes: true }).forEach((entry) => {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            copyContentAssets(srcPath, destPath);
        } else if (!entry.name.endsWith('.md')) {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

/**
 * Copies styles, content assets, and optional icons into the output directory
 */
function copyDeliverAssets(cwd, deliverRoot, contentDir, stylesDir) {
    copyDirectory(path.join(cwd, stylesDir), path.join(deliverRoot, stylesDir));
    copyContentAssets(path.join(cwd, contentDir), path.join(deliverRoot, contentDir));

    ['favicon.ico', 'apple-touch-icon.png'].forEach((icon) => {
        const src = path.join(cwd, icon);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(deliverRoot, icon));
        }
    });
}

/**
 * Recreates the output directory before each build
 */
function prepareOutputDir(outputDirPath) {
    if (fs.existsSync(outputDirPath)) {
        fs.rmSync(outputDirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDirPath, { recursive: true });
}

/**
 * Builds the static site
 */
function buildSite(options = {}) {
    const {
        contentDir = 'content',
        outputDir = 'deliver',
        outputFile = 'index.html',
        templateFile = 'index-template.html',
        stylesDir = 'styles',
        cwd = process.cwd(),
    } = options;

    try {
        const deliverRoot = path.join(cwd, outputDir);
        const outputFileName = path.basename(outputFile);

        prepareOutputDir(deliverRoot);
        copyDeliverAssets(cwd, deliverRoot, contentDir, stylesDir);

        const PATHS = {
            template: path.join(cwd, templateFile),
            output: path.join(deliverRoot, outputFileName),
            posts: path.join(cwd, contentDir, 'posts'),
            postsMd: path.join(cwd, contentDir, 'posts.md'),
            content: path.join(cwd, contentDir),
        };

        checkDuplicateSlugs(PATHS.posts);

        const template = fs.readFileSync(PATHS.template, 'utf8');

        let siteConfig;
        const siteConfigPath = path.join(cwd, 'site-config.js');
        if (fs.existsSync(siteConfigPath)) {
            delete require.cache[require.resolve(siteConfigPath)];
            siteConfig = require(siteConfigPath);
        } else {
            siteConfig = extractSiteConfig(template);
        }

        generatePostsMd(PATHS.posts, PATHS.postsMd, contentDir, '../');

        const sidebarConfig = siteConfig.sidebar || {};
        const sidebarData = {
            _defaults: {
                header: sidebarConfig.header || siteConfig.siteName || 'gorky',
                homeDisplayName: sidebarConfig.homeDisplayName || '🏠 Home',
                postsDisplayName: sidebarConfig.postsDisplayName || '✍️ Posts',
                footer: sidebarConfig.footer || [],
            },
            ...sidebarConfig.sections || {},
        };

        let pageCount = 0;

        const homeFile = `${contentDir}/home.md`;
        const homeRendered = renderMarkdownFile(homeFile, cwd, contentDir);
        if (!homeRendered) {
            throw new Error(`Missing required file: ${homeFile}`);
        }

        buildAndWritePage(template, PATHS.output, {
            siteConfig,
            sidebarData,
            postsMdPath: PATHS.postsMd,
            contentHTML: homeRendered.html,
            metadata: homeRendered.metadata,
            activeNav: 'home',
            canonicalPath: '',
            pageDepth: 0,
        });
        pageCount += 1;

        if (fs.existsSync(PATHS.postsMd)) {
            const postsRendered = renderMarkdownFile(`${contentDir}/posts.md`, cwd, contentDir);
            if (postsRendered) {
                buildAndWritePage(template, path.join(deliverRoot, 'posts', 'index.html'), {
                    siteConfig,
                    sidebarData,
                    postsMdPath: PATHS.postsMd,
                    contentHTML: postsRendered.html,
                    metadata: postsRendered.metadata,
                    activeNav: 'posts',
                    canonicalPath: 'posts',
                    enableTagFilter: true,
                    pageDepth: 1,
                });
                pageCount += 1;
            }
        }

        if (fs.existsSync(PATHS.content)) {
            fs.readdirSync(PATHS.content).forEach((file) => {
                if (!file.endsWith('.md')) return;
                if (file === 'home.md' || file === 'posts.md' || file === 'posts-intro.md') return;

                const pageName = file.replace(/\.md$/, '');
                const filePath = `${contentDir}/${file}`;
                const rendered = renderMarkdownFile(filePath, cwd, contentDir);
                if (!rendered) return;

                buildAndWritePage(template, path.join(deliverRoot, pageName, 'index.html'), {
                    siteConfig,
                    sidebarData,
                    postsMdPath: PATHS.postsMd,
                    contentHTML: rendered.html,
                    metadata: rendered.metadata,
                    activeNav: pageName,
                    canonicalPath: pageName,
                    pageDepth: 1,
                });
                pageCount += 1;
            });
        }

        if (fs.existsSync(PATHS.posts)) {
            fs.readdirSync(PATHS.posts).forEach((file) => {
                if (!file.endsWith('.md')) return;

                const filePath = `${contentDir}/posts/${file}`;
                const rendered = renderMarkdownFile(filePath, cwd, contentDir);
                if (!rendered || !rendered.metadata.slug) return;

                buildAndWritePage(template, path.join(deliverRoot, 'post', rendered.metadata.slug, 'index.html'), {
                    siteConfig,
                    sidebarData,
                    postsMdPath: PATHS.postsMd,
                    contentHTML: rendered.html,
                    metadata: rendered.metadata,
                    activeNav: null,
                    isPost: true,
                    canonicalPath: `post/${rendered.metadata.slug}`,
                    pageDepth: 2,
                });
                pageCount += 1;
            });
        }

        console.log(`✓ Successfully generated ${pageCount} page(s)`);
    } catch (error) {
        console.error('Error building site:', error.message);
        process.exit(1);
    }
}

module.exports = {
    buildSite,
};
