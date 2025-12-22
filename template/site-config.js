// Site Configuration
// This file contains site-specific configuration values
// Copy this to your project root and customize the values

module.exports = {
    baseUrl: 'https://yourusername.github.io/your-repo',
    siteName: 'My Site',
    authorName: 'Your Name',
    defaultDescription: 'A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
    defaultKeywords: 'blog, website, markdown, static site',
    favicon: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png',
    
    // GoatCounter Analytics Configuration
    goatCounterEnabled: false,
    goatCounterCode: 'yourcode',
    allowLocal: false,
    allowFrame: false,
    noOnload: false,
    
    // Sidebar Configuration
    sidebar: {
        // Sidebar header text (displayed at top of sidebar)
        header: 'My Site',
        
        // Display names for main navigation items
        homeDisplayName: '🏠 Home',
        postsDisplayName: '✍️ Posts',
        
        // Sidebar footer items (array of text items or links)
        footer: [
            {
                text: '2025 © Your Name',
                target: 'https://yoursite.com'
            }
        ],
        
        // Navigation sections (object where keys are section titles, values are navigation items)
        // Navigation items: { label: { target: 'url', openInNewTab: boolean } }
        sections: {
            // Empty section name creates items without a section header
            '': {
                '📝 About': {
                    target: '?page=about',
                    openInNewTab: false
                }
            },
            'Links': {
                'GitHub': {
                    target: 'https://github.com/yourusername',
                    openInNewTab: true
                }
            }
        }
    }
};

