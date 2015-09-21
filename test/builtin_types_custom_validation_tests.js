var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  Compiler = require('../lib/compiler');

describe('Custom', function() {
  describe('builtin custom validations', function() {
    // it('simple string type validation extended with custom validation functions', function() {
    //   var schema = new DocumentType({
    //     fields: {
    //       'field': new StringType({
    //         custom: [new CustomType({
    //           context: {valid: 'dog'}, 
    //           func: function(object, context) {
    //             if(object != context.valid) {
    //               return new Error('field did not contain dog');
    //             }
    //           }
    //         }), new CustomType({
    //           context: {}, 
    //           func: function(object, context) {
    //             if(object.length != 3) {
    //               return new Error('field must have 3 characters');
    //             }
    //           }
    //         })]          
    //       })
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(schema, {debug:false});

    //   // Validate {field: ''}
    //   var results = func.validate({field: ''});
    //   assert.equal(2, results.length);
    //   assert.equal('field did not contain dog', results[0].message);
    //   assert.equal('object.field', results[0].path);
    //   assert.equal('', results[0].value);
    //   assert.ok(results[0].rule instanceof DocumentType);
    //   assert.equal('field must have 3 characters', results[1].message);
    //   assert.equal('object.field', results[1].path);
    //   assert.equal('', results[1].value);
    //   assert.ok(results[1].rule instanceof DocumentType);

    //   // Validate {field: 'dog'}
    //   var results = func.validate({field: 'dog'});
    //   assert.equal(0, results.length);
    // });

    // it('simple number type validation extended with custom validation functions', function() {
    //   var schema = new DocumentType({
    //     fields: {
    //       'field': new NumberType({
    //         custom: [new CustomType({
    //           context: {valid: 5}, 
    //           func: function(object, context) {
    //             if(object != context.valid) {
    //               return new Error('field was not 5');
    //             }
    //           }
    //         }), new CustomType({
    //           context: {}, 
    //           func: function(object, context) {
    //             if((object % 5) != 0) {
    //               return new Error('field must be divisible by 5');
    //             }
    //           }
    //         })]                  
    //       })
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(schema, {});

    //   // Validate {field: 0}
    //   var results = func.validate({field: 1});
    //   assert.equal(2, results.length);
    //   assert.equal('field was not 5', results[0].message);
    //   assert.equal('object.field', results[0].path);
    //   assert.equal(1, results[0].value);
    //   assert.ok(results[0].rule instanceof DocumentType);
    //   assert.equal('field must be divisible by 5', results[1].message);
    //   assert.equal('object.field', results[1].path);
    //   assert.equal(1, results[1].value);
    //   assert.ok(results[1].rule instanceof DocumentType);

    //   // Validate {field: 5}
    //   var results = func.validate({field: 5});
    //   assert.equal(0, results.length);
    // });

    // it('simple object type validation extended with custom validation functions', function() {
    //   var schema = new DocumentType({
    //     fields: {
    //       'field': new NumberType({})
    //     },
    //     custom: [new CustomType({
    //       context: {totalKeys: 1}, 
    //       func: function(object, context) {
    //         if(Object.keys(object).length != 1) {
    //           return new Error('object must only contain a single field');
    //         }
    //       }
    //     }), new CustomType({
    //       context: {}, 
    //       func: function(object, context) {
    //         if((object.field % 5) != 0) {
    //           return new Error('field must be divisible by 5');
    //         }
    //       }
    //     })]
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(schema, {});

    //   // Validate {field: 0}
    //   var results = func.validate({field: 1, illegal:1});
    //   assert.equal(2, results.length);
    //   assert.equal('object must only contain a single field', results[0].message);
    //   assert.equal('object', results[0].path);
    //   assert.deepEqual({field: 1, illegal:1}, results[0].value);
    //   assert.ok(results[0].rule instanceof DocumentType);
    //   assert.equal('field must be divisible by 5', results[1].message);
    //   assert.equal('object', results[1].path);
    //   assert.deepEqual({field: 1, illegal:1}, results[1].value);
    //   assert.ok(results[1].rule instanceof DocumentType);

    //   // Validate {field: 5}
    //   var results = func.validate({field: 5});
    //   assert.equal(0, results.length);
    // });

    // it('simple array type validation extended with custom validation functions', function() {
    //   var schema = new DocumentType({
    //     fields: {
    //       'field': new ArrayType({
    //         custom: [new CustomType({
    //           context: {totalKeys: 3}, 
    //           func: function(object, context) {
    //             if(object.length != context.totalKeys) {
    //               return new Error('array length must be 3');
    //             }
    //           }
    //         }), new CustomType({
    //           context: {}, 
    //           func: function(object, context) {
    //             if(object.length % 3 != 0) {
    //               return new Error('array length must be divisible by 3');
    //             }
    //           }
    //         })]         
    //       })
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(schema, {});

    //   // Validate {field: 0}
    //   var results = func.validate({field: [1, 2]});
    //   assert.equal(2, results.length);
    //   assert.equal('array length must be 3', results[0].message);
    //   assert.equal('object.field', results[0].path);
    //   assert.deepEqual([1, 2], results[0].value);
    //   assert.ok(results[0].rule instanceof DocumentType);
    //   assert.equal('array length must be divisible by 3', results[1].message);
    //   assert.equal('object.field', results[1].path);
    //   assert.deepEqual([1, 2], results[1].value);
    //   assert.ok(results[1].rule instanceof DocumentType);

    //   // Validate {field: 5}
    //   var results = func.validate({field: [1, 2, 3]});
    //   assert.equal(0, results.length);
    // });

    // it('simple nested array type validation extended with custom validation functions', function() {
    //   var schema = new DocumentType({
    //     fields: {
    //       'field': new NestedArrayType({depth:2,
    //         custom: [new CustomType({
    //           context: {size:1}, 
    //           func: function(object, context) {
    //             for(var i = 0; i < object.length; i++) {
    //               if(object[i].length != context.size) {
    //                 return new Error(f('array at [%s] is not of size %s', i, context.size));
    //               }
    //             }
    //           }
    //         })]         
    //       })
    //     }
    //   });

    //   var compiler = new Compiler({});
    //   // Compile the AST
    //   var func = compiler.compile(schema, {});

    //   // Validate {field: 0}
    //   var results = func.validate({field: [[1, 2]]});
    //   assert.equal(1, results.length);
    //   assert.equal('array at [0] is not of size 1', results[0].message);
    //   assert.equal('object.field', results[0].path);
    //   assert.deepEqual([[1, 2]], results[0].value);
    //   assert.ok(results[0].rule instanceof DocumentType);

    //   // Validate {field: 5}
    //   var results = func.validate({field: [[1]]});
    //   assert.equal(0, results.length);
    // });
  });
});
