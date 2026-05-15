// ============================================================================
// BUILD-DOCS.JS
//
// Builds the showcase site from docs/ into docs/deliver/ (or outputDir in
// gorky.config.js). Does not modify docs/styles, docs/content, base.html,
// site-config.js, or gorky.config.js — keep those under version control in docs/.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { buildSite } = require('../lib/build');
const { loadConfig } = require('../lib/config');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

if (!fs.existsSync(docsDir)) {
    console.error('Error: docs directory not found');
    process.exit(1);
}

const config = loadConfig(docsDir);

console.log('Building docs site...');
buildSite({
    ...config,
    cwd: docsDir,
});

console.log('\n✓ Docs site built successfully!');
console.log(`  Output: docs/${config.outputDir || 'deliver'}/`);
console.log('  Ready for GitHub Pages deployment from /docs folder');
