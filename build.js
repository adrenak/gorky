const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// File paths
const markdownPath = path.join(__dirname, 'home.md');
const sidebarPath = path.join(__dirname, 'sidebar.json');
const templatePath = path.join(__dirname, 'index-template.html');
const outputPath = path.join(__dirname, 'index.html');

// Function to generate a single nav item HTML
function generateNavItem(label, config, isActive = false) {
    // Extract emoji and text from label (e.g., "🏠 Home" -> emoji: "🏠", text: "Home")
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    const emoji = emojiMatch ? emojiMatch[1] : '';
    const text = emojiMatch ? emojiMatch[2] : label;
    
    // Determine if this is the active link
    const activeClass = isActive ? ' active' : '';
    
    // Build target attribute
    const targetAttr = config.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    
    // Generate HTML for this nav item
    let itemHTML = `<a href="${config.target}" class="nav-link${activeClass}"${targetAttr}>\n`;
    if (emoji) {
        itemHTML += `    <span class="nav-icon">${emoji}</span>\n`;
    }
    itemHTML += `    <span>${text}</span>\n`;
    if (config.openInNewTab) {
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

try {
    // Read sidebar JSON
    const sidebarData = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'));
    
    // Generate sidebar navigation HTML
    const sidebarNavHTML = generateSidebarNav(sidebarData);
    
    // Read markdown
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert to HTML using marked
    const htmlContent = marked.parse(markdown);
    
    // Read template
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace('{{SIDEBAR_NAV}}', sidebarNavHTML);
    template = template.replace('{{MARKDOWN_CONTENT}}', htmlContent);
    
    // Write output
    fs.writeFileSync(outputPath, template, 'utf8');
    
    console.log('✓ Successfully generated index.html from home.md and sidebar.json');
} catch (error) {
    console.error('Error building HTML:', error.message);
    process.exit(1);
}

