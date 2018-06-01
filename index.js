'use strict';

module.exports = {
  name: '@hashicorp/ember-cli-api-double',
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
    if (app.env !== 'test') {
      return;
    }
    return this._super.treeFor.apply(this, arguments);
  },
  included: function() {
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
    // this.addonConfig = this.app.project.config(app.env)['ember-cli-mirage'] || {};
    // this.addonBuildConfig = this.app.options['ember-cli-mirage'] || {};

    // Call super after initializing config so we can use _shouldIncludeFiles for the node assets
    this._super.included.apply(this, arguments);

    if (app.env === 'test') {
      app.import('node_modules/@hashicorp/api-double/index.js', {
        using: [
          { transformation: 'cjs', as: '@hashicorp/api-double' }
        ]
      });
      app.import('node_modules/array-range/index.js', {
        using: [
          { transformation: 'cjs', as: 'array-range' }
        ]
      });
      app.import('node_modules/pretender/pretender.js', {
        using: [
          { transformation: 'cjs', as: 'pretender' }
        ]
      });
      app.import('node_modules/js-yaml/index.js', {
        using: [
          { transformation: 'cjs', as: 'js-yaml' }
        ]
      });
    }
  },
};
