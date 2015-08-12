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

  var exists_validation5 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[4], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[4], object));
    }
  }

  var exists_validation8 = function(path, object, context) {
    if ((object == null || object == undefined) && context.failOnFirst) {
      throw new ValidationError('field does not exist', path, rules[7], object);
    } else if (object == null || object == undefined) {
      errors.push(new ValidationError('field does not exist', path, rules[7], object));
    }
  }

  var string_validation9 = function(path, object, context) {
    if (!object) return;
    if (!(typeof object == 'string') && context.failOnFirst) {
      throw new ValidationError('field is not an array', path, rules[8], object);
    } else if (!(typeof object == 'string')) {
      errors.push(new ValidationError('field is not an array', path, rules[8], object));
    }
  }

  var object_validation7 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[6], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[6], object));
    }
    exists_validation8(f('%s.field', path), object.field, context);
    string_validation9(f('%s.field', path), object.field, context);
  }

  var array_validation6 = function(path, object, context) {
    if (!object) return;
    if (!Array.isArray(object) && context.failOnFirst) {
      throw new ValidationError('field is not an array', path, rules[5], object);
    } else if (!Array.isArray(object)) {
      errors.push(new ValidationError('field is not an array', path, rules[5], object));
    }

    if ((object.length < 5 || object.length > 10) && context.failOnFirst) {
      throw new ValidationError('array failed length validation {"$gte":5,"$lte":10}', path, rules[5], object);
    } else if( (object.length < 5 || object.length > 10) ) {
      errors.push(new ValidationError('array failed length validation {"$gte":5,"$lte":10}', path, rules[5], object));
    }

    for (var i = 0; i < object.length; i++) {
      object_validation7(generatePath(path, i), object[i], context);
    }
  }

  var object_validation4 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[3], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[3], object));
    }
    exists_validation5(f('%s.array', path), object.array, context);
    array_validation6(f('%s.array', path), object.array, context);
  }

  var array_validation3 = function(path, object, context) {
    if (!object) return;
    if (!Array.isArray(object) && context.failOnFirst) {
      throw new ValidationError('field is not an array', path, rules[2], object);
    } else if (!Array.isArray(object)) {
      errors.push(new ValidationError('field is not an array', path, rules[2], object));
    }

    if ((object.length < 0 || object.length > 10) && context.failOnFirst) {
      throw new ValidationError('array failed length validation {"$gte":0,"$lte":10}', path, rules[2], object);
    } else if( (object.length < 0 || object.length > 10) ) {
      errors.push(new ValidationError('array failed length validation {"$gte":0,"$lte":10}', path, rules[2], object));
    }

    for (var i = 0; i < object.length; i++) {
      object_validation4(generatePath(path, i), object[i], context);
    }
  }

  var object_validation1 = function(path, object, context) {
    if ((object == null || typeof object != 'object') && context.failOnFirst) {
      throw new ValidationError('field is not an object', path, rules[0], object);
    } else if (object == null || typeof object != 'object') {
      errors.push(new ValidationError('field is not an object', path, rules[0], object));
    }
    exists_validation2(f('%s.childArray', path), object.childArray, context);
    array_validation3(f('%s.childArray', path), object.childArray, context);
  }

  object_validation1('object', object, context);
  return errors;
};

console.dir(validate({childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]}))