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
    let downloadPaths = config.downloadPaths;
    let projectRoot = this.project.root;

    api.setKey(config.apiKey)

    return new Promise((resolve, reject) => {
      this.ui.startProgress(`Exporting Crowdin's ${folderName} files`);
      api.exportTranslations(config.projectName).then(result => {
        this.ui.stopProgress();
        this.ui.writeLine(`Crowdin build status: ${chalk.green(result.success.status)}`);

        this.ui.startProgress(`Downloading ${folderName} assets and translations`);
        crowdin.download()
        .pipe(unzip.Parse())
        .on('entry', entry => {
          let entryPath = path.parse(entry.path).dir.split(folderName);
          let locale = entryPath.length === 2 ? entryPath[0].slice(0, -1) : null;
          let prePath = entryPath.length === 2 ? entryPath[1].substr(1) : null;
          let relativePath = prePath && entry.path.includes(folderName) ? prePath : null;
          let shouldDownload = relativePath && downloadPaths.some((path) => prePath.includes(path)) && !entry.path.includes("en-US.yaml");

          if (shouldDownload) {
            let downloadPath = downloadPaths.filter((path) => relativePath.includes(path))[0];
            let midPath = relativePath.replace(downloadPath, '').replace(locale, '');
            let entryPath = path.join(downloadPath, locale, midPath, path.parse(entry.path).base);
            createFolderFor(entry, entryPath, projectRoot);
            if(entry.type !== 'Directory'){
              entry.pipe(fs.createWriteStream(entryPath));
              this.ui.writeLine(chalk.green(`Downloaded file ${entryPath} from Crowdin`));
            } else {
              entry.autodrain();
            }
          } else {
            entry.autodrain();
          }
        })
        .on('close', resolve)
        .on('end', resolve)
        .on('error', reject);
      });
      this.ui.stopProgress();
    });
  }
};

function createFolderFor(entry, entryPath, rootPath) {
  let thePath = path.join(rootPath, entryPath);
  let fileName = entry.type === 'File' ? path.parse(entry.path).base : null;
  if(!fs.existsSync(thePath)){
    thePath.split(path.sep).reduce((currentPath, folder) => {
      currentPath += folder + path.sep;
      if (!fs.existsSync(currentPath) && folder !== fileName){
        fs.mkdirSync(currentPath);
      }
      return currentPath;
    }, '');
  }
}
