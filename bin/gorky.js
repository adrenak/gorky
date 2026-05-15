#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { initProject } = require('../lib/init');
const { buildSite } = require('../lib/build');
const { upgradeProject } = require('../lib/upgrade');
const { loadConfig } = require('../lib/config');

const packageJson = require('../package.json');

program
  .name('gorky')
  .description('A lightweight, markdown-powered static site generator')
  .version(packageJson.version);

program
  .command('init [project-name]')
  .description('Initialize a new Gorky site')
  .option('-d, --dir <directory>', 'Target directory', process.cwd())
  .action((projectName, options) => {
    const targetDir = projectName 
      ? path.join(options.dir, projectName)
      : options.dir;
    initProject(targetDir);
  });

program
  .command('build')
  .description('Build the static site')
  .option('-c, --content <path>', 'Content directory')
  .option('-o, --output <path>', 'Output file name (inside output directory)')
  .option('--output-dir <path>', 'Output directory for generated site')
  .option('-t, --template <path>', 'Template file')
  .option('--styles <path>', 'Styles directory')
  .action((options) => {
    // Load config from gorky.config.js or use defaults
    const config = loadConfig(process.cwd());
    
    // Override with CLI options if provided
    const buildOptions = {
      contentDir: options.content || config.contentDir,
      outputDir: options.outputDir || config.outputDir,
      outputFile: options.output || config.outputFile,
      templateFile: options.template || config.templateFile,
      stylesDir: options.styles || config.stylesDir,
      cwd: process.cwd()
    };
    
    buildSite(buildOptions);
  });

program
  .command('upgrade [project-name]')
  .description(
    'Replace base.html and styles/ with the bundled template (preserves README, configs, and content/)'
  )
  .option('-d, --dir <directory>', 'Parent directory when using project-name', process.cwd())
  .option(
    '--no-backup',
    'Replace styles and template in place (default: move existing ones to backup_<timestamp>/ first)'
  )
  .option(
    '--to <version>',
    'npm version, dist-tag, or range for the gorky package template (e.g. 1.0.0, latest); uses a temporary npm install'
  )
  .action((projectName, options) => {
    const targetDir = projectName
      ? path.join(options.dir, projectName)
      : options.dir;
    upgradeProject(targetDir, {
      backup: options.backup,
      toVersion: options.to || null,
    });
  });

program.parse();

