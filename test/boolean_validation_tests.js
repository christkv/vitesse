var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib/array'),
  ObjectNode = require('../lib/object'),
  IntegerNode = require('../lib/integer'),
  BooleanNode = require('../lib/boolean'),
  StringNode = require('../lib/string'),
  Compiler = require('../lib/compiler').Compiler;

describe('Boolean', function() {
  describe('validation', function() {
    it('simple boolean type validation', function() {
      var booleanValue = new BooleanNode(null, null, {typeCheck:true});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', booleanValue)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('object is missing required fields [\"field\"]', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate {field:''}
      var results = func.validate({field:''});
      assert.equal(1, results.length);
      assert.equal('field is not a boolean', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.ok(results[0].rule === booleanValue);

      // Validate correctly
      var results = func.validate({field:true});
      assert.equal(0, results.length);

      // Validate correctly
      var results = func.validate({field:false});
      assert.equal(0, results.length);
    });

    it('simple boolean nested object type validation', function() {
      var booleanValue = new BooleanNode(null, null, {typeCheck:true});
      var doc1 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', booleanValue);

      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('doc', doc1)
        .requiredFields(['doc']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('object is missing required fields ["doc"]', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate {doc: {field:''}}
      var results = func.validate({doc: {field:''}});
      assert.equal(1, results.length);
      assert.equal('field is not a boolean', results[0].message);
      assert.deepEqual(['object', 'doc', 'field'], results[0].path);
      assert.ok(results[0].rule === booleanValue);

      // Validate correctly
      var results = func.validate({doc: {field:true}});
      assert.equal(0, results.length);

      // Validate correctly
      var results = func.validate({doc: {field:false}});
      assert.equal(0, results.length);
    });
  });
});
