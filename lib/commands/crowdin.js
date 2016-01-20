/* jshint node:true */
'use strict';

var Crowdin = require('crowdin');
var chalk = require('chalk');

module.exports = {
  name: 'crowdin',
  description: 'checks the configuration of Crowdin',
  run: function() {
    var config = this.config();
    if (!(config.projectName && config.apiKey)) {
      throw new Error('Invalid configuration: `projectName` and `apiKey` must be given in config/crowdin.js');
    }
    var crowdin = new Crowdin({
      apiKey: config.apiKey,
      endpointUrl: 'https://api.crowdin.net/api/project/' + config.projectName
    });

    return crowdin.getInfo().then(function() {
      this.ui.writeLine(chalk.green('Crowdin is correctly configured.'));
    }.bind(this), function () {
      throw new Error('Crowdin has been incorrectly configured. Please check config/crowdin.js');
    });
  },
  config: function () {
    var configFile = this.project.root + '/config/crowdin.js';
    try {
      return require(configFile);
    } catch(e) {
      throw new Error('Unable to open `config/crowdin.js`. Run `ember generate ember-cli-crowdin` to fix this.');
    }
  }
};
