# Ember-cli-crowdin

This Addon manages and helps with the integration of i18n in your Ember app
with [Crowdin](https://crowdin.com/).

# Installation

`ember install ember-cli-crowdin`

## Configuration

The installation has normally created a file `config/crowfin.js`. If not, run
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

#License

Copyright Xavier Cambar (c) 2016

Licensed under MIT. See the file LICENSE.md for details.
