"use strict"

var f = require('util').format;

var ValidationError = function(message, path, rule, value) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
}

var rules = [];

var ValidationError = function(message, path, rule, value, errors) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
  this.errors = errors;
}

var validate = function(object, context) {
  var context = context == null ? {} : context;
  var errors = [];
  var generatePath = function(parent) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return f('%s%s', parent, args.map(function(x) {
      return f('[%s]', x);
    }).join(''));
  }
  var deepCompareStrict = function(a, b) {
    if (typeof a !== typeof b) {
      return false;
    }
    if (a instanceof Array) {
      if (!(b instanceof Array)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      return a.every(function(v, i) {
        return deepCompareStrict(a[i], b[i]);
      });
    }
    if (typeof a === 'object') {
      if (!a || !b) {
        return a === b;
      }
      var aKeys = Object.keys(a);
      var bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) {
        return false;
      }
      return aKeys.every(function(v) {
        return deepCompareStrict(a[v], b[v]);
      });
    }
    return a === b;
  };
  var testArrays = function(v, i, a) {
    for (var j = i + 1; j < a.length; j++)
      if (deepCompareStrict(v, a[j])) {
        return false;
    }
    return true;
  }
  var all_of_validation12 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (!(object === undefined)) {
      // Total validations to perform
      var totalValidations = 1;
      // Total validations that were successful
      var successfulValidations = 0;
      // Keep track of the local errors
      var currentErrors = errors;
      errors = [];
      console.log("########################################## ALLOF CALLEd 12 :: " + currentErrors.length + " :: " + successfulValidations + " :: " + totalValidations)
      // Perform validations on object fields
      var numberOfErrors = errors.length;
      var _object = object;
      var _path = path;
      var errorLength = errors.length;

      if (!(_object === undefined)) {
        if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true && context.failOnFirst) {
          throw new ValidationError('field is not a number', _path, rules[12], _object);
        } else if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true) {
          errors.push(new ValidationError('field is not a number', _path, rules[12], _object));
        }
        if (typeof _object == 'number' && (_object < 0) && context.failOnFirst) {
          throw new ValidationError('number fails validation {"$gte":0}', _path, rules[12], _object);
        } else if (typeof _object == 'number' && (_object < 0)) {
          errors.push(new ValidationError('number fails validation {"$gte":0}', _path, rules[12], _object));
        }
      }
      if (numberOfErrors == errors.length) {
        successfulValidations = successfulValidations + 1;
      }
      console.log("########################################## ALLOF CALLEd 12 :: " + errors.length + " :: " + successfulValidations + " :: " + totalValidations)
      // Check if we had more than one successful validation
      if ((successfulValidations != totalValidations) && context.failOnFirst) {
        throw new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[11], object, errors);
      } else if ((successfulValidations != totalValidations) && !context.failOnFirst) {
        currentErrors.push(new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[11], object, errors));
      }
      // Reset the errors
      errors = currentErrors;
    }
  }
  var any_of_validation15 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Keep track of the local errors
    var currentErrors = errors;
    errors = [];
    // Perform validations on object fields
    var numberOfErrors = errors.length;
    var _object = object;
    var _path = 'object';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'boolean') && true && context.failOnFirst) {
        throw new ValidationError('field is not a boolean', _path, rules[15], _object);
      } else if (!(typeof _object == 'boolean') && true) {
        errors.push(new ValidationError('field is not a boolean', _path, rules[15], _object));
      }

    }
    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    // Check if we had more than one successful validation
    if (successfulValidations == 0 && context.failOnFirst) {
      throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[14], object, errors);
    } else if (successfulValidations == 0 && !context.failOnFirst) {
      currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[14], object, errors));
    }
    // Reset the errors
    errors = currentErrors;
  }
  var array_validation18 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[17], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[17], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[17], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[17], object));
      }
      // Custom validations
      // Uniqueness validation
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
      }
    }
  }
  var any_of_validation17 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Keep track of the local errors
    var currentErrors = errors;
    errors = [];
    // Perform validations on object fields
    var numberOfErrors = errors.length;
    array_validation18(path + '.items', object, context);
    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    // Check if we had more than one successful validation
    if (successfulValidations == 0 && context.failOnFirst) {
      throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[16], object, errors);
    } else if (successfulValidations == 0 && !context.failOnFirst) {
      currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[16], object, errors));
    }
    // Reset the errors
    errors = currentErrors;
  }
  var all_of_validation20 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (!(object === undefined)) {
      // Total validations to perform
      var totalValidations = 1;
      // Total validations that were successful
      var successfulValidations = 0;
      // Keep track of the local errors
      var currentErrors = errors;
      errors = [];
      console.log("########################################## ALLOF CALLEd 20 :: " + currentErrors.length + " :: " + successfulValidations + " :: " + totalValidations)
      // Perform validations on object fields
      var numberOfErrors = errors.length;
      var _object = object;
      var _path = path;
      var errorLength = errors.length;

      if (!(_object === undefined)) {
        if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true && context.failOnFirst) {
          throw new ValidationError('field is not a number', _path, rules[20], _object);
        } else if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true) {
          errors.push(new ValidationError('field is not a number', _path, rules[20], _object));
        }
        if (typeof _object == 'number' && (_object < 0) && context.failOnFirst) {
          throw new ValidationError('number fails validation {"$gte":0}', _path, rules[20], _object);
        } else if (typeof _object == 'number' && (_object < 0)) {
          errors.push(new ValidationError('number fails validation {"$gte":0}', _path, rules[20], _object));
        }
      }
      if (numberOfErrors == errors.length) {
        successfulValidations = successfulValidations + 1;
      }
      console.log("########################################## ALLOF CALLEd 20 :: " + errors.length + " :: " + successfulValidations + " :: " + totalValidations)
      // Check if we had more than one successful validation
      if ((successfulValidations != totalValidations) && context.failOnFirst) {
        throw new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[19], object, errors);
      } else if ((successfulValidations != totalValidations) && !context.failOnFirst) {
        currentErrors.push(new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[19], object, errors));
      }
      // Reset the errors
      errors = currentErrors;
    }
  }
  var all_of_validation24 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (!(object === undefined)) {
      // Total validations to perform
      var totalValidations = 1;
      // Total validations that were successful
      var successfulValidations = 0;
      // Keep track of the local errors
      var currentErrors = errors;
      errors = [];
      console.log("########################################## ALLOF CALLEd 24 :: " + currentErrors.length + " :: " + successfulValidations + " :: " + totalValidations)
      // Perform validations on object fields
      var numberOfErrors = errors.length;
      var _object = object;
      var _path = path;
      var errorLength = errors.length;

      if (!(_object === undefined)) {
        if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true && context.failOnFirst) {
          throw new ValidationError('field is not a number', _path, rules[24], _object);
        } else if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true) {
          errors.push(new ValidationError('field is not a number', _path, rules[24], _object));
        }
        if (typeof _object == 'number' && (_object < 0) && context.failOnFirst) {
          throw new ValidationError('number fails validation {"$gte":0}', _path, rules[24], _object);
        } else if (typeof _object == 'number' && (_object < 0)) {
          errors.push(new ValidationError('number fails validation {"$gte":0}', _path, rules[24], _object));
        }
      }
      if (numberOfErrors == errors.length) {
        successfulValidations = successfulValidations + 1;
      }
      console.log("########################################## ALLOF CALLEd 24 :: " + errors.length + " :: " + successfulValidations + " :: " + totalValidations)
      // Check if we had more than one successful validation
      if ((successfulValidations != totalValidations) && context.failOnFirst) {
        throw new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[23], object, errors);
      } else if ((successfulValidations != totalValidations) && !context.failOnFirst) {
        currentErrors.push(new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[23], object, errors));
      }
      // Reset the errors
      errors = currentErrors;
    }
  }
  var array_validation26 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[25], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[25], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[25], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[25], object));
      }
      // Custom validations
      // Uniqueness validation
      if (!object.every(testArrays) && context.failOnFirst) {
        throw new ValidationError('array contains duplicate values', path, rules[25], object);
      } else if (!object.every(testArrays)) {
        errors.push(new ValidationError('array contains duplicate values', path, rules[25], object));
      }
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
        var _object = object[i];
        var _path = generatePath(path, i);

        if (_object !== undefined) {
          if (!(typeof _object == 'string') && true && context.failOnFirst) {
            throw new ValidationError('field is not a string', _path, rules[26], _object);
          } else if (!(typeof _object == 'string') && true) {
            errors.push(new ValidationError('field is not a string', _path, rules[26], _object));
          }

        }
      }
    }
  }
  var any_of_validation28 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Keep track of the local errors
    var currentErrors = errors;
    errors = [];
    // Perform validations on object fields
    var numberOfErrors = errors.length;
    var _object = object;
    var _path = 'object';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'boolean') && true && context.failOnFirst) {
        throw new ValidationError('field is not a boolean', _path, rules[28], _object);
      } else if (!(typeof _object == 'boolean') && true) {
        errors.push(new ValidationError('field is not a boolean', _path, rules[28], _object));
      }

    }
    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    // Check if we had more than one successful validation
    if (successfulValidations == 0 && context.failOnFirst) {
      throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[27], object, errors);
    } else if (successfulValidations == 0 && !context.failOnFirst) {
      currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[27], object, errors));
    }
    // Reset the errors
    errors = currentErrors;
  }
  var object_validation30 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[29], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[29], object));
    }
    if (!false && errors.length > 0) {
      errors = currentErrors;
      return;
    } else if (errors.length > 0) {
      errors = currentErrors.concat(errors);
      return;
    } else {
      errors = currentErrors;
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined || object == null) return;
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Field name pattern validation
    var fieldNames = {};
    var keys = Object.keys(object);
    var properties = keys.slice(0);
    // The sets
    var validSet = {};
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }
      // Pattern validations
    }
    // Additional properties object
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      // Perform validation
      if (properties.indexOf(key) != -1) {
      }
    }
    // Additional properties false
    // Custom validations
    // Perform validations on object fields
  }
  var object_validation31 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[30], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[30], object));
    }
    if (!false && errors.length > 0) {
      errors = currentErrors;
      return;
    } else if (errors.length > 0) {
      errors = currentErrors.concat(errors);
      return;
    } else {
      errors = currentErrors;
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined || object == null) return;
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Field name pattern validation
    var fieldNames = {};
    var keys = Object.keys(object);
    var properties = keys.slice(0);
    // The sets
    var validSet = {};
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }
      // Pattern validations
    }
    // Additional properties object
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      // Perform validation
      if (properties.indexOf(key) != -1) {
      }
    }
    // Additional properties false
    // Custom validations
    // Perform validations on object fields
  }
  var object_validation32 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[31], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[31], object));
    }
    if (!false && errors.length > 0) {
      errors = currentErrors;
      return;
    } else if (errors.length > 0) {
      errors = currentErrors.concat(errors);
      return;
    } else {
      errors = currentErrors;
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined || object == null) return;
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Field name pattern validation
    var fieldNames = {};
    var keys = Object.keys(object);
    var properties = keys.slice(0);
    // The sets
    var validSet = {};
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }
      // Pattern validations
    }
    // Additional properties object
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      // Perform validation
      if (properties.indexOf(key) != -1) {
      }
    }
    // Additional properties false
    // Custom validations
    // Perform validations on object fields
  }
  var array_validation35 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[34], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[34], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[34], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[34], object));
      }
      // Custom validations
      // Uniqueness validation
      if (!object.every(testArrays) && context.failOnFirst) {
        throw new ValidationError('array contains duplicate values', path, rules[34], object);
      } else if (!object.every(testArrays)) {
        errors.push(new ValidationError('array contains duplicate values', path, rules[34], object));
      }
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
        var _object = object[i];
        var _path = generatePath(path, i);

        if (_object !== undefined) {
          if (!(typeof _object == 'string') && true && context.failOnFirst) {
            throw new ValidationError('field is not a string', _path, rules[35], _object);
          } else if (!(typeof _object == 'string') && true) {
            errors.push(new ValidationError('field is not a string', _path, rules[35], _object));
          }

        }
      }
    }
  }
  var any_of_validation34 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Keep track of the local errors
    var currentErrors = errors;
    errors = [];
    // Perform validations on object fields
    var numberOfErrors = errors.length;
    array_validation35(path + '.key', object, context);
    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    // Check if we had more than one successful validation
    if (successfulValidations == 0 && context.failOnFirst) {
      throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[33], object, errors);
    } else if (successfulValidations == 0 && !context.failOnFirst) {
      currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[33], object, errors));
    }
    // Reset the errors
    errors = currentErrors;
  }
  var object_validation33 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[32], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[32], object));
    }
    if (!true && errors.length > 0) {
      errors = currentErrors;
      return;
    } else if (errors.length > 0) {
      errors = currentErrors.concat(errors);
      return;
    } else {
      errors = currentErrors;
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined || object == null) return;
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Field name pattern validation
    var fieldNames = {};
    var keys = Object.keys(object);
    var properties = keys.slice(0);
    // The sets
    var validSet = {};
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }
      // Pattern validations
    }
    // Additional properties object
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      // Perform validation
      if (properties.indexOf(key) != -1) {
        any_of_validation34(path + "." + key, object.key, context);
      }
    }
    // Additional properties false
    // Custom validations
    // Perform validations on object fields
  }
  var array_validation34 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[33], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[33], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[33], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[33], object));
      }
      // Custom validations
      // Uniqueness validation
      if (!object.every(testArrays) && context.failOnFirst) {
        throw new ValidationError('array contains duplicate values', path, rules[33], object);
      } else if (!object.every(testArrays)) {
        errors.push(new ValidationError('array contains duplicate values', path, rules[33], object));
      }
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
      }
    }
  }
  var array_validation36 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[35], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[35], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[35], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[35], object));
      }
      // Custom validations
      // Uniqueness validation
      if (!object.every(testArrays) && context.failOnFirst) {
        throw new ValidationError('array contains duplicate values', path, rules[35], object);
      } else if (!object.every(testArrays)) {
        errors.push(new ValidationError('array contains duplicate values', path, rules[35], object));
      }
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
      }
    }
  }
  var any_of_validation35 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Keep track of the local errors
    var currentErrors = errors;
    errors = [];
    // Perform validations on object fields
    var numberOfErrors = errors.length;
    array_validation36(path + '.type', object, context);
    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    // Check if we had more than one successful validation
    if (successfulValidations == 0 && context.failOnFirst) {
      throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[34], object, errors);
    } else if (successfulValidations == 0 && !context.failOnFirst) {
      currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[34], object, errors));
    }
    // Reset the errors
    errors = currentErrors;
  }
  var array_validation37 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[36], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[36], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[36], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[36], object));
      }
      // Custom validations
      // Uniqueness validation
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
      }
    }
  }
  var array_validation38 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[37], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[37], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[37], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[37], object));
      }
      // Custom validations
      // Uniqueness validation
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
      }
    }
  }
  var array_validation39 = function(path, object, context) {
    if (!(object === undefined)) {
      if (!Array.isArray(object) && true && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[38], object);
      } else if (!Array.isArray(object) && true) {
        errors.push(new ValidationError('field is not an array', path, rules[38], object));
      }
      if( (object == null || typeof object != 'object' || !Array.isArray(object)) ) {
        return;
      }
      // Generated from validation language
      if ((object.length < 1) && context.failOnFirst) {
        throw new ValidationError('array failed length validation {"$gte":1}', path, rules[38], object);
      } else if( (object.length < 1) ) {
        errors.push(new ValidationError('array failed length validation {"$gte":1}', path, rules[38], object));
      }
      // Custom validations
      // Uniqueness validation
      // Indexed validations
      // Execute all field level validations
      for (var i = 0; i < object.length; i++) {
      }
    }
  }
  var object_validation1 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[0], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[0], object));
    }
    if (!false && errors.length > 0) {
      errors = currentErrors;
      return;
    } else if (errors.length > 0) {
      errors = currentErrors.concat(errors);
      return;
    } else {
      errors = currentErrors;
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object === undefined || object == null) return;
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Field name pattern validation
    var fieldNames = {
      "id": {},
      "$schema": {},
      "title": {},
      "description": {},
      "default": {},
      "multipleOf": {},
      "maximum": {},
      "exclusiveMaximum": {},
      "minimum": {},
      "exclusiveMinimum": {},
      "maxLength": {},
      "minLength": {},
      "pattern": {},
      "additionalItems": {},
      "items": {},
      "maxItems": {},
      "minItems": {},
      "uniqueItems": {},
      "maxProperties": {},
      "minProperties": {},
      "required": {},
      "additionalProperties": {},
      "definitions": {},
      "properties": {},
      "patternProperties": {},
      "dependencies": {},
      "enum": {},
      "type": {},
      "allOf": {},
      "anyOf": {},
      "oneOf": {},
      "not": {}
    };
    var keys = Object.keys(object);
    var properties = keys.slice(0);
    // The sets
    var validSet = {};
    // Go over all the keys
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }
      // Pattern validations
    }
    // Additional properties object

    // Additional properties false
    // Custom validations
    // Perform validations on object fields
    var _object = object.id;
    var _path = path + '.id';

    if (_object !== undefined) {
      if (!(typeof _object == 'string') && true && context.failOnFirst) {
        throw new ValidationError('field is not a string', _path, rules[1], _object);
      } else if (!(typeof _object == 'string') && true) {
        errors.push(new ValidationError('field is not a string', _path, rules[1], _object));
      }

    }
    var _object = object.$schema;
    var _path = path + '.$schema';

    if (_object !== undefined) {
      if (!(typeof _object == 'string') && true && context.failOnFirst) {
        throw new ValidationError('field is not a string', _path, rules[2], _object);
      } else if (!(typeof _object == 'string') && true) {
        errors.push(new ValidationError('field is not a string', _path, rules[2], _object));
      }

    }
    var _object = object.title;
    var _path = path + '.title';

    if (_object !== undefined) {
      if (!(typeof _object == 'string') && true && context.failOnFirst) {
        throw new ValidationError('field is not a string', _path, rules[3], _object);
      } else if (!(typeof _object == 'string') && true) {
        errors.push(new ValidationError('field is not a string', _path, rules[3], _object));
      }

    }
    var _object = object.description;
    var _path = path + '.description';

    if (_object !== undefined) {
      if (!(typeof _object == 'string') && true && context.failOnFirst) {
        throw new ValidationError('field is not a string', _path, rules[4], _object);
      } else if (!(typeof _object == 'string') && true) {
        errors.push(new ValidationError('field is not a string', _path, rules[4], _object));
      }

    }
    var _object = object.multipleOf;
    var _path = path + '.multipleOf';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'number') && true && context.failOnFirst) {
        throw new ValidationError('field is not a number', _path, rules[5], _object);
      } else if (!(typeof _object == 'number') && true) {
        errors.push(new ValidationError('field is not a number', _path, rules[5], _object));
      }
      if (typeof _object == 'number' && (_object <= 0) && context.failOnFirst) {
        throw new ValidationError('number fails validation {"$gt":0}', _path, rules[5], _object);
      } else if (typeof _object == 'number' && (_object <= 0)) {
        errors.push(new ValidationError('number fails validation {"$gt":0}', _path, rules[5], _object));
      }
    }
    var _object = object.maximum;
    var _path = path + '.maximum';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'number') && true && context.failOnFirst) {
        throw new ValidationError('field is not a number', _path, rules[6], _object);
      } else if (!(typeof _object == 'number') && true) {
        errors.push(new ValidationError('field is not a number', _path, rules[6], _object));
      }

    }
    var _object = object.exclusiveMaximum;
    var _path = path + '.exclusiveMaximum';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'boolean') && true && context.failOnFirst) {
        throw new ValidationError('field is not a boolean', _path, rules[7], _object);
      } else if (!(typeof _object == 'boolean') && true) {
        errors.push(new ValidationError('field is not a boolean', _path, rules[7], _object));
      }

    }
    var _object = object.minimum;
    var _path = path + '.minimum';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'number') && true && context.failOnFirst) {
        throw new ValidationError('field is not a number', _path, rules[8], _object);
      } else if (!(typeof _object == 'number') && true) {
        errors.push(new ValidationError('field is not a number', _path, rules[8], _object));
      }

    }
    var _object = object.exclusiveMinimum;
    var _path = path + '.exclusiveMinimum';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'boolean') && true && context.failOnFirst) {
        throw new ValidationError('field is not a boolean', _path, rules[9], _object);
      } else if (!(typeof _object == 'boolean') && true) {
        errors.push(new ValidationError('field is not a boolean', _path, rules[9], _object));
      }

    }
    var _object = object.maxLength;
    var _path = path + '.maxLength';
    var errorLength = errors.length;

    if (!(_object === undefined)) {
      if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true && context.failOnFirst) {
        throw new ValidationError('field is not a number', _path, rules[10], _object);
      } else if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true) {
        errors.push(new ValidationError('field is not a number', _path, rules[10], _object));
      }
      if (typeof _object == 'number' && (_object < 0) && context.failOnFirst) {
        throw new ValidationError('number fails validation {"$gte":0}', _path, rules[10], _object);
      } else if (typeof _object == 'number' && (_object < 0)) {
        errors.push(new ValidationError('number fails validation {"$gte":0}', _path, rules[10], _object));
      }
    }
    all_of_validation12(path + '.minLength', object.minLength, context);
    var _object = object.pattern;
    var _path = path + '.pattern';

    if (_object !== undefined) {
      if (!(typeof _object == 'string') && true && context.failOnFirst) {
        throw new ValidationError('field is not a string', _path, rules[13], _object);
      } else if (!(typeof _object == 'string') && true) {
        errors.push(new ValidationError('field is not a string', _path, rules[13], _object));
      }

    }
    any_of_validation15(path + '.additionalItems', object.additionalItems, context);
    any_of_validation17(path + '.items', object.items, context);
    var _object = object.maxItems;
    var _path = path + '.maxItems';
    var errorLength = errors.length;

    if (!(_object === undefined)) {
      if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true && context.failOnFirst) {
        throw new ValidationError('field is not a number', _path, rules[18], _object);
      } else if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true) {
        errors.push(new ValidationError('field is not a number', _path, rules[18], _object));
      }
      if (typeof _object == 'number' && (_object < 0) && context.failOnFirst) {
        throw new ValidationError('number fails validation {"$gte":0}', _path, rules[18], _object);
      } else if (typeof _object == 'number' && (_object < 0)) {
        errors.push(new ValidationError('number fails validation {"$gte":0}', _path, rules[18], _object));
      }
    }
    all_of_validation20(path + '.minItems', object.minItems, context);
    var _object = object.uniqueItems;
    var _path = path + '.uniqueItems';

    if (!(_object === undefined)) {
      if (!(typeof _object == 'boolean') && true && context.failOnFirst) {
        throw new ValidationError('field is not a boolean', _path, rules[21], _object);
      } else if (!(typeof _object == 'boolean') && true) {
        errors.push(new ValidationError('field is not a boolean', _path, rules[21], _object));
      }

    }
    var _object = object.maxProperties;
    var _path = path + '.maxProperties';
    var errorLength = errors.length;

    if (!(_object === undefined)) {
      if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true && context.failOnFirst) {
        throw new ValidationError('field is not a number', _path, rules[22], _object);
      } else if ((!(typeof _object == 'number') || !(typeof _object == 'number' && _object % 1 === 0)) && true) {
        errors.push(new ValidationError('field is not a number', _path, rules[22], _object));
      }
      if (typeof _object == 'number' && (_object < 0) && context.failOnFirst) {
        throw new ValidationError('number fails validation {"$gte":0}', _path, rules[22], _object);
      } else if (typeof _object == 'number' && (_object < 0)) {
        errors.push(new ValidationError('number fails validation {"$gte":0}', _path, rules[22], _object));
      }
    }
    all_of_validation24(path + '.minProperties', object.minProperties, context);
    array_validation26(path + '.required', object.required, context);
    any_of_validation28(path + '.additionalProperties', object.additionalProperties, context);
    object_validation30(path + '.definitions', object.definitions, context);
    object_validation31(path + '.properties', object.properties, context);
    object_validation32(path + '.patternProperties', object.patternProperties, context);
    object_validation33(path + '.dependencies', object.dependencies, context);
    array_validation34(path + '.enum', object.enum, context);
    any_of_validation35(path + '.type', object.type, context);
    array_validation37(path + '.allOf', object.allOf, context);
    array_validation38(path + '.anyOf', object.anyOf, context);
    array_validation39(path + '.oneOf', object.oneOf, context);
    object_validation1('object', object.not, context);
  }

  object_validation1('object', object, context);
  return errors;
};

console.dir(validate({"foo": false}))