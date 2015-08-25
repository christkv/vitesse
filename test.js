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
  var any_of_validation1 = function(path, object, context) {
    // Not possible to perform any validations on the object as it does not exist
    if(object == null) return;
    // Total validations that were successful
    var successfulValidations = 0;
    // Keep track of the local errors
    var currentErrors = errors;
    errors = [];

    // Perform validations on object fields
      var numberOfErrors = errors.length;

    var _object = object;
  var _path = 'object';
  if(_object == undefined) return;

  if(!(typeof _object == 'number' && (_object%1) === 0) && context.failOnFirst) {
    throw new ValidationError('field is not a number', _path, rules[1], _object);
  } else if(!(typeof _object == 'number' && (_object%1) === 0)) {
    errors.push(new ValidationError('field is not a number', _path, rules[1], _object));
  }




  if(numberOfErrors == errors.length) {
    successfulValidations = successfulValidations + 1;
  }
  var numberOfErrors = errors.length;

    var _object = object;
  var _path = 'object';
  if(_object == undefined) return;

  if(!(typeof _object == 'number' && (_object%1) === 0) && context.failOnFirst) {
    throw new ValidationError('field is not a number', _path, rules[2], _object);
  } else if(!(typeof _object == 'number' && (_object%1) === 0)) {
    errors.push(new ValidationError('field is not a number', _path, rules[2], _object));
  }

    if(typeof _object == 'number' && (_object < 2) && context.failOnFirst) {
    throw new ValidationError('number fails validation {"$gte":2}', _path, rules[2], _object);
  } else if(typeof _object == 'number' && (_object < 2)) {
    errors.push(new ValidationError('number fails validation {"$gte":2}', _path, rules[2], _object));
  }


  if(numberOfErrors == errors.length) {
    successfulValidations = successfulValidations + 1;
  }
  var numberOfErrors = errors.length;

    var _object = object;
  var _path = 'object';
  if(_object == undefined) return;

  if(!(typeof _object == 'number' && (_object%1) === 0) && context.failOnFirst) {
    throw new ValidationError('field is not a number', _path, rules[3], _object);
  } else if(!(typeof _object == 'number' && (_object%1) === 0)) {
    errors.push(new ValidationError('field is not a number', _path, rules[3], _object));
  }

    if(typeof _object == 'number' && (_object > 5) && context.failOnFirst) {
    throw new ValidationError('number fails validation {"$lte":5}', _path, rules[3], _object);
  } else if(typeof _object == 'number' && (_object > 5)) {
    errors.push(new ValidationError('number fails validation {"$lte":5}', _path, rules[3], _object));
  }


  if(numberOfErrors == errors.length) {
    successfulValidations = successfulValidations + 1;
  }

    // Check if we had more than one successful validation
    if(successfulValidations == 0 && context.failOnFirst) {
      throw new ValidationError('value does not match any of the schema's in the anyOf rule', path, rules[0], object);
    } else if(successfulValidations == 0 && !context.failOnFirst) {
      errors.push(new ValidationError('value does not match any of the schema's in the anyOf rule', path, rules[0], object));
    }

    // Add the errors to the current Errors list
    if(successfulValidations == 0) {
      currentErrors = currentErrors.concat(errors);
    }

    // Reset the errors
    errors = currentErrors;
  }

    any_of_validation1('object', object, context);

    return errors;
  };  



console.dir(validate({child:3}))