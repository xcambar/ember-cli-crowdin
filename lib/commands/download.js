/* jshint node:true */
'use strict';

const chalk = require('chalk');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');

module.exports = {
  name: 'crowdin:download',
  aliases: ['crowdin:dl'],
  description: 'Download i18n files from Crowdin',
  run: function() {
    let config = loadConfig(this.project.root);
    let crowdin = getClient(config);
    let downloadPath = `${this.project.root}/${config.downloadPath}`;

    return crowdin.downloadToPath(downloadPath).then(() =>  {
      this.ui.writeLine(chalk.green(`Translations have been downloaded to ${downloadPath}`));
    }, err => {
      this.ui.writeLine(chalk.red('Unable to download Crowdin translations'));
      throw err;
    });
  }
};
