// var assert = require("assert"),
//   co = require('co'),
//   Builder = require('../lib/builder'),
//   Compiler = require('../lib/compiler');
//
// describe('Number', function() {
//   describe('validation', function() {
//     it('should error due to missing number field', function() {
//       // 1
//       var schema = Schema.create({
//         'number': Schema.number().exists()
//       });
//
//       // 2
//       var schema = Schema.create({
//         'number': Schema.number().exists().gt(100).lt(1000)
//       });
//
//       var schema = Schema.create({
//           'number': Schema.number().exists().gt(100).lt(1000)
//         , 'choice': Schema.number().exists().in([1, 2, 3, 4])
//       });
//
//       // 3
//       var arraySchema = Schema.create({
//         'value': Schema.string().minLength(10).maxLength(255)
//       });
//
//       var schema = Schema.create({
//         'array': Schema.array().of(arraySchema).exists().min(1).max(12)
//       });
//
//       // 3
//       var docSchema = Schema.create({
//         'value': Schema.string().minLength(10).maxLength(255)
//       });
//
//       var schema = Schema.create({
//         'doc': Schema.object().of(docSchema).exists()
//       });
//
//       // 5
//       var schema = Schema.create({
//         'custom_string': Schema.string().exists().custom(function(string) {
//           if(string == null) return new Error('no matching email');
//         }).custom(function(string, context) {
//           if(string.match(context.regexp) == null) return new Error('no matching email');
//         }, {regexp: /[a-z]+$/});
//       });
//
//
//
//       // var schema = new Builder();
//       // schema
//       //   .rule('.number')
//       //   .type(Number)
//       //   .exists(true);
//       //
//       // // Fails excisting validation due to non-existance
//       // var results = new Compiler().compile(schema).validate({});
//       // assert.equal(1, results.length);
//       // assert.equal('.number', results[0].rule.path);
//       //
//       // // Fails excisting validation due to wrong type
//       // var results = new Compiler().compile(schema).validate({number:'test'});
//       // assert.equal(1, results.length);
//       //
//       // // Passes validation
//       // var results = new Compiler().compile(schema).validate({number:1});
//       // assert.equal(0, results.length);
//     });
//
//     // it('should error due to range issues', function() {
//     //   var schema = new Builder();
//     //   schema
//     //     .rule('.number')
//     //     .type(Number)
//     //     .exists(true)
//     //     .validate({
//     //       $gt: 100, $lt: 1000
//     //     });
//     //
//     //   // Fails excisting validation due to non-existance
//     //   var results = new Compiler().compile(schema).validate({number:50});
//     //   console.log(JSON.stringify(results, null, 2))
//     //     // assert.equal(1, results.length);
//     //     // assert.equal('.number', results[0].rule.path);
//     //
//     //   // var schema = new Builder();
//     //   // schema.rule('.number').type(Number).exists(true).validate({$gt: 100});
//     //   // // Fails excisting validation
//     //   // var results = new Compiler().compile(schema).validate({});
//     //   // assert.equal(1, results.length);
//     //   // assert.equal('.number', results[0].rule.path);
//     //   // // Passes validation
//     //   // var results = new Compiler().compile(schema).validate({number:'test'});
//     //   // assert.equal(0, results.length);
//     // });
//   });
// });
//
// // var co = require('co');
// // var Compiler = require('../lib/compiler'),
// //   Builder = require('../lib/builder');
// //
// //
// // var assert = require("assert")
// // // describe('Compiler', function(){
// // //   it('should correctly validate against number', function(){
// // //     var schema = new Builder();
// // //
// // //     // Set up a type of validation
// // //     var Email = {
// // //       validate: function(x) {
// // //         if(x.match(/[a-z]+$/) == null) {
// // //           return new Error('no matching email');
// // //         }
// // //       }
// // //     }
// // //
// // //     // Set up schema rule for the number field
// // //     schema.rule('.number')
// // //       .type(Number)
// // //       .exists(true)
// // //       .validate({
// // //         $gt: 100, $lt: 1000
// // //       });
// // //
// // //     // Validate subdocument
// // //     schema.rule('.doc.email')
// // //       .type(Email)
// // //       .exists(true)
// // //
// // //     // Complile the expression
// // //     var expression = new Compiler().compile(schema);
// // //
// // //     // Test the expression
// // //     var result = expression.validate({
// // //       number: 4, doc: { email: 'aaabbb333' }
// // //     });
// // //
// // //     assert.equal(2, result.length);
// // //   });
// // // });
// //
// // exports['numeric validations'] = {
// //   test: function
// // }
// //
// // // exports['Should correctly insert documents'] = {
// // //   metadata: { requires: { } },
// // //
// // //   // The actual test we wish to run
// // //   test: function(configuration, test) {
// // //     var Compiler = require('../../lib/validator/compiler'),
// // //       Builder = require('../../lib/validator/builder');
// // //
// // //     co(function* () {
// // //       var schema = new Builder();
// // //
// // //       // Set up a type of validation
// // //       var Email = {
// // //         validate: function(x) {
// // //           if(x.match(/[a-z]+$/) == null) {
// // //             return new Error('no matching email');
// // //           }
// // //         }
// // //       }
// // //
// // //       // Set up schema rule for the number field
// // //       schema.rule('.number')
// // //         .type(Number)
// // //         .exists(true)
// // //         .validate({
// // //           $gt: 100, $lt: 1000
// // //         });
// // //
// // //       // Validate subdocument
// // //       schema.rule('.doc.email')
// // //         .type(Email)
// // //         .exists(true)
// // //
// // //       // Complile the expression
// // //       var expression = new Compiler().compile(schema);
// // //
// // //       // Test the expression
// // //       var result = expression.validate({
// // //         number: 4, doc: { email: 'aaabbb333' }
// // //       });
// // //
// // //       test.equal(2, result.length);
// // //       test.done();
// // //     }).catch(function(err) {
// // //       console.log(err.stack)
// // //       test.done();
// // //     });
// // //   }
// // // }
