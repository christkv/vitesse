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
      if((object == null || typeof object != 'object' || Array.isArray(object)) && {{skipOnWrongType}} && context.failOnFirst) {
        throw new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object);
      } else if((object == null || typeof object != 'object' || Array.isArray(object)) && {{skipOnWrongType}}) {       
        errors.push(new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object));
      }

      if((object == null || typeof object != 'object' || Array.isArray(object)) && !{{skipOnWrongType}}) {
        return;
      }

      // Not possible to perform any validations on the object as it does not exist
      if(object == null) return;
      // Prohibits fields override
      {{prohibits}}
      // Requires fields override
      {{requires}}
      // Validations
      {{validations}}
      // Field name pattern validation
      {{patternValidation}}
      // Custom validations
      {{customValidations}}
      // Perform validations on object fields
      {{statements}}
    }
  ***/});

  // Skip validation
  var skipOnWrongType = typeof object.object.skipOnWrongType === 'boolean'
    ? !object.object.skipOnWrongType : true;

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

  // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
  // console.dir(object)

  //
  // Patterns where passed in to validate field names
  // ---------------------------------------------
  var patternValidationString = (object.object.patternProperties != null 
    && typeof object.object.patternProperties == 'object') 
      || (object.object.additionalProperties != null) 
        ? generateFieldValidationPattern(object.object, context, ruleIndex)
        : ''; 

  //
  // Generate requires
  // ---------------------------------------------

  // Do we have validations
  var requiresString = Array.isArray(object.object.required)
    ? generateRequires(object.object.required, context, ruleIndex)
    : '';

  //
  // Generate prohibited
  // ---------------------------------------------

  // Do we have validations
  var prohibitsString = Array.isArray(object.object.prohibited)
    ? generateProhibited(object.object.prohibited, context, ruleIndex)
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
    requires: requiresString,
    prohibits: prohibitsString,
    skipOnWrongType: skipOnWrongType,
    patternValidation: patternValidationString
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

var generateFieldValidationPattern = function(schema, context, ruleIndex) {
  // console.log("@@@@@@@@@@@@@@@@@@@@@@@@ 0")
  // Unpack the fields
  var fieldPatterns = schema.patternProperties || {};
  var additionalFields = schema.additionalProperties || {};
  var fields = schema.fields || {};

  // Create properties fields
  var properties = Object.keys(fields);
  var patterns = Object.keys(fieldPatterns);

  var validationTemplate = M(function(){/***
    // Get the object field names
    var propertyNames = Object.keys(object);

    // Remove any specified fields
    var fieldNames = {{properties}};

    // Remove any fieldNames from properties
    for(var i = 0; i < fieldNames.length; i++) {
      var index = propertyNames.indexOf(fieldNames[i]);

      if(index != -1) {
        propertyNames.splice(index, 1);
      }
    }

    // Iterate over all the keys
    for(var i = 0; i < propertyNames.length; i++) {
      var key = propertyNames[i];
      var valid = {{valid}};
      var numberOfNonMatches = 0;
      var totalMatches = {{totalMatches}};

      // Validate if it exists in the defined properties
      if(fieldNames.indexOf(key) != -1) continue;

      // All the regexp patterns
      {{statements}}
  
      // All patters failed, skip
      if(numberOfNonMatches == totalMatches) {
        continue;
      }

      // If we are not valid print out an error
      if(!valid && context.failOnFirst) {
        throw new ValidationError('field ' + key + ' failed pattern validation', path, rules[{{ruleIndex}}], object);
      } else if(!valid) {
        errors.push(new ValidationError('field ' + key + ' failed pattern validation', path, rules[{{ruleIndex}}], object));
      } else if(valid) {
        {{additionalPropertiesValidation}}  
      }

    }
  ***/});

  var patternValidationTemplate = M(function(){/***
    // Contain the validation pattern
    var pattern = /{{pattern}}/;
    // Perform the validation
    var match = key.match(pattern) != null;
    // Increase the number of non matches
    if(!match) numberOfNonMatches = numberOfNonMatches + 1;
    // OR the valid statement
    valid = valid || match;
    // We have a match validate the field object
    if(match) {
      {{match}}
    }
  ***/});

  // Set up the statements
  var statements = [];

  // Go over the pattern
  for(var name in fieldPatterns) {
    // Create inner context
    var innerContext = {
      functions: context.functions,
      functionCallContexts: [],
      index: context.index,
      ruleIndex: context.ruleIndex,
      rules: context.rules,
      regexps: context.regexps,
      custom: context.custom,
      generatedField: 'path + "." + key',
      object: 'object[key]'
    }

    // console.log("--------------------------------------------------- S :: " + name)
    var match = generatePatternMatch(name, fieldPatterns[name], schema, innerContext, ruleIndex).join('\n');
    // console.log(match)
    // console.log("--------------------------------------------------- E")

    statements.push(Mark.up(patternValidationTemplate, {
      pattern:name,
      match: match
    }));
  }

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: context.index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom,
    generatedField: 'path + "." + key',
    object: 'object[key]'
  }

  // additionalPropertiesValidation
  var additionalPropertiesValidation = (schema.additionalProperties != null && typeof schema.additionalProperties == 'object') 
    ? generateAdditionalPropertiesValidation(schema, innerContext, ruleIndex) 
    : [];

  // Prepare the validation pattern
  var validation = Mark.up(validationTemplate, {
    statements: statements.join('\n'),
    properties: JSON.stringify(properties),
    additionalPropertiesValidation: additionalPropertiesValidation.join('\n'),
    ruleIndex: ruleIndex,
    valid: statements.length > 0 ? 'false' : 'true',
    totalMatches: statements.length
  });

  // console.log("------------------------------------------------------------------------- START")
  // console.log(validation)
  // console.log("------------------------------------------------------------------------- END")

  return validation;  
}

