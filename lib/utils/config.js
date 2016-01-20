/* jshint node:true */
'use strict';

module.exports = function (appPath) {
  var configFile = appPath + '/config/crowdin.js';
  var config;
  try {
    config = require(configFile);
  } catch(e) {
    throw new Error('Unable to open `config/crowdin.js`. Run `ember generate ember-cli-crowdin` to fix this.');
  }
  if (!(config.projectName && config.apiKey)) {
    throw new Error('Invalid configuration: `projectName` and `apiKey` must be given in config/crowdin.js');
  }
  return config;
};
