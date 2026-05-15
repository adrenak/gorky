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
    const templateDir = path.join(packageDir, 'template');
    
    // Create directory structure
    const dirs = [
        targetDir,
        path.join(targetDir, 'deliver'),
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
    
    // Copy template files (project root)
    const filesToCopy = [
        { from: 'base.html', to: 'base.html' },
        { from: 'site-config.js', to: 'site-config.js' },
        { from: 'gorky.config.js.template', to: 'gorky.config.js' }
    ];
    
    filesToCopy.forEach(({ from, to }) => {
        const source = path.join(templateDir, from);
        const dest = path.join(targetDir, to);
        
        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            console.log(`✓ Created ${to}`);
        } else {
            console.warn(`⚠️  Template file not found: ${from}`);
        }
    });
    
    // Copy styles directory from template
    const templateStylesDir = path.join(templateDir, 'styles');
    if (fs.existsSync(templateStylesDir)) {
        copyDirectory(templateStylesDir, path.join(targetDir, 'styles'));
        console.log('✓ Created styles directory');
    }

    // Copy content/ tree (pages, posts-intro, example posts, images, etc.)
    const templateContentDir = path.join(templateDir, 'content');
    if (fs.existsSync(templateContentDir)) {
        copyDirectory(templateContentDir, path.join(targetDir, 'content'));
        console.log('✓ Created content/ from template');
    }
    
    // Copy GitHub Actions workflows
    const githubWorkflowsTemplateDir = path.join(templateDir, '.github', 'workflows');
    const githubWorkflowsTargetDir = path.join(targetDir, '.github', 'workflows');
    if (fs.existsSync(githubWorkflowsTemplateDir)) {
        copyDirectory(githubWorkflowsTemplateDir, githubWorkflowsTargetDir);
        console.log('✓ Created GitHub Actions workflow');
    }
    
    console.log(`\n✓ Gorky site initialized in ${targetDir}`);
    console.log('\nNext steps:');
    console.log('  1. Edit site-config.js to configure site settings and navigation');
    console.log('  2. Customize pages under content/ (e.g. home.md, getstarted.md, customization.md)');
    console.log('  3. Add your own posts to content/posts/ (example posts included)');
    console.log('  4. Run: gorky build (or configure a build script in your own package.json)');
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

