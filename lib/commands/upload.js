const fs = require('fs');
const chalk = require('chalk');
const loadConfig = require('../utils/config');
const getClient = require('../utils/client');

module.exports = {
  name: 'crowdin:upload',
  aliases: ['crowdin:up'],
  description: 'checks the configuration of Crowdin',
  run: function() {
    let config = loadConfig(this.project.root);
    let crowdin = getClient(loadConfig(this.project.root));
    let file = config.baseFile;

    crowdin.addFile([file], config.branchName)
      .then(response =>  {
        console.log('response', response);
        this.ui.writeLine(chalk.green('Crowdin uploaded translation.'));
      }).catch(error => {
        console.log('error', error);
        throw new Error(`Crowdin didn't upload a file ${error}`);
      });
  }
};
