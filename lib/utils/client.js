const Crowdin = require('crowdin-node');

module.exports = function (config) {
  return new Crowdin({
    apiKey: config.apiKey,
    endpointUrl: `https://api.crowdin.com/api/project/${config.projectName}`
  });
};
