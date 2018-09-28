import Service from '@ember/service';
import injectScript from 'ember-cli-crowdin/utils/inject-script';
import { getOwner } from "@ember/application";

export default Service.extend({
  isInContextLoaded: false,

  init() {
    this._super(...arguments);
    this.config = getOwner(this).resolveRegistration('config:environment');
  },

  enableInContext() {
    this._setup();
    this._enable();
  },

  _setup() {
    const text = `var _jipt = []; _jipt.push(['project', '${this.config.crowdin.projectName}']);`;
    injectScript(null, false, text);
  },

  _enable() {
    const url = '//cdn.crowdin.com/jipt/jipt.js';
    injectScript(url).then((response) => {
      this.set('isInContextLoaded', true);
      console.log('incontext loaded'); // eslint-disable-line no-console
      return response;
    })
    .catch((error) => console.log(error)); // eslint-disable-line no-console
  }
});
