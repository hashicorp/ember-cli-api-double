import Pretender from 'pretender';
import apiFactory from '@hashicorp/api-double';
export default function(path, setCookies, typeToURL) {
  const createAPI = apiFactory(12345, path);
  let api = createAPI();
  let cookies = {};
  let history = [];
  const server = new Pretender();
  server.handleRequest = request => {
    let url = request.url.split('?')[0];
    history.push(request);
    const req = {
      path: url,
      url: url,
      query: request.queryParams || {},
      headers: request.requestHeaders,
      body: request.requestBody,
      method: request.method,
      cookies: cookies,
    };
    const response = {
      set: function() {
      },
      send: function(response) {
        request.respond(200, { 'Content-Type': 'application/json' }, response);
      },
    };
    api.serve(req, response, function() {});
  };
  return {
    server: {
      history: history,
      reset: function() {
        api = createAPI();
        cookies = {};
        history = [];
        this.history = history;
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
                  res = Object.assign(item, value);
                } else if (value.constructor == Array) {
                  // res = { ...item, ...value[i] };
                  if(value[i]) {
                    if(typeof value[i] === "object") {
                      res = Object.assign(item, value[i]);
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
