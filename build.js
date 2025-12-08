const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// File paths
const markdownPath = path.join(__dirname, 'home.md');
const sidebarPath = path.join(__dirname, 'sidebar.json');
const templatePath = path.join(__dirname, 'index-template.html');
const outputPath = path.join(__dirname, 'index.html');

// Function to check if a target is a markdown file
function isMarkdownFile(target) {
    return target.endsWith('.md') && !target.startsWith('http');
}

// Function to generate a single nav item HTML
function generateNavItem(label, config, isActive = false) {
    // Extract emoji and text from label (e.g., "🏠 Home" -> emoji: "🏠", text: "Home")
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    const emoji = emojiMatch ? emojiMatch[1] : '';
    const text = emojiMatch ? emojiMatch[2] : label;
    
    // Determine if this is the active link
    const activeClass = isActive ? ' active' : '';
    
    // Check if it's a markdown file (internal content switch)
    const isMarkdown = isMarkdownFile(config.target);
    
    // Build target attribute - only for external links
    const targetAttr = (!isMarkdown && config.openInNewTab) ? ' target="_blank" rel="noopener noreferrer"' : '';
    
    // Build data attribute for content switching
    const dataAttr = isMarkdown ? ` data-content="${config.target}"` : '';
    
    // Generate HTML for this nav item
    let itemHTML = `<a href="${isMarkdown ? '#' : config.target}" class="nav-link${activeClass}"${targetAttr}${dataAttr}>\n`;
    if (emoji) {
        itemHTML += `    <span class="nav-icon">${emoji}</span>\n`;
    }
    itemHTML += `    <span>${text}</span>\n`;
    // Only show external icon for non-markdown external links
    if (!isMarkdown && config.openInNewTab) {
        itemHTML += `    <span class="external-icon">↗</span>\n`;
    }
    itemHTML += `</a>\n`;
    
    return itemHTML;
}

// Function to generate sidebar navigation HTML from JSON
function generateSidebarNav(sidebarData) {
    let navHTML = '';
    let isFirstRootItem = true;
    
    // Process sections in order
    Object.entries(sidebarData).forEach(([sectionName, items]) => {
        if (sectionName === '') {
            // Root navigation items (no section header)
            Object.entries(items).forEach(([label, config]) => {
                // If target is "#" or empty, treat as home.md
                if (config.target === '#' || config.target === '') {
                    config.target = 'home.md';
                }
                navHTML += generateNavItem(label, config, isFirstRootItem);
                isFirstRootItem = false;
            });
        } else {
            // Section with header
            navHTML += `<div class="sidebar-section">\n`;
            navHTML += `    <h3 class="section-title">${sectionName}</h3>\n`;
            navHTML += `    <ul class="section-list">\n`;
            
            Object.entries(items).forEach(([label, config]) => {
                navHTML += `        <li>\n`;
                // Indent the nav item HTML
                const itemHTML = generateNavItem(label, config, false);
                navHTML += itemHTML.split('\n').map(line => line ? `            ${line}` : line).join('\n');
                navHTML += `        </li>\n`;
            });
            
            navHTML += `    </ul>\n`;
            navHTML += `</div>\n`;
        }
    });
    
    return navHTML;
}

// Function to collect all markdown files referenced in sidebar
function collectMarkdownFiles(sidebarData) {
    const markdownFiles = new Map();
    
    // Default home.md
    markdownFiles.set('home.md', 'home.md');
    
    // Traverse sidebar data to find all .md files
    Object.values(sidebarData).forEach(items => {
        Object.values(items).forEach(config => {
            if (isMarkdownFile(config.target)) {
                markdownFiles.set(config.target, config.target);
            }
        });
    });
    
    return markdownFiles;
}

// Function to generate content sections for all markdown files
function generateContentSections(markdownFiles, defaultFile = 'home.md') {
    let contentHTML = '';
    
    markdownFiles.forEach((filePath, key) => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const markdown = fs.readFileSync(fullPath, 'utf8');
                const htmlContent = marked.parse(markdown);
                const isDefault = filePath === defaultFile;
                const displayStyle = isDefault ? 'block' : 'none';
                contentHTML += `<div id="content-${key.replace(/\./g, '-')}" class="content-section" style="display: ${displayStyle};">\n`;
                contentHTML += htmlContent;
                contentHTML += `</div>\n`;
            }
        } catch (error) {
            console.warn(`Warning: Could not load ${filePath}:`, error.message);
        }
    });
    
    return contentHTML;
}

try {
    // Read sidebar JSON
    const sidebarData = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'));
    
    // Generate sidebar navigation HTML
    const sidebarNavHTML = generateSidebarNav(sidebarData);
    
    // Collect all markdown files referenced in sidebar
    const markdownFiles = collectMarkdownFiles(sidebarData);
    
    // Generate content sections for all markdown files
    const contentHTML = generateContentSections(markdownFiles, 'home.md');
    
    // Read template
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace('{{SIDEBAR_NAV}}', sidebarNavHTML);
    template = template.replace('{{MARKDOWN_CONTENT}}', contentHTML);
    
    // Write output
    fs.writeFileSync(outputPath, template, 'utf8');
    
    console.log('✓ Successfully generated index.html from markdown files and sidebar.json');
} catch (error) {
    console.error('Error building HTML:', error.message);
    process.exit(1);
}

