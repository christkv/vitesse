"use strict";

var f = require('util').format;

/**
 * Create a Integer validator for integers greater or equal to 5
 * and less or equal to 100.
 * @example-class IntegerNode
 * @example-method addValidation
 */
exports['simple add validation test integer node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      IntegerNode = require('../../lib/integer');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   IntegerNode = require('vitesse').IntegerNode;
    // BEGIN

    var schema = new IntegerNode(null, null, {typeCheck:true})
      .addValidation({$gte: 5, $lte: 100});

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an integer', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate(1);
    assert.equal(1, results.length);
    assert.equal('integer fails validation {"$gte":5,"$lte":100}', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate(10);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create a Custom validator
 * @example-class IntegerNode
 * @example-method addCustomValidator
 */
exports['simple custom validator for integer node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      IntegerNode = require('../../lib/integer'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   IntegerNode = require('vitesse').IntegerNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN

    var customValidator = new CustomNode()
      .setContext({divisibleBy: 10})
      .setValidator(function(object, context) {
        if((object % context.divisibleBy) != 0) {
          return new Error('integer not divisible by ' + context.divisibleBy);
        }
      });

    var schema = new IntegerNode(null, null, {typeCheck:true})
      .addCustomValidator(customValidator);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an integer', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate(7);
    assert.equal(1, results.length);
    assert.equal('integer not divisible by 10', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === customValidator);

    // Validate string 'xxxxxx'
    var results = func.validate(10);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
