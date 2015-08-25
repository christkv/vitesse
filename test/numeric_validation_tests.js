var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler');

describe('Number', function() {
  describe('validation', function() {
    it('simple number type validation', function() {
      var schema = new DocumentType({
        fields: {
          'field': new NumberType({exists:true})
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
      assert.equal('field is not a number', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.ok(results[0].rule instanceof NumberType);
    });

    it('simple number nested object type validation', function() {
      var doc1 = new DocumentType({
        fields: {
          'field': new NumberType({exists:true})
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
      assert.equal(2, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.doc', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);
      assert.equal('field is not an object', results[1].message);
      assert.equal('object.doc', results[1].path);
      assert.ok(results[1].rule instanceof DocumentType);

      // Validate {doc: {field:''}}
      var results = func.validate({doc: {field:''}});
      assert.equal(1, results.length);
      assert.equal('field is not a number', results[0].message);
      assert.equal('object.doc.field', results[0].path);
      assert.ok(results[0].rule instanceof NumberType);
    });

    it('simple number type validation using supported language and $gte/$lte', function() {
      var schema = new DocumentType({
        fields: {
          'field': new NumberType({
            validations: { $gte: 1, $lte: 25 }
          }, {})
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 0});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal(0, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {field: 26}
      var results = func.validate({field: 26});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal(26, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      var results = func.validate({field: 10});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $gt/$lt', function() {
      var schema = new DocumentType({
        fields: {
          'field': new NumberType({
            validations: { $gt: 1, $lt: 25 }
          }, {})
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 0});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal(0, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {field: 25}
      var results = func.validate({field: 25});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal(25, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      var results = func.validate({field: 24});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $in', function() {
      var schema = new DocumentType({
        fields: {
          'field': new NumberType({
            validations: { $in: [4, 6, 8, 10] }
          }, {})
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: 0});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$in":[4,6,8,10]}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal(0, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      var results = func.validate({field: 8});
      assert.equal(0, results.length);
    });
  });
});
