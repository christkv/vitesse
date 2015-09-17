var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  AnyOfNode = require('../lib2/anyof'),
  ObjectNode = require('../lib2/object'),
  IntegerNode = require('../lib2/integer'),
  StringNode = require('../lib2/string'),
  Compiler = require('../lib2/compiler').Compiler;

describe('AnyOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      var topLevelDocument = new ObjectNode();
      var doc3 = new IntegerNode(null, null, {typeCheck:true}).addValidation({$lte:10});
      // Create anyOfNode
      var anyOf = new AnyOfNode();
      // Add integer node
      anyOf.addValidations([
        new IntegerNode(null, null, {typeCheck:true}),
        new IntegerNode(null, null, {typeCheck:true}).addValidation({$gte:2}),
        doc3
      ])
      topLevelDocument.addChild('child', anyOf);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({child: ''});
      assert.equal(1, results.length);
      assert.equal("value does not match any of the schema\'s in the anyOf rule", results[0].message);
      assert.deepEqual(['object', 'child'], results[0].path);
      assert.ok(anyOf === results[0].rule);
      assert.equal(3, results[0].errors.length);
    });

    it('should handle situation where validation is a document', function() {
      // Document 1
      var doc1 = new ObjectNode().addChild('field', new StringNode(null, null, {typeCheck:true}));
      
      // Document 2
      var string2 = new StringNode(null, null, {typeCheck:true}).addValidation({$gte:2});
      var doc2 = new ObjectNode().addChild('field', string2);

      // Top level schema
      var topLevelDocument = new AnyOfNode().addValidations([
          doc2
        ]);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:3});
      assert.equal(1, results.length);
      assert.equal("value does not match any of the schema\'s in the anyOf rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);

      // Error
      assert.equal("field is not a string", results[0].errors[0].message);
      assert.deepEqual(['object', 'field'], results[0].errors[0].path);
      assert.ok(string2 === results[0].errors[0].rule);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);

      // Document 1
      var doc1 = new ObjectNode().addChild('field', new StringNode(null, null, {typeCheck:true}));
      
      // Document 2
      var string2 = new StringNode(null, null, {typeCheck:true}).addValidation({$gte:2});
      var doc2 = new ObjectNode().addChild('field', string2);

      // Top level schema
      var topLevelDocument = new AnyOfNode().addValidations([
        doc1, doc2
      ]);

      // Compile the AST
      var func = compiler.compile(topLevelDocument);
      // Attempt to validate
      var results = func.validate({field:''});
      assert.equal(0, results.length);

      // Attempt to validate
      var results = func.validate({field:3});
      assert.equal(1, results.length);
      assert.equal("value does not match any of the schema\'s in the anyOf rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(topLevelDocument === results[0].rule);
      assert.equal(2, results[0].errors.length);
    });
  });
});
