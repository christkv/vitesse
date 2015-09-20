var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ObjectNode = require('../lib2/object'),
  StringNode = require('../lib2/string'),
  Compiler = require('../lib2/compiler').Compiler,
  ClosureCompiler = require('../lib2/compiler').ClosureCompiler;

describe('String', function() {
  describe('validation', function() {
    it('simple string type validation for field in object', function() {
      var string = new StringNode(null, null, {typeCheck:true});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
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

      // Validate {field:1}
      var results = func.validate({field:1});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.ok(results[0].rule === string);
    });

    it('simple string nested object type validation', function() {
      var string = new StringNode(null, null, {typeCheck:true});
      var doc1 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

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

      // Validate {doc: {field:1}}
      var results = func.validate({doc: {field:1}});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.deepEqual(['object', 'doc', 'field'], results[0].path);
      assert.ok(results[0].rule === string);
    });

    it('simple string type validation using supported language and $gte/$lte', function() {
      var string = new StringNode(null, null, {typeCheck:true})
        .addValidation({$gte:1})
        .addValidation({$lte:25});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule === string);

      // Validate {field: 'ffffffffffffffffffffffffff'}
      var results = func.validate({field: 'ffffffffffffffffffffffffff'});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gte":1,"$lte":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('ffffffffffffffffffffffffff', results[0].value);
      assert.ok(results[0].rule === string);

      var results = func.validate({field: 'ffffffffffffffffffffffff'});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $gt/$lt', function() {
      var string = new StringNode(null, null, {typeCheck:true})
        .addValidation({$gt:1})
        .addValidation({$lt:25});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule == string);

      // Validate {field: 'fffffffffffffffffffffffff'}
      var results = func.validate({field: 'fffffffffffffffffffffffff'});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$gt":1,"$lt":25}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('fffffffffffffffffffffffff', results[0].value);
      assert.ok(results[0].rule == string);

      var results = func.validate({field: 'ffffffffffffffffffffffff'});
      assert.equal(0, results.length);
    });

    it('simple string type validation using supported language and $in', function() {
      var string = new StringNode(null, null, {typeCheck:true})
        .addValidation({$in: ['man', 'boy', 'wife', 'husband', 'girl', 'woman']})
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$in":["man","boy","wife","husband","girl","woman"]}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule === string);

      // Validate {field: 'puppy'}
      var results = func.validate({field: 'puppy'});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$in":["man","boy","wife","husband","girl","woman"]}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('puppy', results[0].value);
      assert.ok(results[0].rule === string);

      var results = func.validate({field: 'husband'});
      assert.equal(0, results.length);
    });

    it('simple string type validation using regular expression', function() {
      var string = new StringNode(null, null, {typeCheck:true})
        .addValidation({$regexp: /dog/i})
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {});

      // Validate {field: ''}
      var results = func.validate({field: ''});
      assert.equal(1, results.length);
      assert.equal('string fails validation {"$regexp":"/dog/i"}', results[0].message);
      assert.deepEqual(['object', 'field'], results[0].path);
      assert.equal('', results[0].value);
      assert.ok(results[0].rule === string);

      var results = func.validate({field: 'Dog'});
      assert.equal(0, results.length);
    });
  });
});
