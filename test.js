var f = require('util').format;

var ValidationError = function(message, field, parent, rule, value) {
  this.message = message;
  this.field = field;
  this.parent = parent;
  this.rule = rule;
  this.value = value;
}

var rules = [];

var validate = function(object, context) {
  context = context || {};
  var errors = [];

  var exists_validation2 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[1], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[1], object));
    }
  }

  var generatePath = function(parent) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return f('%s%s', parent, args.map(function(x) {
      return f('[%s]', x);
    }).join(''));
  }

  var generateField = function(field) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return f('%s%s', field, args.map(function(x) {
      return f('[%s]', x);
    }).join(''));
  }

  var exists_validation5 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[4], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[4], object));
    }
  }

  var string_validation6 = function(path, object, context) {
    if (!object) return;
    if (!(typeof object == 'string') && context.failOnFirst) {
      throw new ValidationError('field is not an array', path, rules[5], object);
    } else if (!(typeof object == 'string')) {
      errors.push(new ValidationError('field is not an array', path, rules[5], object));
    }
  }

  var object_validation4 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[3], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[3], object));
    }
    exists_validation5('object.childArray[i0][i1][i2].field', object.field, context);
    string_validation6("object.childArray[i0][i1][i2]", "field", object.field, context);
  }

  var nested_array_validation3 = function(path, object, context) {
    if (!object) return;
    if (!Array.isArray(object) && context.failOnFirst) {
      throw new ValidationError('field is not an array', 'object.childArray', rules[2], object);
    } else if (!Array.isArray(object)) {
      errors.push(new ValidationError('field is not an array', 'object.childArray', rules[2], object));
    }

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

        if ((object[i0][i1].length < 5 || object[i0][i1].length > 10) && context.failOnFirst) {
          throw new ValidationError('array failed length validation {"$gte":5,"$lte":10}', "", rules[2], object);
        } else if( (object[i0][i1].length < 5 || object[i0][i1].length > 10) ) {
          errors.push(new ValidationError('array failed length validation {"$gte":5,"$lte":10}', "", rules[2], object));
        }

        for (var i2 = 0; i2 < object[i0][i1].length; i2++) {
          object_validation4(generateField(path, i0, i1, i2), object[i0][i1][i2], context);
        }
      }
    }
  }

  var object_validation1 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[0], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[0], object));
    }
    exists_validation2('object.childArray', object.childArray, context);
    nested_array_validation3('object.childArray', object.childArray, context);
  }

  object_validation1('object', objectobject, context);
  return errors;
};

console.dir(validate({childArray:[[[1,2,3,4,5]]]}))