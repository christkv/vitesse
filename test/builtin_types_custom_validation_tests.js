var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  CustomType = require('../lib/ast').CustomType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType,
  Custom = require('../lib/custom'),
  Builder = require('../lib/builder'),
  Compiler = require('../lib/compiler');

describe('Custom', function() {
  describe('builtin custom validations', function() {
    it('simple string type validation extended with custom validation functions', function() {
      var schema = new DocumentType({
        'field': new StringType({
          custom: [new CustomType({
            context: {valid: 'dog'}, 
            func: function(object, context) {
              if(object != context.valid) {
                return new Error('field did not contain dog');
              }
            }
          }), new CustomType({
            context: {}, 
            func: function(object, context) {
              if(object.length != 3) {
                return new Error('field must have 3 characters');
              }
            }
          })]
        }, {})
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(2, results.length);
      assert.equal('field did not contain dog', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);
      assert.equal('field must have 3 characters', results[1].message);
      assert.equal('object.field', results[1].path);
      assert.equal('', results[1].value);
      assert.ok(results[1].rule instanceof DocumentType);

      // Validate {field: 'dog'}
      var results = func.validate({field: 'dog'});
      assert.equal(0, results.length);
    });

    it('simple number type validation extended with custom validation functions', function() {
      var schema = new DocumentType({
        'field': new NumberType({
          custom: [new CustomType({
            context: {valid: 5}, 
            func: function(object, context) {
              if(object != context.valid) {
                return new Error('field was not 5');
              }
            }
          }), new CustomType({
            context: {}, 
            func: function(object, context) {
              if((object % 5) != 0) {
                return new Error('field must be divisible by 5');
              }
            }
          })]
        }, {})
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 1});
      assert.equal(2, results.length);
      assert.equal('field was not 5', results[0].message);
      assert.equal('object.field', results[0].path);
      assert.equal(1, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);
      assert.equal('field must be divisible by 5', results[1].message);
      assert.equal('object.field', results[1].path);
      assert.equal(1, results[1].value);
      assert.ok(results[1].rule instanceof DocumentType);

      // Validate {field: 5}
      var results = func.validate({field: 5});
      assert.equal(0, results.length);
    });

    it('simple object type validation extended with custom validation functions', function() {
      var schema = new DocumentType({
        'field': new NumberType({})
      }, {
        custom: [new CustomType({
          context: {totalKeys: 1}, 
          func: function(object, context) {
            if(Object.keys(object).length != 1) {
              return new Error('object must only contain a single field');
            }
          }
        }), new CustomType({
          context: {}, 
          func: function(object, context) {
            if((object.field % 5) != 0) {
              return new Error('field must be divisible by 5');
            }
          }
        })]
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {debug:true});

      // Validate {field: 0}
      var results = func.validate({field: 1, illegal:1});
      assert.equal(2, results.length);
      assert.equal('object must only contain a single field', results[0].message);
      assert.equal('object', results[0].path);
      assert.deepEqual({field: 1, illegal:1}, results[0].value);
      assert.ok(results[0].rule instanceof DocumentType);
      assert.equal('field must be divisible by 5', results[1].message);
      assert.equal('object', results[1].path);
      assert.deepEqual({field: 1, illegal:1}, results[1].value);
      assert.ok(results[1].rule instanceof DocumentType);

      // Validate {field: 5}
      var results = func.validate({field: 5});
      assert.equal(0, results.length);
    });
  });
});
