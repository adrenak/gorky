// ============================================================================
// UPGRADE.JS
//
// Syncs base.html and styles/ from the installed package template without
// touching README, site-config, gorky.config, or content/.
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { loadConfig } = require('./config');

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

/** EPERM/EBUSY renaming directories is common on Windows when another process touches the tree. */
const RENAME_FALLBACK_CODES = new Set(['EPERM', 'EBUSY', 'EACCES', 'EXDEV']);

/**
 * Move a directory: fast path `rename`, then copy + delete if the OS blocks rename (e.g. Windows).
 * @param {string} src
 * @param {string} dest - Must not exist yet
 */
function moveDirectoryRobust(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }
    if (fs.existsSync(dest)) {
        throw new Error(`Destination already exists: ${dest}`);
    }
    try {
        fs.renameSync(src, dest);
        return;
    } catch (err) {
        if (!RENAME_FALLBACK_CODES.has(err.code)) {
            throw err;
        }
        console.log(
            'Note: Could not move the folder in one step (often Windows when another program has the project open). ' +
                'Using copy, then removing the original…'
        );
    }
    copyDirectory(src, dest);
    try {
        fs.rmSync(src, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (rmErr) {
        throw new Error(
            `Moved files to backup by copying, but could not remove ${src}: ${rmErr.message}. ` +
                'Close apps using that folder (editor, terminal cwd), delete it manually, then run `gorky upgrade` again.'
        );
    }
}

/**
 * Move a file with the same rename-then-copy fallback as {@link moveDirectoryRobust}.
 * @param {string} src
 * @param {string} dest
 */
function moveFileRobust(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }
    if (fs.existsSync(dest)) {
        throw new Error(`Destination already exists: ${dest}`);
    }
    try {
        fs.renameSync(src, dest);
        return;
    } catch (err) {
        if (!RENAME_FALLBACK_CODES.has(err.code)) {
            throw err;
        }
        console.log(
            'Note: Could not move the file in one step (often Windows file locking). ' +
                'Using copy, then removing the original…'
        );
    }
    fs.copyFileSync(src, dest);
    try {
        fs.unlinkSync(src);
    } catch (unErr) {
        throw new Error(
            `Copied ${src} to backup but could not remove the original: ${unErr.message}. ` +
                'Delete the original file manually if it is still there.'
        );
    }
}

/**
 * Prefer base.html; older packages ship index-template.html.
 * @param {string} templateDir
 * @returns {{ filePath: string, sourceName: string } | null}
 */
function resolveBundledShellPath(templateDir) {
    const base = path.join(templateDir, 'base.html');
    if (fs.existsSync(base)) {
        return { filePath: base, sourceName: 'base.html' };
    }
    const legacy = path.join(templateDir, 'index-template.html');
    if (fs.existsSync(legacy)) {
        return { filePath: legacy, sourceName: 'index-template.html' };
    }
    return null;
}

/**
 * @param {string} targetDir - Project root
 * @returns {string} Absolute path to a new empty backup directory
 */
function makeBackupDirectory(targetDir) {
    const now = new Date();
    const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        '_',
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    let baseName = `backup_${stamp}`;
    let dirPath = path.join(targetDir, baseName);
    let n = 0;

    while (fs.existsSync(dirPath)) {
        n += 1;
        dirPath = path.join(targetDir, `${baseName}_${n}`);
    }

    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
}

/**
 * Reject characters that could break a quoted shell argument or run extra commands.
 * @param {string} spec
 */
