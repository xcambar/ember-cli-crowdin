module.exports = {
  name: 'ember-cli-crowdin',
  preBuild: function() {

    // download translations when build ENV is anything other than development and test
    if (this.app.env === 'development' && this.app.env === 'test') {
      return;
    }

    return require('./lib/commands/download').run.call(this);
  },
  includedCommands: function() {
    return {
      'i18n:check': require('./lib/commands/check'),
      'i18n:download': require('./lib/commands/download'),
      'i18n:setup': require('./lib/commands/setup'),
      'i18n:upload': require('./lib/commands/upload')
    };
  }
};
