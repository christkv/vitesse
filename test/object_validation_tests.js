var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  NumberType = require('../lib/ast').NumberType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler'),
  ClosureCompiler = require('../lib/closure_compiler');

describe('Object', function() {
  describe('validation', function() {
    it('should handle single level embedded document', function() {
      var embeddedDocument = new DocumentType({
        // Document fields
        fields: {
          'field': new StringType({
            exists:true
          })
        },
        
        // Exists
        exists: true
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'child': embeddedDocument
        }
      });

      var compiler = new Compiler({});
      // Compile the AST
      var func = compiler.compile(topLevelDocument, {debug:false});

      // Validate {}
      var results = func.validate({});
      assert.equal(2, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.child', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      assert.equal('field is not an object', results[1].message);
      assert.equal('object.child', results[1].path);
      assert.ok(results[1].rule instanceof DocumentType);

      // Validate {child:1}
      var results = func.validate({child:1});
      assert.equal(1, results.length);
      assert.equal('field is not an object', results[0].message);
      assert.equal('object.child', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {child:{}}
      var results = func.validate({child:{}});
      assert.equal(1, results.length);
      assert.equal('field does not exist', results[0].message);
      assert.equal('object.child.field', results[0].path);
      assert.ok(results[0].rule instanceof DocumentType);

      // Validate {child:{field:1}}
      var results = func.validate({child:{field:1}});
      assert.equal(1, results.length);
      assert.equal('field is not a string', results[0].message);
      assert.equal('object.child.field', results[0].path);
      assert.ok(results[0].rule instanceof StringType);

      // Validate {}
      var results = func.validate({child:{field:''}});
      assert.equal(0, results.length);
    });

    it('should handle single level embedded document using closure compiler', function(done) {
      if(process.env["TRAVIS_JOB_ID"]) return done();

      var embeddedDocument = new DocumentType({
        fields: {
          'field': new StringType({ exists:true })
        },

        exists:true
      });

      // Top level document
      var topLevelDocument = new DocumentType({
        fields: {
          'child': embeddedDocument
        }
      });

      var compiler = new ClosureCompiler({});
      // Compile the AST
      compiler.compile(topLevelDocument, {debug:false}, function(err, func) {
        if(err) {
          console.log(err);
          return done();
        }
        
        // Validate {}
        var results = func.validate({});
        assert.equal(2, results.length);
        assert.equal('field does not exist', results[0].message);
        assert.equal('object.child', results[0].path);
        assert.ok(results[0].rule instanceof DocumentType);

        assert.equal('field is not an object', results[1].message);
        assert.equal('object.child', results[1].path);
        assert.ok(results[1].rule instanceof DocumentType);

        // Validate {child:1}
        var results = func.validate({child:1});
        assert.equal(1, results.length);
        assert.equal('field is not an object', results[0].message);
        assert.equal('object.child', results[0].path);
        assert.ok(results[0].rule instanceof DocumentType);

        // Validate {child:{}}
        var results = func.validate({child:{}});
        assert.equal(1, results.length);
        assert.equal('field does not exist', results[0].message);
        assert.equal('object.child.field', results[0].path);
        assert.ok(results[0].rule instanceof DocumentType);

        // Validate {child:{field:1}}
        var results = func.validate({child:{field:1}});
        assert.equal(1, results.length);
        assert.equal('field is not a string', results[0].message);
        assert.equal('object.child.field', results[0].path);
        assert.ok(results[0].rule instanceof StringType);

        // Validate {}
        var results = func.validate({child:{field:''}});
        assert.equal(0, results.length);
        done();
      });
    });
  });
});
