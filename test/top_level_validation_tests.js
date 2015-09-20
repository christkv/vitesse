var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib2/array'),
  ObjectNode = require('../lib2/object'),
  IntegerNode = require('../lib2/integer'),
  BooleanNode = require('../lib2/boolean'),
  OneOfNode = require('../lib2/oneof'),
  AllOfNode = require('../lib2/allof'),
  AnyOfNode = require('../lib2/anyOf'),
  NotNode = require('../lib2/not'),
  NumberNode = require('../lib2/number'),
  StringNode = require('../lib2/string'),
  Compiler = require('../lib2/compiler').Compiler,
  ClosureCompiler = require('../lib2/compiler').ClosureCompiler;

describe('TopLevel', function() {
  describe('validation', function() {
    it('should correctly validate top level integer value', function() {
      var topLevelDocument = new IntegerNode(null, null, {typeCheck:true})
        .addValidation({$gte:2});

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);
      var results = func.validate(4);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level numeric value', function() {
      var topLevelDocument = new NumberNode(null, null, {typeCheck:true})
        .addValidation({$gte:2});

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);
      var results = func.validate(4);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level boolean value', function() {
      // Top level document
      var topLevelDocument = new BooleanNode(null, null, {typeCheck:true});
      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);
      var results = func.validate(true);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level string value', function() {
      var topLevelDocument = new StringNode(null, null, {typeCheck:true})
        .addValidation({$gte:2});

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Attempt to validate
      var results = func.validate(1);
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(1, results[0].value);

      // Attempt to validate
      var results = func.validate('');
      assert.equal(1, results.length);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal('', results[0].value);

      var results = func.validate('aa');
      assert.equal(0, results.length);
    });

    it('should correctly validate top level array value', function() {
      var embeddedDocument = new IntegerNode(null, null, {typeCheck:true})
        .addValidation({$gte:2});

      var topLevelDocument = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte:5})
        .addValidation({$lte:10})
        .addItemValidation(embeddedDocument);

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate([1, 2, 2]);
      assert.equal(2, results.length);
      assert.equal('array fails length validation {"$gte":5,"$lte":10}', results[0].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.deepEqual([1, 2, 2], results[0].value);

      // Number validation failure
      assert.equal("number fails validation {\"$gte\":2}", results[1].message);
      assert.deepEqual(['object'], results[0].path);
      assert.ok(results[1].rule === embeddedDocument);
      assert.equal(1, results[1].value);

      // Execute validation
      var results = func.validate([1, 2, 1, 1, 1]);
      assert.equal(4, results.length);
      assert.equal("number fails validation {\"$gte\":2}", results[0].message);
      assert.deepEqual(['object', '0'], results[0].path);
      assert.ok(results[0].rule === embeddedDocument);
      assert.equal(1, results[0].value);

      // Valid response
      var results = func.validate([2, 2, 2, 2, 2]);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level ofOne', function() {
      var topLevelDocument = new OneOfNode(null, null, {typeCheck:true})
        .addValidations([
            new IntegerNode(null, null, {typeCheck:true}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$gte:2}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$gte:5}),
          ]);

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate(3);
      assert.equal(1, results.length);
      assert.equal("more than one schema matched ofOne rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);

      // Valid response
      var results = func.validate(1);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level allOf', function() {
      // var doc3 = new IntegerType({ validations: { $lte: 10 } });

      // // Top level document
      // var topLevelDocument = new AllOfType({
      //   validations: [
      //     new IntegerType({}),
      //     new IntegerType({ validations: { $gte: 2 } }),
      //     doc3        
      //   ]
      // });
      var doc3 = new IntegerNode(null, null, {typeCheck:true})
        .addValidation({$lte:10});

      var topLevelDocument = new AllOfNode(null, null, {typeCheck:true})
        .addValidations([
            new IntegerNode(null, null, {typeCheck:true}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$gte:2}),
            doc3
          ]);

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate(11);
      assert.equal(1, results.length);     
      assert.equal("one or more schema's did not match the allOf rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);

      // Error doc
      assert.equal("number fails validation {\"$lte\":10}", results[0].errors[0].message);
      assert.equal('object', results[0].errors[0].path);
      assert.ok(results[0].errors[0].rule === doc3);

      // Valid response
      var results = func.validate(3);
      assert.equal(0, results.length);
    });

    it('should correctly validate top level anyOf', function() {
      // Top level document
      var topLevelDocument = new AnyOfNode(null, null, {typeCheck:true})
        .addValidations([
            new IntegerNode(null, null, {typeCheck:true}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$gte:2}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$lte:5}),
          ]);

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate('');
      assert.equal(1, results.length);
      assert.equal("value does not match any of the schema's in the anyOf rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);
      assert.equal(3, results[0].errors.length);

      // Valid response
      var results = func.validate(3);
      assert.equal(0, results.length);
    });    

    it('should correctly validate top level not', function() {
      // Top level document
      var topLevelDocument = new NotNode(null, null, {typeCheck:true})
        .addValidations([
            new IntegerNode(null, null, {typeCheck:true}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$gte:2}),
            new IntegerNode(null, null, {typeCheck:true})
              .addValidation({$lte:5}),
          ]);

      // Create a compiler
      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Execute validation
      var results = func.validate(3);
      assert.equal(1, results.length);
      assert.equal("value failed not rule", results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);

      // Valid response
      var results = func.validate('');
      assert.equal(0, results.length);
    });    
  });
});
