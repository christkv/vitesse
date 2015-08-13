"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, options) {
  options = options || {};

  var functionTemplate = `
    var string_validation{{index}} = function(path, object, context) {
      if(object == undefined) return;

      if(!(typeof object == 'string') && context.failOnFirst) {
        throw new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object);
      } else if(!(typeof object == 'string')) {
        errors.push(new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object));
      }
      {{validations}}
      {{customValidations}}
    }
  `

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
  var callTemplate = `string_validation{{index}}({{path}}, {{object}}, context);`
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
  var validationTemplate = `
    if(typeof object == 'string' && ({{validation}}) && context.failOnFirst) {
      throw new ValidationError('string fails validation {{rule}}', path, rules[{{ruleIndex}}], object);       
    } else if(typeof object == 'string' && ({{validation}})) {
      errors.push(new ValidationError('string fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
    }
  `;

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('object.length <= %s', validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('object.length < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('object.length > %s', validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('object.length >= %s', validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(object) == -1', Utils.generateArray(validations[operator])));
    } else if(operator === '$regexp') {
      // Add the value validation
      valueValidations.push(f('regexps[%s].test(object) == false', index));
      // Add the validation to the regexp object
      context.regexps[index] = validations[operator];
    } else {
      throw new Error(f('validation operator %s is not supported by String type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: ruleIndex, 
    index: index, 
    rule: JSON.stringify(validations, function(k, v) {
      if(k == '$regexp') {
        return v.toString();
      }

      return v;
    }),
    validation: valueValidations.join(' || ')
  }); 
}

module.exports = Validator;
