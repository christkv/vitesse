"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var ArrayType = require('../ast').ArrayType,
  NestedArrayType = require('../ast').NestedArrayType,
  StringType = require('../ast').StringType,
  NumberType = require('../ast').NumberType,
  IntegerType = require('../ast').IntegerType,
  DocumentType = require('../ast').DocumentType; 

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  IntegerValidator = require('./integer'),
  NestedArrayValidator = require('./nested_array'),
  ExistsValidator = require('./exists');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, generateDocumentType) {
  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  var validations = object.object.validations;

  // Push to rules
  context.rules.push(object);

  // Get the original field path
  var originalFieldPath = path.slice(0);

  // Validation template
  var validationTemplate = M(function(){/***
    var array_validation{{index}} = function(path, object, context) {
      if(object == undefined) return;

      if(!Array.isArray(object) && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object);
      } else if(!Array.isArray(object)) {       
        errors.push(new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object));
      }

      // Generated from validation language
      {{validations}}
      // Custom validations
      {{customValidations}}
      // Execute all field level validations
      for(var i = 0; i < object.length; i++) {
        {{statements}}
      }
    }
  ***/});

  // Set the validation
  var validation = '';

  // Generate the validation
  if(validations) {
    validation = Utils.generateArrayValidation('object', 
        'path',
        ruleIndex, 
        validations)
  }

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom,
    generatedField: f("generatePath(path, i)")
  }

  // The innermost parent object used
  path = path.slice(0);
  var innermostParent = path.pop();

  // Override the field
  if(context.generatedField) {
    path.push(context.generatedField);  
  } else {
    path.push(f('%s[i]', innermostParent));   
  }

  // Generate the document type
  if(object.object.of instanceof DocumentType) {
    generateDocumentType(key, object.object.of, path, innerContext);
  } else if(object.object.of instanceof StringType) {
    // Generate the key and path correctly
    innerContext.object = 'object[i]';
    // Generate string validation
    StringValidator.generate(key, object.object.of, path, innerContext);
  } else if(object.object.of instanceof NumberType) {
    // Generate the key and path correctly
    innerContext.object = 'object[i]';
    // Generate string validation
    NumericValidator.generate(key, object.object.of, path, innerContext);
  } else if(object.object.of instanceof IntegerType) {
    // Generate the key and path correctly
    innerContext.object = 'object[i]';
    // Generate string validation
    IntegerValidator.generate(key, object.object.of, path, innerContext);
  }

  //
  // Generate custom validation functions
  // ---------------------------------------------

  // Do we have custom validations
  var customValidationsString = object.object.custom
    ? Utils.generateCustomValidations(object.object.custom, context, ruleIndex, index)
    : '';

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex, 
    path: f(" '%s'", originalFieldPath.join('.')),
    validations: validation,
    customValidations: customValidationsString
  });

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = "array_validation{{index}}({{path}}, {{object}}, context);"
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Set up the final
  var finalPath = f("'%s'", path.join('.'));

  // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("path + '.{{key}}'", {key: key});
  }

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: ['object', key].join('.')
  }));

  // Push the final function to the tree
  context.functions.push(final);

  // Adjust the context
  context.index = innerContext.index;
  context.ruleIndex = innerContext.ruleIndex; 
}

module.exports = Validator;