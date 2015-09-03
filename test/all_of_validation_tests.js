var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  OneOfType = require('../lib/ast').OneOfType,
  AllOfType = require('../lib/ast').AllOfType,
  NumberType = require('../lib/ast').NumberType,
  IntegerType = require('../lib/ast').IntegerType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler'),
  ClosureCompiler = require('../lib/closure_compiler');

describe('AllOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      var doc3 = new IntegerType({ validations: { $lte: 10 } });

      // Top level document
      var embeddedDocument = new AllOfType({
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
      var results = func.validate({child: 11});
      assert.equal(1, results.length);
      assert.equal('one or more schema\'s did not match the allOf rule', results[0].message);
      assert.equal('object.child', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
      assert.equal(1, results[0].errors.length);

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
      var topLevelDocument = new AllOfType({
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
      assert.equal('one or more schema\'s did not match the allOf rule', results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
      // Remaining error
      assert.equal('string fails validation {\"$gte\":2}', results[0].errors[0].message);
      assert.equal('object.field', results[0].errors[0].path);
      assert.ok(string2 === results[0].errors[0].rule);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);

      // Top level document
      var topLevelDocument = new AllOfType({
        validations: [
          doc1, doc2
        ]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);
    });
  });
});
