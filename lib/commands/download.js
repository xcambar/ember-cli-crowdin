const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const unzip = require('unzipper');
const api = require('@outdoorsyco/crowdin-api');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');
const waitAndExport = require('../utils/wait-and-export');

const CACHE_MINUTES = 5;
const translationCacheDirectory = 'tmp/translation-cache';
const allTranslationsZip = `${translationCacheDirectory}/all-translations.zip`;

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
    const config = loadConfig(project.root);
    const crowdin = getClient(config);
    const folderName = config.folderName || project.pkg.name;
    const projectRoot = project.root;

    this.ui.writeLine(chalk.cyan(`---- Getting translations for ${folderName} ----`));

    // First, check if the zip exists on disk already
    if (fs.existsSync(allTranslationsZip)) {
      const stats = fs.statSync(allTranslationsZip);
      const ageInMinutes = (new Date() - new Date(stats.mtime)) / 1000 / 60;
      if (ageInMinutes > CACHE_MINUTES) {
        this.ui.writeLine(chalk.red('Translations cache expired'));
      } else {
        this.ui.writeLine(chalk.green(
          `Already have all translations downloaded. Getting ${folderName} files from disk`
        ));
        return extractFiles({ folderName, projectRoot, commandOptions, config, ui: this.ui });
      }
    } else {

      // If not, make sure the directory exists and download translation from crowdin
      fs.ensureDirSync(translationCacheDirectory);
    }

    api.setKey(config.apiKey);

    this.ui.writeLine(chalk.yellow(
      `Building and downloading all assets and translations from crowdin`
    ));
    return waitAndExport(config.projectName, folderName).then(result => {
      this.ui.writeLine(`Crowdin build status: ${chalk.green(result.success.status)}`);
      return new Promise((resolve, reject) => {
        // Download all translations and write zip to disk
        crowdin.download().pipe(fs.createWriteStream(allTranslationsZip))
        .on('finish', () => {
          return extractFiles({ folderName, projectRoot, commandOptions, config, ui: this.ui }).then(() => {
            resolve();
          }).catch((error) => {
            reject(error);
          });
        })
      })
    }).catch((error) => {
      throw error;
    });
  },
};

// Extract files for this folder from zip file to translation folder for correct project
function extractFiles({ folderName, projectRoot, commandOptions, config, ui }) {
  return new Promise((resolve, reject) => {
    ui.writeLine(chalk.green(`Extracting ${folderName} assets and translations`));
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
        ui.writeLine(chalk.green(`Extracted file ${entry.path}`));
      } else {
        entry.autodrain();
      }
    })
    .on('close', resolve)
    .on('end', resolve)
    .on('error', reject);
  })
}

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
