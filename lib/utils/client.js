/* jshint node:true */
'use strict';

var Crowdin = require('crowdin');

module.exports = function (config) {
  return new Crowdin({
    apiKey: config.apiKey,
    endpointUrl: 'https://api.crowdin.net/api/project/' + config.projectName
  });
};

