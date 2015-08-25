var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  OneOfType = require('../lib/ast').OneOfType,
  AllOfType = require('../lib/ast').AllOfType,
  AnyOfType = require('../lib/ast').AnyOfType,
  NumberType = require('../lib/ast').NumberType,
  IntegerType = require('../lib/ast').IntegerType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler'),
  ClosureCompiler = require('../lib/closure_compiler');

describe('AnyOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      var doc3 = new IntegerType({ validations: { $lte: 10 } });

      // Top level document
      var embeddedDocument = new AnyOfType({
        validations: [
          new IntegerType({}),
          new IntegerType({ validations: { $gte: 2 } }),
          doc3        
        ]
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: { 
          'child': embeddedDocument
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({child: ''});
      assert.equal(4, results.length);
      assert.equal("value does not match any of the schema\'s in the anyOf rule", results[3].message);
      assert.equal('object.child', results[3].path);
      assert.ok(topLevelDocument === results[3].rule);
    });

    it('should handle situation where validation is a document', function() {
      var doc1 = new DocumentType({
            fields: {
              'field': new StringType({})
            },
            exists:true
          });

      var string2 = new StringType({validations: {$gte:2}});
      var doc2 = new DocumentType({
            fields: {
              'field': string2
            },
            exists:true
          });

      // Top level document
      var topLevelDocument = new AnyOfType({
        validations: [
          doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:3});
      assert.equal(2, results.length);
      assert.equal("field is not a string", results[0].message);
      assert.equal('object.field', results[0].path);
      assert.ok(string2 === results[0].rule);

      assert.equal("value does not match any of the schema\'s in the anyOf rule", results[1].message);
      assert.equal('object', results[1].path);
      assert.ok(topLevelDocument === results[1].rule);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);

      // Top level document
      var topLevelDocument = new AnyOfType({
        validations: [
          doc1, doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:''});
      assert.equal(0, results.length);

      // Attempt to validate
      var results = func.validate({field:3});
      assert.equal(3, results.length);
      assert.equal("value does not match any of the schema\'s in the anyOf rule", results[2].message);
      assert.equal('object', results[2].path);
      assert.ok(topLevelDocument === results[2].rule);
    });
  });
});
