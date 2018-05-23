require('colors');
const chalk = require('chalk');
const jsdiff = require('diff');
const fs = require('fs');
const path = require('path');
const unzip = require('unzipper');
const rimraf = require('rimraf');
const yaml = require('js-yaml');
const api = require('crowdin-api');
const loadConfig = require('../utils/config');

module.exports = {
  name: 'i18n:report',
  aliases: ['i18n:report'],
  description: 'Creates a report displaying common issues like duplicated key contexts',
  run: function() {
    let config = loadConfig(this.project.root);
    let downloadPath = config.downloadPath;

    api.setKey(config.apiKey)

    return new Promise((resolve, reject) => {
      api.exportTranslations(config.projectName).then(result => {
        this.ui.writeLine(chalk.green(`Crowdin build status: ${result.success.status}`));

        let translations = [];
        let tmpDir = path.join(downloadPath, 'tmp');

        if (!fs.existsSync(tmpDir)){
          fs.mkdir(tmpDir);
        }

        api.downloadTranslations('outdoorsy-translations', 'en-US')
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
          if (entry.type === 'File' && entry.path.includes('en-US')) {
            let project = path.parse(entry.path).dir.split("/")[0];
            let fileName = `${project}.yaml`;
            let filePath = path.join(tmpDir, fileName);
            entry.pipe(fs.createWriteStream(filePath)).on('close', () => {
              translations.push({
                project,
                content: yaml.safeLoad(fs.readFileSync(filePath, 'utf8'))
              });
            });
          } else {
            entry.autodrain();
          }
        })
        .on('close', () => {
          rimraf(tmpDir, () => {
            this.ui.writeLine(chalk.green(`Translations temp folder '${tmpDir}' removed...`));
            let report = findDuplicatedKeys(translations);

            if(report.count !== 0) {
              printReport(report, this.ui);
              reject();
            }

            resolve();
          });
        })
        .on('end', resolve)
        .on('error', reject);
      });
    });
  }
};

function findDuplicatedKeys(translations) {
  let toReport = {
    count: 0
  };

  translations.forEach((translation, i) => {
    Object.keys(translation.content).forEach((key, line) => {
      translations.forEach((againstTranslation) => {
        if(translations.indexOf(againstTranslation) !== i &&
          againstTranslation.content[key] !== undefined &&
          typeof translation.content[key] !== 'object' &&
          againstTranslation.content[key] !== translation.content[key]) {
          if(toReport[againstTranslation.project] === undefined) {
            toReport[againstTranslation.project] = [];
          }
          toReport[againstTranslation.project].push({
            key,
            against: translation.project,
            line: line + 1,
            diff: {
              current: againstTranslation.content[key],
              against: translation.content[key]
            }
          });
          toReport.count++;
        }
      });
    });
  });

  return toReport;
}

function printReport(report, ui) {
  Object.keys(report).forEach((key) => {
    if(typeof report[key] !== 'object'){ return; }
    report[key].forEach((dup) => {
      ui.writeLine(`${chalk.bgRed(key)} L${dup.line} '${chalk.cyan(dup.key)}' diff against -> ${chalk.bgBlue(dup.against)}:\n`);
      let diff = jsdiff.diffChars(dup.diff.current || '', dup.diff.against || '');
      diff.forEach((part) => {
        let color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        ui.write(chalk[color](part.value));
      });
      ui.writeLine('\n');
    });
  });
  ui.writeError(`\n Found ${chalk.red(report.count)} duplicated keys, with different values`);
}
