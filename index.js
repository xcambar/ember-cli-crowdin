const Funnel = require('broccoli-funnel');

module.exports = {
  name: 'ember-cli-crowdin',
  excludeInProduction: false,

  preBuild: function() {

    // download translations when build ENV is anything other than development and test
    if (this.app.env === 'development' || this.app.env === 'test') {
      return;
    }

    return require('./lib/commands/download').run.call(this);
  },

  config(env, appConfig) {
    if (appConfig.crowdin && appConfig.crowdin.excludeInProduction) {
      this.excludeInProduction = true;
    }
  },

  treeFor(name) {
    var tree = this._super.treeFor.apply(this, arguments);

    if ((name === 'app' || name === 'addon') && this.excludeInProduction) {
      tree = new Funnel(tree, { exclude: [ /in-context/, /inject-script/ ] });
    }
    return tree;
  },

  includedCommands: function() {
    return {
      'i18n:check': require('./lib/commands/check'),
      'i18n:report': require('./lib/commands/report'),
      'i18n:download': require('./lib/commands/download'),
      'i18n:setup': require('./lib/commands/setup'),
      'i18n:upload': require('./lib/commands/upload')
    };
  }
};
