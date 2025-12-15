// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
 * Checks if a target is a URL parameter (internal navigation)
 */
function isURLParameter(target) {
    return target.startsWith('?');
}

module.exports = { formatDate, isURLParameter };

