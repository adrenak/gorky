// Site Configuration for Gorky Documentation Site
module.exports = {
    baseUrl: 'https://adrenak.github.io/gorky',
    siteName: 'Gorky',
    authorName: 'Vatsal Ambastha',
    defaultDescription: 'Gorky - A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
    defaultKeywords: 'gorky, static site generator, markdown, blog, GitHub Pages, JAMstack, static website, markdown blog',
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
        header: 'Gorky',
        homeDisplayName: '🏠 Home',
        postsDisplayName: '✍️ Posts',
        footer: [
            {
                text: '2025 © Vatsal Ambastha',
                target: 'https://adrenak.github.io'
            },
            {
                text: 'GitHub',
                target: 'https://github.com/adrenak/gorky',
                openInNewTab: true
            }
        ],
        sections: {
            'Documentation': {
                'Get Started': {
                    target: '?page=getstarted',
                    openInNewTab: false
                },
                'Customization': {
                    target: '?page=customization',
                    openInNewTab: false
                }
            },
            'Links': {
                'GitHub': {
                    target: 'https://github.com/adrenak/gorky',
                    openInNewTab: true
                }
            }
        }
    }
};

