"use strict";

var f = require('util').format;

/**
 * Create a AllOf validator for string validations
 * @example-class AllOfNode
 * @example-method addValidations
 */
exports['simple allOf test'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      AllOfNode = require('../../lib/allof'),
      StringNode = require('../../lib/string');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   AllOfNode = require('vitesse').AllOfNode;
    // BEGIN

    var string1 = new StringNode(null, null, {typeCheck:true})
      .addValidation({$gte: 5, $lte: 100});

    var string2 = new StringNode(null, null, {typeCheck:true})
      .addValidation({$in: ['roger', 'william', 'christopher']});

    var schema = new AllOfNode()
      .addValidations([string1, string2]);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal("one or more schema's did not match the allOf rule", results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate('444444');
    assert.equal(1, results.length);
    assert.equal("one or more schema's did not match the allOf rule", results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate('william');
    assert.equal(0, results.length);
    // END
    test.done();
  }
}