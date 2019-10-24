const api = require('@outdoorsyco/crowdin-api');
const loadConfig = require('../utils/config');
const chalk = require('chalk');

module.exports = {
  name: 'i18n:build',
  description: `Trigger a build of the latest translations`,
  aliases: ['i18n:b'],
  availableOptions: [
    {
      name: 'async',
      type: Boolean,
      default: true,
      description: 'true: will return immediately; false: will wait for build to complete'
    }
  ],

  run: function({ async = true }) {
    const config = loadConfig(this.project.root);
    api.setKey(config.apiKey);
    this.ui.writeLine(`Triggering a crowdin build`);
    return new Promise((resolve, reject) => {
      api.exportTranslations(config.projectName, { async: Number(async) }).then((result) => {
        this.ui.writeLine(`Crowdin build status: ${chalk.green(result.success.status)}`);
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }
};

