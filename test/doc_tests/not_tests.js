"use strict";

var f = require('util').format;

/**
 * Create a Not validator for string validations
 * @example-class NotNode
 * @example-method addValidations
 */
exports['simple not test'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      NotNode = require('../../lib/not'),
      StringNode = require('../../lib/string'),
      IntegerNode = require('../../lib/integer');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   IntegerNode = require('vitesse').IntegerNode,
    // LINE   NotNode = require('vitesse').NotNode;
    // BEGIN

    var string1 = new StringNode(null, null, {typeCheck:true})
      .addValidation({$gte: 5, $lte: 100});

    var integer1 = new IntegerNode(null, null, {typeCheck:true})
      .addValidation({$gte: 100, $lte: 1000});

    var schema = new NotNode()
      .addValidations([string1, integer1]);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate(400);
    assert.equal(1, results.length);
    assert.equal("value failed not rule", results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate(50);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}