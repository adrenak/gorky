// ============================================================================
// BUILD-TEMPLATE.JS
//
// Syncs _base/index-template.html to template/index-template.html
// This ensures the template used by gorky init stays in sync with the base template
// ============================================================================

const fs = require('fs');
const path = require('path');

const baseTemplate = path.join(__dirname, '..', '_base', 'index-template.html');
const templateDir = path.join(__dirname, '..', 'template');
const templateFile = path.join(templateDir, 'index-template.html');

// Check if base template exists
if (!fs.existsSync(baseTemplate)) {
    console.error('Error: _base/index-template.html not found');
    process.exit(1);
}

// Ensure template directory exists
if (!fs.existsSync(templateDir)) {
    console.error('Error: template directory not found');
    process.exit(1);
}

// Copy base template to template
fs.copyFileSync(baseTemplate, templateFile);
console.log('✓ Synced index-template.html from _base to template/');

console.log('\n✓ Template sync completed successfully!');

