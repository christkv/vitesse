"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var ArrayType = require('../ast').ArrayType,
  NestedArrayType = require('../ast').NestedArrayType,
  StringType = require('../ast').StringType,
  NumberType = require('../ast').NumberType,
  BooleanType = require('../ast').BooleanType,
  DocumentType = require('../ast').DocumentType,
  IntegerType = require('../ast').IntegerType;

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  IntegerValidator = require('./integer'),
  BooleanValidator = require('./boolean'),
  NestedArrayValidator = require('./nested_array'),
  ExistsValidator = require('./exists'),
  ArrayValidator = require('./array');

var Validator = function() {
}

Validator.generate = function generate(key, object, path, context, generateDocumentType) {
  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  var validations = object.object.validations;

  // Push to rules
  context.rules.push(object);

  // Validation template
  var validationTemplate = M(function(){/***
    var any_of_validation{{index}} = function(path, object, context) {
      // Not possible to perform any validations on the object as it does not exist
      if(object === undefined) return;
      // Total validations that were successful
      var successfulValidations = 0;
      // Keep track of the local errors
      var currentErrors = errors;
      errors = [];      
      
      // Perform validations on object fields
      {{statements}}

      // Check if we had more than one successful validation
      if(successfulValidations == 0 && context.failOnFirst) {
        throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[{{ruleIndex}}], object, errors);
      } else if(successfulValidations == 0 && !context.failOnFirst) {
        currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[{{ruleIndex}}], object, errors));
      }

      // Reset the errors
      errors = currentErrors;
    }
  ***/});

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom,
    object: 'object',
    objectMetaData: context.objectMetaData
  }

  // Iterate over all the document keys
  validations.forEach(function(rule) {
    // Get the rule
    var p = path.slice(0);
    p.push(key)

    // Check if we have a rule
    if(rule instanceof ArrayType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Validation
      ArrayValidator.generate(key, rule, p, innerContext, generate);
    } else if(rule instanceof NestedArrayType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Validation
      NestedArrayValidator.generate(key, rule, p, innerContext, generate);
    } else if(rule instanceof StringType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Validation
      StringValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof NumberType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Validation
      NumericValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof IntegerType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Integer validation
      IntegerValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof BooleanType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Integer validation
      BooleanValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof DocumentType) {
      // Top level context, needs to ensure top level for path and object
      innerContext.generatedField = "'object'";
      innerContext.object = 'object';
      // Get the document validator object (avoid cyclic reference)
      require('./object').generate(key, rule, path, innerContext);
    }
  });

  // Get the adjusted values
  context.ruleIndex = innerContext.ruleIndex;
  context.index = innerContext.index;

  // Statement validation template
  var validationStatementTemplate = M(function(){/***
    var numberOfErrors = errors.length;

    {{statement}}

    if(numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
  ***/});

  // Remap the function calls
  innerContext.functionCallContexts = innerContext.functionCallContexts.map(function(x) {
    return Mark.up(validationStatementTemplate, {
      ruleIndex: ruleIndex,
      statement: x
    });
  });

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex
  });

  // Add to list of functions
  context.functions.push(final);

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = "any_of_validation{{index}}({{path}}, {{object}}, context);"
  // Generate the field
  var field = path.slice(0).pop();

  // If we have a []
  if(field.indexOf('[') != -1) {
    field = field.substr(field.indexOf('['));
  }

  // Object path
  var objectPath = ['object', field].join('');
  // Top level object
  if(context.depth == 0) {
    objectPath = ['object'];
  } else if(field.indexOf('[') == -1) {
    objectPath = ['object', key].join('.');
  }

  // Get the finalPath
  var finalPath = f("'%s'", path.join('.'));

  // Set up the final path
  if(context.generatedField) {
    finalPath = context.generatedField;
  }

   // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("path + '.{{key}}'", {key: key});
  } else {
    finalPath = context.generatedField; 
  }

  if(context.depth == 0) {
    finalPath = "'object'";
  }

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: objectPath
  }));
}

module.exports = Validator;