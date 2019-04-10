require('colors');
const chalk = require('chalk');
const fs = require('fs');
const yaml = require('js-yaml');

module.exports = {
  name: 'i18n:validate',
  aliases: ['i18n:v'],
  description: 'Checks that all translations keys that exist in apps and addons are found in the compiled translation locales',

  translationsValid: true,

  // When run from command line, "this" is the app from which the command is run
  run: function({
    parentApp = this.project,
    distLocation = `${parentApp.root}/dist`,
    ui = this.ui
  } = {}) {
    this.parentApp = parentApp;
    this.distLocation = distLocation;
    this.ui = ui;
    this._validateTranslations(parentApp);
    this._outdoorsyAddonsWithTranslations().forEach((addon) => {
      this._validateTranslations(addon);
    });

    if (this.translationsValid) {
      return this.ui.writeLine(chalk.green('Translations validated!'));
    } else {
      this.ui.writeLine(chalk.red('Some translations were missing.  Validation failed.'));
      this.ui.writeLine(chalk.red('You may need to run ember i18n:download'));
      throw('Failing build');
    }

  },

  // sourceSubProject is an individual addon or the root app, uncompiled before build
  // validate that the compiled translations contain the sourceSubProject's translation keys
  _validateTranslations(sourceSubProject) {
    const sourceSubProjectName = sourceSubProject.pkg.name;
    this.ui.writeLine(chalk.magenta(
      `Validating translations exist for ${sourceSubProjectName}`
    ));
    try {
      const sourceSubProjectENYaml = fs.readFileSync(
        `${sourceSubProject.root}/translations/en.yaml`, 'utf8'
      );
      const parsed = yaml.safeLoad(sourceSubProjectENYaml);
      const sourceSubProjectKeys = Object.keys(parsed);
      const distTranslationsDirectory = `${this.distLocation}/translations`;
      if (!fs.existsSync(distTranslationsDirectory)) {
        throw('No dist translations directory found. You might need to run a build first');
      }
      const compiledTranslationFiles = fs.readdirSync(distTranslationsDirectory);
      const numFiles = compiledTranslationFiles.length;
      if (numFiles < 5) {
        const plural = numFiles === 1 ? '' : 's';
        this.ui.writeLine(chalk.red(
          `Only ${numFiles} compiled translation file${plural} found in parent app.`
        ));
        this.ui.writeLine(chalk.red(
          `Did you remember to run ember i18n:download?`
        ));
        throw('Validation failed');
      }
      compiledTranslationFiles.forEach((path) => {
        const compiledTranslationsFile = fs.readFileSync(
          `${this.distLocation}/translations/${path}`
        );
        const parentAppCompiledKeysForLocale = Object.keys(
          JSON.parse(compiledTranslationsFile)
        );
        sourceSubProjectKeys.forEach((key) => {
          if (!parentAppCompiledKeysForLocale.includes(key)) {
            this.ui.writeLine(chalk.red(
              `missing key ${key} from project ${sourceSubProjectName}`
            ));
            this.translationsValid = false;
          }
        })
      })

    } catch (error) {
      throw error;
    }
  },

  _outdoorsyAddonsWithTranslations() {
    return this.parentApp.addons.filter((addon) => {
      const path = addon.root;
      return path.includes('outdoorsyco') && fs.existsSync(`${path}/config/crowdin.js`);
    });
  }
}
