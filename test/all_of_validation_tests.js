var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  AllOfNode = require('../lib2/allof'),
  ObjectNode = require('../lib2/object'),
  IntegerNode = require('../lib2/integer'),
  StringNode = require('../lib2/string'),
  Compiler = require('../lib2/compiler').Compiler;

var debug = true;
var debug = false;

describe('AllOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      var topLevelDocument = new ObjectNode(null, null, {});
      // Embedded field
      var allOfNode = new AllOfNode(null, null, {});     
      // Add to allOfNode
      allOfNode.addValidations([
        new IntegerNode(null, null, {}),
        new IntegerNode(null, null, {}).addValidation({$lte: 10})
      ]);

      // Add embedded document
      topLevelDocument.addChild('child', allOfNode);

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {debug:debug});
      // Attempt to validate
      var results = func.validate({child: 11});
      assert.equal(1, results.length);
      assert.equal('one or more schema\'s did not match the allOf rule', results[0].message);
      assert.deepEqual(['object', 'child'], results[0].path);
      assert.ok(allOfNode === results[0].rule);
      assert.equal(1, results[0].errors.length);
    });

    it('should handle situation where validation is a document', function() {
      var doc1 = new ObjectNode(null, null, {});
      doc1.addChild('field', new StringNode(null, null, {}));

      var doc2 = new ObjectNode(null, null, {});
      var string = new StringNode(null, null, {}).addValidation({$gte:2});
      doc2.addChild('field', string);

      var allOf = new AllOfNode(null, null, {}).addValidations([doc2]);

      // Compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(allOf, {});
      // Attempt to validate
      var results = func.validate({field:''});
      assert.equal(1, results.length);
      assert.equal('one or more schema\'s did not match the allOf rule', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(allOf === results[0].rule);
      // Remaining error
      assert.equal('string fails validation {\"$gte\":2}', results[0].errors[0].message);     
      assert.deepEqual(['object', 'field'], results[0].errors[0].path);
      assert.ok(string === results[0].errors[0].rule);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);

      var doc1 = new ObjectNode(null, null, {});
      // Generate a new allOf
      var allOf = new AllOfNode(null, null, {}).addValidations([
          new StringNode(null, null, {}).addValidation({$gte:2}),
          new StringNode(null, null, {}).addValidation({$lte:5})
        ]);

      // Add as a field
      doc1.addChild('field', allOf);

      // Compile the AST
      var func = compiler.compile(doc1, {});
      // Attempt to validate
      var results = func.validate({field:'                      '});
      assert.equal(1, results.length);
    });
  });
});
