"use strict"

var f = require('util').format,
  M = require('mstring'),
  Mark = require("markup-js");

var Utils = function() {
}

Utils.clone = function(o) {
  var opts = {};
  for(var name in o) opts[name] = o[name];
  return opts;
}

Utils.generateArray = function(a) {
  return a.map(function(x) {
    return f('"%s"', x);
  });
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
  return Mark.up(M(function(){/***
    if({{validation}} && context.failOnFirst) {
      throw new ValidationError('array failed length validation {{rule}}', {{path}}, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('array failed length validation {{rule}}', {{path}}, rules[{{ruleIndex}}], object));
    }
    ***/}), {
    ruleIndex: ruleIndex,
    rule: JSON.stringify(validations),
    validation: f('(%s)', stmts.join(' || ')),
    path: actualPath
  });
}

Utils.generateCustomValidations = function(custom, context, ruleIndex, index) {
  var functionTemplate = M(function(){/***
    var custom_{{index}}_{{customIndex}} = {{function}};
  ***/});

  var functionTemplateCall = M(function(){/***
    var error = custom_{{index}}_{{customIndex}}(object, custom['{{index}}_{{customIndex}}']);

    if(error instanceof Error && context.failOnFirst) {
      throw new ValidationError(error.message, path, rules[{{ruleIndex}}], object);       
    } else if(error instanceof Error) {
      errors.push(new ValidationError(error.message, path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Function calls
  var functionCalls = [];

  // Generate the custom method wrappers and calls
  custom.forEach(function(x, i) {
    // Unpack the custom validation
    var func = x.object.func.toString();
    var con = x.object.context || {};
    // Transform function
    var transformFunction = Mark.up(functionTemplate, {
      index: index, customIndex: i, function: func
    });

    // Add context to dictionary
    context.custom[f('%s_%s', index, i)] = con;

    // Add the function to the complete list of functions
    context.functions.push(transformFunction);

    // Generate the custom call
    functionCalls.push(Mark.up(functionTemplateCall, {
      index: index, customIndex:i, ruleIndex: ruleIndex
    }))
  });

  return functionCalls.join('\n');
}


module.exports = Utils;
