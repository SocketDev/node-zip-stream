var normalizePath = require('normalize-path');
var defaults = require('lodash.defaults');

var utils = module.exports = {};

// this is slightly different from lodash version
utils.defaults = function(object, source, guard) {
  var args = arguments;
  args[0] = args[0] || {};

  return defaults(...args);
};

utils.sanitizePath = function(filepath) {
  return normalizePath(filepath, false).replace(/^\w+:/, '').replace(/^(\.\.\/|\/)+/, '');
};

utils.dateify = function(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === 'string') {
    dateish = new Date(dateish);
  } else {
    dateish = new Date();
  }

  return dateish;
};
