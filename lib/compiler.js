"use strict"

var f = require('util').format,
  AST = require('./ast');

var Compiler = function(options) {
  options = options || {};
  this.options = options;
  // this.failOnFirst = (typeof options.failOnFirst == 'boolean') ? options.failOnFirst | false;
}

Compiler.prototype.compile = function(ast) {
  // The rules
  var rules = [];
  // Set the options
  this.options.index = 0;
  // Compile the validation
  var functionString = compile(ast, rules, this.options);
  console.log("#######################################################")
  console.log(functionString)

  // Variables used in the eval
  var func = null;

  // Compile the function
  eval(functionString)

  // Return the validation function
  return {
    validate: func
  }
}

// Create the statement
var compileSchema = function(schema, rules, result, options) {
  // Explore entire schema for async method (will require additional code to be generated)
  var keys = schema.keys();
  // Iterate over all the keys
  for(var i = 0; i < keys.length; i++) {
    // Get the field and rule
    var field = keys[i];
    var rule = schema.value(keys[i]);
    // Add rule to rule object
    rules.push(rule);

    // If no type is specified throw an error
    if(rule.type == null) {
      throw new Error('a validation rule must specify a type');
    }

    // Value must exist
    if(rule.exists === true) {
      result.sync.push(createExistsValidation(field, rule, options));
    }

    // We have an async function
    if(typeof rule.customAsync == 'function') {
      async = true;
    } else {

      // Generate code depending on the content
      if(rule.type === Number) {
        result.sync.push(createNativeTypeValidation(field, rule, '!(typeof %s == "number")', options));
      } else if(rule.type === String) {
        result.sync.push(createNativeTypeValidation(field, rule, '!(typeof %s == "string")', options));
      } else if(rule.type === Boolean) {
        result.sync.push(createNativeTypeValidation(field, rule, '!(typeof %s == "boolean")', options));
      } else if(rule.type === Array) {
        result.sync.push(createNativeTypeValidation(field, rule, '!Array.isArray(%s)', options));
      }

      // We have one or more custom validator applied
    }

    // Update option index
    options.index = options.index + 1;
  }
}

// The compile step
var compile = function(schema, rules, options) {
  // Throw an error due to the schema not being an AST
  if(!(schema instanceof AST)) throw new Error('schema not an instance of AST');

  // Result object
  var result = {
    sync: [],
    async: []
  };

  // Set the options async
  options.async = false;

  // Compile the schema
  compileSchema(schema, rules, result, options);

  // Create the sync code
  var syncCode = f(syncTemplate, result.sync.join('\n'));

  // Return final function
  return syncCode;
}

var syncTemplate = `
  var validate = function(object) {
    var errors = [];
    %s

    return errors;
  };

  func = validate;
`

//
// Exists handler
//
var createExistsValidation = function(field, rule, options) {
  var template = `
    if(%s && context.failOnFirst) {
      throw new ValidationError('field %s fails validation', rules[%s]);
    } else if(%s) {
      errors.push(new ValidationError('field %s fails validation', rules[%s]));
    }`

  // Get the index
  var index = options.index;
  // Do we have a parent namespace for this validation
  var parent = options.parent;

  // Object name
  var fieldName = parent
    ? f('object.%s.%s', parent, field)
    : f('object.%s' , field);

  // Get the validation chain
  var validations = generatePathValidation(fieldName);

  // Generate the validation
  var source = f(template,
    validations.join(' && '),
    fieldName,
    index,
    validations.join(' && '),
    fieldName,
    index);

  // log the generated code
  if(options.logger) {
    options.logger.info(f('[INFO] generated exists code for %s: %s', fieldName, source));
  }

  // Return the source
  return source;
}

var generatePathValidation = function(fieldName) {
  // Split up the path
  var paths = fieldName.split('.');
  paths.shift();

  // Statements
  var exists = [];
  var currentPath = [];

  // Exercise the path
  for(let field of paths) {
    currentPath.push(field);
    exists.push(f('object.%s != null', currentPath.join('.')));
  }

  return exists;
}

