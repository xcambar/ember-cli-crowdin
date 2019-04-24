const fs = require('fs');

module.exports = function (parentApp) {
  return parentApp.addons.filter((addon) => {
    const isOutdoorsyAddon = addon.pkg.name.includes('@outdoorsyco');
    const hasTranslations = fs.existsSync(`${addon.root}/config/crowdin.js`);

    return isOutdoorsyAddon && hasTranslations;
  });
}
