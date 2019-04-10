const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const unzipper = require('unzipper');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');
const api = require('@outdoorsyco/crowdin-api');
const waitAndExport = require('../utils/wait-and-export');

const CACHE_MINUTES = 5;
const translationCacheDirectory = 'tmp/translation-cache';
const allTranslationsZip = `${translationCacheDirectory}/all-translations.zip`;

module.exports = {
  name: 'i18n:download',
  aliases: ['i18n:dl'],
  availableOptions: [
    { name: 'assets', type: Boolean, default: true }
  ],
  description: 'Download i18n files from Crowdin, including addons',

  run: function({
    assets = true,
    parentApp = this.project,
    ui = this.ui
  }) {
    const includeAssets = assets;
    this.parentApp = parentApp;
    const addons = this._outdoorsyAddonsWithTranslations();
    const config = loadConfig(parentApp.root);
    const crowdin = getClient(config);

    ui.writeLine(chalk.cyan(`---- Getting all translations for ${parentApp.pkg.name} ----`));

    // First, check if the zip exists on disk already
    if (fs.existsSync(allTranslationsZip)) {
      const stats = fs.statSync(allTranslationsZip);
      const ageInMinutes = (new Date() - new Date(stats.mtime)) / 1000 / 60;
      if (ageInMinutes > CACHE_MINUTES) {
        ui.writeLine(chalk.red('Translations cache expired'));
      } else {
        ui.writeLine(chalk.green(
          `Already have all translations downloaded. Getting files from disk`
        ));
        return extractFiles({ parentApp, addons, config, includeAssets, ui });
      }
    } else {

      // If not, make sure the directory exists and download translation from crowdin
      fs.ensureDirSync(translationCacheDirectory);
    }

    api.setKey(config.apiKey);

    ui.writeLine(chalk.yellow(
      `Building and downloading all assets and translations from crowdin`
    ));
    return waitAndExport(config.projectName).then(result => {
      ui.writeLine(`Crowdin build status: ${chalk.green(result.success.status)}`);
      return new Promise((resolve, reject) => {
        // Download all translations and write zip to disk
        crowdin.download().pipe(fs.createWriteStream(allTranslationsZip))
        .on('finish', () => {
          return extractFiles({ parentApp, addons, config, includeAssets, ui }).then(() => {
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

  _outdoorsyAddonsWithTranslations() {
    return this.parentApp.addons.filter((addon) => {
      const path = addon.root;
      return path.includes('outdoorsyco') && fs.existsSync(`${path}/config/crowdin.js`);
    });
  }
};

// Extract files for this folder from zip file to translation folder for correct project
function extractFiles({ parentApp, addons, config, includeAssets, ui }) {
  return new Promise((resolve, reject) => {
    ui.writeLine(chalk.green(`Extracting assets and translations`));
    fs.createReadStream(allTranslationsZip)
    .pipe(unzipper.Parse())
    .on('entry', file => {
      // iterate through every translation file and put it in its correct place
      const folderName = file.path.split('/')[0];
      const matchedAppOrAddon = [parentApp].concat(addons).find((appOrAddon) => {
        const appOrAddonCrowdinName = loadConfig(appOrAddon.root).folderName;

        return folderName === appOrAddonCrowdinName;
      })
      if (file.type !== 'Directory' && matchedAppOrAddon && !file.path.includes("en.yaml")) {
        const relativePath = file.path.replace(`${folderName}/`, '');
        let fullPath = path.join(matchedAppOrAddon.root, relativePath);
        const isAsset = !relativePath.includes('.yaml');

        if (config.assetPaths && config.assetPaths.length && isAsset) {
          if (includeAssets) {
            config.assetPaths.forEach((asset) => {
              const assetLocaleIndex = asset.exportPattern.split('/').indexOf('%locale%');
              const splitPath = relativePath.split('/');
              const locale = splitPath[assetLocaleIndex];
              splitPath[assetLocaleIndex] = locale.toLowerCase();
              const lcLocalePath = path.join(...splitPath);
              const relativeFilePath = file.path.replace(`${folderName}/`, '');
              fullPath = path.join(matchedAppOrAddon.root, lcLocalePath);
              if(relativeFilePath.toLowerCase() === lcLocalePath) {
                createFolderFor(file, fullPath);
              }
            });
          } else {
            file.autodrain();
            return;
          }
        }

        file.pipe(fs.createWriteStream(fullPath));
        ui.writeLine(chalk.green(`Writing file ${file.path}`));
      } else {
        file.autodrain();
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
