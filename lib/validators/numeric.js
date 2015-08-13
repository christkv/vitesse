"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, options) {
  options = options || {};

  var functionTemplate = M(function(){/***
    var string_validation{{index}} = function(path, object, context) {
      if(object == undefined) return;

      if(!(typeof object == 'number') && context.failOnFirst) {
        throw new ValidationError('field is not a number', path, rules[{{ruleIndex}}], object);
      } else if(!(typeof object == 'number')) {
        errors.push(new ValidationError('field is not a number', path, rules[{{ruleIndex}}], object));
      }
      {{validations}}
      {{customValidations}}
    }
  ***/});

  // Get the array
  var functions = context.functions;
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  
  // Do we have validations
  var validationsString = object.object.validations 
    ? generateValidationLanguage(object.object.validations, context, ruleIndex, index)
    : '';

  // Do we have custom validations
  var customValidationsString = object.options.custom
    ? Utils.generateCustomValidations(object.options.custom, context, ruleIndex, index)
    : '';

  // Push to rules
  context.rules.push(object);

  // Push the function to the list of complete functions
  functions.push(Mark.up(functionTemplate, {
    ruleIndex: ruleIndex, index: index, validations: validationsString, customValidations: customValidationsString
  }));

  // Create a functionCallContext
  var callTemplate = "string_validation{{index}}({{path}}, {{object}}, context);"
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Set up the final
  var finalPath = f("'%s'", path.join('.'));

  // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("f('%s.{{key}}', path)", {key: key});
  } else {
    finalPath = context.generatedField
  }

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: context.object ? context.object : ['object', key].join('.')
  }));
}

var generateValidationLanguage = function(validations, context, ruleIndex, index) {
  var validationTemplate = M(function(){/***
    if(typeof object == 'number' && ({{validation}}) && context.failOnFirst) {
      throw new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object);       
    } else if(typeof object == 'number' && ({{validation}})) {
      errors.push(new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('object <= %s', validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('object < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('object > %s', validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('object >= %s', validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(object) == -1', validations[operator].toString()));
    } else {
      throw new Error(f('validation operator %s is not supported by Number type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: ruleIndex, 
    index: index, 
    rule: JSON.stringify(validations),
    validation: valueValidations.join(' || ')
  }); 
}

module.exports = Validator;