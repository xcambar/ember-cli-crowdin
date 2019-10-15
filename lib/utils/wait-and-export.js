const api = require('@outdoorsyco/crowdin-api');
const WAIT_INTERVAL_SECONDS = 30;
const MAX_ATTEMPTS = 50;

module.exports = function (projectName) {
  return new Promise((resolve, reject) => {
    console.info('\nReaching out to Crowdin to process latest translations…');
    console.info('If there are several new translations to process, this may take a couple of minutes.')
    let attempts = 0;
    (function checkForSuccess(){
      api.translationExportStatus(projectName).then(({ status }) => {
        if (status === 'in-progress') {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            return reject(`\nCrowdin processing for too long.  Aborting…`);
          }
          console.info(`\nCrowdin is still processing.  Waiting ${WAIT_INTERVAL_SECONDS} seconds…`);
          setTimeout(checkForSuccess, WAIT_INTERVAL_SECONDS * 1000);
        } else {
          api.exportTranslations(projectName).then((result) => {
            resolve(result);
          }).catch((error) => {
            reject(error);
          })
        }
      })
    })();
  })
};

