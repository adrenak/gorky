// ============================================================================
// INIT.JS
//
// This file handles initializing a new Gorky project
// ============================================================================

const fs = require('fs');
const path = require('path');

/**
 * Initializes a new Gorky project
 * @param {string} targetDir - Target directory for the new project
 */
function initProject(targetDir) {
    const packageDir = path.dirname(require.resolve('../package.json'));
    const templatesDir = path.join(packageDir, 'templates');
    const stylesDir = path.join(packageDir, 'styles');
    
    // Create directory structure
    const dirs = [
        targetDir,
        path.join(targetDir, 'content'),
        path.join(targetDir, 'content', 'posts'),
        path.join(targetDir, 'content', 'images'),
        path.join(targetDir, 'styles')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    // Copy template files
    const filesToCopy = [
        { from: 'index-template.html', to: 'index-template.html' },
        { from: 'sidebar.json', to: 'content/sidebar.json' },
        { from: 'home.md', to: 'content/home.md' },
        { from: 'getstarted.md', to: 'content/getstarted.md' },
        { from: 'customization.md', to: 'content/customization.md' },
        { from: 'package.json.template', to: 'package.json' },
        { from: 'README.md.template', to: 'README.md' },
        { from: '.gitignore.template', to: '.gitignore' },
        { from: 'gorky.config.js.template', to: 'gorky.config.js' }
    ];
    
    filesToCopy.forEach(({ from, to }) => {
        const source = path.join(templatesDir, from);
        const dest = path.join(targetDir, to);
        
        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            console.log(`✓ Created ${to}`);
        } else {
            console.warn(`⚠️  Template file not found: ${from}`);
        }
    });
    
    // Copy styles directory
    if (fs.existsSync(stylesDir)) {
        copyDirectory(stylesDir, path.join(targetDir, 'styles'));
        console.log('✓ Created styles directory');
    }
    
    // Copy example posts
    const postsTemplateDir = path.join(templatesDir, 'posts');
    const postsTargetDir = path.join(targetDir, 'content', 'posts');
    if (fs.existsSync(postsTemplateDir)) {
        copyDirectory(postsTemplateDir, postsTargetDir);
        console.log('✓ Created example posts');
    }
    
    // Copy example images
    const imagesTemplateDir = path.join(templatesDir, 'images');
    const imagesTargetDir = path.join(targetDir, 'content', 'images');
    if (fs.existsSync(imagesTemplateDir)) {
        copyDirectory(imagesTemplateDir, imagesTargetDir);
        console.log('✓ Created example images');
    }
    
    console.log(`\n✓ Gorky site initialized in ${targetDir}`);
    console.log('\nNext steps:');
    console.log('  1. Edit content/sidebar.json to configure navigation');
    console.log('  2. Edit index-template.html and update SITE_CONFIG');
    console.log('  3. Customize content/home.md, content/getstarted.md, and content/customization.md');
    console.log('  4. Add your own posts to content/posts/ (example posts included)');
    console.log('  5. Run: gorky build');
}

/**
 * Recursively copies a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
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

module.exports = {
    initProject,
};

