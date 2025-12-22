// ============================================================================
// BUILD-TEMPLATE.JS
//
// Syncs _base/index-template.html to templates/index-template.html
// This ensures the template used by gorky init stays in sync with the base template
// ============================================================================

const fs = require('fs');
const path = require('path');

const baseTemplate = path.join(__dirname, '..', '_base', 'index-template.html');
const templatesDir = path.join(__dirname, '..', 'templates');
const templatesTemplate = path.join(templatesDir, 'index-template.html');

// Check if base template exists
if (!fs.existsSync(baseTemplate)) {
    console.error('Error: _base/index-template.html not found');
    process.exit(1);
}

// Ensure templates directory exists
if (!fs.existsSync(templatesDir)) {
    console.error('Error: templates directory not found');
    process.exit(1);
}

// Copy base template to templates
fs.copyFileSync(baseTemplate, templatesTemplate);
console.log('✓ Synced index-template.html from _base to templates/');

console.log('\n✓ Template sync completed successfully!');

