var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib/array'),
  ObjectNode = require('../lib/object'),
  IntegerNode = require('../lib/integer'),
  NotNode = require('../lib/not'),
  BooleanNode = require('../lib/boolean'),
  NumberNode = require('../lib/number'),
  StringNode = require('../lib/string'),
  Compiler = require('../lib/compiler').Compiler;

describe('Not', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      var embeddedDocument = new NotNode()
        .addValidations([
            new IntegerNode(null, null, {typeCheck:true}),
            new StringNode(null, null, {typeCheck:true})
          ]);

      var topLevelDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('child', embeddedDocument);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({child: ''});
      assert.equal(1, results.length);
      assert.equal("value failed not rule", results[0].message);
      assert.deepEqual(['object', 'child'], results[0].path);
      assert.ok(embeddedDocument === results[0].rule);
    });

    it('should handle situation where validation is a document', function() {
      var string1 = new StringNode(null, null, {typeCheck:true});
      var doc1 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string1)
        .requiredFields(['field']);

      // String
      var string2 = new StringNode(null, null, {typeCheck:true});
      // Get the document
      var doc2 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string2)
        .requiredFields(['field']);

      // Top level document
      var topLevelDocument = new NotNode()
        .addValidations([doc2]);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(1, results.length);
      assert.equal("value failed not rule", results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(topLevelDocument === results[0].rule);

      // Attempt to validate
      var results = func.validate({field:true});
      assert.equal(0, results.length);

      // Top level document
      var topLevelDocument = new NotNode()
        .addValidations([doc1, doc2]);

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
      assert.deepEqual(['object'], results[0].path);
      assert.ok(string1 === results[0].rule);
    });
  });
});
