var Benchmark = require('benchmark'),
  Compiler = require('../lib/compiler').Compiler,
  ClosureCompiler = require('../lib/compiler').ClosureCompiler,
  ObjectNode = require('../lib/object'),
  IntegerNode = require('../lib/integer'),
  f = require('util').format;

var Joi = require('joi');

// Create a benchmark suite
var suite = new Benchmark.Suite;

// Create the top node
var obj = new ObjectNode(null, null, {});
// Create the number field
var number = new IntegerNode(obj, 'number', {});
number.addValidation({$gt: 100});
number.addValidation({$lt: 100});
obj.addChild('number', number);

// Debug flag
var debug = false;

// Compile the validator
var validator = new Compiler().compile(obj, {debug:debug});

// Compile the validator
var validatorOptimized = new Compiler().compile(obj, {debug:debug, optimize:true});

// Create Joi expression
var joiSchema = Joi.object().keys({
  number: Joi.number().integer().min(100).max(1000)
}).requiredKeys('number');

// Compile to validator
var validatorClosure = null;
// Compile using closure compiler
new ClosureCompiler().compile(obj, {debug:true}, function(err, v) {
  validatorClosure = v;
  // run benchmark
  suite.run({ 'async': true });
});

var manual = function(object) {
  var errors = [];
  var rules = [];

  if(object.number == null && true) {
    errors.push(new ValidationError('field .number does not exist', rules[0]));
  } else if(object.number == null) {
    throw new ValidationError('field .number does not exist', rules[0]);
  }

  if(object.number != null && !(object.number.constructor.name == "Number") && true) {
    errors.push(new ValidationError('field .number is not of expected type function Number() { [native code] }', rules[0]));
  } else if(object.number != null && !(object.number.constructor.name == "Number")) {
    throw new ValidationError('field .number is not of expected type function Number() { [native code] }', rules[0]);
  }

  if(!(object.number > 100 && object.number < 1000) && true) {
    errors.push(new ValidationError('field .number fails validation', rules[0]));
  } else if(!(object.number > 100 && object.number < 1000)) {
    throw new ValidationError('field .number fails validation', rules[0]);
  }
}

// Joi test
suite.add('Joi test', function() {
  Joi.validate({number:150}, joiSchema, function (err, value) { });
});

// Vitesse test
suite.add('Compiler test', function() {
  validator.validate({number:150});
});

// Vitesse test
suite.add('Compiler test optimized', function() {
  validatorOptimized.validate({number:150});
});

// Vitesse closure test
suite.add('Closure compiler test', function() {
  validatorClosure.validate({number:150});
});

// Manual test
suite.add('Manual vitesse test', function() {
  validate({number:150});
});

// Each cycle
suite.on('cycle', function(event) {
  console.log(String(event.target));
});

// On complete
suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
});

var rules = [];

var ValidationError = function(message, path, rule, value) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
}

var validate = function(object, context) {
  var context = context == null ? {} : context;
  var errors = [];
  var path = ['object'];
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

  // function object_validation_0(path, object, context) {
    if (object === undefined) return;
    // We have a type validation
    if (object == null || typeof object != 'object' || Array.isArray(object)) {
      return errors;
    }
    // Prohibits fields override
    // Requires fields override
    // Validations
    // Additional field validations
    // Dependencies
    // Custom validations
    // Perform validations on object fields
    var object_1 = object.number;
    var path_1 = path.slice(0).concat(["number"]);{
    if (object_1 === undefined) return;
    // We have a type validation
    if (typeof object_1 == 'number') {
      // Validations
      if ((object_1 <= 100 || object_1 >= 100) && context.failOnFirst) {
        throw new ValidationError('number fails validation {"$gt":100,"$lt":100}', path_1, rules[1], object_1);
      } else if( (object_1 <= 100 || object_1 >= 100) ) {
        errors.push(new ValidationError('number fails validation {"$gt":100,"$lt":100}', path_1, rules[1], object_1));
      }
      // Custom validations
    }
    };
  // }
  // object_validation_0(["object"], object, context);
  return errors;
};