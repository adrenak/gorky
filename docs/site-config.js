// Site Configuration for Gorky Documentation Site
module.exports = {
    baseUrl: 'https://adrenak.github.io/gorky/deliver',
    siteName: 'Gorky',
    authorName: 'Vatsal Ambastha',
    defaultDescription: 'Gorky - A lightweight, markdown-powered static site generator for creating beautiful blogs and personal websites. Perfect for GitHub Pages deployment.',
    defaultKeywords: 'gorky, static site generator, markdown, blog, GitHub Pages, JAMstack, static website, markdown blog',
    favicon: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png',
    /** Optional portrait for link previews (og:image fallback when page has no thumbnail). Root-relative or https URL. */
    avatar: 'content/images/gorky.jpg',

    /**
     * Color palette: `styles/themes/<theme>.css` (only :root variables).
     * Try: default, thematrix, desert, candy, simple-light, simple-dark, hacker, dollhouse, pulpfiction, earthy, typewriter, magazine, frost, forest, futurism, cyberpunk, fallout, rustpunk, utopia, hellhole, vicecity, ocean, underwater, coralreef, finding-nemo
     */
    theme: 'default',

    /**
     * Optional: theme ids for a sidebar dropdown (above the footer). Live palette switch.
     * Choice is stored in localStorage as `gorky-theme` if the visitor changes the select;
     * only ids in this array (after normalisation) plus the configured `theme` are allowed.
     */
    themeOptions: [
        'default',
        'candy',
        'coralreef',
        'cyberpunk',
        'desert',
        'dollhouse',
        'earthy',
        'finding-nemo',
        'forest',
        'frost',
        'futurism',
        'hacker',
        'hellhole',
        'magazine',
        'ocean',
        'pulpfiction',
        'rustpunk',
        'simple-dark',
        'simple-light',
        'thematrix',
        'typewriter',
        'underwater',
        'utopia',
        'vicecity',
    ],

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
                // Use ?page= for internal links — converted to path URLs at build time
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

