var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib/array'),
  ObjectNode = require('../lib/object'),
  IntegerNode = require('../lib/integer'),
  BooleanNode = require('../lib/boolean'),
  OneOfNode = require('../lib/oneof'),
  NumberNode = require('../lib/number'),
  StringNode = require('../lib/string'),
  Compiler = require('../lib/compiler').Compiler,
  ClosureCompiler = require('../lib/compiler').ClosureCompiler;

describe('OneOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      var integer1 = new IntegerNode(null, null, {typeCheck:true});
      var integer2 = new IntegerNode(null, null, {typeCheck:true})
        .addValidation({$gte:2});
      var embeddedDocument = new OneOfNode(null, null, {typeCheck:true})
        .addValidations([
            integer1, integer2
          ]);

      // Top level document
      var topLevelDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('child', embeddedDocument)
        .requiredFields(['child']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({child: 3});
      assert.equal(1, results.length);
      assert.equal('more than one schema matched ofOne rule', results[0].message);
      assert.deepEqual(['object', 'child'], results[0].path);
      assert.ok(embeddedDocument === results[0].rule);
    });

    it('should handle OneOf where validation is a document', function() {
      var string1 = new StringNode(null, null, {typeCheck:true});
      var doc1 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string1)
        .requiredFields(['field']);

      var string2 = new StringNode(null, null, {typeCheck:true})
        .addValidation({$gte:2});
      var doc2 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string2)
        .requiredFields(['field']);
  
      // Top level document
      var topLevelDocument = new OneOfNode(null, null, {typeCheck:true})
        .addValidations([
            doc2
          ]);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:''});
      assert.equal(1, results.length);
      assert.equal('more than one schema matched ofOne rule', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(topLevelDocument === results[0].rule);

      // Validate other errors
      assert.equal('string fails validation {\"$gte\":2}', results[0].errors[0].message);
      assert.deepEqual(['object', 'field'], results[0].errors[0].path);
      assert.ok(string2 === results[0].errors[0].rule);

      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(0, results.length);

      // Top level document
      var topLevelDocument = new OneOfNode(null, null, {typeCheck:true})
        .addValidations([
            doc1, doc2
          ]);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate({field:'  '});
      assert.equal(1, results.length);
      assert.equal('more than one schema matched ofOne rule', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(string1 === results[0].rule);
    });
  });
});
