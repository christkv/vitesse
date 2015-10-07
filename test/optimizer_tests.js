var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ObjectNode = require('../lib/object'),
  StringNode = require('../lib/string'),
  Compiler = require('../lib/compiler').Compiler,
  ClosureCompiler = require('../lib/compiler').ClosureCompiler;

describe('Optimizer', function() {
  describe('validation', function() {
    it('simple string type validation for field in object', function() {
      var string = new StringNode(null, null, {typeCheck:true});
      var schema = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(schema, {optimize:true, debug:false});

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
  });
});    