// ============================================================================
// BUILD.JS
//
// Multi-page static site build into outputDir (default deliver/; use '' or '.' for site root / GitHub Pages):
//   Self-contained bundle: HTML + copied styles/ + copied content/ assets + README.txt
//   outputDir/index.html          <- home.md
//   outputDir/posts/index.html    <- generated posts.md
//   outputDir/post/{slug}/        <- individual posts
//   outputDir/{page}/index.html   <- other content/*.md pages
//   outputDir/r/{slug}/           <- redirects.json short links (optional)
//
// When outputDir is ''/'.' (site root == cwd), we only remove prior Gorky outputs — never the whole cwd.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { generatePostsMd, checkDuplicateSlugs, checkReservedPostTags } = require('./posts');
const { marked } = require('marked');
const { renderMarkdownFile, assemblePage, writePage } = require('./page');
const { buildRedirectPages, hasActiveRedirects } = require('./redirects');

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
 * Copies non-markdown files from content/ into deliver/content/ (images, etc.).
 * Markdown stays only in the source tree.
 */
function copyContentAssets(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        return;
    }

    if (path.resolve(srcDir) === path.resolve(destDir)) {
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
 * Copies styles into deliver/ so CSS loads when serving deliver/ directly.
 */
function copyStylesToDeliver(cwd, deliverRoot, stylesDir) {
    const src = path.join(cwd, stylesDir);
    const dest = path.join(deliverRoot, stylesDir);

    if (!fs.existsSync(src)) {
        return;
    }

    if (path.resolve(src) === path.resolve(dest)) {
        return;
    }

    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    }

    fs.mkdirSync(dest, { recursive: true });

    fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });

    ['favicon.ico', 'apple-touch-icon.png'].forEach((icon) => {
        const iconSrc = path.join(cwd, icon);
        if (fs.existsSync(iconSrc)) {
            fs.copyFileSync(iconSrc, path.join(deliverRoot, icon));
        }
    });
}

/**
 * Recreates the output directory before each build
 */
function prepareOutputDir(outputDirPath) {
    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
        return;
    }

    try {
        fs.rmSync(outputDirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
        fs.mkdirSync(outputDirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EBUSY' && error.code !== 'EPERM') {
            throw error;
        }

        emptyDirectory(outputDirPath);
    }
}

/**
 * Deletes all entries inside a directory without removing the directory itself
 */
function emptyDirectory(dirPath) {
    fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            fs.rmSync(entryPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
        } else {
            fs.unlinkSync(entryPath);
        }
    });
}

/**
 * Resolves the directory where the static bundle is written.
 * Empty string or '.' means the project root (cwd), not a subfolder named deliver/.
 */
function resolveDeliverRoot(cwd, outputDir) {
    if (outputDir === '' || outputDir === '.') {
        return path.resolve(cwd);
    }
    return path.resolve(cwd, outputDir);
}

function isSiteRootOutput(cwd, deliverRoot) {
    return path.resolve(cwd) === path.resolve(deliverRoot);
}

/**
 * Removes outputs from a previous build when writing into cwd (avoids rm -rf on the whole project).
 */
function cleanSiteRootBuildArtifacts({
    cwd,
    deliverRoot,
    contentDir,
    outputFile,
}) {
    const outputFileName = path.basename(outputFile);
    const safeRm = (p) => {
        if (fs.existsSync(p)) {
            fs.rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
        }
    };
    const safeUnlink = (p) => {
        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
        }
    };

    safeUnlink(path.join(deliverRoot, outputFileName));
    safeRm(path.join(deliverRoot, 'posts'));
    safeRm(path.join(deliverRoot, 'post'));
    safeRm(path.join(deliverRoot, 'r'));

    const contentPath = path.join(cwd, contentDir);
    if (fs.existsSync(contentPath)) {
        fs.readdirSync(contentPath).forEach((file) => {
            if (!file.endsWith('.md')) return;
            if (file === 'home.md' || file === 'posts.md' || file === 'posts-intro.md') return;
            const pageName = file.replace(/\.md$/, '');
            safeRm(path.join(deliverRoot, pageName));
        });
    }

    safeUnlink(path.join(deliverRoot, 'README.txt'));
}

