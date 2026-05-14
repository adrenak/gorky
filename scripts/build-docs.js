// ============================================================================
// BUILD-DOCS.JS
//
// Syncs shared files from template/ into docs/, then builds the showcase site.
// template/ is the single source of truth for styles, HTML shell, and shared
// markdown pages. docs/ keeps its own site-config, posts, and images.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { buildSite } = require('../lib/build');
const { loadConfig } = require('../lib/config');

const rootDir = path.join(__dirname, '..');
const templateDir = path.join(rootDir, 'template');
const docsDir = path.join(rootDir, 'docs');

if (!fs.existsSync(docsDir)) {
    console.error('Error: docs directory not found');
    process.exit(1);
}

if (!fs.existsSync(templateDir)) {
    console.error('Error: template directory not found');
    process.exit(1);
}

const config = loadConfig(docsDir);

// Shared assets: template → docs
replaceDirectory(
    path.join(templateDir, 'styles'),
    path.join(docsDir, 'styles')
);
console.log('✓ Synced styles from template/ to docs/');

fs.copyFileSync(
    path.join(templateDir, 'index-template.html'),
    path.join(docsDir, 'index-template.html')
);
console.log('✓ Synced index-template.html from template/ to docs/');

// Shared markdown pages: template → docs/content
const sharedPages = ['home.md', 'getstarted.md', 'customization.md'];
sharedPages.forEach((file) => {
    const src = path.join(templateDir, file);
    const dest = path.join(docsDir, 'content', file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Synced content/${file} from template/`);
    }
});

console.log('Building docs site...');
buildSite({
    ...config,
    cwd: docsDir,
});

console.log('\n✓ Docs site built successfully!');
console.log(`  Output: docs/${config.outputDir || 'deliver'}/`);
console.log('  Ready for GitHub Pages deployment from /docs folder');

function replaceDirectory(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`⚠️  ${src} not found`);
        return;
    }

    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    }

    copyDirectory(src, dest);
}

function copyDirectory(src, dest) {
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
