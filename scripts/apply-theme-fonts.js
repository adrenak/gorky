/**
 * Injects typography CSS variables (@import + :root) into each built-in theme file.
 * Run from repo root: node scripts/apply-theme-fonts.js
 */

const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, '..', 'template', 'styles', 'themes');

const SYSTEM =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
const JBM = "'JetBrains Mono', 'Courier New', Consolas, monospace";

const stdSizes = {
    '--font-size-body': '1rem',
    '--font-size-h1': '2rem',
    '--font-size-h2': '1.5rem',
    '--font-size-h3': '1.25rem',
    '--font-size-sidebar-title': '1.25rem',
    '--font-size-nav': '0.9rem',
    '--font-size-nav-icon': '1.1rem',
    '--font-size-section-label': '0.7rem',
    '--font-size-theme-select': '0.85rem',
    '--font-size-footer': '0.75rem',
    '--font-size-code': '0.9em',
    '--line-height-body': '1.7',
};

function sizes(overrides = {}) {
    return { ...stdSizes, ...overrides };
}

/** @type {Record<string, { import?: string, body: string, heading?: string, mono?: string, sizes?: Record<string, string> }>} */
const PRESETS = {
    default: {
        import: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: SYSTEM,
        mono: JBM,
    },
    'simple-light': {
        import:
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Inter', ${SYSTEM}`,
        mono: JBM,
    },
    'simple-dark': {
        import:
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Inter', ${SYSTEM}`,
        mono: JBM,
    },
    typewriter: {
        import:
            'https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&display=swap',
        body: `'Courier Prime', 'Courier New', monospace`,
        heading: `'Special Elite', 'Courier Prime', monospace`,
        mono: `'Courier Prime', 'Courier New', monospace`,
        sizes: sizes({
            '--font-size-body': '0.95rem',
            '--font-size-h1': '1.9rem',
            '--font-size-h2': '1.35rem',
            '--line-height-body': '1.65',
        }),
    },
    magazine: {
        import:
            'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Source Sans 3', ${SYSTEM}`,
        heading: `'Playfair Display', Georgia, 'Times New Roman', serif`,
        mono: JBM,
        sizes: sizes({
            '--font-size-body': '1.05rem',
            '--font-size-h1': '2.35rem',
            '--font-size-h2': '1.6rem',
            '--line-height-body': '1.75',
        }),
    },
    hacker: {
        import: 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
        body: `'Share Tech Mono', ${JBM}`,
        heading: 'var(--font-family-body)',
        mono: 'var(--font-family-body)',
        sizes: sizes({
            '--font-size-body': '0.92rem',
            '--font-size-h1': '1.75rem',
            '--font-size-h2': '1.3rem',
            '--line-height-body': '1.6',
        }),
    },
    thematrix: {
        import: 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
        body: `'Share Tech Mono', ${JBM}`,
        heading: 'var(--font-family-body)',
        mono: 'var(--font-family-body)',
        sizes: sizes({
            '--font-size-body': '0.92rem',
            '--font-size-h1': '1.75rem',
            '--line-height-body': '1.6',
        }),
    },
    cyberpunk: {
        import:
            'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Rajdhani', ${SYSTEM}`,
        heading: `'Orbitron', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({
            '--font-size-body': '1.05rem',
            '--font-size-h1': '2.1rem',
            '--font-size-h2': '1.45rem',
        }),
    },
    pulpfiction: {
        import:
            'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Libre Baskerville', Georgia, serif`,
        heading: `'Abril Fatface', Georgia, 'Times New Roman', serif`,
        mono: JBM,
        sizes: sizes({
            '--font-size-h1': '2.35rem',
            '--font-size-h2': '1.55rem',
            '--line-height-body': '1.75',
        }),
    },
    vicecity: {
        import:
            'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Righteous&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Exo 2', ${SYSTEM}`,
        heading: `'Righteous', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-h1': '2.2rem' }),
    },
    fallout: {
        import:
            'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto+Slab:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Roboto Slab', Georgia, serif`,
        heading: `'Oswald', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-h1': '2.15rem' }),
    },
    futurism: {
        import:
            'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Space Grotesk', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-body': '1.02rem' }),
    },
    dollhouse: {
        import:
            'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Quicksand', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-body': '1.05rem', '--line-height-body': '1.75' }),
    },
    candy: {
        import:
            'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Nunito', ${SYSTEM}`,
        heading: `'Fredoka', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-body': '1.05rem', '--font-size-h1': '2.15rem' }),
    },
    forest: {
        import:
            'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Nunito+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Nunito Sans', ${SYSTEM}`,
        heading: `'Lora', Georgia, serif`,
        mono: JBM,
    },
    earthy: {
        import:
            'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700&family=Nunito+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Nunito Sans', ${SYSTEM}`,
        heading: `'Lora', Georgia, serif`,
        mono: JBM,
    },
    desert: {
        import:
            'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700&family=Nunito+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Nunito Sans', ${SYSTEM}`,
        heading: `'Lora', Georgia, serif`,
        mono: JBM,
    },
    ocean: {
        import:
            'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700&family=Nunito+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Nunito Sans', ${SYSTEM}`,
        heading: `'Lora', Georgia, serif`,
        mono: JBM,
    },
    frost: {
        import:
            'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
        body: `'IBM Plex Sans', ${SYSTEM}`,
        mono: `'IBM Plex Mono', 'Courier New', monospace`,
    },
    hellhole: {
        import:
            'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Barlow', ${SYSTEM}`,
        heading: `'Barlow Condensed', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-h1': '2.1rem' }),
    },
    rustpunk: {
        import:
            'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Barlow', ${SYSTEM}`,
        heading: `'Barlow Condensed', ${SYSTEM}`,
        mono: JBM,
    },
    utopia: {
        import:
            'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Cormorant Garamond', Georgia, 'Times New Roman', serif`,
        heading: 'var(--font-family-body)',
        mono: JBM,
        sizes: sizes({
            '--font-size-body': '1.125rem',
            '--font-size-h1': '2.4rem',
            '--line-height-body': '1.8',
        }),
    },
    'finding-nemo': {
        import:
            'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Fredoka:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Comfortaa', ${SYSTEM}`,
        heading: `'Fredoka', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-body': '1.05rem' }),
    },
    underwater: {
        import:
            'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Fredoka:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Comfortaa', ${SYSTEM}`,
        heading: `'Fredoka', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-body': '1.05rem' }),
    },
    coralreef: {
        import:
            'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Fredoka:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
        body: `'Comfortaa', ${SYSTEM}`,
        heading: `'Fredoka', ${SYSTEM}`,
        mono: JBM,
        sizes: sizes({ '--font-size-body': '1.05rem' }),
    },
};

