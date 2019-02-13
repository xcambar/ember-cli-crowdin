# Ember-cli-crowdin

This Addon manages and helps with the integration of i18n in your Ember app
with [Crowdin](https://crowdin.com/).

# Installation

`ember install ember-cli-crowdin`

## Configuration

The installation has normally created a file `config/crowdin.js`. If not, run
`ember generate ember-cli-crowdin` to fix this.

Simply open this file and fill in the blanks.

Check that your configuration is valid by running `ember crowdin:check`.

# Usage

## `ember crowdin:check`

Ensures everything is configured properly and
that you have access to the Crowdin API.

## `ember crowdin:download`

Downloads the translations to the path specified
in `config/crowdin.js` under the key `downloadPath` (defaults to `app/locales`).

# "In-context" integration:

info: https://support.crowdin.com/in-context-localization/

To load the integration, pass `incontext=true` as a query param to the url
and make sure that the consuming app has incontext configured:  

`// config/environment.js`

`const crowdinConfig = require('./crowdin.js');`

```
crowdin: {
  projectName: crowdinConfig.projectName
}
```

The initializer that loads this integration is removed from production builds by default
but if, for some reason, you would like to include it in the production build add `includeIncontextInProduction: true`
to your environment:

```
crowdin: {
  projectName: crowdinConfig.projectName,
  includeIncontextInProduction: true
}
```

# License

Copyright Xavier Cambar (c) 2016

Licensed under MIT. See the file LICENSE.md for details.
