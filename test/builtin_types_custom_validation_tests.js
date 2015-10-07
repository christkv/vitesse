var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib/array'),
  ObjectNode = require('../lib/object'),
  IntegerNode = require('../lib/integer'),
  BooleanNode = require('../lib/boolean'),
  CustomNode = require('../lib/custom'),
  NumberNode = require('../lib/number'),
  StringNode = require('../lib/string'),
  Compiler = require('../lib/compiler').Compiler;

describe('Custom', function() {
  describe('builtin custom validations', function() {
    it('simple string type validation extended with custom validation functions', function() {
      var customValidator1 = new CustomNode(null, null).setContext({valid:'dog'}).setValidator(function(object, context) {
          if(object != context.valid) {
            return new Error('field did not contain dog');
          }  
        });

      var customValidator2 = new CustomNode(null, null).setValidator(function(object, context) {
          if(object.length != 3) {
            return new Error('field must have 3 characters');
          }  
        });

      // String node with custom validator
      var stringNode = new StringNode(null, null, {typeCheck:true})
        .addCustomValidator(customValidator1)
        .addCustomValidator(customValidator2);

      // Embedded document
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', stringNode)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(2, results.length);
      assert.equal('field did not contain dog', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule === customValidator1);
      assert.equal('field must have 3 characters', results[1].message);
      assert.deepEqual(['object', 'field'], results[1].path);
      assert.equal('', results[1].value);
      assert.ok(results[1].rule === customValidator2);

      // Validate {field: 'dog'}
      var results = func.validate({field: 'dog'});
      assert.equal(0, results.length);
    });

    it('simple number type validation extended with custom validation functions', function() {
      var customValidator1 = new CustomNode(null, null).setContext({valid:5}).setValidator(function(object, context) {
          if(object != context.valid) {
            return new Error('field was not 5');
          }  
        });

      var customValidator2 = new CustomNode(null, null).setValidator(function(object, context) {
          if((object % 5) != 0) {
            return new Error('field must be divisible by 5');
          }  
        });

      // String node with custom validator
      var numberNode = new NumberNode(null, null, {typeCheck:true})
        .addCustomValidator(customValidator1)
        .addCustomValidator(customValidator2);

      // Embedded document
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 1});
      assert.equal(2, results.length);
      assert.equal('field was not 5', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal(1, results[0].value);
      assert.ok(results[0].rule === customValidator1);
      assert.equal('field must be divisible by 5', results[1].message);
      assert.deepEqual(['object', 'field'], results[1].path);
      assert.equal(1, results[1].value);
      assert.ok(results[1].rule === customValidator2);

      // Validate {field: 5}
      var results = func.validate({field: 5});
      assert.equal(0, results.length);
    });

    it('simple object type validation extended with custom validation functions', function() {
      var customValidator1 = new CustomNode(null, null).setContext({totalKeys: 1}).setValidator(function(object, context) {
          if(Object.keys(object).length != 1) {
            return new Error('object must only contain a single field');
          }  
        });

      var customValidator2 = new CustomNode(null, null).setValidator(function(object, context) {
          if((object.field % 5) != 0) {
            return new Error('field must be divisible by 5');
          }  
        });

      // String node with custom validator
      var numberNode = new NumberNode(null, null, {typeCheck:true});

      // Embedded document
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)
        .addCustomValidator(customValidator1)
        .addCustomValidator(customValidator2)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 1, illegal:1});
      assert.equal(2, results.length);
      assert.equal('object must only contain a single field', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.deepEqual({field: 1, illegal:1}, results[0].value);
      assert.ok(results[0].rule === customValidator1);
      assert.equal('field must be divisible by 5', results[1].message);
      assert.deepEqual(['object'], results[1].path);
      assert.deepEqual({field: 1, illegal:1}, results[1].value);
      assert.ok(results[1].rule === customValidator2);

      // Validate {field: 5}
      var results = func.validate({field: 5});
      assert.equal(0, results.length);
    });

    it('simple array type validation extended with custom validation functions', function() {
      var customValidator1 = new CustomNode(null, null).setContext({totalKeys: 3}).setValidator(function(object, context) {
          if(object.length != context.totalKeys) {
            return new Error('array length must be 3');
          }  
        });

      var customValidator2 = new CustomNode(null, null).setValidator(function(object, context) {
          if(object.length % 3 != 0) {
            return new Error('array length must be divisible by 3');
          }  
        });

      // String node with custom validator
      var arrayNode = new ArrayNode(null, null, {typeCheck:true})
        .addCustomValidator(customValidator1)
        .addCustomValidator(customValidator2);

      // Embedded document
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', arrayNode)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: [1, 2]});
      assert.equal(2, results.length);
      assert.equal('array length must be 3', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.deepEqual([1, 2], results[0].value);
      assert.ok(results[0].rule === customValidator1);
      assert.equal('array length must be divisible by 3', results[1].message);
      assert.deepEqual(['object', 'field'], results[1].path);
      assert.deepEqual([1, 2], results[1].value);
      assert.ok(results[1].rule === customValidator2);

      // Validate {field: 5}
      var results = func.validate({field: [1, 2, 3]});
      assert.equal(0, results.length);
    });
  });
});
