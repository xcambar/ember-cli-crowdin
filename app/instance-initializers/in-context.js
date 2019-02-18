import injectScript from '../utils/inject-script';

export function initialize(appInstance) {
  const fastboot = appInstance.lookup('service:fastboot');

  if (fastboot && fastboot.get('isFastBoot')) {
    return;
  }

  if (window && window.location && window.location.search && window.location.search.match(/incontext/)) {

    const config = appInstance.resolveRegistration('config:environment');
    const intl = appInstance.lookup('service:intl');
    const apiRequest = appInstance.lookup('service:apiRequest');
    const metadata = appInstance.lookup('service:set-metadata');
    const assetMap = appInstance.lookup('service:assetMap');
    const locale = 'ach-ug';

    const scriptText = `var _jipt = []; _jipt.push(['project', '${config.crowdin.projectName}']);`;
    const url = '//cdn.crowdin.com/jipt/jipt.js';

    if (assetMap) {

      let path = assetMap.resolve(`translations/${locale}.json`);
      let options = {};

      if (!path.match(/https?:/)) {
        path = `${metadata.get('urlHost')}${path}`;
      }

      if (path.match(/herokuapp/)) {
        options = {
          username: 'outdoorsy',
          password: 'testlikeaboss'
        };
      }
      apiRequest.request(path, options).then(data => {
        intl.addTranslations(`${locale}`, data);
      });
    }

    injectScript(null, false, scriptText);
    injectScript(url).then(() => {
      intl.setLocale(locale);
    });
  }
}

export default {
  initialize,
  name: 'in-context',
  after: 'ember-simple-auth'
};
