const api = require('@outdoorsyco/crowdin-api');
const MAX_ATTEMPTS = 20;

module.exports = function (projectName, folderName) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    (function checkForSuccess(){
      api.translationExportStatus(projectName).then(({ status }) => {
        if (status === 'in-progress') {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            return reject(`\nExport status for ${folderName || projectName} in-progress for too long.  Aborting…`);
          }
          console.info(`\nprevious build for ${folderName || projectName} is in progress.  Waiting 5 seconds…`);
          setTimeout(checkForSuccess, 5000);
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

