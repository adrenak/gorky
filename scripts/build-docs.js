// ============================================================================
// BUILD-DOCS.JS
//
// Builds the showcase site directly in docs/ folder
// ============================================================================

const fs = require('fs');
const path = require('path');
const { buildSite } = require('../lib/build');
const { loadConfig } = require('../lib/config');

const docsDir = path.join(__dirname, '..', 'docs');

// Check if docs exists
if (!fs.existsSync(docsDir)) {
    console.error('Error: docs directory not found');
    process.exit(1);
}

// Load config from docs
const config = loadConfig(docsDir);

// Always sync styles from root to docs (ensures they stay in sync)
const packageStyles = path.join(__dirname, '..', 'styles');
const docsStyles = path.join(docsDir, 'styles');

if (fs.existsSync(packageStyles)) {
    copyDirectory(packageStyles, docsStyles);
    console.log('✓ Synced styles from root to docs/');
} else {
    console.warn('⚠️  Root styles directory not found');
}

// Always sync template from templates to docs (ensures it stays in sync)
const packageTemplate = path.join(__dirname, '..', 'templates', 'index-template.html');
const docsTemplate = path.join(docsDir, 'index-template.html');

if (fs.existsSync(packageTemplate)) {
    fs.copyFileSync(packageTemplate, docsTemplate);
    console.log('✓ Synced index-template.html from templates to docs/');
} else {
    console.warn('⚠️  Template file not found');
}

// Build the site directly in docs/
console.log('Building docs site...');
buildSite({
    ...config,
    cwd: docsDir
});

console.log('\n✓ Docs site built successfully!');
console.log('  Output: docs/index.html');
console.log('  Ready for GitHub Pages deployment from /docs folder');

/**
 * Recursively copies a directory
 */
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}
