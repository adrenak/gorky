#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { initProject } = require('../lib/init');
const { buildSite } = require('../lib/build');
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
  .option('-o, --output <path>', 'Output file')
  .option('-t, --template <path>', 'Template file')
  .option('--styles <path>', 'Styles directory')
  .action((options) => {
    // Load config from gorky.config.js or use defaults
    const config = loadConfig(process.cwd());
    
    // Override with CLI options if provided
    const buildOptions = {
      contentDir: options.content || config.contentDir,
      outputFile: options.output || config.outputFile,
      templateFile: options.template || config.templateFile,
      stylesDir: options.styles || config.stylesDir,
      cwd: process.cwd()
    };
    
    buildSite(buildOptions);
  });

program.parse();

