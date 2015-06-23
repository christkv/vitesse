var co = require('co');
var Compiler = require('../lib/compiler'),
  Builder = require('../lib/builder');


var assert = require("assert")
describe('Compiler', function(){
  it('should correctly validate against number', function(){
    var schema = new Builder();

    // Set up a type of validation
    var Email = {
      validate: function(x) {
        if(x.match(/[a-z]+$/) == null) {
          return new Error('no matching email');
        }
      }
    }

    // Set up schema rule for the number field
    schema.rule('.number')
      .type(Number)
      .exists(true)
      .validate({
        $gt: 100, $lt: 1000
      });

    // Validate subdocument
    schema.rule('.doc.email')
      .type(Email)
      .exists(true)

    // Complile the expression
    var expression = new Compiler().compile(schema);

    // Test the expression
    var result = expression.validate({
      number: 4, doc: { email: 'aaabbb333' }
    });

    assert.equal(2, result.length);
  });
});

exports['Should correctly insert documents'] = {
  metadata: { requires: { } },

  // The actual test we wish to run
  test: function(configuration, test) {
    var Compiler = require('../../lib/validator/compiler'),
      Builder = require('../../lib/validator/builder');

    co(function* () {
      var schema = new Builder();

      // Set up a type of validation
      var Email = {
        validate: function(x) {
          if(x.match(/[a-z]+$/) == null) {
            return new Error('no matching email');
          }
        }
      }

      // Set up schema rule for the number field
      schema.rule('.number')
        .type(Number)
        .exists(true)
        .validate({
          $gt: 100, $lt: 1000
        });

      // Validate subdocument
      schema.rule('.doc.email')
        .type(Email)
        .exists(true)

      // Complile the expression
      var expression = new Compiler().compile(schema);

      // Test the expression
      var result = expression.validate({
        number: 4, doc: { email: 'aaabbb333' }
      });

      test.equal(2, result.length);
      test.done();
    }).catch(function(err) {
      console.log(err.stack)
      test.done();
    });
  }
}
