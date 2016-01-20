/* jshint node:true */
'use strict';

var chalk = require('chalk');
var loadConfig = require('../utils/config');
var getClient = require('../utils/client');

module.exports = {
  name: 'crowdin:download',
  aliases: ['crowdin:dl'],
  description: 'Download i18n files from Crowdin',
  run: function() {
    var config = loadConfig(this.project.root);
    var crowdin = getClient(config);
    var downloadPath = this.project.root + '/' + config.downloadPath;

    return crowdin.downloadToPath(downloadPath).then(function() {
      this.ui.writeLine(chalk.green('Translations have been downloaded to ' + downloadPath));
    }.bind(this), function (err) {
      this.ui.writeLine(chalk.red('Unable to download Crowdin translations'));
      throw err;
    });
  }
};
