"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, options) {
  options = options || {};

  var callTemplate = M(function(){/***
    var _object = {{object}};
    var _path = {{path}};

    {{defaultString}}

    if(!(_object === undefined)) {
      if(_object != null && {{performTypeCheck}} && context.failOnFirst) {
        throw new ValidationError('field is not null', _path, rules[{{ruleIndex}}], _object);
      } else if(_object != null && {{performTypeCheck}}) {
        errors.push(new ValidationError('field is not null', _path, rules[{{ruleIndex}}], _object));
      }

      {{customValidations}}
    }
  ***/});

  // Skip validation
  var performTypeCheck = typeof object.object.performTypeCheck === 'boolean'
    ? object.object.performTypeCheck : true;

  // Get the array
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  
  // Do we have custom validations
  var customValidationsString = object.object.custom
    ? generateCustomValidations(object.object.custom, context, ruleIndex, index)
    : '';

  // Push to rules
  context.rules.push(object);

  // Set up the final
  var finalPath = f("'%s'", path.join('.'));

  // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("path + '.{{key}}'", {key: key});
  } else {
    finalPath = context.generatedField
  }

  var defaultString = object.object.default ? Mark.up(M(function(){/***
    return;
  ***/})) : '';

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    ruleIndex: ruleIndex,
    object: context.object ? context.object : ['object', key].join('.'),
    customValidations: customValidationsString,
    performTypeCheck: performTypeCheck,
    defaultString: defaultString  
  }));
}

var generateCustomValidations = function(custom, context, ruleIndex, index) {
  var functionTemplate = M(function(){/***
    var custom_{{index}}_{{customIndex}} = {{function}};
  ***/});

  var functionTemplateCall = M(function(){/***
    var error = custom_{{index}}_{{customIndex}}(_object, custom['{{index}}_{{customIndex}}']);

    if(error instanceof Error && context.failOnFirst) {
      throw new ValidationError(error.message, _path, rules[{{ruleIndex}}], _object);
    } else if(error instanceof Error) {
      errors.push(new ValidationError(error.message, _path, rules[{{ruleIndex}}], _object));
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

module.exports = Validator;