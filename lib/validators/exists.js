"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, generateDocumentType) {
  var functionTemplate = M(function(){/***
    var exists_validation{{index}} = function(path, object, context) {
      if((object == null || object == undefined) && context.failOnFirst) {
        throw new ValidationError('field does not exist', path, rules[{{ruleIndex}}], object);
      } else if(object == null || object == undefined) {
        errors.push(new ValidationError('field does not exist', path, rules[{{ruleIndex}}], object));
      }
    }
  ***/});

  // Get the array
  var functions = context.functions;
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push to rules
  context.rules.push(object);

  // Push the function to the list of complete functions
  functions.push(Mark.up(functionTemplate, {
    ruleIndex: ruleIndex, index: index
  }));

  // Create a functionCallContext
  var callTemplate = "exists_validation{{index}}({{path}}, {{object}}, context);"
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Set up the final
  var finalPath = f("'%s'", path.join('.'));

  // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("f('%s.{{key}}', path)", {key: key});
  }

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: ['object', key].join('.')
  }));
}

module.exports = Validator;