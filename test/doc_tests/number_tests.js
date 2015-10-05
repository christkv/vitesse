"use strict";

var f = require('util').format;

/**************************************************************************
 *
 * COLLECTION TESTS
 *
 *************************************************************************/

/**
 * Create a NumberNode validator for integers greater or equal to 5
 * and less or equal to 100.
 * @example-class NumberNode
 * @example-method addValidation
 */
exports['simple add validation test for number'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      NumberNode = require('../../lib/number');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   NumberNode = require('vitesse').NumberNode;
    // BEGIN

    var schema = new NumberNode(null, null, {typeCheck:true})
      .addValidation({$gte: 5, $lte: 100});

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a number', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate(1);
    assert.equal(1, results.length);
    assert.equal('number fails validation {"$gte":5,"$lte":100}', results[0].message);
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
 * @example-class NumberNode
 * @example-method addCustomValidator
 */
exports['simple custom validator for number node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      NumberNode = require('../../lib/number'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   NumberNode = require('vitesse').NumberNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN

    var customValidator = new CustomNode()
      .setContext({divisibleBy: 10})
      .setValidator(function(object, context) {
        if((object % context.divisibleBy) != 0) {
          return new Error('number not divisible by ' + context.divisibleBy);
        }
      });

    var schema = new NumberNode(null, null, {typeCheck:true})
      .addCustomValidator(customValidator);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a number', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate(7);
    assert.equal(1, results.length);
    assert.equal('number not divisible by 10', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === customValidator);

    // Validate string 'xxxxxx'
    var results = func.validate(10);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
