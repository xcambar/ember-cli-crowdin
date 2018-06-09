const chalk = require('chalk');
const loadConfig = require('../utils/config');
const api = require('@outdoorsyco/crowdin-api');

module.exports = {
  name: 'i18n:setup',
  aliases: ['i18n:s'],
  description: 'Sets up folder structure for a given project in Crowdin',
  run() {

    let config = loadConfig(this.project.root);
    let folderName = config.folderName || this.project.pkg.name;
    let file = config.baseFile;

    api.setKey(config.apiKey) // Get this from your project page

    return this.createDirectory(config.projectName, `${folderName}`).then(() => {
      return this.createDirectory(config.projectName, `${folderName}/${config.downloadPath}`)
        .then(() => {
          return this.addTranslations(config.projectName, file, folderName, config.downloadPath);
        });
    });
  },

  addTranslations(projectName, file, folderName, downloadPath) {
    return api.addFile(projectName, [file], null, folderName, downloadPath)
      .then(() => {
        this.ui.writeLine(chalk.green('Crowdin uploaded translation.'));
      }).catch(error =>  {
        throw new Error(`Crowdin didn't upload a file ${error}`);
      });
  },

  createDirectory(projectName, folderName) {
    return api.createDirectory(projectName, `${folderName}`)
      .catch(error => {
        this.error(error);
      });
  },

  error(message) {
    throw new Error(`Crowdin didn't setup folder structure ${message}`);
  }
};
