module.exports = {
  name: 'ember-cli-crowdin',
  preBuild: function() {
    if (!this.app.isProduction) {
      return;
    }
    return require('./lib/commands/download').run.call(this);
  },
  includedCommands: function() {
    return {
      'crowdin:check': require('./lib/commands/check'),
      'crowdin:download': require('./lib/commands/download'),
      'crowdin:setup': require('./lib/commands/setup'),
      'crowdin:upload': require('./lib/commands/upload')
    };
  }
};
