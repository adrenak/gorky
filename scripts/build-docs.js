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

// Always sync styles from _base to docs (ensures they stay in sync)
const baseStyles = path.join(__dirname, '..', '_base', 'styles');
const docsStyles = path.join(docsDir, 'styles');

if (fs.existsSync(baseStyles)) {
    copyDirectory(baseStyles, docsStyles);
    console.log('✓ Synced styles from _base to docs/');
} else {
    console.warn('⚠️  _base/styles directory not found');
}

// Always sync template from _base to docs (ensures it stays in sync)
const baseTemplate = path.join(__dirname, '..', '_base', 'index-template.html');
const docsTemplate = path.join(docsDir, 'index-template.html');

if (fs.existsSync(baseTemplate)) {
    fs.copyFileSync(baseTemplate, docsTemplate);
    console.log('✓ Synced index-template.html from _base to docs/');
} else {
    console.warn('⚠️  _base/index-template.html not found');
}

// Sync site-config.js template (but keep docs-specific one if it exists)
const packageSiteConfig = path.join(__dirname, '..', 'template', 'site-config.js');
const docsSiteConfig = path.join(docsDir, 'site-config.js');

// Only sync if docs doesn't have its own config (preserve docs-specific config)
if (!fs.existsSync(docsSiteConfig) && fs.existsSync(packageSiteConfig)) {
    fs.copyFileSync(packageSiteConfig, docsSiteConfig);
    console.log('✓ Synced site-config.js from template to docs/');
}

// Build the site directly in docs/
console.log('Building docs site...');
buildSite({
    ...config,
    cwd: docsDir
});

console.log('\n✓ Docs site built successfully!');
console.log(`  Output: docs/${config.outputDir || 'deliver'}/`);
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

