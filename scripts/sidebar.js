// ============================================================================
// SIDEBAR.JS
//
// This file generates HTML for the sidebar navigation:
//
//   - generateNavItem: Generates HTML for a single navigation item
//   - generateMainNav: Generates main navigation (Home and Posts links)
//   - generateSidebarNav: Generates sidebar navigation sections from JSON
//   - generateSidebarFooter: Generates sidebar footer from JSON
//
// Used by: build.js
// ============================================================================

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
    // Only treat as emoji if the first group contains emoji characters
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    let emoji = '';
    let text = label;
    
    if (emojiMatch) {
        const potentialEmoji = emojiMatch[1];
        // Check if it's actually an emoji (contains emoji Unicode ranges or common emoji characters)
        const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
        if (emojiPattern.test(potentialEmoji)) {
            emoji = potentialEmoji;
            text = emojiMatch[2];
        }
    }
    
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
 * Generates main navigation (Home and Posts) HTML
 * @param {Object} sidebarData - Sidebar configuration data
 * @param {string} postsMdPath - Path to posts.md file to check if it exists
 * @returns {string} Main nav HTML string
 */
function generateMainNav(sidebarData, postsMdPath) {
    let mainNavHTML = '';
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
    mainNavHTML += generateNavItem(homeDisplayName, homeConfig, isFirstRootItem);
    isFirstRootItem = false;
    
    // Generate Posts link only if posts.md exists
    if (fs.existsSync(postsMdPath)) {
        const postsConfig = {
            target: '?page=posts',
            openInNewTab: false
        };
        mainNavHTML += generateNavItem(postsDisplayName, postsConfig, isFirstRootItem);
        isFirstRootItem = false;
    }
    
    return mainNavHTML;
}

/**
 * Generates sidebar navigation HTML from JSON (scrollable sections)
 * @param {Object} sidebarData - Sidebar configuration data
 * @returns {string} Navigation HTML string
 */
function generateSidebarNav(sidebarData) {
    let navHTML = '';
    
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

/**
 * Generates sidebar header HTML from JSON
 * @param {Object} sidebarData - Sidebar configuration data
 * @returns {string} Header HTML string
 */
function generateSidebarHeader(sidebarData) {
    const defaults = sidebarData._defaults || {};
    const headerText = defaults.header || 'gorky';
    return `<h1>${headerText}</h1>`;
}

/**
 * Generates sidebar footer HTML from JSON
 * @param {Object} sidebarData - Sidebar configuration data
 * @returns {string} Footer HTML string
 */
function generateSidebarFooter(sidebarData) {
    const defaults = sidebarData._defaults || {};
    const footer = defaults.footer;
    
    if (!footer || !Array.isArray(footer) || footer.length === 0) {
        return '';
    }
    
    let footerHTML = `<div class="sidebar-footer">\n`;
    footer.forEach((item) => {
        if (item.target) {
            // Footer item with link
            const isURLParam = isURLParameter(item.target);
            const isInternal = isURLParam && !item.openInNewTab;
            const TARGET_BLANK = ' target="_blank" rel="noopener noreferrer"';
            const targetAttr = item.openInNewTab ? TARGET_BLANK : '';
            const dataURLAttr = isInternal ? ` data-url="${item.target}"` : '';
            const hrefValue = isInternal ? '#' : item.target;
            
            footerHTML += `    <a href="${hrefValue}" class="footer-link"${targetAttr}${dataURLAttr}>${item.text}</a>\n`;
        } else {
            // Footer item as plain text
            footerHTML += `    <span class="footer-text">${item.text}</span>\n`;
        }
    });
    footerHTML += `</div>\n`;
    
    return footerHTML;
}

module.exports = {
    generateNavItem,
    generateMainNav,
    generateSidebarNav,
    generateSidebarHeader,
    generateSidebarFooter,
};

