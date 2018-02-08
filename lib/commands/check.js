const chalk = require('chalk');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');

module.exports = {
  name: 'crowdin:check',
  aliases: ['crowdin'],
  description: 'checks the configuration of Crowdin',
  run: function() {
    let crowdin = getClient(loadConfig(this.project.root));

    return crowdin.getInfo().then(() =>  {
      this.ui.writeLine(chalk.green('Crowdin is correctly configured.'));
    }, () => {
      throw new Error('Crowdin has been incorrectly configured. Please check config/crowdin.js');
    });
  }
};
