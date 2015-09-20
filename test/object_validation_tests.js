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

describe('Object', function() {
  describe('validation', function() {
    it('should handle single level embedded document', function() {
      // var embeddedDocument = new DocumentType({
      //   // Document fields
      //   fields: {
      //     'field': new StringType({
      //       exists:true
      //     })
      //   },
        
      //   // Exists
      //   exists: true
      // });
      var string = new StringNode(null, null, {typeCheck:true})
      var embeddedDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('field', string)
        .requiredFields(['field']);

      // // Top level document
      // var topLevelDocument = new DocumentType({
      //   fields: {
      //     'child': embeddedDocument
      //   }
      // });
      var topLevelDocument = new ObjectNode(null, null, {typeCheck:true})
        .addChild('child', embeddedDocument)
        .requiredFields(['child']);

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {debug:false});

      // Validate {}
      var results = func.validate({});
      console.log("-----------------------------------------------")
      console.dir(results)
      // assert.equal(1, results.length);
      // assert.equal('field does not exist', results[0].message);
      // assert.equal('object.child', results[0].path);
      // assert.ok(results[0].rule instanceof DocumentType);

      // // Validate {child:1}
      // var results = func.validate({child:1});
      // assert.equal(1, results.length);
      // assert.equal('field is not an object', results[0].message);
      // assert.equal('object.child', results[0].path);
      // assert.ok(results[0].rule instanceof DocumentType);

      // // Validate {child:{}}
      // var results = func.validate({child:{}});
      // assert.equal(1, results.length);
      // assert.equal('field does not exist', results[0].message);
      // assert.equal('object.child.field', results[0].path);
      // assert.ok(results[0].rule instanceof DocumentType);

      // // Validate {child:{field:1}}
      // var results = func.validate({child:{field:1}});
      // assert.equal(1, results.length);
      // assert.equal('field is not a string', results[0].message);
      // assert.equal('object.child.field', results[0].path);
      // assert.ok(results[0].rule instanceof StringType);

      // // Validate {}
      // var results = func.validate({child:{field:''}});
      // assert.equal(0, results.length);
    });

    // it('should handle single level embedded document using closure compiler', function(done) {
    //   if(process.env["TRAVIS_JOB_ID"]) return done();

    //   var embeddedDocument = new DocumentType({
    //     fields: {
    //       'field': new StringType({ exists:true })
    //     },

    //     exists:true
    //   });

    //   // Top level document
    //   var topLevelDocument = new DocumentType({
    //     fields: {
    //       'child': embeddedDocument
    //     }
    //   });

    //   var compiler = new ClosureCompiler({});
    //   // Compile the AST
    //   compiler.compile(topLevelDocument, {debug:false}, function(err, func) {
    //     if(err) {
    //       console.log(err);
    //       return done();
    //     }
        
    //     // Validate {}
    //     var results = func.validate({});
    //     assert.equal(1, results.length);
    //     assert.equal('field does not exist', results[0].message);
    //     assert.equal('object.child', results[0].path);
    //     assert.ok(results[0].rule instanceof DocumentType);

    //     // Validate {child:1}
    //     var results = func.validate({child:1});
    //     assert.equal(1, results.length);
    //     assert.equal('field is not an object', results[0].message);
    //     assert.equal('object.child', results[0].path);
    //     assert.ok(results[0].rule instanceof DocumentType);

    //     // Validate {child:{}}
    //     var results = func.validate({child:{}});
    //     assert.equal(1, results.length);
    //     assert.equal('field does not exist', results[0].message);
    //     assert.equal('object.child.field', results[0].path);
    //     assert.ok(results[0].rule instanceof DocumentType);

    //     // Validate {child:{field:1}}
    //     var results = func.validate({child:{field:1}});
    //     assert.equal(1, results.length);
    //     assert.equal('field is not a string', results[0].message);
    //     assert.equal('object.child.field', results[0].path);
    //     assert.ok(results[0].rule instanceof StringType);

    //     // Validate {}
    //     var results = func.validate({child:{field:''}});
    //     assert.equal(0, results.length);
    //     done();
    //   });
    // });
  });
});
