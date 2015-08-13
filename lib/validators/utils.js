"use strict"

var f = require('util').format,
  Mark = require("markup-js");

var Utils = function() {
}

Utils.clone = function(o) {
  var opts = {};
  for(var name in o) opts[name] = o[name];
  return opts;
}

Utils.generateArrayValidation = function(path, actualPath, ruleIndex,validations) {
  var stmts = [];

  // Go through all the validations
  for(var name in validations) {
    if(name == '$gt') {
      stmts.push(f('%s.length <= %s', path, validations[name]));
    } else if(name == '$gte') {
      stmts.push(f('%s.length < %s', path, validations[name]));
    } else if(name == '$lte') {
      stmts.push(f('%s.length > %s', path, validations[name]));
    } else if(name == '$lt') {
      stmts.push(f('%s.length >= %s', path, validations[name]));
    } else if(name == '$eq') {
      stmts.push(f('%s.length == %s', path, validations[name]));
    }
  }

  // Generate validation string
  return Mark.up(`
    if({{validation}} && context.failOnFirst) {
      throw new ValidationError('array failed length validation {{rule}}', {{path}}, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('array failed length validation {{rule}}', {{path}}, rules[{{ruleIndex}}], object));
    }
  `, {
    ruleIndex: ruleIndex,
    rule: JSON.stringify(validations),
    validation: f('(%s)', stmts.join(' || ')),
    path: actualPath
  });
}

module.exports = Utils;
