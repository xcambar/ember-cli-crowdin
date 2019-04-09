const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const unzip = require('unzipper');
const api = require('@outdoorsyco/crowdin-api');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');
const waitAndExport = require('../utils/wait-and-export');

module.exports = {
  name: 'i18n:download',
  aliases: ['i18n:dl'],
  availableOptions: [
    { name: 'assets', type: Boolean, default: false }
  ],
  description: 'Download i18n files from Crowdin',

  run: function(commandOptions) {
    commandOptions = commandOptions || {};
    const project = commandOptions.project || this.project;
    let config = loadConfig(project.root);
    let crowdin = getClient(config);
    let folderName = config.folderName || project.pkg.name;
    let projectRoot = project.root;
    const translationCacheDirectory = 'tmp/translation-cache';
    const allTranslationsZip = `${translationCacheDirectory}/all-translations.zip`;
    if (fs.existsSync(allTranslationsZip)) {
      this.ui.writeLine(`Already have all translations downloaded`);
      this.ui.writeLine(`Extracting ${folderName} files from cache`);
    } else {
      fs.ensureDirSync(translationCacheDirectory);
      this.ui.writeLine('Downloading all translations');
    }

    api.setKey(config.apiKey);
    this.ui.startProgress(`Exporting Crowdin's ${folderName} files`);

    return new Promise((resolve, reject) => {
      return waitAndExport(config.projectName, folderName).then(result => {
        this.ui.stopProgress();
        this.ui.writeLine(`Crowdin build status: ${chalk.green(result.success.status)}`);

        this.ui.startProgress(`Downloading ${folderName} assets and translations`);
        crowdin.download().pipe(fs.createWriteStream(allTranslationsZip))
        .on('finish', () => {
          fs.createReadStream(allTranslationsZip)
          .pipe(unzip.Parse())
          .on('entry', entry => {
            let isThisProject = entry.path.split('/').includes(folderName);
            if(isThisProject && entry.type !== 'Directory' && !entry.path.includes("en.yaml")){
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
        })

        this.ui.stopProgress();
      }).catch((error) => {
        throw error;
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
