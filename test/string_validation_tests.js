var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType,
  Custom = require('../lib/custom'),
  Builder = require('../lib/builder'),
  Compiler = require('../lib/compiler');

describe('String', function() {
  describe('validation', function() {
    it('simple string type validation', function() {
      var schema = new DocumentType({
        'field': new StringType({}, {exists:true})
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

      // Validate {field:1}
      var results = func.validate({field:1});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.ok(results[0].rule instanceof StringType);
    });

    it('simple string nested object type validation', function() {
      var doc1 = new DocumentType({
        'field': new StringType({}, {exists:true})
      }, {exists:true});

      var schema = new DocumentType({
        'doc': doc1
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

      // Validate {doc: {field:1}}
      var results = func.validate({doc: {field:1}});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.doc.field', results[0].path);
      assert.ok(results[0].rule instanceof StringType);
    });

    it('simple string type validation using supported language and $gte/$lte', function() {
      var schema = new DocumentType({
        'field': new StringType({
          validations: { $gte: 1, $lte: 25 }
        }, {})
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {field: 'ffffffffffffffffffffffffff'}
      var results = func.validate({field: 'ffffffffffffffffffffffffff'});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('ffffffffffffffffffffffffff', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      var results = func.validate({field: 'ffffffffffffffffffffffff'});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $gt/$lt', function() {
      var schema = new DocumentType({
        'field': new StringType({
          validations: { $gt: 1, $lt: 25 }
        }, {})
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {field: 'fffffffffffffffffffffffff'}
      var results = func.validate({field: 'fffffffffffffffffffffffff'});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('fffffffffffffffffffffffff', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      var results = func.validate({field: 'ffffffffffffffffffffffff'});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $in', function() {
      var schema = new DocumentType({
        'field': new StringType({
          validations: { $in: ['man', 'boy', 'wife', 'husband', 'girl', 'woman'] }
        }, {})
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$in":["man","boy","wife","husband","girl","woman"]}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {field: 'puppy'}
      var results = func.validate({field: 'puppy'});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$in":["man","boy","wife","husband","girl","woman"]}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('puppy', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);

      var results = func.validate({field: 'husband'});
      assert.equal(0, results.length);
    });
  });
});
