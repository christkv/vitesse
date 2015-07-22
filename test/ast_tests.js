var assert = require("assert"),
  co = require('co'),
  f = require('util').format,
  AST = require('../lib/ast'),
  Custom = require('../lib/custom'),
  Builder = require('../lib/builder'),
  Compiler = require('../lib/compiler');

describe('Number', function() {
  describe('validation', function() {
    it('should error due to missing number field', function() {
      var embeddedDocument = new AST({
        'field': {
          type: String, exists:true, custom: new Custom({regexp: /dog/}, function(string, field, context) {
            if(string.match(context.regexp) == null) {
              return new Error(f('field %s does not match %', field, context.regexp));
            }
          })
        }
      });

      // Another ast for array documents
      var arrayDocument = new AST({
        'user': {
          type: String, exists:true, customAsync: new Custom({}, function(string, field, context, callback) {
            if(string.length == 0) {
              return callback(f('field %s must be longer than 0 characters', field));
            }

            callback();
          })
        },
        'users': {
          type: Array, exists:true, validations: {
            $gte: 1, $lte: 16
          }, of: embeddedDocument
        }
      });

      // Top level document
      var topLevelDocument = new AST({
        'number' : {
          type: Number, exists:true, validation: {
            $gt: 100, $lt: 1000, $in: [100, 200]
          }
        },
        'string' : {
          type: String, exists: true, validation: {
            $gt: 0, $lte: 255, $in: ['plane', '']
          }
        },
        'array': {
          type: Array, exists: true, validation: {
            $gt:0, $lte: 10
          }, of: arrayDocument
        },
        'object': {
          type: Object, exists:false, of: embeddedDocument
        }
      });

      var compiler = new Compiler({
        // logger: {
        //   info: function(string) {
        //     console.log(string)
        //   }
        // }
      });

      // Compile the AST
      var func = compiler.compile(topLevelDocument);
      // Execute validations
      var results = func.validate({});
      assert.equal(3, results.length);
      assert.equal('number', results[0].field)
      assert.equal('object', results[0].parent)
      
      assert.equal('string', results[1].field)
      assert.equal('object', results[1].parent)
      
      assert.equal('array', results[2].field)
      assert.equal('object', results[2].parent)

      var results = func.validate({number:1});
      assert.equal(2, results.length);
      assert.equal('string', results[0].field)
      assert.equal('object', results[0].parent)
      
      assert.equal('array', results[1].field)
      assert.equal('object', results[1].parent)

      var results = func.validate({number:1, string: 'hello'});
      assert.equal(1, results.length);
      assert.equal('array', results[0].field)
      assert.equal('object', results[0].parent)

      var results = func.validate({number:1, string: 'hello', array: []});
      assert.equal(0, results.length);

      var results = func.validate({number:1, string: 'hello', array: [{}]});
      assert.equal(2, results.length);
      assert.equal('user', results[0].field)
      assert.equal('object.array[0]', results[0].parent)
      assert.equal('users', results[1].field)
      assert.equal('object.array[0]', results[1].parent)

      var results = func.validate({number:1, string: 'hello', array: [{}, {}]});
      assert.equal(4, results.length);
      assert.equal('user', results[0].field)
      assert.equal('object.array[0]', results[0].parent)
      assert.equal('users', results[1].field)
      assert.equal('object.array[0]', results[1].parent)
      assert.equal('user', results[2].field)
      assert.equal('object.array[1]', results[2].parent)
      assert.equal('users', results[3].field)
      assert.equal('object.array[1]', results[3].parent)

      var results = func.validate({number:1, string: 'hello', array: [{user:'user'}]});
      assert.equal(1, results.length);
      assert.equal('users', results[0].field)
      assert.equal('object.array[0]', results[0].parent)

      var results = func.validate({number:1, string: 'hello', array: [{user:'user', users:[]}]});
      assert.equal(0, results.length);

      var results = func.validate({number:1, string: 'hello', array: [{user:'user', users:[{}]}]});
      assert.equal(1, results.length);
      assert.equal('field', results[0].field)
      assert.equal('object.array[0].users[0]', results[0].parent)

      var results = func.validate({number:1, string: 'hello', array: [{user:'user', users:[{}, {}]}]});
      assert.equal(2, results.length);
      assert.equal('field', results[0].field)
      assert.equal('object.array[0].users[0]', results[0].parent)
      assert.equal('field', results[1].field)
      assert.equal('object.array[0].users[1]', results[1].parent)

      var results = func.validate({number:1, string: 'hello', array: [{user:'user', users:[]}, {user:'user', users:[{}]}]});
      assert.equal(1, results.length);
      assert.equal('field', results[0].field)
      assert.equal('object.array[1].users[0]', results[0].parent)
      // assert.equal('field', results[1].field)
      // assert.equal('object.array[0].users[1]', results[1].parent)

      // assert.equal('array', results[0].field)
      // assert.equal('object', results[0].parent)

      // // // console.dir(func)
      // var results = func.validate({number: 1, string: 'hello', array:[{user:2, users: [{t:1}]}]})
      //
      // // Get all the results
      console.log("------------------------------------------------------------ final results")
      // console.log(JSON.stringify(results, null, 2))
      console.dir(results)
    });
  });
});
