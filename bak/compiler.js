"use strict"

var f = require('util').format;

class Compiler {
  compile(schema, context, options) {
    // The context and options
    context = context || {};
    options = options || {};
    // Compile the validation
    var functionString = compile(schema, context, options);
    console.log("#######################################################")
    console.log(functionString)

    // Variables used in the eval
    var func = null;
    var rules = schema.rules;

    // Compile the function
    eval(functionString)

    // Return the validation function
    return {
      validate: function(obj, callback) {
        if(typeof callback == 'number') {
          return func(obj, callback);
        }

        return new Promise(function(resolve, reject) {
          func(obj, function(err) {
            resolve(err);
          });
        });
      }
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
var compile = function(schema, context, options) {
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
      statements.push(f(validationFunction, createExistsValidation(rule, i, options).trim()));
    }

    // If we have a type specificed validate it
    if(rule.type) {
      statements.push(f(validationFunction, createTypeValidation(rule, i, context, options).trim()));
    }

    // Basic type validations
    if(rule.validation) {
      statements.push(f(validationFunction, createBasicValidation(rule, i, options).trim()));
    }

    // // Custom type validations
    // if(rule.type != null
    //   && typeof rule.type == 'object'
    //   && typeof rule.type.validate == 'function') {
    //     statements.push(createCustomValidation(rule, i, options));
    // }
  }

  // Return the code
  return f(validationFunctionsAsync, statements.join(''));
}

var validationFunction = `
    var _func = %s
    validations.push(_func);
`

var validationFunctionsSync = `
  var validate = function(object, options, callback) {
    if(typeof options == 'function') callback = options, options = {};
    options = options || {};

    // Do we return on the first error
    var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;

    // All the state variables used
    var errors = [];
    var validations = [];
    var index = 0;
    %s

    // The list of validation
    if(validations.length == 0) {
      return callback(null, []);
    }

    // Execute validation
    var execute = function(_validations, _callback) {
      // All done with the validations are done
      if(_validations.length == 0) {
        return _callback(errors);
      }

      // Get the validation
      var validation = _validations.shift();
      // Execute the validation
      validation(object, context, function(err) {

        // Do we have an array of errors, add to the list
        if(Array.isArray(err)) {
          errors = errors.concat(err);
        } else if(err) {
          errors.push(err);
        }

        // If we stop at first error return
        if(errorOnFirst) {
          return _callback(errors);
        }

        // Execute the next validation
        execute(_validations, _callback);
      });
    }

    // Get all validations to perform
    var validationsLeft = validations.slice(0);

    // Execute the validation
    execute(validationsLeft, callback);
  };

  func = validate;
`

var validationFunctionsAsync = `
  var validate = function(object, callback) {
    var errors = [];
    var validations = [];
    %s

    // The list of validation
    if(validations.length == 0) {
      return callback(null, []);
    }

    // Get the number of validations to perform
    var left = validations.length;

    // Execute all the validations
    for(var i = 0; i < validations.length; i++) {
      // Execute the validation
      validations[i](object, context, function(err) {
        left = left - 1;

        // Do we have an array of errors, add to the list
        if(Array.isArray(err)) {
          errors = errors.concat(err);
        } else if(err) {
          errors.push(err);
        }

        // Return all the errors
        if(left == 0) {
          callback(errors);
        }
      });
    }
  };

  func = validate;
`

// //
// // Custom type validation generator
// //
// var createCustomValidation = function(rule, i, options) {
//   options = options || {};
//
//   // Error on first
//   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
//
//   // Turn custom validation into a string
//   var code = rule.type.validate.toString();
//
//   // Lets create the validator name
//   var paths = rule.path.split('.');
//   paths.shift();
//   paths.push(i);
//   var name = paths.join('');
//
//   // Create the statement for exists
//   return f(customValidation
//     , name, code
//     , name, rule.path
//     , !errorOnFirst
//     , rule.path, i
//     , rule.path, i);
// }
//
// var customValidation = `
//     // Name the custom validator function
//     var custom%sValidator = %s;
//
//     // Execute the validation
//     var result = custom%sValidator(object%s);
//     result = Array.isArray(result) ? result :
//       (result != null ? [result] : []);
//
//     // We have an error and want to abort on the first failed validation
//     if(result.length > 0 && %s) {
//       errors.push(new CustomValidationError('field %s fails custom validation', rules[%s], result));
//     } else if(result.length > 0) {
//       throw new CustomValidationError('field %s fails custom validation', rules[%s], result);
//     }`

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
      , rule.path
      , i);
  } else {
    throw new Error('compiler only supports validation expressions for basic types');
  }
}

var basicValidation = `
    function(object, context, callback) {
      if(%s) {
        return callback(new ValidationError('field %s fails validation', rules[%s]));
      }

      callback();
    }`

// var basicValidation = `
//     if(%s && %s) {
//       errors.push(new ValidationError('field %s fails validation', rules[%s]));
//     } else if(%s) {
//       throw new ValidationError('field %s fails validation', rules[%s]);
//     }`

// Must not contain these types
var illegalOperations = function(illegalOps, validation) {
  for(var name in validation) {
    if(illegalOps.indexOf(name) != -1) return true;
  }

  return false;
}

//
// Type validation generator
//
var createTypeValidation = function(rule, i, context, options) {
  options = options || {};
  // Error on first
  var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;

  // Split up the path
  var paths = rule.path.split('.');
  paths.shift();

  // Get the type
  var type = rule.type;

  // Add the type to the context under the path
  context[i] = {'type': type};

  // Statements
  var exists = [];
  var currentPath = [];

  // Exercise the path
  for(let field of paths) {
    currentPath.push(field);
    exists.push(f('object.%s != null', currentPath.join('.')));
  }

  // Add type the check
  if(type.name == 'Number') {
    exists.push(f('!(typeof object.%s == "number")', currentPath.join('.')));
  } else if(type.name == 'String') {
    exists.push(f('!(typeof object.%s == "string")', currentPath.join('.')));
  } else if(type.name == 'Boolean') {
    exists.push(f('!(typeof object.%s == "boolean")', currentPath.join('.')));
  } else if(type.name == 'Date') {
    exists.push(f('!(typeof object.%s instanceof Date)', currentPath.join('.')));
  } else {
    exists.push(f('!(context[%s].type.prototype.isPrototypeOf(object.%s))', i, currentPath.join('.')));
  }

  // Create the statement for exists
  return f(typeValidation
    , exists.join(' && ')
    , rule.path
    , type
    , i);
}

var typeValidation = `
    function(object, context, callback) {
      if(%s) {
        return callback(new ValidationError('field %s is not of expected type %s', rules[%s]));
      }

      callback();
    }`

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
    , rule.path
    , i);
}

var existsValidation = `
    function(object, context, callback) {
      if(%s) {
        return callback(new ValidationError('field %s does not exist', rules[%s]));
      }

      callback();
    }`

module.exports = Compiler;
