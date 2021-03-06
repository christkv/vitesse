"use strict";

var f = require('util').format;

/**
 * Create a String validator for strings of length greater or equal to 5
 * and less or equal than 100 characters
 * @example-class StringNode
 * @example-method addValidation
 */
exports['simple add validation test'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode;
    // BEGIN

    var schema = new StringNode(null, null, {typeCheck:true})
      .addValidation({$gte: 5, $lte: 100});

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate('');
    assert.equal(1, results.length);
    assert.equal('string fails validation {"$gte":5,"$lte":100}', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate('xxxxxx');
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create a String validator for date strings 
 * @example-class StringNode
 * @example-method addValidation
 */
exports['simple date format validation test'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode;
    // BEGIN

    var schema = new StringNode(null, null, {typeCheck:true})
      .addValidation({$format: 'date'});

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate('');
    assert.equal(1, results.length);
    assert.equal('string fails validation {"$format":"date"}', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate string 'xxxxxx'
    var results = func.validate('2015-09-10');
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create a Custom validator
 * @example-class StringNode
 * @example-method addCustomValidator
 */
exports['simple custom validator for string node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      StringNode = require('../lib/string'),
      CustomNode = require('../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   CustomNode = require('../lib/custom');
    // BEGIN

    var customValidator = new CustomNode()
      .setContext({regexp: /^[0-9]+$/ })
      .setValidator(function(object, context) {
        if(!context.regexp.test(object)) {
          return new Error('failed regular expression ' + context.regexp.toString());
        }
      });

    var schema = new StringNode(null, null, {typeCheck:true})
      .addCustomValidator(customValidator);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ''
    var results = func.validate('');
    assert.equal(1, results.length);
    assert.equal('failed regular expression /^[0-9]+$/', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === customValidator);

    // Validate string 'xxxxxx'
    var results = func.validate('123456');
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
