var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  BooleanType = require('../lib/ast').BooleanType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler');

describe('Boolean', function() {
  describe('validation', function() {
    it('simple boolean type validation', function() {
      var schema = new DocumentType({
        fields: {
          'field': new BooleanType({exists:true})
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {field:''}
      var results = func.validate({field:''});
      assert.equal(1, results.length);
      assert.equal('field is not a boolean', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.ok(results[0].rule instanceof BooleanType);

      // Validate correctly
      var results = func.validate({field:true});
      assert.equal(0, results.length);

      // Validate correctly
      var results = func.validate({field:false});
      assert.equal(0, results.length);
    });

    it('simple boolean nested object type validation', function() {
      var doc1 = new DocumentType({
        fields: {
          'field': new BooleanType({exists:true})
        },
        exists:true
      });

      var schema = new DocumentType({
        fields: {
          'doc': doc1
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.doc', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {doc: {field:''}}
      var results = func.validate({doc: {field:''}});
      assert.equal(1, results.length);
      assert.equal('field is not a boolean', results[0].message);
      assert.equal('object.doc.field', results[0].path);
      assert.ok(results[0].rule instanceof BooleanType);

      // Validate correctly
      var results = func.validate({doc: {field:true}});
      assert.equal(0, results.length);

      // Validate correctly
      var results = func.validate({doc: {field:false}});
      assert.equal(0, results.length);
    });
  });
});
