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
  }  var exists_validation2 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[1], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[1], object));
    }
  }  var exists_validation5 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[4], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[4], object));
    }
  }  var exists_validation8 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[7], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[7], object));
    }
  }  var string_validation9 = function(path, object, context) {
    if (object == undefined) {
      return;
    }
    if (!(typeof object == 'string') && context.failOnFirst) {
      throw new ValidationError('field is not a string', path, rules[8], object);
    } else if (!(typeof object == 'string')) {
      errors.push(new ValidationError('field is not a string', path, rules[8], object));
    }

  }  var object_validation7 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[6], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[6], object));
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) {
      return;
    }
    // Custom validations
    // Perform validations on object fields
    exists_validation8(f('%s.field', path), object.field, context);
    string_validation9(f('%s.field', path), object.field, context);
  }  var array_validation6 = function(path, object, context) {
    if (object == undefined) {
      return;
    }
    if (!Array.isArray(object) && context.failOnFirst) {
      throw new ValidationError('field is not an array', path, rules[5], object);
    } else if (!Array.isArray(object)) {
      errors.push(new ValidationError('field is not an array', path, rules[5], object));
    }
    // Generated from validation language
    if ((object.length < 1 || object.length > 10) && context.failOnFirst) {
      throw new ValidationError('array failed length validation {"$gte":1,"$lte":10}', path, rules[5], object);
    } else if( (object.length < 1 || object.length > 10) ) {
      errors.push(new ValidationError('array failed length validation {"$gte":1,"$lte":10}', path, rules[5], object));
    }
    // Custom validations
    // Execute all field level validations
    for (var i = 0; i < object.length; i++) {
      object_validation7(generatePath(path, i), object[i], context);
    }
  }  var object_validation4 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[3], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[3], object));
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) {
      return;
    }
    // Custom validations
    // Perform validations on object fields
    exists_validation5(f('%s.array', path), object.array, context);
    array_validation6(f('%s.array', path), object.array, context);
  }  var nested_array_validation3 = function(path, object, context) {
    if (object == undefined) {
      return;
    }
    if (!Array.isArray(object) && context.failOnFirst) {
      throw new ValidationError('field is not an array', 'object.childArray', rules[2], object);
    } else if (!Array.isArray(object)) {
      errors.push(new ValidationError('field is not an array', 'object.childArray', rules[2], object));
    }
    // Custom validations

    if ((object.length < 0 || object.length > 100) && context.failOnFirst) {
      throw new ValidationError('array failed length validation {"$gte":0,"$lte":100}', generatePath(path, i0), rules[2], object);
    } else if( (object.length < 0 || object.length > 100) ) {
      errors.push(new ValidationError('array failed length validation {"$gte":0,"$lte":100}', generatePath(path, i0), rules[2], object));
    }
    for (var i0 = 0; i0 < object.length; i0++) {
      if (!Array.isArray(object[i0]) && context.failOnFirst) {
        throw new ValidationError('field is not an array', generatePath(path, i0), rules[2], object[i0]);
      } else if (!Array.isArray(object[i0])) {
        errors.push(new ValidationError('field is not an array', generatePath(path, i0), rules[2], object[i0]));
      }

      for (var i1 = 0; i1 < object[i0].length; i1++) {
        if (!Array.isArray(object[i0][i1]) && context.failOnFirst) {
          throw new ValidationError('field is not an array', generatePath(path, i0, i1), rules[2], object[i0][i1]);
        } else if (!Array.isArray(object[i0][i1])) {
          errors.push(new ValidationError('field is not an array', generatePath(path, i0, i1), rules[2], object[i0][i1]));
        }
        if ((object[i0][i1].length < 1 || object[i0][i1].length > 10) && context.failOnFirst) {
          throw new ValidationError('array failed length validation {"$gte":1,"$lte":10}', generatePath(path, i0, i1), rules[2], object);
        } else if( (object[i0][i1].length < 1 || object[i0][i1].length > 10) ) {
          errors.push(new ValidationError('array failed length validation {"$gte":1,"$lte":10}', generatePath(path, i0, i1), rules[2], object));
        }
        for (var i2 = 0; i2 < object[i0][i1].length; i2++) {
          object_validation4(generatePath(path, i0, i1, i2), object[i0][i1][i2], context);
        }
      }
    }
  }  var object_validation1 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[0], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[0], object));
    }
    // Not possible to perform any validations on the object as it does not exist
    if (object == null) {
      return;
    }
    // Custom validations
    // Perform validations on object fields
    exists_validation2(f('%s.childArray', path), object.childArray, context);
    nested_array_validation3('object.childArray', object.childArray, context);
  }  object_validation1('object', object, context);
  return errors;
};
console.dir(validate({field:''}))