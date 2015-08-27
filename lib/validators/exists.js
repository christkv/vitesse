"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, generateDocumentType) {
  // Get the array
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push to rules
  context.rules.push(object);

  // Set up the final
  var finalPath = f("'%s'", path.join('.'));

  // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("path + '.{{key}}'", {key: key});
  }

  // The call template to perform the exist tests
  var callTemplate = M(function(){/***
    var _object = {{object}};
    var _path = {{path}};
    
    if(undefined === _object && context.failOnFirst) {
      throw new ValidationError('field does not exist', _path, rules[{{ruleIndex}}], _object);
    } else if(undefined === _object) {
      errors.push(new ValidationError('field does not exist', _path, rules[{{ruleIndex}}], _object));
    }
  ***/});

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    ruleIndex: ruleIndex,
    path: finalPath,
    object: ['object', key].join('.')
  }));
}

module.exports = Validator;