function assertSafeNpmVersionSpec(spec) {
    if (/['";`$&\n\r\\]/.test(spec)) {
        console.error('Error: --to version contains disallowed characters.');
        process.exit(1);
    }
}

/**
 * @param {string | null | undefined} toVersion - npm dist-tag, semver, or range
 * @returns {{ templateDir: string, cleanup: (() => void) | null, label: string }}
 */
function resolveTemplateSource(toVersion) {
    const spec = toVersion != null && String(toVersion).trim()
        ? String(toVersion).trim()
        : null;

    if (!spec) {
        const packageDir = path.dirname(require.resolve('../package.json'));
        const templateDir = path.join(packageDir, 'template');
        let label = 'current gorky install';
        try {
            const pkg = JSON.parse(
                fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')
            );
            label = `gorky@${pkg.version} (this CLI)`;
        } catch (_) {
            // keep default label
        }
        return { templateDir, cleanup: null, label };
    }

    assertSafeNpmVersionSpec(spec);

    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gorky-upgrade-'));
    const quoted = JSON.stringify(`gorky@${spec}`);

    try {
        execSync(
            `npm install ${quoted} --omit=dev --no-save --no-package-lock --ignore-scripts`,
            {
                cwd: tmpRoot,
                stdio: 'pipe',
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024,
                shell: true,
                windowsHide: true,
            }
        );
    } catch (err) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
        const stderr = err.stderr || '';
        const stdout = err.stdout || '';
        const tail = [stderr, stdout].filter(Boolean).join('\n').trim() || err.message;
        console.error(`Error: Could not install gorky@${spec} for template sync.`);
        console.error(tail);
        process.exit(1);
    }

    const gorkyRoot = path.join(tmpRoot, 'node_modules', 'gorky');
    const templateDir = path.join(gorkyRoot, 'template');

    if (!fs.existsSync(templateDir)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
        console.error(`Error: gorky@${spec} has no template directory after install.`);
        process.exit(1);
    }

    let resolved = spec;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(gorkyRoot, 'package.json'), 'utf8'));
        resolved = pkg.version;
    } catch (_) {
        // keep spec as label
    }

    const cleanup = () => {
        try {
            fs.rmSync(tmpRoot, { recursive: true, force: true });
        } catch (_) {
            // best-effort cleanup
        }
    };

    return {
        templateDir,
        cleanup,
        label: `gorky@${resolved} (npm: ${spec})`,
    };
}

/**
 * @param {string} targetDir - Project root
 * @param {{ backup?: boolean, toVersion?: string | null }} options
 */
function upgradeProject(targetDir, options = {}) {
    const { backup = true, toVersion = null } = options;
    const resolvedTarget = path.resolve(targetDir);

    const { templateDir, cleanup, label } = resolveTemplateSource(toVersion);
    const bundledStylesDir = path.join(templateDir, 'styles');

    try {
        if (!fs.existsSync(templateDir)) {
            console.error('Error: Could not find template directory.');
            process.exit(1);
        }

        const bundledShell = resolveBundledShellPath(templateDir);
        if (!bundledShell) {
            console.error('Error: Template has neither base.html nor index-template.html.');
            process.exit(1);
        }

        if (!fs.existsSync(bundledStylesDir)) {
            console.error('Error: Could not find styles in template.');
            process.exit(1);
        }

        console.log(`✓ Template source: ${label}`);

        const config = loadConfig(resolvedTarget);
        const stylesDest = path.join(resolvedTarget, config.stylesDir);
        const templateDest = path.join(resolvedTarget, config.templateFile);

        const shouldBackup = backup;
        const canBackupStyles = fs.existsSync(stylesDest);
        const canBackupTemplate = fs.existsSync(templateDest);

        if (shouldBackup && (canBackupStyles || canBackupTemplate)) {
            const backupDir = makeBackupDirectory(resolvedTarget);
            console.log(`✓ Created ${path.relative(resolvedTarget, backupDir) || backupDir}`);

            if (canBackupStyles) {
                const stylesBackupPath = path.join(backupDir, path.basename(config.stylesDir));
                moveDirectoryRobust(stylesDest, stylesBackupPath);
                console.log(`✓ Moved ${config.stylesDir}/ → backup (${path.basename(stylesBackupPath)}/)`);
            }

            if (canBackupTemplate) {
                const templateBackupPath = path.join(
                    backupDir,
                    path.basename(config.templateFile)
                );
                moveFileRobust(templateDest, templateBackupPath);
                console.log(`✓ Moved ${config.templateFile} → backup`);
            }
        }

        copyDirectory(bundledStylesDir, stylesDest);
        fs.copyFileSync(bundledShell.filePath, templateDest);

        console.log(`✓ Updated ${config.stylesDir}/ from Gorky template`);
        console.log(
            `✓ Updated ${config.templateFile} from Gorky template (` +
                `${bundledShell.sourceName})`
        );
        console.log('\nNext step: run `gorky build`');
    } finally {
        if (cleanup) {
            cleanup();
        }
    }
}

module.exports = {
    upgradeProject,
};
