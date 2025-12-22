// ============================================================================
// BUILD-TEMPLATE.JS
//
// Syncs root/index-template.html to templates/index-template.html
// This ensures the template used by gorky init stays in sync with the root template
// ============================================================================

const fs = require('fs');
const path = require('path');

const rootTemplate = path.join(__dirname, '..', 'index-template.html');
const templatesDir = path.join(__dirname, '..', 'templates');
const templatesTemplate = path.join(templatesDir, 'index-template.html');

// Check if root template exists
if (!fs.existsSync(rootTemplate)) {
    console.error('Error: root/index-template.html not found');
    process.exit(1);
}

// Ensure templates directory exists
if (!fs.existsSync(templatesDir)) {
    console.error('Error: templates directory not found');
    process.exit(1);
}

// Copy root template to templates
fs.copyFileSync(rootTemplate, templatesTemplate);
console.log('✓ Synced index-template.html from root to templates/');

console.log('\n✓ Template sync completed successfully!');

