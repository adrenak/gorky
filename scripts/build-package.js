// ============================================================================
// BUILD-PACKAGE.JS
//
// Runs both build-template.js and build-docs.js to sync all package files
// This ensures templates and docs stay in sync with _base
// ============================================================================

const { execSync } = require('child_process');
const path = require('path');

const scriptsDir = __dirname;

console.log('Building package files...\n');

try {
    // Run build-template.js first (syncs _base to template/)
    console.log('1. Syncing template files...');
    execSync('node build-template.js', {
        cwd: scriptsDir,
        stdio: 'inherit'
    });
    
    console.log('\n2. Building docs site...');
    // Then run build-docs.js (syncs _base to docs/ and builds docs)
    execSync('node build-docs.js', {
        cwd: scriptsDir,
        stdio: 'inherit'
    });
    
    console.log('\n✓ Package build completed successfully!');
} catch (error) {
    console.error('\n✗ Package build failed');
    process.exit(1);
}

