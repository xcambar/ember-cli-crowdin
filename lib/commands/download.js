const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const unzip = require('unzipper');
const api = require('@outdoorsyco/crowdin-api');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');

module.exports = {
  name: 'i18n:download',
  aliases: ['i18n:dl'],
  availableOptions: [
    { name: 'assets', type: Boolean, default: false }
  ],
  description: 'Download i18n files from Crowdin',

  run: function(commandOptions) {
    let config = loadConfig(this.project.root);
    let crowdin = getClient(config);
    let folderName = config.folderName || this.project.pkg.name;
    let projectRoot = this.project.root;

    api.setKey(config.apiKey);
    this.ui.startProgress(`Exporting Crowdin's ${folderName} files`);

    return new Promise((resolve, reject) => {
      return api.exportTranslations(config.projectName).then(result => {
        this.ui.stopProgress();
        this.ui.writeLine(`Crowdin build status: ${chalk.green(result.success.status)}`);

        this.ui.startProgress(`Downloading ${folderName} assets and translations`);
        crowdin.download()
        .pipe(unzip.Parse())
        .on('entry', entry => {
          let isThisProject = entry.path.split('/').includes(folderName);
          if(isThisProject && entry.type !== 'Directory' && !entry.path.includes("en-US.yaml")){
            let relPath = entry.path.replace(`${folderName}/`, '');
            let fullPath = path.join(projectRoot, relPath);
            let isAsset = !relPath.includes('.yaml');
            let hasAssets = commandOptions && commandOptions.assets;


            if(config.assetPaths && config.assetPaths.length && isAsset) {
              if(hasAssets) {
                config.assetPaths.forEach((asset) => {
                  let assetLocaleIndex = asset.exportPattern.split('/').indexOf('%locale%');
                  let splitPath = relPath.split('/');
                  let locale = splitPath[assetLocaleIndex];
                  splitPath[assetLocaleIndex] = locale.toLowerCase();
                  let lcLocalePath = path.join(...splitPath);
                  let relEntryPath = entry.path.replace(`${folderName}/`, '');
                  fullPath = path.join(projectRoot, lcLocalePath);
                  if(relEntryPath.toLowerCase() === lcLocalePath) {
                    createFolderFor(entry, fullPath);
                  }
                });
              } else {
                entry.autodrain();
                return;
              }
            }

            entry.pipe(fs.createWriteStream(fullPath));
            this.ui.writeLine(chalk.green(`Downloaded file ${entry.path}`));
          } else {
            entry.autodrain();
          }
        })
        .on('close', resolve)
        .on('end', resolve)
        .on('error', reject);

        this.ui.stopProgress();
      });
    });
  }
};

function createFolderFor(entry, fullPath) {
  let fileName = entry.type === 'File' ? path.parse(entry.path).base : null;
  if(!fs.existsSync(fullPath)){
    fullPath.split(path.sep).reduce((currentPath, folder) => {
      currentPath += folder + path.sep;
      if (!fs.existsSync(currentPath) && folder !== fileName){
        fs.mkdirSync(currentPath);
      }
      return currentPath;
    }, '');
  }
}
