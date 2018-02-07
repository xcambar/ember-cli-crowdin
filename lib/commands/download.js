const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const unzip = require('unzip');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');

module.exports = {
  name: 'crowdin:download',
  aliases: ['crowdin:dl'],
  description: 'Download i18n files from Crowdin',
  run: function() {
    let config = loadConfig(this.project.root);
    let crowdin = getClient(config);
    let folderName = config.folderName || this.project.pkg.name;
    let downloadPath = config.downloadPath;

    let folderPath = path.join(folderName, downloadPath);

    return new Promise((resolve, reject) => {
      crowdin.download()
        .pipe(unzip.Parse())
        .on('entry', entry => {
          if (entry.type === 'File' && path.dirname(entry.path) === folderPath) {
            let fileName = path.parse(entry.path).base;
            entry.pipe(fs.createWriteStream(path.join(downloadPath, fileName)));
            this.ui.writeLine(chalk.green(`Downloaded translation ${fileName} to ${downloadPath}`));
          } else {
            entry.autodrain();
          }
        })
        .on('close', resolve)
        .on('end', resolve)
        .on('error', reject);
    });
  }
};
