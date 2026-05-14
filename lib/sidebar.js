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
const { normalizeNavTarget, resolveSitePath } = require('./routes');

// ============================================================================
// SIDEBAR GENERATION
// ============================================================================

/**
 * Checks whether a nav item should be marked active
 * @param {Object} config
 * @param {string|null} activeNav
 * @returns {boolean}
 */
function isNavItemActive(config, activeNav) {
    if (!activeNav || !isURLParameter(config.target)) {
        return false;
    }

    const normalized = normalizeNavTarget(config.target);

    if (activeNav === 'home') {
        return normalized === './';
    }
    if (activeNav === 'posts') {
        return normalized === 'posts/';
    }

    return normalized === `${activeNav}/`;
}

/**
 * Generates HTML for a single navigation item
 */
function generateNavItem(label, config, isActive = false, rootPrefix = '') {
    const emojiMatch = label.match(/^([^\s]+)\s+(.+)$/);
    let emoji = '';
    let text = label;

    if (emojiMatch) {
        const potentialEmoji = emojiMatch[1];
        const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
        if (emojiPattern.test(potentialEmoji)) {
            emoji = potentialEmoji;
            text = emojiMatch[2];
        }
    }

    const activeClass = isActive ? ' active' : '';
    const isURLParam = isURLParameter(config.target);
    const hrefValue = isURLParam
        ? resolveSitePath(rootPrefix, normalizeNavTarget(config.target))
        : config.target;
    const TARGET_BLANK = ' target="_blank" rel="noopener noreferrer"';
    const targetAttr = config.openInNewTab ? TARGET_BLANK : '';

    let itemHTML = `<a href="${hrefValue}" class="nav-link${activeClass}"${targetAttr}>\n`;
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
 * @param {string|null} activeNav - Active page identifier
 * @returns {string} Main nav HTML string
 */
function generateMainNav(sidebarData, postsMdPath, activeNav = null, rootPrefix = '') {
    let mainNavHTML = '';

    const defaults = sidebarData._defaults || {};
    const homeDisplayName = defaults.homeDisplayName || '🏠 Home';
    const postsDisplayName = defaults.postsDisplayName || '✍️ Posts';

    const homeConfig = {
        target: '?page=home',
        openInNewTab: false,
    };
    mainNavHTML += generateNavItem(homeDisplayName, homeConfig, activeNav === 'home', rootPrefix);

    if (fs.existsSync(postsMdPath)) {
        const postsConfig = {
            target: '?page=posts',
            openInNewTab: false,
        };
        mainNavHTML += generateNavItem(postsDisplayName, postsConfig, activeNav === 'posts', rootPrefix);
    }

    return mainNavHTML;
}

/**
 * Generates sidebar navigation HTML from JSON (scrollable sections)
 * @param {Object} sidebarData - Sidebar configuration data
 * @param {string|null} activeNav - Active page identifier
 * @returns {string} Navigation HTML string
 */
function generateSidebarNav(sidebarData, activeNav = null, rootPrefix = '') {
    let navHTML = '';

    Object.entries(sidebarData).forEach(([sectionName, items]) => {
        if (sectionName === '_defaults') {
            return;
        }

        navHTML += `<div class="sidebar-section">\n`;
        navHTML += `    <h3 class="section-title">${sectionName}</h3>\n`;
        navHTML += `    <ul class="section-list">\n`;

        Object.entries(items).forEach(([label, config]) => {
            navHTML += `        <li>\n`;
            const itemHTML = generateNavItem(label, config, isNavItemActive(config, activeNav), rootPrefix);
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
function generateSidebarFooter(sidebarData, rootPrefix = '') {
    const defaults = sidebarData._defaults || {};
    const footer = defaults.footer;

    if (!footer || !Array.isArray(footer) || footer.length === 0) {
        return '';
    }

    let footerHTML = `<div class="sidebar-footer">\n`;
    footer.forEach((item) => {
        if (item.target) {
            const isURLParam = isURLParameter(item.target);
            const hrefValue = isURLParam
                ? resolveSitePath(rootPrefix, normalizeNavTarget(item.target))
                : item.target;
            const TARGET_BLANK = ' target="_blank" rel="noopener noreferrer"';
            const targetAttr = item.openInNewTab ? TARGET_BLANK : '';

            footerHTML += `    <a href="${hrefValue}" class="footer-link"${targetAttr}>${item.text}</a>\n`;
        } else {
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
