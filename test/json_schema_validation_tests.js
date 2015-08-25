var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  IntegerType = require('../lib/ast').IntegerType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler');

describe('JSONSchema', function() {
  describe('validation', function() {
    it('numeric options', function() {
      var schema = new NumberType({
        validations: {$multipleOf: 4}
      })

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});
      // Validate 1
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal("number fails validation {\"$multipleOf\":4}", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate 4
      var results = func.validate(4);
      assert.equal(0, results.length);

      // Validate 16
      var results = func.validate(16);
      assert.equal(0, results.length);
    });

    it('integer options', function() {
      var schema = new IntegerType({
        validations: {$multipleOf: 4}
      })

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});
      // Validate 1
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal("number fails validation {\"$multipleOf\":4}", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate 4
      var results = func.validate(4);
      assert.equal(0, results.length);

      // Validate 16
      var results = func.validate(16);
      assert.equal(0, results.length);
    });

    it('string options', function() {
      var schema = new StringType({
        validations: {$regexp: /car/}
      })

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});
      // Validate dog
      var results = func.validate('dog');
      assert.equal(1, results.length);
      assert.equal("string fails validation {\"$regexp\":\"/car/\"}", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate car
      var results = func.validate('car');
      assert.equal(0, results.length);

      // Validate carcar
      var results = func.validate('carcar');
      assert.equal(0, results.length);
    });

    it('object options max/min', function() {
      var schema = new DocumentType({
        fields: {},
        validations: {$gte: 2, $lte: 4}
      })

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});
      // Validate {a:1, b:1, c:1, d:1, e:1}
      var results = func.validate({a:1, b:1, c:1, d:1, e:1});
      assert.equal(1, results.length);
      assert.equal("number fails validation {\"$gte\":2,\"$lte\":4}", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate {a:1, b:1, c:1}
      var results = func.validate({a:1, b:1, c:1});
      assert.equal(0, results.length);
    });

    it('object options required', function() {
      var schema = new DocumentType({
        fields: {},
        required: ['a', 'b']
      })

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});
      // Validate {c:1, d:1}
      var results = func.validate({c:1, d:1});
      assert.equal(1, results.length);
      assert.equal("object is missing required fields [\"a\",\"b\"]", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate {a:1, b:1, c:1}
      var results = func.validate({a:1, b:1, c:1});
      assert.equal(0, results.length);

        // console.log(JSON.stringify(results, null, 2));
    });
  });
});
