const fs = require('fs');
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
    
    const TARGET_BLANK = ' target="_blank" rel="noopener noreferrer"';
    const targetAttr = config.openInNewTab ? TARGET_BLANK : '';
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
 * @param {Object} sidebarData - Sidebar configuration data
 * @param {string} postsMdPath - Path to posts.md file to check if it exists
 */
function generateSidebarNav(sidebarData, postsMdPath) {
    let navHTML = '';
    let isFirstRootItem = true;
    
    // Extract defaults
    const defaults = sidebarData._defaults || {};
    const homeDisplayName = defaults.homeDisplayName || '🏠 Home';
    const postsDisplayName = defaults.postsDisplayName || '✍️ Posts';
    
    // Always generate Home link
    const homeConfig = {
        target: '?page=home',
        openInNewTab: false
    };
    navHTML += generateNavItem(homeDisplayName, homeConfig, isFirstRootItem);
    isFirstRootItem = false;
    
    // Generate Posts link only if posts.md exists
    if (fs.existsSync(postsMdPath)) {
        const postsConfig = {
            target: '?page=posts',
            openInNewTab: false
        };
        navHTML += generateNavItem(postsDisplayName, postsConfig, isFirstRootItem);
        isFirstRootItem = false;
    }
    
    // Process other sections (skip _defaults)
    Object.entries(sidebarData).forEach(([sectionName, items]) => {
        if (sectionName === '_defaults') {
            return; // Skip defaults section
        }
        
        // Section with header
        navHTML += `<div class="sidebar-section">\n`;
        navHTML += `    <h3 class="section-title">${sectionName}</h3>\n`;
        navHTML += `    <ul class="section-list">\n`;
        
        Object.entries(items).forEach(([label, config]) => {
            navHTML += `        <li>\n`;
            const itemHTML = generateNavItem(label, config, false);
            const indentedHTML = itemHTML.split('\n')
                .map(line => line ? `            ${line}` : line)
                .join('\n');
            navHTML += indentedHTML;
            navHTML += `        </li>\n`;
        });
        
        navHTML += `    </ul>\n`;
        navHTML += `</div>\n`;
    });
    
    return navHTML;
}

module.exports = {
    generateNavItem,
    generateSidebarNav,
};

