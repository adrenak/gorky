// ============================================================================
// INDEX.JS
//
// Main entry point for the Gorky package
// ============================================================================

module.exports = {
  buildSite: require('./build').buildSite,
  initProject: require('./init').initProject,
  loadConfig: require('./config').loadConfig,
};

