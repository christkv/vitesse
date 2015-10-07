"use strict";

var f = require('util').format;

/**
 * Create a Custom validator
 * @example-class BooleanNode
 * @example-method addCustomValidator
 */
exports['simple custom validator for boolean node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      BooleanNode = require('../lib/boolean'),
      CustomNode = require('../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   BooleanNode = require('vitesse').BooleanNode,
    // LINE   CustomNode = require('../lib/custom');
    // BEGIN

    var customValidator = new CustomNode()
      .setContext({divisibleBy: 10})
      .setValidator(function(object, context) {
        if(object == false) {
          return new Error('value must be true');
        }
      });

    var schema = new BooleanNode(null, null, {typeCheck:true})
      .addCustomValidator(customValidator);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a boolean', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate(false);
    assert.equal(1, results.length);
    assert.equal('value must be true', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === customValidator);

    // Validate string 'xxxxxx'
    var results = func.validate(true);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
