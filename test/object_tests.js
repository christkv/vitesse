"use strict";

var f = require('util').format;

/**
 * Create an Object validation that validates the number of properties on an object.
 * @example-class ObjectNode
 * @example-method addValidation
 */
exports['simple validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object'),
      CustomNode = require('../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // LINE   CustomNode = require('../lib/custom');
    // BEGIN
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addValidation({$gte: 2, $lte: 5});
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {a:1}
    var results = func.validate({a:1});
    assert.equal(1, results.length);
    assert.equal('number fails validation {"$gte":2,"$lte":5}', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {a:1, b:2}
    var results = func.validate({a:1, b:2});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object custom validation that validates the number of properties on an object.
 * @example-class ObjectNode
 * @example-method addCustomValidator
 */
exports['simple custom validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object'),
      CustomNode = require('../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // LINE   CustomNode = require('../lib/custom');
    // BEGIN
    var customValidator = new CustomNode()
      .setContext({ max: 4 })
      .setValidator(function(object, context) {
        if(Object.keys(object).length > context.max) {
          return new Error('object contains more properties ' + context.max);
        }
      });

    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addCustomValidator(customValidator);
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {a:1, b:2, c:3, d:4, e:5}
    var results = func.validate({a:1, b:2, c:3, d:4, e:5});
    assert.equal(1, results.length);
    assert.equal('object contains more properties 4', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === customValidator);

    // Validate {a:1, b:2}
    var results = func.validate({a:1, b:2});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object with required fields
 * @example-class ObjectNode
 * @example-method requiredFields
 */
exports['simple required fields validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // BEGIN
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .requiredFields(['a', 'b']);
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {a:1}
    var results = func.validate({a:1});
    assert.equal(1, results.length);
    assert.equal('object is missing required fields ["a","b"]', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {a:1, b:2}
    var results = func.validate({a:1, b:2});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object with prohibited fields
 * @example-class ObjectNode
 * @example-method prohibitedFields
 */
exports['simple prohibited fields validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // BEGIN
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .prohibitedFields(['a', 'b']);
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {a:1}
    var results = func.validate({a:1});
    assert.equal(1, results.length);
    assert.equal('object has prohibited fields ["a","b"]', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {c:1, d:2}
    var results = func.validate({c:1, d:2});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object where certain pattern match fields must validate against specific schema
 * @example-class ObjectNode
 * @example-method addPatternPropertiesValidator
 */
exports['simple addPattern properties validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object'),
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // BEGIN
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addPatternPropertiesValidator({
        "^ca$": string
      });

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema);

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {ca:1}
    var results = func.validate({ca:1});
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate {ca:'test'}
    var results = func.validate({ca:'test'});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object where any additional properties must be a string property
 * @example-class ObjectNode
 * @example-method addAdditionalPropertiesValidator
 */
exports['simple addAdditionalPropertiesValidator properties validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object'),
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // BEGIN
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addAdditionalPropertiesValidator(string);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema);

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {ca:1}
    var results = func.validate({ca:1});
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate {ca:'test'}
    var results = func.validate({ca:'test'});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object where any additional properties are not allowed
 * @example-class ObjectNode
 * @example-method addAdditionalPropertiesValidator
 */
exports['simple addAdditionalPropertiesValidator properties are not allowed for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object'),
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // BEGIN
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addAdditionalPropertiesValidator(false);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema);

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {ca:1}
    var results = func.validate({ca:1});
    assert.equal(1, results.length);
    assert.equal('illegal fields on object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {}
    var results = func.validate({});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Object specifying a field to be of a specific type
 * @example-class ObjectNode
 * @example-method addChild
 */
exports['simple addChild properties validator for object node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../lib/compiler').Compiler,
      ObjectNode = require('../lib/object'),
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // BEGIN
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addChild('brand', string);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema);

    // Validate {}
    var results = func.validate([]);
    assert.equal(1, results.length);
    assert.equal('field is not an object', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate {ca:1}
    var results = func.validate({brand:100});
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object', 'brand'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate {ca:'test'}
    var results = func.validate({brand:'test'});
    assert.equal(0, results.length);
    // END
    test.done();
  }
}