/**
 * Builds the static site
 */
async function buildSite(options = {}) {
    const {
        contentDir = 'content',
        outputDir = 'deliver',
        outputFile = 'index.html',
        templateFile = 'base.html',
        stylesDir = 'styles',
        cwd = process.cwd(),
    } = options;

    try {
        const deliverRoot = resolveDeliverRoot(cwd, outputDir);
        const outputFileName = path.basename(outputFile);

        if (isSiteRootOutput(cwd, deliverRoot)) {
            cleanSiteRootBuildArtifacts({ cwd, deliverRoot, contentDir, outputFile });
        } else {
            prepareOutputDir(deliverRoot);
        }
        copyStylesToDeliver(cwd, deliverRoot, stylesDir);
        copyContentAssets(path.join(cwd, contentDir), path.join(deliverRoot, contentDir));

        const PATHS = {
            template: path.join(cwd, templateFile),
            output: path.join(deliverRoot, outputFileName),
            posts: path.join(cwd, contentDir, 'posts'),
            postsMd: path.join(cwd, contentDir, 'posts.md'),
            content: path.join(cwd, contentDir),
        };

        checkDuplicateSlugs(PATHS.posts);
        checkReservedPostTags(PATHS.posts);

        const template = fs.readFileSync(PATHS.template, 'utf8');

        let siteConfig;
        const siteConfigPath = path.join(cwd, 'site-config.js');
        if (fs.existsSync(siteConfigPath)) {
            delete require.cache[require.resolve(siteConfigPath)];
            siteConfig = require(siteConfigPath);
        } else {
            siteConfig = extractSiteConfig(template);
        }

        const skipRMd = hasActiveRedirects(cwd);

        const postsArtifacts = generatePostsMd(
            PATHS.posts,
            PATHS.postsMd,
            contentDir,
            siteConfig,
            deliverRoot
        );

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

        let pageCount = await buildRedirectPages({
            cwd,
            deliverRoot,
            siteConfig,
            contentDir,
        });

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
                    pageDepth: 1,
                });
                pageCount += 1;

                if (postsArtifacts) {
                    const extraPages = [
                        ...postsArtifacts.extraListingPages,
                        ...postsArtifacts.tagArchivePages,
                    ];
                    extraPages.forEach((page) => {
                        buildAndWritePage(template, page.outputPath, {
                            siteConfig,
                            sidebarData,
                            postsMdPath: PATHS.postsMd,
                            contentHTML: marked.parse(page.html),
                            metadata: page.metadata,
                            activeNav: 'posts',
                            canonicalPath: page.canonicalPath,
                            pageDepth: page.pageDepth,
                        });
                        pageCount += 1;
                    });
                }
            }
        }

        if (fs.existsSync(PATHS.content)) {
            fs.readdirSync(PATHS.content).forEach((file) => {
                if (!file.endsWith('.md')) return;
                if (file === 'home.md' || file === 'posts.md' || file === 'posts-intro.md') return;
                if (skipRMd && file === 'r.md') return;

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
        writeDeliverReadme(deliverRoot);
    } catch (error) {
        console.error('Error building site:', error.message);
        process.exit(1);
    }
}

/**
 * Explains that the build output folder is a complete static bundle (upload as-is).
 */
function writeDeliverReadme(deliverRoot) {
    const text = [
        'Gorky build output — self-contained static site',
        '',
        'Upload this entire folder to your web host (as the site root, or match baseUrl in site-config.js if you use a subpath).',
        '',
        'Included:',
        '  - HTML pages (index, posts/, post/*/, custom pages, r/* short links if configured)',
        '  - styles/   — copy of your project styles/',
        '  - content/  — copy of non-markdown files from your project content/ (e.g. images)',
        '  - favicon.ico / apple-touch-icon.png — if present at project root when built',
        '',
        'Markdown sources stay outside this folder. Run gorky build again after editing content.',
        '',
    ].join('\n');

    fs.writeFileSync(path.join(deliverRoot, 'README.txt'), text, 'utf8');
}

module.exports = {
    buildSite,
};
