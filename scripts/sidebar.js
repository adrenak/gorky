const { isURLParameter } = require('./utils');

// ============================================================================
// SIDEBAR GENERATION
// ============================================================================

/**
 * Generates HTML for a single navigation item
 */
function generateNavItem(label, config, isActive = false) {
    // Extract emoji and text from label (e.g., "🏠 Home" -> emoji: "🏠", text: "Home")
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    const emoji = emojiMatch ? emojiMatch[1] : '';
    const text = emojiMatch ? emojiMatch[2] : label;
    
    const activeClass = isActive ? ' active' : '';
    const isURLParam = isURLParameter(config.target);
    const isInternal = isURLParam && !config.openInNewTab;
    
    const targetAttr = config.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const dataURLAttr = isInternal ? ` data-url="${config.target}"` : '';
    const hrefValue = isInternal ? '#' : config.target;
    
    let itemHTML = `<a href="${hrefValue}" class="nav-link${activeClass}"${targetAttr}${dataURLAttr}>\n`;
    if (emoji) {
        itemHTML += `    <span class="nav-icon">${emoji}</span>\n`;
    }
    itemHTML += `    <span>${text}</span>\n`;
    if (config.openInNewTab && !isURLParam) {
        itemHTML += `    <span class="external-icon">↗</span>\n`;
    }
    itemHTML += `</a>\n`;
    
    return itemHTML;
}

/**
 * Generates sidebar navigation HTML from JSON
 */
function generateSidebarNav(sidebarData) {
    let navHTML = '';
    let isFirstRootItem = true;
    
    Object.entries(sidebarData).forEach(([sectionName, items]) => {
        if (sectionName === '') {
            // Root navigation items
            Object.entries(items).forEach(([label, config]) => {
                if (config.target === '#' || config.target === '') {
                    config.target = '?page=home';
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

module.exports = {
    generateNavItem,
    generateSidebarNav,
};

