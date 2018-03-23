module.exports = {
  name: 'ember-cli-crowdin',
  preBuild: function() {

    // download translations when build ENV is anything other than development
    if (this.app.env === 'development') {
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
