var Benchmark = require('benchmark'),
  Compiler = require('../lib/compiler'),
  Builder = require('../lib/builder');

var Joi = require('joi');

// Create a benchmark suite
var suite = new Benchmark.Suite;

// Create a schema instance
var schema = new Builder();
// Set up schema rule for the number field
schema.rule('.number')
  .type(Number)
  .exists(true)
  .validate({
    $gt: 100, $lt: 1000
  });

// Complile the expression
var expression = new Compiler().compile(schema);

// var schema = Joi.obj ect().keys({
//     username: Joi.string().alphanum().min(3).max(30).required(),
//     password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/),
//     access_token: [Joi.string(), Joi.number()],
//     birthyear: Joi.number().integer().min(1900).max(2013),
//     email: Joi.string().email()
// }).with('username', 'birthyear').without('password', 'access_token');
//
// Joi.validate({ username: 'abc', birthyear: 2994 }, schema, function (err, value) {
//   console.dir(err)
// });

// Create Joi expression
var joiSchema = Joi.object().keys({
  number: Joi.number().integer().min(100).max(1000)
}).requiredKeys('number');

// Joi.validate({number:15}, joiSchema, function(err, value) {
//   console.dir(err)
// })
//
// process.exit(0)

// process.exit(0)
// add tests
// suite.add('RegExp#test', function() {
//   /o/.test('Hello World!');
// })
// .add('String#indexOf', function() {
//   'Hello World!'.indexOf('o') > -1;
// })
// .add('String#match', function() {
//   !!'Hello World!'.match(/o/);
// })
// add listeners

//

suite.add('Validator compile', function() {
  var object = {
    number: 150
  };
  expression.validate(object);
})
.add('Joi validator', function() {
  Joi.validate({number:105}, joiSchema, {abortEarly:false}, function(err, value) {})
})

.add('Handcoded validation', function() {
  var errors = [];
  var rules = [];
  var object = {
    number: 150
  };

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

})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run({ 'async': true });
