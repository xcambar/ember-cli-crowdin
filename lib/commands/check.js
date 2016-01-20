/* jshint node:true */
'use strict';

var chalk = require('chalk');
var loadConfig = require('../utils/config');
var getClient = require('../utils/client');

module.exports = {
  name: 'crowdin:check',
  aliases: ['crowdin'],
  description: 'checks the configuration of Crowdin',
  run: function() {
    var crowdin = getClient(loadConfig(this.project.root));

    return crowdin.getInfo().then(function() {
      this.ui.writeLine(chalk.green('Crowdin is correctly configured.'));
    }.bind(this), function () {
      throw new Error('Crowdin has been incorrectly configured. Please check config/crowdin.js');
    });
  }
};
