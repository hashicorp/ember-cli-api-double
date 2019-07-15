import Pretender from 'pretender';
import apiFactory from '@hashicorp/api-double';
import htmlReader from '@hashicorp/api-double/reader/html';
import deepAssign from 'merge-options';

const defaultGetCookiesFor = function(cookies = document.cookie) {
  return function(type, value, obj = {}) {
    return cookies.split(';').reduce(
      function(prev, item) {
        const temp = item.split('=');
        prev[temp[0].trim()] = temp[1];
        return prev;
      },
      {}
    )
  }
}
const defaultGetShouldMutateCallback = function() {
  return function() {
    return function(type) {
      return function() {
        return false;
      }
    }
  }
}
export default function(path, getCookiesFor = defaultGetCookiesFor(), getShouldMutateCallback = defaultGetShouldMutateCallback(), reader = 'html') {
  let createAPI;
  if(reader === 'html') {
    createAPI = apiFactory(12345, path, htmlReader);
  } else {
    createAPI = apiFactory(12345, path);
  }
  let api = createAPI();
  let cookies = {};
  let history = [];
  let statuses = {};
  let bodies = {};
  const server = new Pretender();
  server.handleRequest = request => {
    const temp = request.url.split('?');
    let url = temp[0];
    let queryParams = {};
    if(temp[1]) {
      queryParams = temp[1].split('&').reduce(
        function(prev, item) {
          const temp = item.split('=');
          prev[temp[0]] = temp[1];
          return prev;
        },
        queryParams
      );
    }
    history.push(request);
    const req = {
      path: url,
      url: url,
      query: queryParams,
      headers: request.requestHeaders,
      body: request.requestBody,
      method: request.method,
      cookies: Object.assign(cookies, getCookiesFor('*'))
    };
    let headers = { 'Content-Type': 'application/json' };
    const response = {
      _status: 200,
      set: function(_headers) {
        headers = Object.assign({}, headers, _headers);
      },
      send: function(response) {
        request.respond(statuses[url] || this._status, headers, bodies[url] || response);
      },
      status: function(status) {
        this._status = status;
        return this;
      }
    };
    api.serve(req, response, function() {});
  };
  return {
    api: api,
    server: {
      history: history,
      reset: function() {
        api = createAPI();
        cookies = {};
        statuses = {};
        bodies = {};
        history = [];
        this.history = history;
      },
      setCookie: function(name, value) {
        cookies[name] = value;
      },
      respondWithStatus: function(url, s) {
        statuses[url] = s;
      },
      respondWith: function(url, response) {
        statuses[url] = response.status || 200;
        bodies[url] = response.body || '';
      },
      // keep mirage-like interface
      createList: function(type, num, value) {
        cookies = Object.assign(
          cookies,
          getCookiesFor(type, num)
        );

        if (typeof value !== 'undefined') {
          api.mutate(
            function(response, config) {
              if (typeof response.map !== 'function') {
                return deepAssign(response, value)
              }
              return response.map((item, i, arr) => {
                let res = value;
                if (typeof value === 'object') {
                  if (value.constructor == Object) {
                    // res = { ...item, ...value };
                    if(typeof item === 'string') {
                      res = value.toString();
                    } else {
                      res = deepAssign(item, value);
                    }
                  } else if (value.constructor == Array) {
                    // res = { ...item, ...value[i] };
                    if(value[i]) {
                      if(typeof value[i] === "object") {
                        res = deepAssign(item, value[i]);
                      } else {
                        res = value[i];
                      }
                    }
                  }
                }
                return res;
              });
            },
            getShouldMutateCallback(type)
          );
        }
      },
    },
  };

}
