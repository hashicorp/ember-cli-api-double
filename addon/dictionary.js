/*eslint no-control-regex: "off"*/
import YAML from 'js-yaml';
export default function(models, Yadda) {
  return new Yadda.Dictionary()
    .define('json', /([^\u0000]*)/, function(val, cb) {
      cb(null, JSON.parse(val));
    })
    .define('yaml', /([^\u0000]*)/, function(val, cb) {
      cb(null, YAML.safeLoad(val));
    }) /*.define(
    'pathname',
    /([^\u0000]*)/,
    function(val, cb) {
      cb(null, url.split('/').map(item => encodeURIComponent(item).join('/'))
    }
  )*/
    .define('model', /(\w+)/, models)
    .define('number', /(\d+)/, Yadda.converters.integer);
}