var generatePatternMatch = function(field, rule, schema, context, ruleIndex) {
  // Set the key field
  var key = 'key';
  var path = [''];

  // console.log("############################################################# generatePatternMatch")
  // console.dir(rule)

  // Check if we have a rule
  if(rule instanceof ArrayType) {
    ArrayValidator.generate(key, rule, path, context);
  } else if(rule instanceof NestedArrayType) {
    NestedArrayValidator.generate(key, rule, path, context, generate);
  } else if(rule instanceof StringType) {
    StringValidator.generate(key, rule, path, context);
  } else if(rule instanceof NumberType) {
    NumericValidator.generate(key, rule, path, context);
  } else if(rule instanceof IntegerType) {
    IntegerValidator.generate(key, rule, path, context);
  } else if(rule instanceof BooleanType) {
    BooleanValidator.generate(key, rule, path, context);
  } else if(rule instanceof DocumentType) {
    generate(key, rule, path, context);
  } else if(rule instanceof OneOfType) {
    OneOfValidator.generate(key, rule, path, context);
  } else if(rule instanceof AllOfType) {
    AllOfValidator.generate(key, rule, path, context);
  } else if(rule instanceof AnyOfType) {
    AnyOfValidator.generate(key, rule, path, context);
  } else if(rule instanceof NotType) {
    NotValidator.generate(key, rule, path, context);
  } else {
    throw new Error('type not supported for pattern match object generation');
  }

  return context.functionCallContexts.length > 0 ? context.functionCallContexts : [];
}

var generateAdditionalPropertiesValidation = function(schema, context, ruleIndex) {
  var rule = schema.additionalProperties || {};

  // Generate the additional fields
  if(rule != null && typeof rule == 'object') {

    // Set the key field
    var key = 'key';
    var path = [''];

    // Check if we have a rule
    if(rule instanceof ArrayType) {
      ArrayValidator.generate(key, rule, path, context);
    } else if(rule instanceof NestedArrayType) {
      NestedArrayValidator.generate(key, rule, path, context, generate);
    } else if(rule instanceof StringType) {
      StringValidator.generate(key, rule, path, context);
    } else if(rule instanceof NumberType) {
      NumericValidator.generate(key, rule, path, context);
    } else if(rule instanceof IntegerType) {
      IntegerValidator.generate(key, rule, path, context);
    } else if(rule instanceof BooleanType) {
      BooleanValidator.generate(key, rule, path, context);
    } else if(rule instanceof DocumentType) {
      generate(key, rule, path, context);
    } else if(rule instanceof OneOfType) {
      OneOfValidator.generate(key, rule, path, context);
    } else if(rule instanceof AllOfType) {
      AllOfValidator.generate(key, rule, path, context);
    } else if(rule instanceof AnyOfType) {
      AnyOfValidator.generate(key, rule, path, context);
    } else if(rule instanceof NotType) {
      NotValidator.generate(key, rule, path, context);
    }
  }

  return context.functionCallContexts;
}

var generateProhibited = function(prohibited, context, ruleIndex) {
  var validationTemplate = M(function(){/***
    var prohibited = {{prohibited}};
    var valid = true;

    // Iterate over all the keys
    for(var i = 0; i < prohibited.length; i++) {
      if(object[prohibited[i]] !== undefined) {
        valid = false;
        break;
      }
    }

    if(!valid && context.failOnFirst) {
      throw new ValidationError('object has prohibited fields {{prohibited}}', path, rules[{{ruleIndex}}], object);
    } else if(!valid) {
      errors.push(new ValidationError('object has prohibited fields {{prohibited}}', path, rules[{{ruleIndex}}], object));
    } 
  ***/});

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: ruleIndex, 
    prohibited: JSON.stringify(prohibited)
  }); 
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