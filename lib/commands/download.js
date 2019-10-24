const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const unzipper = require('unzipper');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');
const outdoorsyAddonsWithTranslations = require('../utils/outdoorsy-addons-with-translations');
const api = require('@outdoorsyco/crowdin-api');
const waitAndExport = require('../utils/wait-and-export');

const translationCacheDirectory = 'tmp/translation-cache';
const allTranslationsZip = `${translationCacheDirectory}/all-translations.zip`;

module.exports = {
  name: 'i18n:download',
  aliases: ['i18n:dl'],
  availableOptions: [
    {
      name: 'assets',
      type: Boolean,
      default: true,
      description: 'Whether to include non-string assets like images'
    },
    {
      name: 'wait-for-build',
      type: Boolean,
      default: false,
      description: (
        'Whether to first trigger and wait for a crowdin build' +
        'If set to false (default), will immediately download latest completed build'
      )
    }
  ],
  description: 'Download i18n files from Crowdin, including addons',

  async run({
    assets = true,
    waitForBuild = false,
    parentApp = this.project,
    ui = this.ui
  }) {
    const includeAssets = assets;
    this.parentApp = parentApp;
    const addons = outdoorsyAddonsWithTranslations(parentApp);
    const config = loadConfig(parentApp.root);
    const crowdin = getClient(config);

    ui.writeLine(chalk.cyan(`---- Getting all translations for ${parentApp.pkg.name} ----`));
    api.setKey(config.apiKey);

    if (waitForBuild) {
      ui.writeLine(chalk.yellow(
        `Building and downloading all assets and translations from crowdin`
      ));
      try {
        const buildResult = await waitAndExport(config.projectName);
        ui.writeLine(`Crowdin build status: ${chalk.green(buildResult.success.status)}`);
      } catch (error) {
        throw(error);
      }
    } else {
      ui.writeLine(chalk.yellow(
        `Downloading all assets and translations from crowdin`
      ));
    }
    return new Promise((resolve, reject) => {
      // Download all translations and write zip to disk
      fs.ensureDirSync(translationCacheDirectory);
      crowdin.download().pipe(fs.createWriteStream(allTranslationsZip))
      .on('finish', async () => {
        try {
          await extractFiles({ parentApp, addons, config, includeAssets, ui });
          resolve();
        } catch (error) {
          reject(error);
        }
      })
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

        file.pipe(fs.createWriteStream(fullPath))
        .on('close', () => {
          ui.writeLine(chalk.green(`File successfully written: ${file.path}`));
        });
      } else {
        file.autodrain();
      }
    })
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
