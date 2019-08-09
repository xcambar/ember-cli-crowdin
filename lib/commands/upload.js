const chalk = require('chalk');
const loadConfig = require('../utils/config');
const api = require('@outdoorsyco/crowdin-api');

module.exports = {
  name: 'i18n:upload',
  aliases: ['i18n:up'],
  availableOptions: [
    { name: 'assets', type: Boolean, default: false },
    { name: 'add', type: Boolean, default: false }
  ],
  description: 'updates translation to Crowdin',

  run: function(commandOptions) {
    let config = loadConfig(this.project.root);
    let folderName = config.folderName || this.project.pkg.name;
    let toComplete = [];

    api.setKey(config.apiKey);

    this.ui.startProgress(`Uploading translations to Crowdin's ${folderName} folder`);

    let translations = api.updateFile(config.projectName, { path: config.baseFile}, null, folderName).then(() => {
      this.ui.stopProgress();
      this.ui.writeLine(chalk.green(`Source translations were successfully updated on ${folderName} folder.`));
    }).catch(error =>  {
      this.ui.stopProgress();
      throw new Error(error.message);
    });

    toComplete.push(translations);

    // en-us assets sources
    if(config.assetPaths && config.assetPaths.length && commandOptions.assets) {
      this.ui.startProgress(`Uploading assets to Crowdin's ${folderName} folder`);

      if(commandOptions.add) {
        config.assetPaths.forEach((file) => {
          toComplete.push(api.addFile(config.projectName, file, null, folderName).then(() => {
            this.ui.stopProgress();
            this.ui.writeLine(chalk.green(`ADDED ${file.path}`));
          }).catch(error =>  {
            if(error.statusCode === 400) {
              this.ui.writeLine(chalk.red(`EXISTING ${file.path}`));
            } else {
              this.ui.stopProgress();
              throw new Error(error.message);
            }
          }));
        });
      } else {
        config.assetPaths.forEach((file) => {
          toComplete.push(api.updateFile(config.projectName, file, null, folderName).then(() => {
            this.ui.stopProgress();
            this.ui.writeLine(chalk.green(`UPDATED ${file.path}`));
          }).catch(error =>  {
            if(error.statusCode === 404) {
              this.ui.writeLine(chalk.red(`NOT FOUND ${file.path} (Use --add to upload for the first time)`));
            } else {
              this.ui.stopProgress();
              throw new Error(error.message);
            }
          }));
        });
      }
    }

    return Promise.all(toComplete);
  }
};
