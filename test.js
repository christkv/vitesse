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

  var exists_validation2 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[1], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[1], object));
    }
  }

  var exists_validation4 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[3], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[3], object));
    }
  }

  var string_validation5 = function(path, object, context) {
    if (!object) return;
    if (!(typeof object == 'string') && context.failOnFirst) {
      throw new ValidationError('field is not a string', path, rules[4], object);
    } else if (!(typeof object == 'string')) {
      errors.push(new ValidationError('field is not a string', path, rules[4], object));
    }
  }

  var object_validation3 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[2], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[2], object));
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) return;
    // Perform validations on object fields
    exists_validation4(f('%s.field', path), object.field, context);
    string_validation5(f('%s.field', path), object.field, context);
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
    exists_validation2(f('%s.child', path), object.child, context);
    object_validation3('object', object.child, context);
  }

  object_validation1('object', object, context);
  return errors;
};



console.dir(validate({}))