"use strict"

var f = require('util').format;

var ValidationError = function(message, path, rule, value) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
}

var rules = [];

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
  var object_validation1 = function(path, object, context) {
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && false && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[0], object);
    } else if ((object == null || typeof object != 'object' || Array.isArray(object)) && false) {
      errors.push(new ValidationError('field is not an object', path, rules[0], object));
    }
    if ((object == null || typeof object != 'object' || Array.isArray(object)) && !false) {
      return;
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) return;
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Field name pattern validation
    // Get the object field names
    var propertyNames = Object.keys(object);
    // Remove any specified fields
    var fieldNames = [];
    // Remove any fieldNames from properties
    for (var i = 0; i < fieldNames.length; i++) {
      var index = propertyNames.indexOf(fieldNames[i]);
      if (index != -1) {
        propertyNames.splice(index, 1);
      }
    }
    // Iterate over all the keys
    for (var i = 0; i < propertyNames.length; i++) {
      var key = propertyNames[i];
      var valid = false;
      // Validate if it exists in the defined properties
      if (fieldNames.indexOf(key) != -1) continue;
      // All the regexp patterns
      // Contain the validation pattern
      var pattern = /f.*o/;
      // Perform the validation
      var match = key.match(pattern) != null;
      valid = valid || match;
      // We have a match validate the field object
      if (match) {
        var _object = object[key];
        var _path = path + "." + key;
        if (_object == undefined) return;
        if (!(typeof _object == 'number' && (_object % 1) === 0) && true && context.failOnFirst) {
          throw new ValidationError('field is not a number', _path, rules[1], _object);
        } else if (!(typeof _object == 'number' && (_object % 1) === 0) && true) {
          errors.push(new ValidationError('field is not a number', _path, rules[1], _object));
        }

      }
      // If we are not valid print out an error
      if (!valid && context.failOnFirst) {
        throw new ValidationError('field ' + key + ' failed pattern validation', path, rules[0], object);
      } else if (!valid) {
        errors.push(new ValidationError('field ' + key + ' failed pattern validation', path, rules[0], object));
      } else if (valid) {
      }
    }
    // Custom validations
    // Perform validations on object fields
  }

  object_validation1('object', object, context);
  return errors;
};

console.dir(validate({child:3}))