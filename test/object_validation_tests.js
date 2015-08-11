var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  AST = require('../lib/ast'),
  Custom = require('../lib/custom'),
  Builder = require('../lib/builder'),
  Compiler = require('../lib/compiler');

describe('Object', function() {
  describe('validation', function() {
    it('should error due to missing object', function() {
      // var embeddedDocument = new AST({
      //   'field': {
      //     type: String, exists:true
      //   }
      // });

      // // Top level document
      // var topLevelDocument = new AST({
      //   'childObject': {
      //     type: Object, exists:true, of: embeddedDocument
      //   }
      // });

      // var compiler = new Compiler({});
      // // Compile the AST
      // var func = compiler.compile(topLevelDocument);

      // // childObject field does not exist
      // var results = func.validate({}, {failOnFirst:false});
      // assert.equal(1, results.length);
      // assert.equal('childObject', results[0].field);
      // assert.equal('object', results[0].parent);
      // assert.equal('field does not exist', results[0].message);
      // assert.ok(results[0].rule.type === Object);
      // assert.equal(true, results[0].rule.exists);

      // // childObject.field field does not exist
      // var results = func.validate({childObject: {}}, {failOnFirst:false});
      // assert.equal(1, results.length);
      // assert.equal('field', results[0].field);
      // assert.equal('object.childObject', results[0].parent);
      // assert.equal('field does not exist', results[0].message);
      // assert.ok(results[0].rule.type === String);
      // assert.equal(true, results[0].rule.exists);

      // // childObject field is wrong type
      // var results = func.validate({childObject: {field:1}}, {failOnFirst:false});
      // assert.equal(1, results.length);
      // assert.equal('field', results[0].field);
      // assert.equal('object.childObject', results[0].parent);
      // assert.equal('field does not have the correct type', results[0].message);
      // assert.ok(results[0].rule.type === String);
      // assert.equal(true, results[0].rule.exists);

      // // whole object is valid
      // var results = func.validate({childObject: {field:'hello'}}, {failOnFirst:false});
      // assert.equal(0, results.length);

      // // childObject field does not exist
      // try {
      //   var results = func.validate({}, {failOnFirst:true});
      // } catch(err) {
      //   assert.equal('childObject', err.field);
      //   assert.equal('object', err.parent);
      //   assert.equal('field does not exist', err.message);
      //   assert.ok(err.rule.type === Object);
      //   assert.equal(true, err.rule.exists);        
      // }

      // // childObject.field field does not exist
      // try {
      //   var results = func.validate({childObject: {}}, {failOnFirst:true});
      // } catch(err) {
      //   assert.equal('field', err.field);
      //   assert.equal('object.childObject', err.parent);
      //   assert.equal('field does not exist', err.message);
      //   assert.ok(err.rule.type === String);
      //   assert.equal(true, err.rule.exists);        
      // }

      // // childObject field is wrong type
      // try {
      //   var results = func.validate({childObject: { field: 1 }}, {failOnFirst:true});
      // } catch(err) {
      //   assert.equal('field', err.field);
      //   assert.equal('object.childObject', err.parent);
      //   assert.equal('field does not have the correct type', err.message);
      //   assert.ok(err.rule.type === String);
      //   assert.equal(true, err.rule.exists);
      // }

      // // childObject field is wrong type
      // var results = func.validate({childObject: {field:'hello'}}, {failOnFirst:true});
      // assert.equal(0, results.length);
    });
  });
});
