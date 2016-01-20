/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-crowdin',
  includedCommands: function() {
    return {
      crowdin: require('./lib/commands/crowdin')
    };
  }
};
