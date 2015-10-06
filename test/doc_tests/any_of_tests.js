"use strict";

var f = require('util').format;

/**
 * Create a AnyOf validator for string validations
 * @example-class AnyOfNode
 * @example-method addValidations
 */
exports['simple anyOf test'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      AnyOfNode = require('../../lib/anyof'),
      StringNode = require('../../lib/string'),
      IntegerNode = require('../../lib/integer');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   IntegerNode = require('vitesse').IntegerNode,
    // LINE   AnyOfNode = require('vitesse').AnyOfNode;
    // BEGIN

    var string1 = new StringNode(null, null, {typeCheck:true})
      .addValidation({$gte: 5, $lte: 100});

    var integer1 = new IntegerNode(null, null, {typeCheck:true})
      .addValidation({$gte: 100, $lte: 1000});

    var schema = new AnyOfNode()
      .addValidations([string1, integer1]);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal("value does not match any of the schema's in the anyOf rule", results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate('4444');
    assert.equal(1, results.length);
    assert.equal("value does not match any of the schema's in the anyOf rule", results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate(200);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}