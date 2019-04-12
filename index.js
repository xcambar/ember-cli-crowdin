// eslint-disable-next-line node/no-extraneous-require
const Funnel = require('broccoli-funnel');

process.on('unhandledRejection', error => {
  throw error;
});

module.exports = {
  name: require('./package').name,
  excludeFromBuild: false,

  postBuild(results) {
    if (
      process.env.VALIDATE !== 'false'
      && !['test', 'development'].includes(this.app.env)
      // if this is ember-cli-crowdin itself, there's nothing to validate
      && !this.project.root.includes('ember-cli-crowdin')
    ) {
      try {
        require('./lib/commands/validate').run({
          parentApp: this.project,
          distLocation: results.directory,
          ui: this.ui
        });
      } catch (error) {
        throw(error);
      }
    }
  },

  config(env, appConfig) {
    if (appConfig.crowdin && appConfig.crowdin.excludeFromBuild) {
      this.excludeFromBuild = true;
    }
  },

  treeFor(name) {
    var tree = this._super.treeFor.apply(this, arguments);

    if ((name === 'app' || name === 'addon') && this.excludeFromBuild) {
      tree = new Funnel(tree, { exclude: [ /in-context/, /inject-script/ ] });
    }
    return tree;
  },

  includedCommands: function() {
    return {
      'i18n:check': require('./lib/commands/check'),
      'i18n:report': require('./lib/commands/report'),
      'i18n:validate': require('./lib/commands/validate'),
      'i18n:download': require('./lib/commands/download'),
      'i18n:setup': require('./lib/commands/setup'),
      'i18n:upload': require('./lib/commands/upload')
    };
  }
};
