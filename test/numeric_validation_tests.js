var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib2/array'),
  ObjectNode = require('../lib2/object'),
  IntegerNode = require('../lib2/integer'),
  BooleanNode = require('../lib2/boolean'),
  NumberNode = require('../lib2/number'),
  StringNode = require('../lib2/string'),
  Compiler = require('../lib2/compiler').Compiler;

describe('Number', function() {
  describe('validation', function() {
    it('simple number type validation', function() {
      var numberNode = new NumberNode(null, null, {typeCheck:true});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('object is missing required fields ["field"]', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate {field:''}
      var results = func.validate({field:''});
      assert.equal(1, results.length);
      assert.equal('field is not a number', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.ok(results[0].rule === numberNode);
    });

    it('simple number nested object type validation', function() {
      var numberNode = new NumberNode(null, null, {typeCheck:true});
      var doc1 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)

      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('doc', doc1)
        .requiredFields(['doc']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('object is missing required fields ["doc"]', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(results[0].rule === schema);

      // Validate {doc: {field:''}}
      var results = func.validate({doc: {field:''}});
      assert.equal(1, results.length);
      assert.equal('field is not a number', results[0].message);
      assert.deepEqual(['object', 'doc', 'field'], results[0].path);
      assert.ok(results[0].rule == numberNode);
    });

    it('simple number type validation using supported language and $gte/$lte', function() {
      var numberNode = new NumberNode(null, null, {typeCheck:true})
        .addValidation({$gte: 1})
        .addValidation({$lte: 25});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 0});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal(0, results[0].value);
      assert.ok(results[0].rule === numberNode);

      // Validate {field: 26}
      var results = func.validate({field: 26});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal(26, results[0].value);
      assert.ok(results[0].rule === numberNode);

      var results = func.validate({field: 10});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $gt/$lt', function() {
      var numberNode = new NumberNode(null, null, {typeCheck:true})
        .addValidation({$gt: 1})
        .addValidation({$lt: 25});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)
        .requiredFields(['field']);
    
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: 0}
      var results = func.validate({field: 0});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal(0, results[0].value);
      assert.ok(results[0].rule === numberNode);

      // Validate {field: 25}
      var results = func.validate({field: 25});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal(25, results[0].value);
      assert.ok(results[0].rule === numberNode);

      var results = func.validate({field: 24});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $in', function() {
      var numberNode = new NumberNode(null, null, {typeCheck:true})
        .addValidation({$in: [4, 6, 8, 10]})
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', numberNode)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: 0});
      assert.equal(1, results.length);
      assert.equal('number fails validation {"$in":[4,6,8,10]}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal(0, results[0].value);
      assert.ok(results[0].rule === numberNode);

      var results = func.validate({field: 8});
      assert.equal(0, results.length);
    });
  });
});
