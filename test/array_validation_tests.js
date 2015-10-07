var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayNode = require('../lib/array'),
  ObjectNode = require('../lib/object'),
  IntegerNode = require('../lib/integer'),
  StringNode = require('../lib/string'),
  Compiler = require('../lib/compiler').Compiler;

describe('Array', function() {
  describe('validation', function() {
    it('should perform complex nested objects and arrays', function() {
      // Embedded document
      var embeddedDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', new StringNode(null, null, {typeCheck:true}))
        .requiredFields(['field']);

      // Array item validations
      var aNode = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte:5}).addValidation({$lte: 10})
        .addItemValidation(embeddedDocument);
      
      var arrayDocument = new ObjectNode()
        .addChild('array', aNode)
        .requiredFields(['array']);
      
      // Array document
      var arrayDoc = new ArrayNode(null, null, {typeCheck: true})
                .addItemValidation(arrayDocument)
                .addValidation({$gte:0})
                .addValidation({$lte:10});

      // Top level document
      var topLevelDocument = new ObjectNode()
          .addChild('childArray', arrayDoc)
          .requiredFields(['childArray']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {debug:false});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('object is missing required fields ["childArray"]', results[0].message);
      assert.equal('object', results[0].path);
      assert.ok(results[0].rule === topLevelDocument);

      // Validate {childArray:1}
      var results = func.validate({childArray:1});
      assert.equal(1, results.length);
      assert.equal('field is not an array', results[0].message);
      assert.deepEqual(['object', 'childArray'], results[0].path);
      assert.ok(results[0].rule === arrayDoc);

      // Validate {childArray:[]}
      var results = func.validate({childArray:[]});
      assert.equal(0, results.length);

      // Validate {childArray:[{}]}
      var results = func.validate({childArray:[{}]});
      assert.equal(1, results.length);
      assert.equal('object is missing required fields ["array"]', results[0].message);
      assert.deepEqual(['object', 'childArray', '0'], results[0].path);
      assert.ok(results[0].rule === arrayDocument);

      // Validate {childArray:[{array:1}]}
      var results = func.validate({childArray:[{array:1}]});
      assert.equal(1, results.length);
      assert.equal('field is not an array', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'array'], results[0].path);
      assert.ok(results[0].rule === aNode);

      // Validate {childArray:[{array:[]}]}
      var results = func.validate({childArray:[{array:[]}]});
      assert.equal(1, results.length);
      assert.equal('array fails length validation {"$gte":5,"$lte":10}', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'array'], results[0].path);
      assert.deepEqual([], results[0].value);

      // Validate {childArray:[{array:[1, 2, 3, 4, 5]}]}
      var results = func.validate({childArray:[{array:[1, 2, 3, 4, 5]}]});
      assert.equal(5, results.length);

      assert.equal('field is not an object', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '0'], results[0].path);
      assert.ok(results[0].rule === embeddedDocument)

      assert.equal('field is not an object', results[1].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '1'], results[1].path);
      assert.ok(results[1].rule === embeddedDocument)

      assert.equal('field is not an object', results[2].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '2'], results[2].path);
      assert.ok(results[2].rule === embeddedDocument)

      assert.equal('field is not an object', results[3].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '3'], results[3].path);
      assert.ok(results[3].rule === embeddedDocument)

      assert.equal('field is not an object', results[4].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '4'], results[4].path);
      assert.ok(results[4].rule === embeddedDocument)

      // Validate {childArray:[{array:[1, 2, 3, 4, 5]}]}
      var results = func.validate({childArray:[{array:[{field:''}, {field:''}, {field:''}, 4, {field:''}]}]});
      assert.equal('field is not an object', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '3'], results[0].path);
      assert.ok(results[0].rule === embeddedDocument);

      // Validate {childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]}
      var results = func.validate({childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]});
      assert.equal('field is not a string', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'array', '2', 'field'], results[0].path);
      assert.ok(results[0].rule instanceof StringNode)
    });

    it('should perform complex triple nested objects and arrays', function() {
      var stringNode = new StringNode(null, null, {typeCheck:true});
      var embeddedDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', stringNode)
        .requiredFields(['field']);

      // First array node
      var arrayNode = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte:2}).addValidation({$lte: 10})
        .addItemValidation(embeddedDocument);
      var arrayDocument2 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('array2', arrayNode)

      // Second array node
      var arrayNode1 = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte:0}).addValidation({$lte: 10})
        .addItemValidation(arrayDocument2);
      var arrayDocument1 = new ObjectNode(null, null, {typeCheck:true})
        .addChild('array1', arrayNode1)

      // Third array
      var arrayNode2 = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte:0}).addValidation({$lte: 10})
        .addItemValidation(arrayDocument1);
      var topLevelDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('childArray', arrayNode2);


      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Validate {childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]}
      var results = func.validate({childArray:[{array1:[{array2:[{field:1},{}]}]}]});
      assert.equal('field is not a string', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'array1', '0', 'array2', '0', 'field'], results[0].path);
      assert.ok(results[0].rule === stringNode);

      assert.equal('object is missing required fields ["field"]', results[1].message);
      assert.deepEqual(['object', 'childArray', '0', 'array1', '0', 'array2', '1'], results[1].path);
      assert.ok(results[1].rule === embeddedDocument);
    });

    it('array validation using string validation', function() {
      // Array specification
      var stringNode = new StringNode(null, null, {typeCheck:true})
        .addValidation({$gte: 1})
        .addValidation({$lte: 10});
      var arrayDocument = new ArrayNode(null, null, {typeCheck:true})
        .addItemValidation(stringNode);

      // Top level document
      var topLevelDocument = new ObjectNode(null, null, {typeCheck: true})
        .addChild('childArray', arrayDocument);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [1]}
      var results = func.validate({childArray: [1]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.deepEqual(['object', 'childArray', '0'], results[0].path);
      assert.ok(results[0].rule === stringNode);

      // Validate {childArray: ['', 1, '']}
      var results = func.validate({childArray: ['', 1, '  ']});
      assert.equal(2, results.length);

      assert.equal('string fails validation {"$gte":1,"$lte":10}', results[0].message);
      assert.deepEqual(['object', 'childArray', '0'], results[0].path);
      assert.ok(results[0].rule === stringNode);

      assert.equal('field is not a string', results[1].message);
      assert.deepEqual(['object', 'childArray', '1'], results[1].path);
      assert.ok(results[1].rule === stringNode);
    });

    it('nested simple array validation using string validation', function() {
      // Array specification
      var stringNode = new StringNode(null, null, {typeCheck:true})
      var arrayDocument2 = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte: 1})
        .addValidation({$lte: 10})
        .addItemValidation(stringNode);

      var subDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('childArray1', arrayDocument2);

      var arrayDocument1 = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte: 1})
        .addValidation({$lte: 10})
        .addItemValidation(subDocument);

      // Top level document
      var topLevelDocument = new ObjectNode(null, null, {typeCheck: true})
        .addChild('childArray', arrayDocument1);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [{childArray1:['', 1, '']}]}
      var results = func.validate({childArray: [{childArray1:['', 1, '']}]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.deepEqual(['object', 'childArray', '0', 'childArray1', '1'], results[0].path);
      assert.ok(results[0].rule === stringNode);
    });

    it('array validation using unique constraint', function() {
      // Array specification
      var stringNode = new StringNode(null, null, {typeCheck:true})
      var arrayDocument = new ArrayNode(null, null, {typeCheck:true})
        .addValidation({$gte: 1})
        .addValidation({$lte: 10})
        .addItemValidation(stringNode)
        .uniqueItems(true);

      // Top level document
      var topLevelDocument = new ObjectNode(null, null, {typeCheck: true})
        .addChild('childArray', arrayDocument);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [1, 2, 1]}
      var results = func.validate({childArray: ['1', '2', '1']});
      assert.equal(1, results.length);
      assert.equal("array contains duplicate values", results[0].message);
      assert.deepEqual(['object', 'childArray'], results[0].path);
      assert.ok(arrayDocument === results[0].rule);

      var results = func.validate({childArray: ['1', '2', '3']});
      assert.equal(0, results.length);
    });
  });
});
