// ============================================================================
// BUILD-PACKAGE.JS
//
// Syncs template/ into docs/ and builds the showcase site.
// template/ is the canonical starter kit and shared asset source.
// ============================================================================

const { execSync } = require('child_process');
const path = require('path');

const scriptsDir = __dirname;

console.log('Building package files...\n');

try {
    console.log('Building docs site (syncs from template/)...');
    execSync('node build-docs.js', {
        cwd: scriptsDir,
        stdio: 'inherit',
    });

    console.log('\n✓ Package build completed successfully!');
} catch (error) {
    console.error('\n✗ Package build failed');
    process.exit(1);
}
