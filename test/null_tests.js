"use strict";

var f = require('util').format;

/**
 * Create a Custom validator
 * @example-class NullNode
 * @example-method addCustomValidator
 */
exports['simple validator for null node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      NullNode = require('../lib/null'),
      CustomNode = require('../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   NullNode = require('vitesse').NullNode,
    // LINE   CustomNode = require('../lib/custom');
    // BEGIN

    var customValidator = new CustomNode()
      .setContext({divisibleBy: 10})
      .setValidator(function(object, context) {
        if((object % context.divisibleBy) != 0) {
          return new Error('number not divisible by ' + context.divisibleBy);
        }
      });

    var schema = new NullNode(null, null, {typeCheck:true})
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a null', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate(null);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
