/**
 * A simple example of compiling a schema
 * @example-class Compiler
 * @example-method compile
 */
exports['simple compiler example'] = {
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

/**
 * A simple example of compiling a schema
 * @example-class ClosureCompiler
 * @example-method compile
 */
exports['simple closure compiler example'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    if(process.env["TRAVIS_JOB_ID"]) return test.done();
    var assert = require('assert'),
      ClosureCompiler = require('../lib/compiler').ClosureCompiler,
      ObjectNode = require('../lib/object'),
      StringNode = require('../lib/string');
    // LINE assert = require('assert'),
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ObjectNode = require('vitesse').ObjectNode,
    // REMOVE-LINE test.done();
    // BEGIN
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ObjectNode(null, null, {typeCheck:true})
      .addChild('brand', string);

    var compiler = new ClosureCompiler({});
    // Compile the AST
    compiler.compile(schema, function(err, func) {
      assert.equal(null, err);
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
      test.done();
    });
    // END
  }
}
