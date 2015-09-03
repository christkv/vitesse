var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler');

describe('Array', function() {
  describe('validation', function() {
    it('should perform triple nested array validations [][][]', function() {
      var embeddedDocument = new DocumentType({
        fields: {
          'field': new StringType({ exists:true })
        }
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': new NestedArrayType({
            exists:true, depth: 3, of: embeddedDocument, validations: {
              0: {$gte:0, $lte:100},
              2: {$gte:5, $lte:10},
            }
          })
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.childArray', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {childArray:[]}
      var results = func.validate({childArray:[]});
      assert.equal(0, results.length);

      // Validate {childArray:[[[]]]}
      var results = func.validate({childArray:[[[]]]});
      assert.equal(1, results.length);
      assert.equal('array failed length validation {"$gte":5,"$lte":10}', results[0].message);
      assert.equal('object.childArray[0][0]', results[0].path);
      assert.deepEqual([[[]]], results[0].value); 
      assert.ok(results[0].rule instanceof NestedArrayType);

      // Validate {childArray:[[[]]]}
      var results = func.validate({childArray:[[[1, 2, 3, 4, 5]]]});
      assert.equal(5, results.length);
      assert.equal('field is not an object', results[0].message);
      assert.equal('object.childArray[0][0][0]', results[0].path);
      assert.ok(results[0].rule instanceof NestedArrayType);
      assert.equal(1, results[0].value);

      assert.equal('field is not an object', results[1].message);
      assert.equal('object.childArray[0][0][1]', results[1].path);
      assert.ok(results[1].rule instanceof NestedArrayType);
      assert.equal(2, results[1].value);

      assert.equal('field is not an object', results[2].message);
      assert.equal('object.childArray[0][0][2]', results[2].path);
      assert.ok(results[2].rule instanceof NestedArrayType);
      assert.equal(3, results[2].value);

      assert.equal('field is not an object', results[3].message);
      assert.equal('object.childArray[0][0][3]', results[3].path);
      assert.ok(results[3].rule instanceof NestedArrayType);
      assert.equal(4, results[3].value);

      assert.equal('field is not an object', results[4].message);
      assert.equal('object.childArray[0][0][4]', results[4].path);
      assert.ok(results[4].rule instanceof NestedArrayType);
      assert.equal(5, results[4].value);
    });

    it('should perform triple nested array validations with internal document with array', function() {
      var embeddedDocument = new DocumentType({
        fields: {
          'field': new StringType({ exists:true })
        }
      });

      var arrayDocument = new DocumentType({
        fields: {
          'array': new ArrayType({
            exists:true, of: embeddedDocument, validations: {$gte:1, $lte:10}
          })
        }
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': new NestedArrayType({
            exists:true, depth: 3, of: arrayDocument, validations: {
              0: {$gte:0, $lte:100},
              2: {$gte:1, $lte:10},
            }
          })
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [[[{array:[]}]]]}
      var results = func.validate({childArray: [[[{array:[]}]]]});
      assert.equal(1, results.length);
      assert.equal('array failed length validation {"$gte":1,"$lte":10}', results[0].message);
      assert.equal('object.childArray[0][0][0].array', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType);
      assert.equal(true, results[0].rule.object.exists);
      assert.deepEqual({ '$gte': 1, '$lte': 10 }, results[0].rule.object.validations);

      // Validate {childArray: [[[{array:[{field:1}]}]]]}
      var results = func.validate({childArray: [[[{array:[{field:1}]}]]]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0][0][0].array[0].field', results[0].path);
      assert.ok(results[0].rule instanceof StringType);
      assert.equal(true, results[0].rule.object.exists);
      assert.equal(1, results[0].value);
    });

    it('should perform complex nested objects and arrays', function() {
      var embeddedDocument = new DocumentType({
        fields: {
          'field': new StringType({ exists:true })
        }
      });

      var arrayDocument = new DocumentType({
        fields: {
          'array': new ArrayType({
            exists:true, of: embeddedDocument, validations: {$gte:5, $lte:10}
          })
        }
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': new ArrayType({
            exists:true, of: arrayDocument, validations: {$gte:0, $lte:10}
          })
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {}
      var results = func.validate({});
      assert.equal(1, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.childArray', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {childArray:1}
      var results = func.validate({childArray:1});
      assert.equal(1, results.length);
      assert.equal('field is not an array', results[0].message);
      assert.equal('object.childArray', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType);
      assert.equal(true, results[0].rule.object.exists);
      assert.deepEqual({ '$gte': 0, '$lte': 10 }, results[0].rule.object.validations);

      // Validate {childArray:[]}
      var results = func.validate({childArray:[]});
      assert.equal(0, results.length);

      // Validate {childArray:[{}]}
      var results = func.validate({childArray:[{}]});
      assert.equal(1, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.childArray[0].array', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {childArray:[{array:1}]}
      var results = func.validate({childArray:[{array:1}]});
      assert.equal(1, results.length);
      assert.equal('field is not an array', results[0].message);
      assert.equal('object.childArray[0].array', results[0].path);
      assert.equal(true, results[0].rule.object.exists);
      assert.ok(results[0].rule instanceof ArrayType);
      assert.deepEqual({ '$gte': 5, '$lte': 10 }, results[0].rule.object.validations);
      assert.equal(1, results[0].value);

      // Validate {childArray:[{array:[]}]}
      var results = func.validate({childArray:[{array:[]}]});
      assert.equal(1, results.length);
      assert.equal('array failed length validation {"$gte":5,"$lte":10}', results[0].message);
      assert.equal('object.childArray[0].array', results[0].path);
      assert.equal(true, results[0].rule.object.exists);
      assert.ok(results[0].rule instanceof ArrayType);
      assert.deepEqual([], results[0].value);

      // Validate {childArray:[{array:[1, 2, 3, 4, 5]}]}
      var results = func.validate({childArray:[{array:[1, 2, 3, 4, 5]}]});
      assert.equal(5, results.length);

      assert.equal('field is not an object', results[0].message);
      assert.equal('object.childArray[0].array[0]', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType)

      assert.equal('field is not an object', results[1].message);
      assert.equal('object.childArray[0].array[1]', results[1].path);
      assert.ok(results[1].rule instanceof ArrayType)

      assert.equal('field is not an object', results[2].message);
      assert.equal('object.childArray[0].array[2]', results[2].path);
      assert.ok(results[2].rule instanceof ArrayType)

      assert.equal('field is not an object', results[3].message);
      assert.equal('object.childArray[0].array[3]', results[3].path);
      assert.ok(results[3].rule instanceof ArrayType)

      assert.equal('field is not an object', results[4].message);
      assert.equal('object.childArray[0].array[4]', results[4].path);
      assert.ok(results[4].rule instanceof ArrayType)

      // Validate {childArray:[{array:[1, 2, 3, 4, 5]}]}
      var results = func.validate({childArray:[{array:[{field:''}, {field:''}, {field:''}, 4, {field:''}]}]});
      assert.equal('field is not an object', results[0].message);
      assert.equal('object.childArray[0].array[3]', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType)

      // Validate {childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]}
      var results = func.validate({childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]});
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0].array[2].field', results[0].path);
      assert.ok(results[0].rule instanceof StringType)
    });

    it('should perform complex triple nested objects and arrays', function() {
      var embeddedDocument = new DocumentType({
        fields: {
          'field': new StringType({
            exists:true
          })
        }
      });

      var arrayDocument2 = new DocumentType({
        fields: {
          'array2': new ArrayType({
            exists:true, of: embeddedDocument, validations: {$gte:2, $lte:10}
          })
        }
      });

      var arrayDocument1 = new DocumentType({
        fields: {
          'array1': new ArrayType({
            exists:true, of: arrayDocument2, validations: {$gte:0, $lte:10}
          })
        }
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': new ArrayType({
            exists:true, of: arrayDocument1, validations: {$gte:0, $lte:10}
          })
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});
      // Validate {childArray:[{array:[{field:''}, {field:''}, {field:1}, {field:''}, {field:''}]}]}
      var results = func.validate({childArray:[{array1:[{array2:[{field:1},{}]}]}]});
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0].array1[0].array2[0].field', results[0].path);
      assert.ok(results[0].rule instanceof StringType)

      assert.equal('field does not exist', results[1].message);
      assert.equal('object.childArray[0].array1[0].array2[1].field', results[1].path);
      assert.ok(results[1].rule instanceof DocumentType)
    });

    it('array validation using string validation', function() {
      var arrayDocument = new ArrayType({
        exists:true, of: new StringType({}), validations: {$gte:1, $lte:10}
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': arrayDocument
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [1]}
      var results = func.validate({childArray: [1]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0]', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType);

      // Validate {childArray: ['', 1, '']}
      var results = func.validate({childArray: ['', 1, '']});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[1]', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType);
    });

    it('nested simple array validation using string validation', function() {
      var arrayDocument2 = new ArrayType({
        exists:true, of: new StringType({}), validations: {$gte:1, $lte:10}
      });

      var subDocument = new DocumentType({
        fields: {
          'childArray1': arrayDocument2
        }
      });

      var arrayDocument1 = new ArrayType({
        exists:true, of: subDocument, validations: {$gte:1, $lte:10}
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': arrayDocument1
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [{childArray1:['', 1, '']}]}
      var results = func.validate({childArray: [{childArray1:['', 1, '']}]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0].childArray1[1]', results[0].path);
      assert.ok(results[0].rule instanceof ArrayType);
    });

    it('nested array validation using string validation', function() {
      var arrayDocument = new NestedArrayType({
        exists:true, of: new StringType({}), depth:2
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': arrayDocument
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [[1]]}
      var results = func.validate({childArray: [[1]]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0][0]', results[0].path);
      assert.ok(results[0].rule instanceof NestedArrayType);
      assert.equal(1, results[0].value);

      try {
        func.validate({childArray: [[1]]}, {failOnFirst:true});
      } catch(err) {
        assert.equal('field is not a string', err.message);
        assert.equal('object.childArray[0][0]', err.path);
        assert.ok(err.rule instanceof NestedArrayType);
        assert.equal(1, err.value);
      }

      // Validate {childArray: [['', 1, '']]}
      var results = func.validate({childArray: [['', 1, '']]});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.childArray[0][1]', results[0].path);
      assert.ok(results[0].rule instanceof NestedArrayType);
      assert.equal(1, results[0].value);

      try {
        func.validate({childArray: [['', 1, '']]}, {failOnFirst:true});
      } catch(err) {
        assert.equal('field is not a string', err.message);
        assert.equal('object.childArray[0][1]', err.path);
        assert.ok(err.rule instanceof NestedArrayType);
        assert.equal(1, err.value);
      }
    });

    it('array validation using unique constraint', function() {
      var arrayDocument = new ArrayType({
        exists:true, of: new StringType({}), validations: {$gte:1, $lte:10}, unique:true
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': arrayDocument
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [1, 2, 1]}
      var results = func.validate({childArray: ['1', '2', '1']});
      assert.equal(1, results.length);
      assert.equal("array contains duplicate values", results[0].message);
      assert.equal("object.childArray", results[0].path);
      assert.ok(arrayDocument === results[0].rule);

      var results = func.validate({childArray: ['1', '2', '3']});
      assert.equal(0, results.length);
    });

    it('nested array validation using unique constraint', function() {
      var arrayDocument = new NestedArrayType({
        exists:true, of: new StringType({}), validations: {$gte:1, $lte:10}, unique:true, depth: 2
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'childArray': arrayDocument
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {});

      // Validate {childArray: [1, 2, 1]}
      var results = func.validate({childArray: [['1', '2', '3'],['1', '2', '1']]});
      assert.equal(1, results.length);
      assert.equal("array contains duplicate values", results[0].message);
      assert.equal("object.childArray[1]", results[0].path);
      assert.ok(arrayDocument === results[0].rule);

      var results = func.validate({childArray: [['1', '2', '3']]});
      assert.equal(0, results.length);

      // console.log(JSON.stringify(results, null, 2));     
    });
  });
});
