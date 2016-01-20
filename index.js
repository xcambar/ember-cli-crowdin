/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-crowdin',
  includedCommands: function() {
    return {
      'crowdin:check': require('./lib/commands/check'),
      'crowdin:download': require('./lib/commands/download')
    };
  }
};
