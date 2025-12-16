// ============================================================================
// BUILD.JS
//
// This script allows testing the package locally.
// For actual site building, users should use: gorky build
// ============================================================================

const { buildSite } = require('../lib/build');
const { loadConfig } = require('../lib/config');

// Load config and build (if content/ exists for testing)
const config = loadConfig(process.cwd());
buildSite({
  ...config,
  cwd: process.cwd()
});
