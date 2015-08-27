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
    if(_object === undefined) return;

    if(!(typeof _object == 'number') && {{skipOnWrongType}} && context.failOnFirst) {
      throw new ValidationError('field is not a number', _path, rules[{{ruleIndex}}], _object);
    } else if(!(typeof _object == 'number') && {{skipOnWrongType}}) {
      errors.push(new ValidationError('field is not a number', _path, rules[{{ruleIndex}}], _object));
    }

    {{validations}}
    {{customValidations}}
  ***/});

  // Skip validation
  var skipOnWrongType = typeof object.object.skipOnWrongType === 'boolean'
    ? !object.object.skipOnWrongType : true;

  // Get the array
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  
  // Do we have validations
  var validationsString = object.object.validations 
    ? generateValidationLanguage(object.object.validations, context, ruleIndex, index)
    : '';

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

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    ruleIndex: ruleIndex,
    object: context.object ? context.object : ['object', key].join('.'),
    validations: validationsString, 
    customValidations: customValidationsString,
    skipOnWrongType: skipOnWrongType 
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

var generateValidationLanguage = function(validations, context, ruleIndex, index) {
  var validationTemplate = M(function(){/***
    if(typeof _object == 'number' && ({{validation}}) && context.failOnFirst) {
      throw new ValidationError('number fails validation {{rule}}', _path, rules[{{ruleIndex}}], _object);
    } else if(typeof _object == 'number' && ({{validation}})) {
      errors.push(new ValidationError('number fails validation {{rule}}', _path, rules[{{ruleIndex}}], _object));
    }
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('_object <= %s', validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('_object < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('_object > %s', validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('_object >= %s', validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(_object) == -1', validations[operator].toString()));
    } else if(operator === '$multipleOf') {
      valueValidations.push(f('(_object % %s) != 0', validations[operator]));
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