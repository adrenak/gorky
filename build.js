const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// File paths
const markdownPath = path.join(__dirname, 'home.md');
const sidebarPath = path.join(__dirname, 'sidebar.json');
const templatePath = path.join(__dirname, 'index-template.html');
const outputPath = path.join(__dirname, 'index.html');

// Function to generate sidebar navigation HTML from JSON
function generateSidebarNav(sidebarData) {
    const items = Object.entries(sidebarData);
    let navHTML = '';
    let isFirst = true;
    
    items.forEach(([label, config]) => {
        // Extract emoji and text from label (e.g., "🏠 Home" -> emoji: "🏠", text: "Home")
        const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
        const emoji = emojiMatch ? emojiMatch[1] : '';
        const text = emojiMatch ? emojiMatch[2] : label;
        
        // Determine if this is the active link (first one by default)
        const activeClass = isFirst ? ' active' : '';
        isFirst = false;
        
        // Build target attribute
        const targetAttr = config.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        
        // Generate HTML for this nav item
        navHTML += `<a href="${config.target}" class="nav-link${activeClass}"${targetAttr}>\n`;
        navHTML += `    <span class="nav-icon">${emoji}</span>\n`;
        navHTML += `    <span>${text}</span>\n`;
        if (config.openInNewTab) {
            navHTML += `    <span class="external-icon">↗</span>\n`;
        }
        navHTML += `</a>\n`;
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

