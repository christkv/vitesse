var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType,
  Custom = require('../lib/custom'),
  Builder = require('../lib/builder'),
  Compiler = require('../lib/compiler');

describe('Array', function() {
  describe('validation', function() {
    // it('should perform single array validations', function() {
    //   var embeddedDocument = new DocumentType({
    //     'field': {
    //       type: String, exists:true
    //     }
    //   });

    //   // Top level document
    //   var topLevelDocument = new DocumentType({
    //     'childArray': {
    //       type: Array, exists:true, of: embeddedDocument
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(topLevelDocument);

    //   //
    //   // {}
    //   // ----------------------------------------------------------------------

    //   // childArray field does not exist
    //   var results = func.validate({}, {failOnFirst:false});
    //   assert.equal(1, results.length);
    //   assert.equal('childArray', results[0].field);
    //   assert.equal('object', results[0].parent);
    //   assert.equal('field does not exist', results[0].message);
    //   assert.ok(results[0].rule.type === Array);
    //   assert.equal(true, results[0].rule.exists);

    //   try {
    //     func.validate({}, {failOnFirst:true});
    //   } catch(err) {
    //     assert.equal('childArray', err.field);
    //     assert.equal('object', err.parent);
    //     assert.equal('field does not exist', err.message);
    //     assert.ok(err.rule.type === Array);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: {}}
    //   // ----------------------------------------------------------------------

    //   // childArray field is wrong type
    //   var results = func.validate({childArray: {}}, {failOnFirst:false});
    //   assert.equal(1, results.length);
    //   assert.equal('childArray', results[0].field);
    //   assert.equal('object', results[0].parent);
    //   assert.equal('field does not have the correct type', results[0].message);
    //   assert.ok(results[0].rule.type === Array);
    //   assert.equal(true, results[0].rule.exists);

    //   try {
    //     func.validate({childArray: {}}, {failOnFirst:true});
    //   } catch(err) {
    //     assert.equal('childArray', err.field);
    //     assert.equal('object', err.parent);
    //     assert.equal('field does not have the correct type', err.message);
    //     assert.ok(err.rule.type === Array);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: []}
    //   // ----------------------------------------------------------------------

    //   // whole object is valid
    //   var results = func.validate({childArray: []}, {failOnFirst:false});
    //   assert.equal(0, results.length);

    //   try {
    //     func.validate({childArray: []}, {failOnFirst:true});
    //   } catch(err) {
    //     assert.equal('childArray', err.field);
    //     assert.equal('object', err.parent);
    //     assert.equal('field does not have the correct type', err.message);
    //     assert.ok(err.rule.type === Array);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: [1,2]}
    //   // ----------------------------------------------------------------------

    //   // Wrong type in array
    //   var results = func.validate({childArray: [1,2]}, {failOnFirst:false});
    //   assert.equal(4, results.length);

    //   // Type error of entry in array
    //   assert.equal('childArray[0]', results[0].field);
    //   assert.equal('object', results[0].parent);
    //   assert.equal('field does not have the correct type', results[0].message);
    //   assert.equal('object', typeof results[0].rule.of);
    //   assert.equal(true, results[0].rule.exists);
    //   assert.deepEqual([1, 2], results[0].value);

    //   // Field does not exist
    //   assert.equal('field', results[1].field);
    //   assert.equal('object.childArray[0]', results[1].parent);
    //   assert.equal('field does not exist', results[1].message);
    //   assert.ok(results[1].rule.type == String);
    //   assert.equal(true, results[1].rule.exists);

    //   // Type error of entry in array
    //   assert.equal('childArray[1]', results[2].field);
    //   assert.equal('object', results[2].parent);
    //   assert.equal('field does not have the correct type', results[2].message);
    //   assert.equal('object', typeof results[2].rule.of);
    //   assert.equal(true, results[2].rule.exists);
    //   assert.deepEqual([1, 2], results[2].value);

    //   // Field does not exist
    //   assert.equal('field', results[3].field);
    //   assert.equal('object.childArray[1]', results[3].parent);
    //   assert.equal('field does not exist', results[3].message);
    //   assert.ok(results[3].rule.type == String);
    //   assert.equal(true, results[3].rule.exists);

    //   try {
    //     func.validate({childArray: [1,2]}, {failOnFirst:true});
    //   } catch(err) {
    //     assert.equal('childArray[0]', err.field);
    //     assert.equal('object', err.parent);
    //     assert.equal('field does not have the correct type', err.message);
    //     assert.ok(err.rule.type === Array);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: [{},{}]}
    //   // ----------------------------------------------------------------------

    //   // Wrong type in array entries
    //   var results = func.validate({childArray: [{},{}]}, {failOnFirst:false});
    //   assert.equal(2, results.length);

    //   // Field does not exist
    //   assert.equal('field', results[0].field);
    //   assert.equal('object.childArray[0]', results[0].parent);
    //   assert.equal('field does not exist', results[0].message);
    //   assert.ok(results[0].rule.type == String);
    //   assert.equal(true, results[0].rule.exists);

    //   // Field does not exist
    //   assert.equal('field', results[1].field);
    //   assert.equal('object.childArray[1]', results[1].parent);
    //   assert.equal('field does not exist', results[1].message);
    //   assert.ok(results[1].rule.type == String);
    //   assert.equal(true, results[1].rule.exists);

    //   try {
    //     func.validate({childArray: [{},{}]}, {failOnFirst:true});
    //   } catch(err) {
    //     assert.equal('field', err.field);
    //     assert.equal('object.childArray[0]', err.parent);
    //     assert.equal('field does not exist', err.message);
    //     assert.ok(err.rule.type === String);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: [{},{field:1}]}
    //   // ----------------------------------------------------------------------

    //   // Wrong type in array entries
    //   var results = func.validate({childArray: [{},{field:1}]}, {failOnFirst:false});
    //   assert.equal(2, results.length);

    //   // Field does not exist
    //   assert.equal('field', results[0].field);
    //   assert.equal('object.childArray[0]', results[0].parent);
    //   assert.equal('field does not exist', results[0].message);
    //   assert.ok(results[0].rule.type == String);
    //   assert.equal(true, results[0].rule.exists);

    //   // Type error of entry in array
    //   assert.equal('field', results[1].field);
    //   assert.equal('object.childArray[1]', results[1].parent);
    //   assert.equal('field does not have the correct type', results[1].message);
    //   assert.ok(results[1].rule.type === String);
    //   assert.equal(true, results[1].rule.exists);
    //   assert.deepEqual(1, results[1].value);

    //   try {
    //     func.validate({childArray: [{},{field:1}]}, {failOnFirst:true});
    //   } catch(err) {
    //     assert.equal('field', err.field);
    //     assert.equal('object.childArray[0]', err.parent);
    //     assert.equal('field does not exist', err.message);
    //     assert.ok(err.rule.type === String);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: [{field:'a'},{field:'b'}]}
    //   // ----------------------------------------------------------------------
    //   var results = func.validate({childArray: [{field:'a'},{field:'b'}]}, {failOnFirst:false});
    //   assert.equal(0, results.length);
    // });

    // it('basic javascript types', function() {
    //   var embeddedDocument = new DocumentType({
    //     'field': {
    //       type: String, exists:true
    //     }
    //   });

    //   // Top level document
    //   var topLevelDocument = new DocumentType({
    //     'childArray': {
    //       type: Array, exists:true, of: new BasicType({type: Number})
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(topLevelDocument);

    //   // Compile the AST with debug
    //   var func = compiler.compile(topLevelDocument, {debug:true});

    //   //
    //   // {childArray: [[{}, {field:1}]]}
    //   // ----------------------------------------------------------------------
    //   // var results = func.validate({childArray: [[0, 0, 1]]}, {failOnFirst:false});
    //   // console.log("--------------------------------------------------------------------")
    //   // console.dir(results)

    // });

    it('should perform tripe nested array validations [][][]', function() {
      var embeddedDocument = new DocumentType({
        'field': new StringType({
          exists:true
        })
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        'childArray': new NestedArrayType({
          exists:true, depth: 3, of: embeddedDocument, validations: {
            0: {$gte:0, $lte:100},
            2: {$gte:5, $lte:10},
          }
        })
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {debug:true});

      // var results = func.validate({childArray: [[[{}]]]}, {failOnFirst:false});
      // console.log("----------------------------------------------------------------")
      // console.dir(results)
      // assert.equal(3, results.length);

    });

    // it('should perform nested array validations [][]', function() {
    //   var embeddedDocument = new DocumentType({
    //     'field': {
    //       type: String, exists:true
    //     }
    //   });

    //   // Top level document
    //   var topLevelDocument = new DocumentType({
    //     'childArray': {
    //       type: Array, exists:true, of: new BasicType({type: Array, of: embeddedDocument})
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(topLevelDocument);

    //   //
    //   // {childArray: [{}]}
    //   // ----------------------------------------------------------------------
    //   var results = func.validate({childArray: [{}, 3, true, []]}, {failOnFirst:false});
    //   assert.equal(3, results.length);
      
    //   // Not the correct type
    //   assert.equal('childArray[0]', results[0].field);
    //   assert.equal('object', results[0].parent);
    //   assert.equal('field does not have the correct type', results[0].message);
    //   assert.ok(results[0].rule.type == Array);
    //   assert.equal(true, results[0].rule.exists);

    //   // Not the correct type
    //   assert.equal('childArray[1]', results[1].field);
    //   assert.equal('object', results[1].parent);
    //   assert.equal('field does not have the correct type', results[1].message);
    //   assert.ok(results[1].rule.type == Array);
    //   assert.equal(true, results[1].rule.exists);

    //   // Not the correct type
    //   assert.equal('childArray[2]', results[2].field);
    //   assert.equal('object', results[2].parent);
    //   assert.equal('field does not have the correct type', results[2].message);
    //   assert.ok(results[2].rule.type == Array);
    //   assert.equal(true, results[2].rule.exists);

    //   try {
    //     var results = func.validate({childArray: [{}, 3, true, []]}, {failOnFirst:false});       
    //   } catch(err) {
    //     // Field does not exist
    //     assert.equal('childArray[0]', err.field);
    //     assert.equal('object', err.parent);
    //     assert.equal('field does not have the correct type', err.message);
    //     assert.ok(err.rule.type == Array);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: [[{}, {field:1}]]}
    //   // ----------------------------------------------------------------------
    //   var results = func.validate({childArray: [[{}, {field:1}]]}, {failOnFirst:false});
    //   assert.equal(2, results.length);

    //   // Field does not exist
    //   assert.equal('field', results[0].field);
    //   assert.equal('object.childArray[0][0]', results[0].parent);
    //   assert.equal('field does not exist', results[0].message);
    //   assert.ok(results[0].rule.type == String);
    //   assert.equal(true, results[0].rule.exists);

    //   // Type error of entry in array
    //   assert.equal('field', results[1].field);
    //   assert.equal('object.childArray[0][1]', results[1].parent);
    //   assert.equal('field does not have the correct type', results[1].message);
    //   assert.ok(results[1].rule.type === String);
    //   assert.equal(true, results[1].rule.exists);
    //   assert.deepEqual(1, results[1].value);

    //   try {
    //     var results = func.validate({childArray: [[{}, {field:1}]]}, {failOnFirst:false});       
    //   } catch(err) {
    //     // Field does not exist
    //     assert.equal('field', err.field);
    //     assert.equal('object.childArray[0][0]', err.parent);
    //     assert.equal('field does not exist', err.message);
    //     assert.ok(err.rule.type == String);
    //     assert.equal(true, err.rule.exists);
    //   }

    //   //
    //   // {childArray: [[{}, {field:1}], [{field:1}]]}
    //   // ----------------------------------------------------------------------
    //   var results = func.validate({childArray: [[{}, {field:1}], [{field:2}]]}, {failOnFirst:false});
    //   assert.equal(3, results.length);

    //   // Field does not exist
    //   assert.equal('field', results[0].field);
    //   assert.equal('object.childArray[0][0]', results[0].parent);
    //   assert.equal('field does not exist', results[0].message);
    //   assert.ok(results[0].rule.type == String);
    //   assert.equal(true, results[0].rule.exists);

    //   // Type error of entry in array
    //   assert.equal('field', results[1].field);
    //   assert.equal('object.childArray[0][1]', results[1].parent);
    //   assert.equal('field does not have the correct type', results[1].message);
    //   assert.ok(results[1].rule.type === String);
    //   assert.equal(true, results[1].rule.exists);
    //   assert.deepEqual(1, results[1].value);

    //   // Type error of entry in array
    //   assert.equal('field', results[2].field);
    //   assert.equal('object.childArray[1][0]', results[2].parent);
    //   assert.equal('field does not have the correct type', results[2].message);
    //   assert.ok(results[2].rule.type === String);
    //   assert.equal(true, results[2].rule.exists);
    //   assert.deepEqual(2, results[2].value);

    //   try {
    //     var results = func.validate({childArray: [[{}, {field:1}], [{field:2}]]}, {failOnFirst:false});       
    //   } catch(err) {
    //     // Field does not exist
    //     assert.equal('field', err.field);
    //     assert.equal('object.childArray[0][0]', err.parent);
    //     assert.equal('field does not exist', err.message);
    //     assert.ok(err.rule.type == String);
    //     assert.equal(true, err.rule.exists);
    //   }
    // });

    // it('should perform array length validations', function() {
    //   // var embeddedDocument = new DocumentType({
    //   //   'field': {
    //   //     type: String, exists:true
    //   //   }
    //   // });

    //   // // Top level document
    //   // var topLevelDocument = new DocumentType({
    //   //   'childArray': {
    //   //     type: Array, exists:true, of: embeddedDocument, validations: {
    //   //       $gte: 0, $lte: 10 
    //   //     }
    //   //   }
    //   // });

    //   // var compiler = new Compiler({});
    //   // // Compile the AST
    //   // var func = compiler.compile(topLevelDocument);
    // });
  });
});
