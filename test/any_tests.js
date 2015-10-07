"use strict";

var f = require('util').format;

/**
 * Create a Custom validator
 * @example-class AnyNode
 * @example-method generate
 */
exports['simple validator for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      AnyNode = require('../lib/any'),
      CustomNode = require('../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   AnyNode = require('vitesse').AnyNode,
    // LINE   CustomNode = require('../lib/custom');
    // BEGIN
    var schema = new AnyNode(null, null, {typeCheck:true})
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(0, results.length);

    // Validate number 100
    var results = func.validate(100);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
