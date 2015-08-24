var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  OneOfType = require('../lib/ast').OneOfType,
  NumberType = require('../lib/ast').NumberType,
  IntegerType = require('../lib/ast').IntegerType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler'),
  ClosureCompiler = require('../lib/closure_compiler');

describe('OneOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      // Embedded documents
      var embeddedDocument = new OneOfType({
        validations: [
          new IntegerType(),
          new IntegerType({
            validations: { $gte: 2 }
          })
        ]
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        'child': embeddedDocument
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({child: 3});
      assert.equal(1, results.length);
      assert.equal('more than one schema matched ofOne rule', results[0].message);
      assert.equal('object.child', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
    });

    it('should handle OneOf where validation is a document', function() {
      var doc1 = new DocumentType({
            'field': new StringType({})
          }, { exists:true });

      var doc2 = new DocumentType({
            'field': new StringType({validations: {$gte:2}})
          }, { exists:true });

      // Top level document
      var topLevelDocument = new OneOfType({
        validations: [
          doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {\"$gte\":2}', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.ok(doc2 === results[0].rule);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);

      // Top level document
      var topLevelDocument = new OneOfType({
        validations: [
          doc1, doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(1, results.length);
      assert.equal('more than one schema matched ofOne rule', results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
      // console.log(JSON.stringify(results, null, 2))  
    });
  });
});