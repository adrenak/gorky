// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Formats date from "2025-12-8" to "8 Dec 2025"
 * @param {string|Date|any} dateString - Date string in format "YYYY-M-D" or "YYYY-MM-DD", or a Date object
 * @returns {string|null} Formatted date string or null if invalid
 */
function formatDate(dateString) {
    if (!dateString) return null;
    
    // Convert to string if it's not already
    let dateStr = typeof dateString === 'string' ? dateString : String(dateString);
    
    // If it's a Date object, extract the date components
    if (dateString instanceof Date) {
        const year = dateString.getFullYear();
        const month = dateString.getMonth() + 1;
        const day = dateString.getDate();
        dateStr = `${year}-${month}-${day}`;
    }
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12) return null;
    
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Parses a date string for sorting
 * @param {string|Date|any} dateStr - Date string in format "YYYY-M-D" or "YYYY-MM-DD", or a Date object
 * @returns {Date} Parsed date object
 */
function parseDateForSorting(dateStr) {
    if (!dateStr) return new Date(0);
    
    // Handle Date objects directly
    if (dateStr instanceof Date) {
        return dateStr;
    }
    
    // Convert to string if it's not already
    const dateString = typeof dateStr === 'string' ? dateStr : String(dateStr);
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date(0);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date(0);
    
    return new Date(year, month, day);
}

/**
 * Converts a date to a string format (YYYY-MM-DD or YYYY-M-D)
 * @param {string|Date|any} dateValue - Date value to convert
 * @returns {string|null} Date string or null if invalid
 */
function dateToString(dateValue) {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date) {
        const year = dateValue.getFullYear();
        const month = dateValue.getMonth() + 1;
        const day = dateValue.getDate();
        return `${year}-${month}-${day}`;
    }
    
    if (typeof dateValue === 'string') {
        return dateValue;
    }
    
    return String(dateValue);
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Normalizes a file path to use forward slashes
 * @param {string} filePath - The file path to normalize
 * @returns {string} Normalized path with forward slashes
 */
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}

/**
 * Checks if a path is a post file
 * @param {string} filePath - The file path to check
 * @param {string} postsFolderPrefix - The prefix path for posts folder (e.g., 'user-content/posts/')
 * @returns {boolean} True if the path is a post file
 */
function isPostFile(filePath, postsFolderPrefix) {
    return normalizePath(filePath).startsWith(postsFolderPrefix);
}

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * Checks if a target is a URL parameter (internal navigation)
 * @param {string} target - The target URL to check
 * @returns {boolean} True if target starts with '?'
 */
function isURLParameter(target) {
    return target.startsWith('?');
}

// ============================================================================
// HTML UTILITIES
// ============================================================================

/**
 * Escapes HTML special characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Escapes a string for use in HTML attributes (specifically quotes)
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML attributes
 */
function escapeHtmlAttribute(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
}

module.exports = {
    // Date utilities
    formatDate,
    parseDateForSorting,
    dateToString,
    // Path utilities
    normalizePath,
    isPostFile,
    // URL utilities
    isURLParameter,
    // HTML utilities
    escapeHtml,
    escapeHtmlAttribute,
};

