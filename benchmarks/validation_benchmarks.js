var Benchmark = require('benchmark'),
  Compiler = require('../lib/compiler'),
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType
  f = require('util').format;

var Joi = require('joi');

// Create a benchmark suite
var suite = new Benchmark.Suite;

// Compile to validator
var validator = new Compiler().compile(new DocumentType({
  'number': new NumberType({validations: {
    $gt: 100, $lt: 1000
  }}, {exists:true})
}), {debug:true});

// Create Joi expression
var joiSchema = Joi.object().keys({
  number: Joi.number().integer().min(100).max(1000)
}).requiredKeys('number');

// // Joi validator
// suite.add('Joi validator', function() {
//   Joi.validate({number:150}, joiSchema, {abortEarly:false}, function(err, value) {})
// })

// // Hand coded
// suite.add('Handcoded validation', function() {
//   manual({number:150})
// });

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

// Vitesse test
suite.add('Compiler test', function() {
  validator.validate({number:150});
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
  // var generatePath = function(parent) {
  //   var args = Array.prototype.slice.call(arguments);
  //   args.shift();
  //   return f('%s%s', parent, args.map(function(x) {
  //     return f('[%s]', x);
  //   }).join(''));
  // }
  // var exists_validation2 = function(path, object, context) {
  //   if (undefined == object && context.failOnFirst) {
  //     throw new ValidationError('field does not exist', path, rules[1], object);
  //   } else if (undefined == object) {
  //     errors.push(new ValidationError('field does not exist', path, rules[1], object));
  //   }
  // }
  // var number_validation3 = function(path, object, context) {
  //   if (object == undefined) return;
  //   if (!(typeof object == 'number') && context.failOnFirst) {
  //     throw new ValidationError('field is not a number', path, rules[2], object);
  //   } else if (!(typeof object == 'number')) {
  //     errors.push(new ValidationError('field is not a number', path, rules[2], object));
  //   }
  //   if (typeof object == 'number' && (object <= 100 || object >= 1000) && context.failOnFirst) {
  //     throw new ValidationError('number fails validation {"$gt":100,"$lt":1000}', path, rules[2], object);
  //   } else if (typeof object == 'number' && (object <= 100 || object >= 1000)) {
  //     errors.push(new ValidationError('number fails validation {"$gt":100,"$lt":1000}', path, rules[2], object));
  //   }
  // }

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
    // exists_validation2(path + '.number', object.number, context);
    // number_validation3(path + '.number', object.number, context);

    var _object = object.number;
    var _path = path + '.number';

    if (undefined == _object && context.failOnFirst) {
      throw new ValidationError('field does not exist', _path, rules[1], _object);
    } else if (undefined == _object) {
      errors.push(new ValidationError('field does not exist', _path, rules[1], _object));
    }

    if (_object == undefined) return;
    if (!(typeof _object == 'number') && context.failOnFirst) {
      throw new ValidationError('field is not a number', _path, rules[2], _object);
    } else if (!(typeof _object == 'number')) {
      errors.push(new ValidationError('field is not a number', _path, rules[2], _object));
    }

    if (typeof _object == 'number' && (_object <= 100 || _object >= 1000) && context.failOnFirst) {
      throw new ValidationError('number fails validation {"$gt":100,"$lt":1000}', _path, rules[2], _object);
    } else if (typeof _object == 'number' && (_object <= 100 || _object >= 1000)) {
      errors.push(new ValidationError('number fails validation {"$gt":100,"$lt":1000}', _path, rules[2], _object));
    }

  }

  object_validation1('object', object, context);
  return errors;
};

// var validate = function(b, e) {
//   e = e || {};
//   var c = [], d = e;
//   if (null != b && "object" == typeof b || !d.failOnFirst) {
//     null != b && "object" == typeof b || c.push(new ValidationError("field is not an object", "object", rules[0], b));
//   } else {
//     throw new ValidationError("field is not an object", "object", rules[0], b);
//   }
//   if (null != b) {
//     var a = b.number;
//     if (void 0 == a && d.failOnFirst) {
//       throw new ValidationError("field does not exist", "object.number", rules[1], a);
//     }
//     null != a && void 0 != a || c.push(new ValidationError("field does not exist", "object.number", rules[1], a));
//     a = b.number;
//     if (void 0 != a) {
//       if ("number" != typeof a && d.failOnFirst) {
//         throw new ValidationError("field is not a number", "object.number", rules[2], a);
//       }
//       "number" != typeof a && c.push(new ValidationError("field is not a number", "object.number", rules[2], a));
//       if ("number" == typeof a && (100 >= a || 1E3 <= a) && d.failOnFirst) {
//         throw new ValidationError('number fails validation {"$gt":100,"$lt":1000}', "object.number", rules[2], a);
//       }
//       "number" == typeof a && (100 >= a || 1E3 <= a) && c.push(new ValidationError('number fails validation {"$gt":100,"$lt":1000}', "object.number", rules[2], a));
//     }
//   }
//   return c;
// };

// run benchmark
suite.run({ 'async': true });