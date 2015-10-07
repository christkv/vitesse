"use strict";

var f = require('util').format;

/**
 * Create an Array validation that validates the length of the array and type.
 * @example-class ArrayNode
 * @example-method addValidation
 */
exports['simple validator for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN
    var schema = new ArrayNode(null, null, {typeCheck:true})
      .addValidation({$gte: 2, $lte: 5});
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1]
    var results = func.validate([1]);
    assert.equal(1, results.length);
    assert.equal('array fails length validation {"$gte":2,"$lte":5}', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate number 100
    var results = func.validate([1, 2, 3]);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Array validation that requires all elements to be a string.
 * @example-class ArrayNode
 * @example-method addItemValidation
 */
exports['simple per item validator for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      StringNode = require('../../lib/string'),
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ArrayNode(null, null, {typeCheck:true})
      .addItemValidation(string);
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1]
    var results = func.validate([1]);
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object', '0'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate ['1']
    var results = func.validate(['1']);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Array validation that requires positional elements to pass specific validations
 * @example-class ArrayNode
 * @example-method addPositionalItemValidation
 */
exports['simple positional item validators for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      StringNode = require('../../lib/string'),
      IntegerNode = require('../../lib/integer'),
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   IntegerNode = require('vitesse').IntegerNode,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN
    var integer = new IntegerNode(null, null, {typeCheck:true});
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ArrayNode(null, null, {typeCheck:true})
      .addPositionalItemValidation(0, string)
      .addPositionalItemValidation(1, integer);
    
    // Create a compiler
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});
    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1]
    var results = func.validate([1]);
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object', '0'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate ['1', '1']
    var results = func.validate(['1', '1']);
    assert.equal(1, results.length);
    assert.equal('field is not an integer', results[0].message);
    assert.deepEqual(['object', '1'], results[0].path);
    assert.ok(results[0].rule === integer);

    // Validate ['1', 2, 'test']
    var results = func.validate(['1', 2, 'test']);
    assert.equal(0, results.length);

    // Validate ['1']
    var results = func.validate(['1']);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create a Custom validator
 * @example-class ArrayNode
 * @example-method addCustomValidator
 */
exports['simple custom validator for string node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN

    var customValidator = new CustomNode()
      .setContext({ max: 4 })
      .setValidator(function(object, context) {
        if(object.length > context.max) {
          return new Error('array longer than maximum size ' + context.max);
        }
      });

    var schema = new ArrayNode(null, null, {typeCheck:true})
      .addCustomValidator(customValidator);

    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});

    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1, 2, 3, 4, 5]
    var results = func.validate([1, 2, 3, 4, 5]);
    assert.equal(1, results.length);
    assert.equal('array longer than maximum size 4', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === customValidator);

    // Validate [1, 2, 3]
    var results = func.validate([1, 2, 3]);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Array validation that requires positional elements as well as additional items validation
 * @example-class ArrayNode
 * @example-method addAdditionalItemsValidation
 */
exports['simple positional item validators with additional items validation for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      StringNode = require('../../lib/string'),
      IntegerNode = require('../../lib/integer'),
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   IntegerNode = require('vitesse').IntegerNode,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN
    var integer = new IntegerNode(null, null, {typeCheck:true});
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ArrayNode(null, null, {typeCheck:true})
      .addPositionalItemValidation(0, string)
      .addPositionalItemValidation(1, integer)
      .addAdditionalItemsValidation(integer);
    
    // Create a compiler
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});
    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1]
    var results = func.validate([1]);
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object', '0'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate ['1', '1']
    var results = func.validate(['1', '1']);
    assert.equal(1, results.length);
    assert.equal('field is not an integer', results[0].message);
    assert.deepEqual(['object', '1'], results[0].path);
    assert.ok(results[0].rule === integer);

    // Validate ['1', 2, 'test']
    var results = func.validate(['1', 2, 'test']);
    assert.equal(1, results.length);
    assert.equal('field is not an integer', results[0].message);
    assert.deepEqual(['object', '2'], results[0].path);
    assert.ok(results[0].rule === integer);

    // Validate ['1']
    var results = func.validate(['1']);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Array validation that requires positional elements as well as additional items validation
 * @example-class ArrayNode
 * @example-method addAdditionalItemsValidation
 */
exports['simple positional item validators with additional items validation equal to false for any node'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      StringNode = require('../../lib/string'),
      IntegerNode = require('../../lib/integer'),
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   StringNode = require('vitesse').StringNode,
    // LINE   IntegerNode = require('vitesse').IntegerNode,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN
    var integer = new IntegerNode(null, null, {typeCheck:true});
    var string = new StringNode(null, null, {typeCheck:true});
    var schema = new ArrayNode(null, null, {typeCheck:true})
      .addPositionalItemValidation(0, string)
      .addPositionalItemValidation(1, integer)
      .addAdditionalItemsValidation(false);
    
    // Create a compiler
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});
    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1]
    var results = func.validate([1]);
    assert.equal(1, results.length);
    assert.equal('field is not a string', results[0].message);
    assert.deepEqual(['object', '0'], results[0].path);
    assert.ok(results[0].rule === string);

    // Validate ['1', '1']
    var results = func.validate(['1', '1']);
    assert.equal(1, results.length);
    assert.equal('field is not an integer', results[0].message);
    assert.deepEqual(['object', '1'], results[0].path);
    assert.ok(results[0].rule === integer);

    // Validate ['1', 2, 'test']
    var results = func.validate(['1', 2, 'test']);
    assert.equal(1, results.length);
    assert.equal('array contains invalid items', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate ['1']
    var results = func.validate(['1']);
    assert.equal(0, results.length);
    // END
    test.done();
  }
}

/**
 * Create an Array validation that requires all elements to be unique
 * @example-class ArrayNode
 * @example-method uniqueItems
 */
exports['ensure all array elements are unique'] = {
  // The actual test we wish to run
  test: function(configure, test) {
    var assert = require('assert'),
      Compiler = require('../../lib/compiler').Compiler,
      ArrayNode = require('../../lib/array'),
      CustomNode = require('../../lib/custom');
    // LINE assert = require('assert'),
    // LINE   Compiler = require('vitesse').Compiler,
    // LINE   ArrayNode = require('vitesse').ArrayNode,
    // LINE   CustomNode = require('../../lib/custom');
    // BEGIN
    var schema = new ArrayNode(null, null, {typeCheck:true})
      .uniqueItems(true);
    
    // Create a compiler
    var compiler = new Compiler({});
    // Compile the AST
    var func = compiler.compile(schema, {});
    // Validate {}
    var results = func.validate({});
    assert.equal(1, results.length);
    assert.equal('field is not an array', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);

    // Validate [1]
    var results = func.validate([1]);
    assert.equal(0, results.length);

    // Validate [1, 2, 1]
    var results = func.validate([1, 2, 1]);
    assert.equal(1, results.length);
    assert.equal('array contains duplicate values', results[0].message);
    assert.deepEqual(['object'], results[0].path);
    assert.ok(results[0].rule === schema);
    // END
    test.done();
  }
}
