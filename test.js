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
  var of_one_validation2 = function(path, object, context) {
    console.log("------------------------------------------------------------------ 0")
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Perform validations on object fields
    var numberOfErrors = errors.length;
    var _object = object.child;
    var _path = path + '.child';
    if (_object == undefined) return;
    if (!(typeof _object == 'number' && (object % 1) === 0) && context.failOnFirst) {
      throw new ValidationError('field is not a number', _path, rules[2], _object);
    } else if (!(typeof _object == 'number' && (object % 1) === 0)) {
      errors.push(new ValidationError('field is not a number', _path, rules[2], _object));
    }


    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    if (successfulValidations > 1 && context.failOnFirst) {
      throw new ValidationError('more than one schema matched ofOne rule', path, rules[1], object);
    } else if (successfulValidations > 1 && !context.failOnFirst) {
      errors.push(new ValidationError('more than one schema matched ofOne rule', path, rules[1], object));
    }
    var numberOfErrors = errors.length;
    var _object = object.child;
    var _path = path + '.child';
    if (_object == undefined) return;
    if (!(typeof _object == 'number' && (object % 1) === 0) && context.failOnFirst) {
      throw new ValidationError('field is not a number', _path, rules[3], _object);
    } else if (!(typeof _object == 'number' && (object % 1) === 0)) {
      errors.push(new ValidationError('field is not a number', _path, rules[3], _object));
    }
    if (typeof _object == 'number' && (_object < 2) && context.failOnFirst) {
      throw new ValidationError('number fails validation {"$gte":2}', _path, rules[3], _object);
    } else if (typeof _object == 'number' && (_object < 2)) {
      errors.push(new ValidationError('number fails validation {"$gte":2}', _path, rules[3], _object));
    }

    if (numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
    if (successfulValidations > 1 && context.failOnFirst) {
      throw new ValidationError('more than one schema matched ofOne rule', path, rules[1], object);
    } else if (successfulValidations > 1 && !context.failOnFirst) {
      errors.push(new ValidationError('more than one schema matched ofOne rule', path, rules[1], object));
    }
  }
  var object_validation1 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[0], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[0], object));
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) return;
    // Custom validations
    // Perform validations on object fields
    of_one_validation2(path + '.child', object.child, context);
  }

  object_validation1('object', object, context);
  return errors;
};




console.dir(validate({child:3}))