"use strict"

var f = require('util').format;

class Compiler {
  compile(schema, options) {
    // Compile the validation
    var functionString = compile(schema, options);
    console.log("#######################################################")
    console.log(functionString)

    // Variables used in the eval
    var func = null;
    var rules = schema.rules;
    // Compile the function
    eval(functionString)
    // Return the validation function
    return {
      validate: func
    }
  }
}

class ValidationError {
  constructor(message, rule) {
    this.message = message;
    this.rule = rule;
  }
}

class CustomValidationError {
  constructor(message, rule, errors) {
    this.message = message;
    this.rule = rule;
    this.errors = errors;
  }
}

// Compile the schema into a text string
var compile = function(schema, options) {
  options = options || {};
  // Error on first
  var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
  // All validation string statements
  var statements = [];

  // for(let rule of schema.rules) {
  for(var i = 0; i < schema.rules.length; i++) {
    var rule = schema.rules[i];

    // Create the statement for exists
    if(rule.exists) {
      statements.push(createExistsValidation(rule, i, options));
    }

    // Basic type validations
    if(rule.validation) {
      statements.push(createBasicValidation(rule, i, options));
    }

    // Custom type validations
    if(rule.type != null
      && typeof rule.type == 'object'
      && typeof rule.type.validate == 'function') {
        statements.push(createCustomValidation(rule, i, options));
    }
  }

  // Return the code
  return f(validationFunction, statements.join('\n'));
}

var validationFunction = `
  var validate = function(object) {
    var errors = [];
    %s

    return errors;
  };

  func = validate;
`

//
// Custom type validation generator
//
var createCustomValidation = function(rule, i, options) {
  options = options || {};

  // Error on first
  var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;

  // Turn custom validation into a string
  var code = rule.type.validate.toString();

  // Lets create the validator name
  var paths = rule.path.split('.');
  paths.shift();
  paths.push(i);
  var name = paths.join('');

  // Create the statement for exists
  return f(customValidation
    , name, code
    , name, rule.path
    , !errorOnFirst
    , rule.path, i
    , rule.path, i);
}

var customValidation = `
    // Name the custom validator function
    var custom%sValidator = %s;

    // Execute the validation
    var result = custom%sValidator(object%s);
    result = Array.isArray(result) ? result :
      (result != null ? [result] : []);

    // We have an error and want to abort on the first failed validation
    if(result.length > 0 && %s) {
      errors.push(new CustomValidationError('field %s fails custom validation', rules[%s], result));
    } else if(result.length > 0) {
      throw new CustomValidationError('field %s fails custom validation', rules[%s], result);
    }`

//
// Basic type validation language generator
//
var createBasicValidation = function(rule, i, options) {
  options = options || {};

  // Error on first
  var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;

  // Ensure only supported types are used
  if(rule.type === Number
    || rule.type === String
    || rule.type === Boolean) {

    // Statements compiled into final validation
    var statements = [];
    var validation = rule.validation;

    // Valid operators for a numeric value
    if(rule.type !== Number &&
      illegalOperations(['$gt', '$gte', '$lt', '$lte'], validation)) {
        throw new Error('compiler does not support $gt, $gte, $lt, $lte for non numeric types');
    }

    for(var name in validation) {
      // We need to parse the validation statement
      if(name == '$gt') {
        statements.push(f('object%s > %s', rule.path, validation[name]));
      } else if(name == '$gte') {
        statements.push(f('object%s >= %s', rule.path, validation[name]));
      } else if(name == '$lte') {
        statements.push(f('object%s <= %s', rule.path, validation[name]));
      } else if(name == '$lt') {
        statements.push(f('object%s < %s', rule.path, validation[name]));
      } else if(name == '$eq') {
        statements.push(f('object%s == %s', rule.path, validation[name]));
      }
    }

    // Create the statement for exists
    return f(basicValidation
      , f('!(%s)', statements.join(' && '))
      , !errorOnFirst
      , rule.path
      , i
      , f('!(%s)', statements.join(' && '))
      , rule.path
      , i);
  } else {
    throw new Error('compiler only supports validation expressions for basic types');
  }
}

var basicValidation = `
    if(%s && %s) {
      errors.push(new ValidationError('field %s fails validation', rules[%s]));
    } else if(%s) {
      throw new ValidationError('field %s fails validation', rules[%s]);
    }`

// Must not contain these types
var illegalOperations = function(illegalOps, validation) {
  for(var name in validation) {
    if(illegalOps.indexOf(name) != -1) return true;
  }

  return false;
}

//
// Exists validation generator
//
var createExistsValidation = function(rule, i, options) {
  options = options || {};
  // Error on first
  var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;

  // Split up the path
  var paths = rule.path.split('.');
  paths.shift();

  // Statements
  var exists = [];
  var currentPath = [];

  // Exercise the path
  for(let field of paths) {
    currentPath.push(field);
    exists.push(f('object.%s == null', currentPath.join('.')));
  }

  // Create the statement for exists
  return f(existsValidation
    , exists.join(' && ')
    , !errorOnFirst
    , rule.path
    , i
    , exists.join(' && ')
    , rule.path
    , i);
}

var existsValidation = `
    if(%s && %s) {
      errors.push(new ValidationError('field %s does not exist', rules[%s]));
    } else if(%s) {
      throw new ValidationError('field %s does not exist', rules[%s]);
    }`

module.exports = Compiler;
