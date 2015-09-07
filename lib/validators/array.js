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
  NullType = require('../ast').NullType,
  BooleanType = require('../ast').BooleanType,
  DocumentType = require('../ast').DocumentType; 

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  IntegerValidator = require('./integer'),
  BooleanValidator = require('./boolean'),
  NullValidator = require('./null'),
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
      if(!(object === undefined)) {
        if(!Array.isArray(object) && {{performTypeCheck}} && context.failOnFirst) {
          throw new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object);
        } else if(!Array.isArray(object) && {{performTypeCheck}}) {       
          errors.push(new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object));
        }

        if((object == null || typeof object != 'object' || !Array.isArray(object))) {
          return;
        }

        // Generated from validation language
        {{validations}}
        // Custom validations
        {{customValidations}}
        // Uniqueness validation
        {{uniquenessValidation}}
        // Indexed validations
        {{indexedValidations}}
        // Execute all field level validations
        for(var i = 0; i < object.length; i++) {
          {{statements}}
        }
      }
    }
  ***/});

  // Set the validation
  var validation = '';

  // Skip validation
  var performTypeCheck = typeof object.object.performTypeCheck === 'boolean'
    ? object.object.performTypeCheck : true;

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
    generatedField: f("generatePath(path, i)"),
    objectMetaData: context.objectMetaData
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

  // Contains the string of indexed validations
  var indexedValidations = '';
  var indexedFunctionCallContexts = [];
  var schemas = Array.isArray(object.object.of) ? object.object.of : [object.object.of];

  for(var i = 0; i < schemas.length; i++) {
    // Get the schema
    var of = schemas[i];
    // Generate the key and path correctly
    innerContext.object = 'object[i]';

    // Generate the document type
    if(of instanceof DocumentType) {
      generateDocumentType(key, of, path, innerContext);
    } else if(of instanceof StringType) {
      StringValidator.generate(key, of, path, innerContext);
    } else if(of instanceof NumberType) {
      NumericValidator.generate(key, of, path, innerContext);
    } else if(of instanceof NullType) {
      NullValidator.generate(key, of, path, innerContext);
    } else if(of instanceof BooleanType) {
      BooleanValidator.generate(key, of, path, innerContext);
    } else if(of instanceof IntegerType) {
      IntegerValidator.generate(key, of, path, innerContext);
    } else if(of && typeof of.index == 'number' && of.schema != null) {
      // Generate the key and path correctly
      innerContext.object = f('object[%s]', of.index);
      // To check if we have a function call context
      var functionCallContextsLength = innerContext.functionCallContexts.length;

      // Execute the schema
      if(of.schema instanceof DocumentType) {
        generateDocumentType(key, of.schema, path, innerContext);
      } else if(of.schema instanceof StringType) {
        StringValidator.generate(key, of.schema, path, innerContext);
      } else if(of.schema instanceof NumberType) {
        NumericValidator.generate(key, of.schema, path, innerContext);
      } else if(of.schema instanceof BooleanType) {
        BooleanValidator.generate(key, of.schema, path, innerContext);
      } else if(of.schema instanceof IntegerType) {
        IntegerValidator.generate(key, of.schema, path, innerContext);
      }

      if(innerContext.functionCallContexts.length > functionCallContextsLength) {
        indexedFunctionCallContexts.push(innerContext.functionCallContexts.pop());
      }
    } else if(of && typeof of.validations && of.schema != null) {
      // To check if we have a function call context
      var functionCallContextsLength = innerContext.functionCallContexts.length;

      // Execute the schema
      if(of.schema instanceof DocumentType) {
        generateDocumentType(key, of.schema, path, innerContext);
      } else if(of.schema instanceof StringType) {
        StringValidator.generate(key, of.schema, path, innerContext);
      } else if(of.schema instanceof NumberType) {
        NumericValidator.generate(key, of.schema, path, innerContext);
      } else if(of.schema instanceof BooleanType) {
        BooleanValidator.generate(key, of.schema, path, innerContext);
      } else if(of.schema instanceof IntegerType) {
        IntegerValidator.generate(key, of.schema, path, innerContext);
      }

      if(innerContext.functionCallContexts.length > functionCallContextsLength) {
        innerContext.functionCallContexts.push(generateConditionalValidation(innerContext, of.validations, innerContext.functionCallContexts.pop()));
      }
    }
  }

  //
  // Generate custom validation functions
  // ---------------------------------------------

  // Do we have custom validations
  var customValidationsString = object.object.custom
    ? Utils.generateCustomValidations(object.object.custom, context, ruleIndex, index)
    : '';

  //
  // Generate uniqueness validation function
  // ---------------------------------------------
  // Validation template
  var uniqueValidationTemplate = M(function(){/***
    if(!object.every(testArrays) && context.failOnFirst) {
      throw new ValidationError('array contains duplicate values', path, rules[{{ruleIndex}}], object);
    } else if(!object.every(testArrays)) {      
      errors.push(new ValidationError('array contains duplicate values', path, rules[{{ruleIndex}}], object));
    }
  ***/});


  //
  // Generate indexed schema validations
  // ---------------------------------------------
  indexedValidations = indexedFunctionCallContexts.join('\n\n');

  var uniquenessValidation = object.object.unique
    ? Mark.up(uniqueValidationTemplate, {
      ruleIndex: ruleIndex
    })
    : '';

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex, 
    path: f(" '%s'", originalFieldPath.join('.')),
    validations: validation,
    customValidations: customValidationsString,
    uniquenessValidation: uniquenessValidation,
    performTypeCheck: performTypeCheck,
    indexedValidations: indexedValidations
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
  if(!context.generateedField) {
    finalPath = Mark.up("path + '.{{key}}'", {key: key});
  } else if(context.generatedField && context.rawGeneratedField) {
    finalPath = path.join('.');
  }

  if(context.depth == 0) {
    finalPath = "'object'";
  }

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: context.object ? context.object : ['object', key].join('.')
  }));

  // Push the final function to the tree
  context.functions.push(final);

  // Adjust the context
  context.index = innerContext.index;
  context.ruleIndex = innerContext.ruleIndex; 
}

var generateConditionalValidation = function(context, validations, functionCallContext) {
  // Store validation string parts
  var valueValidations = [];

  var validationTemplate = M(function(){/***
    if({{validation}}) {
      {{functionCallContext}}
    } 
  ***/});

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gte') {
      valueValidations.push(f('i > %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('i < %s', validations[operator]));
    } else {
      throw new Error(f('validation operator %s is not supported by Object type', operator));
    }
  }  

  // Generate the validation code
  return Mark.up(validationTemplate, {
    functionCallContext: functionCallContext,
    validation: valueValidations.join(' || ')
  });  
}

module.exports = Validator;