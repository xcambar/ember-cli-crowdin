module.exports = function (appPath) {
  let config;
  let configFile = `${appPath}/config/crowdin.js`;

  try {
    config = require(configFile);
  } catch(e) {
    console.error(`checking path: ${configFile}`);
    throw new Error('Unable to open `config/crowdin.js`. Run `ember generate ember-cli-crowdin` to fix this.');
  }
  if (!(config.projectName && config.apiKey)) {
    throw new Error('Invalid configuration: `projectName` and `apiKey` must be given in config/crowdin.js');
  }
  return config;
};
