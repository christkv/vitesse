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
  var object_validation5 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[4], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[4], object));
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

    // Additional properties false
    // Custom validations
    // Perform validations on object fields
  }
  var object_validation4 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[3], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[3], object));
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
    var fieldNames = {
      "foo": {}
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
    object_validation5(path + '.foo', object.foo, context);
  }
  var object_validation3 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[2], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[2], object));
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
    var fieldNames = {
      "foo": {}
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
    object_validation4(path + '.foo', object.foo, context);
  }
  var object_validation2 = function(path, object, context) {
    var currentErrors = errors;
    errors = [];
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[1], object);
    } else if( (object == null || typeof object != 'object' || Array.isArray(object)) ) {
      errors.push(new ValidationError('field is not an object', path, rules[1], object));
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
    var fieldNames = {
      "foo": {}
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
    object_validation3(path + '.foo', object.foo, context);
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
      "foo": {}
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
    if (properties.length > 0 && context.failOnFirst) {
      throw new ValidationError('illegal fields on object', path, rules[0], object);
    } else if (properties.length > 0) {
      errors.push(new ValidationError('illegal fields on object', path, rules[0], object));
    }
    // Custom validations
    // Perform validations on object fields
    object_validation2(path + '.foo', object.foo, context);
  }

  object_validation1('object', object, context);
  return errors;
};

console.dir(validate({"foo": false}))