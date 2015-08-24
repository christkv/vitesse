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

describe('TopLevel', function() {
  describe('validation', function() {
    it('should correctly validate top level integer value', function() {
      // Top level document
      var topLevelDocument = new IntegerType({
        validations: {$gte:2}
      });

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);
      var results = func.validate(4);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level numeric value', function() {
      // Top level document
      var topLevelDocument = new NumberType({
        validations: {$gte:2}
      });

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);
      var results = func.validate(4);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level string value', function() {
      // Top level document
      var topLevelDocument = new StringType({
        validations: {$gte:2}
      });

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);

      // Attempt to validate
      var results = func.validate('');
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal('', results[0].value);

      var results = func.validate('aa');
      assert.equal(0, results.length);
    });

    it('should correctly validate top level array value', function() {
      // Embedded document
      var embeddedDocument = new IntegerType({
        validations: {$gte:2}
      });

      // Top level document
      var topLevelDocument = new ArrayType({
        validations: {$gte:2}, of: embeddedDocument, validations: {$gte:5, $lte:10}
      });

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate([1, 2, 2]);
      assert.equal(2, results.length);
      assert.equal("array failed length validation {\"$gte\":5,\"$lte\":10}", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.deepEqual([1, 2, 2], results[0].value);

      // Number validation failure
      assert.equal("number fails validation {\"$gte\":2}", results[1].message);
      assert.equal('object[0]', results[1].path);
      assert.ok(results[1].rule === embeddedDocument);
      assert.equal(1, results[1].value);

      // Execute validation
      var results = func.validate([1, 2, 1, 1, 1]);
      assert.equal(4, results.length);
      assert.equal("number fails validation {\"$gte\":2}", results[0].message);
      assert.equal('object[0]', results[0].path);
      assert.ok(results[0].rule === embeddedDocument);
      assert.equal(1, results[0].value);

      // Valid response
      var results = func.validate([2, 2, 2, 2, 2]);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level ofOne', function() {
      // Top level document
      var topLevelDocument = new OneOfType({
        validations: [
          new IntegerType({}),
          new IntegerType({ validations: { $gte: 2 } }),
          new IntegerType({ validations: { $gte: 5 } })        
        ]
      });

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate(3);
      assert.equal(2, results.length);
      assert.equal("more than one schema matched ofOne rule", results[1].message);
      assert.equal('object', results[1].path);
      assert.ok(results[1].rule === topLevelDocument);

      // Valid response
      var results = func.validate(1);
      assert.equal(0, results.length);
    });
  });
});
