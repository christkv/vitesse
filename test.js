var f = require('util').format;

var ValidationError = function(message, path, rule, value) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
}

var rules = [];

var validate = function(object, context) {
  context = context || {};
  var errors = [];

  var generatePath = function(parent) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return f('%s%s', parent, args.map(function(x) {
      return f('[%s]', x);
    }).join(''));
  }

  var string_validation2 = function(path, object, context) {
    if (!object) return;
    if (!(typeof object == 'string') && context.failOnFirst) {
      throw new ValidationError('field is not a string', path, rules[1], object);
    } else if (!(typeof object == 'string')) {
      errors.push(new ValidationError('field is not a string', path, rules[1], object));
    }

    if (typeof object == 'string' && (object.length < 1 || object.length > 25) && context.failOnFirst) {
      throw new ValidationError('string fails validation {"$gte":1,"$lte":25}', path, rules[1], object);
    } else if (typeof object == 'string' && (object.length < 1 || object.length > 25)) {
      errors.push(new ValidationError('string fails validation {"$gte":1,"$lte":25}', path, rules[1], object));
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
    // Perform validations on object fields
    string_validation2(f('%s.field', path), object.field, context);
  }

  object_validation1('object', object, context);
  return errors;
};

console.dir(validate({field:''}))