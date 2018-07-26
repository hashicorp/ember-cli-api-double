import Pretender from 'pretender';
import apiFactory from '@hashicorp/api-double';
import htmlReader from '@hashicorp/api-double/reader/html';
import deepAssign from 'merge-options';
const assign = Object.assign;
export default function(path, setCookies, typeToURL, reader) {
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
      cookies: cookies,
    };
    let headers = { 'Content-Type': 'application/json' };
    const response = {
      _status: 200,
      set: function(_headers) {
        headers = Object.assign({}, headers, _headers);
      },
      send: function(response) {
        request.respond(statuses[url] || this._status, headers, response);
      },
      status: function(status) {
        this._status = status;
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
        history = [];
        this.history = history;
      },
      setCookie: function(name, value) {
        cookies[name] = value;
      },
      respondWithStatus: function(url, s) {
        statuses[url] = s;
      },
      createList: function(type, num, value) {
        const url = typeToURL(type);
        cookies = setCookies(type, num, cookies);
        if (url && value) {
          api.mutate(function(response, config) {
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
          }, url);
        }
      },
    },
  };

}
