var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  OneOfType = require('../lib/ast').OneOfType,
  AllOfType = require('../lib/ast').AllOfType,
  AnyOfType = require('../lib/ast').AnyOfType,
  NotType = require('../lib/ast').NotType,
  NumberType = require('../lib/ast').NumberType,
  IntegerType = require('../lib/ast').IntegerType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler'),
  ClosureCompiler = require('../lib/closure_compiler');

describe('Not', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      // Top level document
      var embeddedDocument = new NotType({
        validations: [
          new IntegerType({}),
          new StringType({})        
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
      var results = func.validate({child: ''});
      assert.equal(1, results.length);
      assert.equal("value failed not rule", results[0].message);
      assert.equal('object.child', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
    });

    it('should handle situation where validation is a document', function() {
      var doc1 = new DocumentType({
            'field': new StringType({})
          }, { exists:true });

      // String
      var string2 = new StringType({validations: {$gte:2}});
      // Get the document
      var doc2 = new DocumentType({
            'field': string2
          }, { exists:true });

      // Top level document
      var topLevelDocument = new NotType({
        validations: [
          doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(1, results.length);
      assert.equal("value failed not rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);

      // Attempt to validate
      var results = func.validate({field:true});
      assert.equal(0, results.length);

      // Top level document
      var topLevelDocument = new NotType({
        validations: [
          doc1, doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:3});
      assert.equal(0, results.length);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(1, results.length);
      assert.equal("value failed not rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
    });
  });
});
