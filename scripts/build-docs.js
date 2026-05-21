// ============================================================================
// BUILD-DOCS.JS
//
// Builds the showcase site from docs/ (outputDir: '' in docs/gorky.config.js writes into
// docs/ for GitHub Pages publishing from the /docs folder).
// the docs site always matches the shipped template CSS. Other docs sources
// (content, base.html, site-config.js, gorky.config.js) stay edited under docs/.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { buildSite } = require('../lib/build');
const { loadConfig } = require('../lib/config');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

/**
 * Recursive copy (Node 12+ compatible).
 */
function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
        const from = path.join(src, ent.name);
        const to = path.join(dest, ent.name);
        if (ent.isDirectory()) {
            copyDirRecursive(from, to);
        } else if (ent.isFile()) {
            fs.copyFileSync(from, to);
        }
    }
}

/**
 * Remove files and directories under destRoot that are not present under srcRoot
 * at the same relative path (keeps docs/styles a mirror of template/styles).
 */
function pruneMissing(srcRoot, destRoot) {
    if (!fs.existsSync(destRoot)) return;
    for (const ent of fs.readdirSync(destRoot, { withFileTypes: true })) {
        const destPath = path.join(destRoot, ent.name);
        const srcPath = path.join(srcRoot, ent.name);
        if (!fs.existsSync(srcPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
            continue;
        }
        if (ent.isDirectory()) {
            pruneMissing(srcPath, destPath);
        }
    }
}

function syncTemplateStylesToDocs() {
    const src = path.join(rootDir, 'template', 'styles');
    const dest = path.join(docsDir, 'styles');
    if (!fs.existsSync(src)) {
        console.error('Error: template/styles not found');
        process.exit(1);
    }
    copyDirRecursive(src, dest);
    pruneMissing(src, dest);
    console.log('✓ Synced template/styles → docs/styles');
}

if (!fs.existsSync(docsDir)) {
    console.error('Error: docs directory not found');
    process.exit(1);
}

const config = loadConfig(docsDir);

console.log('Building docs site...');
syncTemplateStylesToDocs();
buildSite({
    ...config,
    cwd: docsDir,
}).catch((error) => {
    console.error('Error building docs site:', error.message);
    process.exit(1);
});

console.log('\n✓ Docs site built successfully!');
const outDir = config.outputDir ?? 'deliver';
const outputMsg =
  outDir === '' || outDir === '.'
    ? '  Output: docs/ (site root — same folder as gorky.config.js)'
    : `  Output: docs/${outDir}/`;
console.log(outputMsg);
console.log('  Ready for GitHub Pages deployment from /docs folder');
