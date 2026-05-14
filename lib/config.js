// ============================================================================
// CONFIG.JS
//
// This file handles loading configuration from gorky.config.js or defaults
// ============================================================================

const fs = require('fs');
const path = require('path');

/**
 * Loads configuration from gorky.config.js or returns defaults
 * @param {string} cwd - Current working directory
 * @returns {Object} Configuration object
 */
function loadConfig(cwd = process.cwd()) {
    const configPath = path.join(cwd, 'gorky.config.js');
    
    // Default configuration
    const defaults = {
        contentDir: 'content',
        outputDir: 'deliver',
        outputFile: 'index.html',
        templateFile: 'index-template.html',
        stylesDir: 'styles'
    };
    
    // Try to load config file
    if (fs.existsSync(configPath)) {
        try {
            const userConfig = require(configPath);
            return { ...defaults, ...userConfig };
        } catch (error) {
            console.warn(`Warning: Could not load gorky.config.js: ${error.message}`);
            console.warn('Using default configuration.');
        }
    }
    
    return defaults;
}

module.exports = {
    loadConfig,
};

