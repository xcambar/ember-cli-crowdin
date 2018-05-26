const chalk = require('chalk');
const loadConfig = require('../utils/config');
const api = require('crowdin-api');
const path = require('path');
const walkSync = require('walk-sync');

module.exports = {
  name: 'i18n:upload',
  aliases: ['i18n:up'],
  description: 'updates translation to Crowdin',
  run: function() {

    let config = loadConfig(this.project.root);
    let toUpload = [];
    let folderName = config.folderName || this.project.pkg.name;
    let projectRoot = this.project.root;

    // en-us translations source
    toUpload.push(config.baseFile);

    // en-us assets sources
    if(config.assetPaths && config.assetPaths.length) {
      config.assetPaths.forEach((assetPath) => {
        walkSync.entries(path.join(projectRoot, assetPath)).forEach((entry) => {
          if(!entry.isDirectory()) {
            toUpload.push(path.join(assetPath, entry.relativePath));
          }
        });
      })
    }

    api.setKey(config.apiKey);

    this.ui.startProgress(`Uploading source assets and translations to Crowdin's ${folderName} folder`);

    return api.updateFile(config.projectName, toUpload, null, folderName).then(() => {
      this.ui.stopProgress();
      this.ui.writeLine(chalk.green(`Source assets and translations were successfully updated on ${folderName} folder.`));
    }).catch(error =>  {
      this.ui.stopProgress();
      throw new Error(`Crowdin didn't upload a file ${error}`);
    });
  }
};
