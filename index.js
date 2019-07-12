'use strict';

const readdir = require('recursive-readdir-sync');
const read = require('fs').readFileSync;
module.exports = {
  name: require('./package.json').name,
  contentFor: function(type, config) {
    const name = this.name;
    const addon = config[name] || {enabled: false};
    if(addon.enabled) {
      switch (type) {
        case 'test-body':
          if(addon.reader === 'html') {
            const cwd = process.cwd();
            return addon.endpoints.map(
              function(api, i, arr) {
                const absoluteAPI = `${cwd}/${api}`;
                return readdir(absoluteAPI).map(
                  function(item, i, arr) {
                    const url = item.replace(cwd, '');
                    return `<script type="text/javascript+template" data-url="${url}">${read(item)}</script>`;
                  }
                ).join('');
              }
            ).join('');
          }
          break;
      }
    }
  },
  treeFor: function() {
    let app;

    // If the addon has the _findHost() method (in ember-cli >= 2.7.0), we'll just
    // use that.
    if (typeof this._findHost === 'function') {
      app = this._findHost();
    } else {
      // Otherwise, we'll use this implementation borrowed from the _findHost()
      // method in ember-cli.
      let current = this;
      do {
        app = current.app || app;
      } while (current.parent.parent && (current = current.parent));
    }

    this.app = app;
    const config = app.project.config(app.env) || {};
    const addon = config[this.name] || {enabled: false};

    if (!addon.enabled) {
      return;
    }
    return this._super.treeFor.apply(this, arguments);
  },
};
