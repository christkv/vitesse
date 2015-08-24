var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  ArrayType = require('../lib/ast').ArrayType,
  NestedArrayType = require('../lib/ast').NestedArrayType,
  StringType = require('../lib/ast').StringType,
  OfOneType = require('../lib/ast').OfOneType,
  NumberType = require('../lib/ast').NumberType,
  IntegerType = require('../lib/ast').IntegerType,
  DocumentType = require('../lib/ast').DocumentType,
  Compiler = require('../lib/compiler'),
  ClosureCompiler = require('../lib/closure_compiler');

describe('OneOf', function() {
  describe('validation', function() {
    it('should correctly handle nested types', function() {
      // // Embedded documents
      // var embeddedDocument = new OfOneType({
      //   validations: [
      //     new IntegerType(),
      //     new IntegerType({
      //       validations: { $gte: 2 }
      //     })
      //   ]
      // });

      // // Top level document
      // var topLevelDocument = new DocumentType({
      //   'child': embeddedDocument
      // });

      // var compiler = new Compiler({});
      // // Compile the AST
      // var func = compiler.compile(topLevelDocument, {debug:true});
      // // Attempt to validate
      // var results = func.validate({child: 3});
      // // console.dir(results)
      // console.log(JSON.stringify(results, null, 2))

    });

    it('should handle the oneOf array validation', function() {
      // // Top level document
      // var topLevelDocument = new OfOneType({
      //   validations: [
      //     new IntegerType(),
      //     new IntegerType({
      //       validations: { $gte: 2 }
      //     })
      //   ]
      // });

      // var compiler = new Compiler({});
      // // Compile the AST
      // var func = compiler.compile(topLevelDocument, {debug:true});
      // // Attempt to validate
      // var results = func.validate(3 );
      // console.dir(results)
    });
  });
});
