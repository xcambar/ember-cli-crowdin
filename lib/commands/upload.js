const chalk = require('chalk');
const loadConfig = require('../utils/config');
const api = require('crowdin-api');

module.exports = {
  name: 'crowdin:upload',
  aliases: ['crowdin:up'],
  description: 'updates translation to Crowdin',
  run: function() {

    let config = loadConfig(this.project.root);
    let file = config.baseFile;
    let folderName = config.folderName || this.project.pkg.name;

    api.setKey(config.apiKey);

    return api.updateFile(config.projectName, [file], null, folderName)
      .then(() => {
        this.ui.writeLine(chalk.green('Crowdin uploaded translation.'));
      }).catch(error =>  {
        throw new Error(`Crowdin didn't upload a file ${error}`);
      });
  }
};
