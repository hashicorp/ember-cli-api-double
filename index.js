'use strict';

const path = require('path');
const fs = require('fs');
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const writeFile = require('broccoli-file-creator');

const readdir = require('recursive-readdir-sync');
const read = require('fs').readFileSync;

module.exports = {
  name: require('./package.json').name,
  contentFor: function(type, config) {
    const name = this.name;
    const addon = config[name] || {enabled: false};
    if(addon.enabled) {
      switch (type) {
        case 'body':
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
          break;
      }
    }
  },
  treeForApp: function(appTree) {
    const config = this.app.project.config(this.app.env) || {};
    const addon = config[this.name] || {enabled: false};
    if (!addon.enabled) {
      return;
    }
    const dir = 'api-double';
    const trees = [appTree];
    const addonTree = new Funnel(path.join(this.app.project.root, `/${dir}`), {
      destDir: dir
    });
    trees.push(addonTree);
    return mergeTrees(trees);
  },
  treeFor: function(name) {
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
    if(addon['auto-import'] !== false && name === 'app') {
      const dir = 'api-double';
      if(fs.existsSync(path.join(this.app.project.root, `/${dir}/index.js`))) {
        const tree = writeFile('instance-initializers/ember-cli-api-double.js', `
            import api from '${config.modulePrefix}/${dir}';
            export default {
              name: 'ember-cli-api-double',
              initialize: function() {}
            };
        `);
        return mergeTrees([
          tree,
          this._super.treeFor.apply(this, arguments)
        ]);
      }

    }
    return this._super.treeFor.apply(this, arguments);
  },
};
