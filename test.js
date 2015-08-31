"use strict"

var f = require('util').format;

var ValidationError = function(message, path, rule, value) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
}

var rules = [];

var validate = function(object, context) {
  var context = context == null ? {} : context;
  var errors = [];
  var generatePath = function(parent) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return f('%s%s', parent, args.map(function(x) {
      return f('[%s]', x);
    }).join(''));
  }
  var deepCompareStrict = function(a, b) {
    if (typeof a !== typeof b) {
      return false;
    }
    if (a instanceof Array) {
      if (!(b instanceof Array)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      return a.every(function(v, i) {
        return deepCompareStrict(a[i], b[i]);
      });
    }
    if (typeof a === 'object') {
      if (!a || !b) {
        return a === b;
      }
      var aKeys = Object.keys(a);
      var bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) {
        return false;
      }
      return aKeys.every(function(v) {
        return deepCompareStrict(a[v], b[v]);
      });
    }
    return a === b;
  };
  var testArrays = function(v, i, a) {
    for (var j = i + 1; j < a.length; j++)
      if (deepCompareStrict(v, a[j])) {
        return false;
    }
    return true;
  }

  var _object = object;
  var _path = object;
  var _valid = false;
  if (_object === undefined) return;
  // Enum validations
  if (object === 1) return;
  if (object === 2) return;
  if (object === 3) return;
  return errors;
};

console.dir(validate(3))