const chalk = require('chalk');
const loadConfig = require('../utils/config');
const api = require('crowdin-api');
const path = require('path');
const walkSync = require('walk-sync');

module.exports = {
  name: 'i18n:upload',
  aliases: ['i18n:up'],
  availableOptions: [
    { name: 'assets', type: Boolean, default: false, aliases: ['a'] }
  ],
  description: 'updates translation to Crowdin',

  run: function(commandOptions) {
    let config = loadConfig(this.project.root);
    let folderName = config.folderName || this.project.pkg.name;
    let projectRoot = this.project.root;

    api.setKey(config.apiKey);

    this.ui.startProgress(`Uploading translations to Crowdin's ${folderName} folder`);

    api.updateFile(config.projectName, [config.baseFile], null, folderName).then(() => {
      this.ui.stopProgress();
      this.ui.writeLine(chalk.green(`Source tanslations were successfully updated on ${folderName} folder.`));
    }).catch(error =>  {
      this.ui.stopProgress();
      throw new Error(`Crowdin didn't upload a file ${error}`);
    });

    // en-us assets sources
    if(config.assetPaths && config.assetPaths.length && commandOptions.assets) {
      let toUpload = [];
      config.assetPaths.forEach((assetPath) => {
        walkSync.entries(path.join(projectRoot, assetPath)).forEach((entry) => {
          if(!entry.isDirectory()) {
            toUpload.push(path.join(assetPath, entry.relativePath));
          }
        });
      });

      this.ui.startProgress(`Uploading assets to Crowdin's ${folderName} folder`);

      return api.updateFile(config.projectName, [config.baseFile], null, folderName).then(() => {
        this.ui.stopProgress();
        this.ui.writeLine(chalk.green(`Source assets were successfully updated on ${folderName} folder.`));
      }).catch(error =>  {
        this.ui.stopProgress();
        throw new Error(`Crowdin didn't upload a file ${error}`);
      });
    }

    return 0;
  }
};
