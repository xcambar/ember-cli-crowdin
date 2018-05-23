const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const unzip = require('unzipper');
const api = require('crowdin-api');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');

module.exports = {
  name: 'i18n:download',
  aliases: ['i18n:dl'],
  description: 'Download i18n files from Crowdin',
  run: function() {
    let config = loadConfig(this.project.root);
    let crowdin = getClient(config);
    let folderName = config.folderName || this.project.pkg.name;
    let downloadPath = config.downloadPath;

    let folderPath = path.join(folderName, downloadPath);

    api.setKey(config.apiKey)

    return new Promise((resolve, reject) => {
      api.exportTranslations(config.projectName).then(result => {
        this.ui.writeLine(chalk.green(`Crowdin build status: ${result.success.status}`));

        crowdin.download()
        .pipe(unzip.Parse())
        .on('entry', entry => {
          let fileName = path.parse(entry.path).base;
          if (entry.type === 'File' && path.dirname(entry.path) === folderPath && fileName !== "en-US.yaml") { // Skip en-US for now
            entry.pipe(fs.createWriteStream(path.join(downloadPath, fileName)));
            this.ui.writeLine(chalk.green(`Downloaded translation ${fileName} to ${downloadPath} from Crowdin`));
          } else {
            entry.autodrain();
          }
        })
        .on('close', resolve)
        .on('end', resolve)
        .on('error', reject);
      });
    });
  }
};
