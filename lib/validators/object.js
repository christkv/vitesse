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
  BooleanType = require('../ast').BooleanType,
  DocumentType = require('../ast').DocumentType,
  OneOfType = require('../ast').OneOfType,
  AllOfType = require('../ast').AllOfType,
  AnyOfType = require('../ast').AnyOfType,
  NotType = require('../ast').NotType;

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  IntegerValidator = require('./integer'),
  BooleanValidator = require('./boolean'),
  NestedArrayValidator = require('./nested_array'),
  ExistsValidator = require('./exists'),
  ArrayValidator = require('./array'),
  OneOfValidator = require('./one_of'),
  AllOfValidator = require('./all_of'),
  AnyOfValidator = require('./any_of'),
  NotValidator = require('./not');

var Validator = function() {
}

Validator.generate = function generate(key, object, path, context, generateDocumentType) {
  // Get all the keys
  var keys = object.keys();

  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push to rules
  context.rules.push(object);

  // Need the first rule to be duplicated
  if(context.depth == 0) {
    context.rules.push(object);    
  }

  // Validation template
  var validationTemplate = M(function(){/***
    var object_validation{{index}} = function(path, object, context) {
      if((object == null || typeof object != 'object') && context.failOnFirst) {
        throw new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object);
      } else if(object == null || typeof object != 'object') {       
        errors.push(new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object));
      }

      // Not possible to perform any validations on the object as it does not exist
      if(object == null) return;
      // Requires fields override
      {{requires}}
      // Validations
      {{validations}}
      // Custom validations
      {{customValidations}}
      // Perform validations on object fields
      {{statements}}
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
    custom: context.custom
  }

  // Iterate over all the document keys
  keys.forEach(function(key) {
    // Get the rule
    var rule = object.value(key);
    var p = path.slice(0);
    p.push(key)

    // Do we have an exists statement
    if(rule.object.exists) {
      ExistsValidator.generate(key, rule, p, innerContext);
    } else if(rule.options && rule.options.exists) {
      ExistsValidator.generate(key, rule, p, innerContext);
    }

    // Check if we have a rule
    if(rule instanceof ArrayType) {
      ArrayValidator.generate(key, rule, p, innerContext, generate);
    } else if(rule instanceof NestedArrayType) {
      NestedArrayValidator.generate(key, rule, p, innerContext, generate);
    } else if(rule instanceof StringType) {
      StringValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof NumberType) {
      NumericValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof IntegerType) {
      IntegerValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof BooleanType) {
      BooleanValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof DocumentType) {
      generate(key, rule, path, innerContext);
    } else if(rule instanceof OneOfType) {
      OneOfValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof AllOfType) {
      AllOfValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof AnyOfType) {
      AnyOfValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof NotType) {
      NotValidator.generate(key, rule, path, innerContext);
    }
  });

  // Get the adjusted values
  context.ruleIndex = innerContext.ruleIndex;
  context.index = innerContext.index;

  //
  // Generate requires
  // ---------------------------------------------

  // Do we have validations
  var requiresString = object.object.required 
    ? generateRequires(object.object.required, context, ruleIndex)
    : '';


  //
  // Generate validation language
  // ---------------------------------------------

  // Do we have validations
  var validationsString = object.object.validations 
    ? generateValidationLanguage(object.object.validations, context, ruleIndex)
    : '';

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
    customValidations: customValidationsString,
    validations: validationsString,
    requires: requiresString
  });

  // Add to list of functions
  context.functions.push(final);

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = "object_validation{{index}}({{path}}, {{object}}, context);"
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
    object: context.object ? context.object : objectPath
  }));
}

var generateRequires = function(required, context, ruleIndex) {
  var validationTemplate = M(function(){/***
    var required = {{required}};
    var valid = true;

    // Iterate over all the keys
    for(var i = 0; i < required.length; i++) {
      if(object[required[i]] === undefined) {
        valid = false;
        break;
      }
    }

    if(!valid && context.failOnFirst) {
      throw new ValidationError('object is missing required fields {{required}}', path, rules[{{ruleIndex}}], object);
    } else if(!valid) {
      errors.push(new ValidationError('object is missing required fields {{required}}', path, rules[{{ruleIndex}}], object));
    } 
  ***/});

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: ruleIndex, 
    required: JSON.stringify(required)
  }); 
}

var generateValidationLanguage = function(validations, context, ruleIndex) {
  var validationTemplate = M(function(){/***
    if(typeof object == 'object' && ({{validation}}) && context.failOnFirst) {
      throw new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object);
    } else if(typeof object == 'object' && ({{validation}})) {
      errors.push(new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
    } 
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gte') {
      valueValidations.push(f('Object.keys(object).length < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('Object.keys(object).length > %s', validations[operator]));
    } else {
      throw new Error(f('validation operator %s is not supported by Object type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: ruleIndex, 
    rule: JSON.stringify(validations),
    validation: valueValidations.join(' || ')
  }); 
}

module.exports = Validator;