function buildTypographyBlock(preset) {
    const heading = preset.heading || 'var(--font-family-body)';
    const mono = preset.mono || JBM;
    const sizeMap = preset.sizes || sizes();
    const lines = [
        '',
        '    /* Typography */',
        `    --font-family-body: ${preset.body};`,
        `    --font-family-heading: ${heading};`,
        `    --font-family-mono: ${mono};`,
    ];
    Object.entries(sizeMap).forEach(([key, value]) => {
        lines.push(`    ${key}: ${value};`);
    });
    return lines.join('\n');
}

function patchThemeFile(filePath, themeId) {
    const preset = PRESETS[themeId];
    if (!preset) {
        console.warn(`No preset for ${themeId}, skipping`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/@import url\([^)]+\);\s*\n?/g, '');

    content = content.replace(/\n\s*\/\* Typography \*\/[\s\S]*?(?=\n\s*--color-)/, '\n');

    const typography = buildTypographyBlock(preset);
    const anchor = '--font-weight-section-label: 750;';
    if (!content.includes(anchor)) {
        throw new Error(`${themeId}: missing font-weight anchor`);
    }
    if (content.includes('--font-family-body:')) {
        content = content.replace(/\n\s*\/\* Typography \*\/[\s\S]*?(?=\n\s*--color-)/, `\n${typography}`);
    } else {
        content = content.replace(anchor, `${anchor}${typography}`);
    }

    const importLine = preset.import ? `@import url('${preset.import}');\n\n` : '';
    const rootMatch = content.match(/^([\s\S]*?\*\/)\s*(:root\s*\{)/m);
    if (!rootMatch) {
        throw new Error(`${themeId}: unexpected file shape`);
    }
    const rest = content.slice(rootMatch[0].length).replace(/^@import url\([^)]+\);\s*\n*/m, '');
    content = `${rootMatch[1]}\n\n${importLine}${rootMatch[2]}${rest}`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${themeId}`);
}

fs.readdirSync(themesDir).forEach((file) => {
    if (!file.endsWith('.css')) return;
    const id = file.replace(/\.css$/, '');
    patchThemeFile(path.join(themesDir, file), id);
});

console.log('Done.');
