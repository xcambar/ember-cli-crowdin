// eslint-disable-next-line node/no-extraneous-require
const Funnel = require('broccoli-funnel');
const fs = require('fs');
const downloadTranslations = require('./lib/commands/download');

process.on('unhandledRejection', error => {
  throw error;
});

module.exports = {
  name: require('./package').name,
  excludeFromBuild: false,
  hasDownloadedTranslations: false,

  preBuild: function() {
    if (
      // only download translations on initial build, not on live reloads
      !this.hasDownloadedTranslations
      // don't download in development; would slow things down.  Devs should download manually
      && this.app.env !== 'development'
      // if this is ember-cli-crowdin itself, there's nothing to download
      && !this.project.root.includes('ember-cli-crowdin')
    ) {
      return this._downloadTranslations().then(() => {
        this.hasDownloadedTranslations = true;
      }).catch((error) => {
        throw error;
      });
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
      'i18n:download': require('./lib/commands/download'),
      'i18n:setup': require('./lib/commands/setup'),
      'i18n:upload': require('./lib/commands/upload')
    };
  },

  _downloadTranslations() {
    // download consuming application's translations
    const appPromise = downloadTranslations.run.call(this, {
      project: this.project
    });

    return appPromise.then(() => {
      return Promise.all(this._addonsPromises());
    }).catch((error) => {
      throw error;
    });
  },

  _addonsPromises() {
    // download all addons' translations
    const outdoorsyAddonsWithTranslations = this.project.addons.filter((addon) => {
      const path = addon.root;
      return path.includes('outdoorsyco') && fs.existsSync(`${path}/config/crowdin.js`);
    });
    return outdoorsyAddonsWithTranslations.map((addon) => {
      downloadTranslations.run.call(this, {
        project: addon
      });
    });
  }
};
