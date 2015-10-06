"use strict";

var f = require('util').format;

/**
 * Create an Enum validation that validates the value
 * @example-class EnumNode
 * @example-method addEnums
 */
exports['simple validator for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      EnumNode = require('../../lib/enum');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   EnumNode = require('vitesse').EnumNode;
    // BEGIN
    var enums = [null, 'dog', true, [1, 2, 3]];
    var schema = new EnumNode(null, null, {typeCheck:true})
      .addEnums(enums);
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field does not match enumeration [null,"dog",true,[1,2,3]]', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1, 2, 3]
    var results = func.validate([1, 2, 3]);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}