//
// Number handler
//
var createNativeTypeValidation = function(field, rule, validationTemplate, options) {
  var template = `
    if(%s && context.failOnFirst) {
      throw new ValidationError('field %s fails type validation', rules[%s]);
    } else if(%s) {
      errors.push(new ValidationError('field %s fails type validation', rules[%s]));
    }`

  // Get the index
  var index = options.index;
  // Do we have a parent namespace for this validation
  var parent = options.parent;

  // Object name
  var fieldName = parent
    ? f('object.%s.%s', parent, field)
    : f('object.%s' , field);

  // Get the validation chain
  var validations = generatePathValidation(fieldName);

  // Push the last validation
  validations.push(f(validationTemplate, fieldName));

  // Generate the validation
  var source = f(template,
    validations.join(' && '),
    fieldName,
    index,
    validations.join(' && '),
    fieldName,
    index);

  // log the generated code
  if(options.logger) {
    options.logger.info(f('[INFO] generated number type validation code for %s: %s', fieldName, source));
  }

  // Return the source
  return source;
}

// class Compiler {
//   compile(schema, options) {
//     // Compile the validation
//     var functionString = compile(schema, options);
//     console.log("#######################################################")
//     console.log(functionString)
//
//     // Variables used in the eval
//     var func = null;
//     var rules = schema.rules;
//     // Compile the function
//     eval(functionString)
//     // Return the validation function
//     return {
//       validate: func
//     }
//   }
// }
//
// class ValidationError {
//   constructor(message, rule) {
//     this.message = message;
//     this.rule = rule;
//   }
// }
//
// class CustomValidationError {
//   constructor(message, rule, errors) {
//     this.message = message;
//     this.rule = rule;
//     this.errors = errors;
//   }
// }
//
// // Compile the schema into a text string
// var compile = function(schema, options) {
//   options = options || {};
//   // Error on first
//   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
//   // All validation string statements
//   var statements = [];
//
//   // for(let rule of schema.rules) {
//   for(var i = 0; i < schema.rules.length; i++) {
//     var rule = schema.rules[i];
//
//     // Create the statement for exists
//     if(rule.exists) {
//       statements.push(createExistsValidation(rule, i, options));
//     }
//
//     // If we have a type specificed validate it
//     if(rule.type) {
//       statements.push(createTypeValidation(rule, i, options));
//     }
//
//     // Basic type validations
//     if(rule.validation) {
//       statements.push(createBasicValidation(rule, i, options));
//     }
//
//     // Custom type validations
//     if(rule.type != null
//       && typeof rule.type == 'object'
//       && typeof rule.type.validate == 'function') {
//         statements.push(createCustomValidation(rule, i, options));
//     }
//   }
//
//   // Return the code
//   return f(validationFunction, statements.join('\n'));
// }
//
// var validationFunction = `
//   var validate = function(object) {
//     var errors = [];
//     %s
//
//     return errors;
//   };
//
//   func = validate;
// `
//
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
// //
// // Basic type validation language generator
// //
// var createBasicValidation = function(rule, i, options) {
//   options = options || {};
//
//   // Error on first
//   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
//
//   // Ensure only supported types are used
//   if(rule.type === Number
//     || rule.type === String
//     || rule.type === Boolean) {
//
//     // Statements compiled into final validation
//     var statements = [];
//     var validation = rule.validation;
//
//     // Valid operators for a numeric value
//     if(rule.type !== Number &&
//       illegalOperations(['$gt', '$gte', '$lt', '$lte'], validation)) {
//         throw new Error('compiler does not support $gt, $gte, $lt, $lte for non numeric types');
//     }
//
//     for(var name in validation) {
//       // We need to parse the validation statement
//       if(name == '$gt') {
//         statements.push(f('object%s > %s', rule.path, validation[name]));
//       } else if(name == '$gte') {
//         statements.push(f('object%s >= %s', rule.path, validation[name]));
//       } else if(name == '$lte') {
//         statements.push(f('object%s <= %s', rule.path, validation[name]));
//       } else if(name == '$lt') {
//         statements.push(f('object%s < %s', rule.path, validation[name]));
//       } else if(name == '$eq') {
//         statements.push(f('object%s == %s', rule.path, validation[name]));
//       }
//     }
//
//     // Create the statement for exists
//     return f(basicValidation
//       , f('!(%s)', statements.join(' && '))
//       , !errorOnFirst
//       , rule.path
//       , i
//       , f('!(%s)', statements.join(' && '))
//       , rule.path
//       , i);
//   } else {
//     throw new Error('compiler only supports validation expressions for basic types');
//   }
// }
//
// var basicValidation = `
//     if(%s && %s) {
//       errors.push(new ValidationError('field %s fails validation', rules[%s]));
//     } else if(%s) {
//       throw new ValidationError('field %s fails validation', rules[%s]);
//     }`
//
// // Must not contain these types
// var illegalOperations = function(illegalOps, validation) {
//   for(var name in validation) {
//     if(illegalOps.indexOf(name) != -1) return true;
//   }
//
//   return false;
// }
//
// //
// // Type validation generator
// //
// var createTypeValidation = function(rule, i, context, options) {
//   options = options || {};
//   // Error on first
//   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
//
//   // Split up the path
//   var paths = rule.path.split('.');
//   paths.shift();
//
//   // Get the type
//   var type = rule.type;
//
//   // Add the type to the context under the path
//   context[i] = {'type': type};
//
//   // Statements
//   var exists = [];
//   var currentPath = [];
//
//   // Exercise the path
//   for(let field of paths) {
//     currentPath.push(field);
//     exists.push(f('object.%s != null', currentPath.join('.')));
//   }
//
//   // Add type the check
//   if(type.name == 'Number') {
//     exists.push(f('!(object.%s.constructor.name == "Number")', currentPath.join('.')));
//   } else {
//     exists.push(f('!(context[%s].type.prototype.isPrototypeOf(object.%s))', i, currentPath.join('.')));
//   }
//
//   // Create the statement for exists
//   return f(typeValidation
//     , exists.join(' && ')
//     , !errorOnFirst
//     , rule.path
//     , type
//     , i
//     , exists.join(' && ')
//     , rule.path
//     , type
//     , i);
// }
//
// var typeValidation = `
//     if(%s && %s) {
//       errors.push(new ValidationError('field %s is not of expected type %s', rules[%s]));
//     } else if(%s) {
//       throw new ValidationError('field %s is not of expected type %s', rules[%s]);
//     }`
//
// // var typeValidation = `
// //     function(object, context, callback) {
// //       if(%s) {
// //         return callback(new ValidationError('field %s is not of expected type %s', rules[%s]));
// //       }
// //
// //       callback();
// //     }`
//
// //
// // Exists validation generator
// //
// var createExistsValidation = function(rule, i, options) {
//   options = options || {};
//   // Error on first
//   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
//
//   // Split up the path
//   var paths = rule.path.split('.');
//   paths.shift();
//
//   // Statements
//   var exists = [];
//   var currentPath = [];
//
//   // Exercise the path
//   for(let field of paths) {
//     currentPath.push(field);
//     exists.push(f('object.%s == null', currentPath.join('.')));
//   }
//
//   // Create the statement for exists
//   return f(existsValidation
//     , exists.join(' && ')
//     , !errorOnFirst
//     , rule.path
//     , i
//     , exists.join(' && ')
//     , rule.path
//     , i);
// }
//
// var existsValidation = `
//     if(%s && %s) {
//       errors.push(new ValidationError('field %s does not exist', rules[%s]));
//     } else if(%s) {
//       throw new ValidationError('field %s does not exist', rules[%s]);
//     }`

module.exports = Compiler;
