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
      // Another ast for array documents
      var arrayDocument = new AST({
        'user': {
          type: String, exits:true, customAsync: new Custom({}, function(string, field, context, callback) {
            if(string.length == 0) {
              return callback(f('field %s must be longer than 0 characters', field));
            }

            callback();
          })
        }
      });

      var embeddedDocument = new AST({
        'field': {
          type: String, custom: new Custom({regexp: /dog/}, function(string, field, context) {
            if(string.match(context.regexp) == null) {
              return new Error(f('field %s does not match %', field, context.regexp));
            }
          })
        }
      });

      // Top level document
      var topLevelDocument = new AST({
        'number' : {
          type: Number, exists:true, validation: {
            $gt: 100, $lt: 1000
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
        logger: {
          info: function(string) {
            console.log(string)
          }
        }
      });
      var func = compiler.compile(topLevelDocument);
    });
  });
});
