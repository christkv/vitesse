"use strict"

var f = require('util').format,
  Utils = require('./validators/utils'),
  jsfmt = require('jsfmt'),
  Mark = require("markup-js"),
  ArrayType = require('./ast').ArrayType,
  NestedArrayType = require('./ast').NestedArrayType,
  StringType = require('./ast').StringType,
  NumberType = require('./ast').NumberType,
  DocumentType = require('./ast').DocumentType;

var StringValidator = require('./validators/string'),
  ObjectValidator = require('./validators/object'),
  NumericValidator = require('./validators/numeric'),
  NestedArrayValidator = require('./validators/nested_array'),
  ExistsValidator = require('./validators/exists'),
  ArrayValidator = require('./validators/array');

var ValidationError = function(message, path, rule, value) {
  this.message = message;
  this.path = path;
  this.rule = rule;
  this.value = value;
}

var Compiler = function() {
}

Compiler.prototype.compile = function(ast, options) {
  options = options || {};
  options = Utils.clone(options);

  // Contains all the rules used
  var rules = [];

  // Wrap in validation method
  var syncTemplate = `
    var validate = function(object, context) {
      context = context || {};
      var errors = [];

      {{functions}}
  
      {{statements}}

      return errors;
    };

    func = validate;
  `  

  // Total generation context
  var context = {
    functions: [],
    functionCallContexts: [],
    index: 0,
    ruleIndex: 0,
    rules: rules,
    depth: 0
  }

  // Generate generatePath function
  context.functions.push(`
    var generatePath = function(parent) {
      var args = Array.prototype.slice.call(arguments);
      args.shift();
      return f('%s%s', parent, args.map(function(x) {
        return f('[%s]', x);
      }).join(''));
    }
  `)

  // Generate code
  ObjectValidator.generate('object', ast, ['object'], context);

  // Generate final code
  var source = Mark.up(syncTemplate, {
    functions: context.functions.join('\n'),
    statements: context.functionCallContexts.map(function(x) {
      return x.replace('object.object', 'object');
    }).join('\n')
  });

  // Format the final code
  var source = jsfmt.format(source);
  source = source.replace(/\n\n/g, "\n");

  // We enabled debugging, print the generated source
  if(options.debug) {
    console.log(source);
  }

  // Variables used in the eval
  var func = null;

  // Compile the function
  eval(source)

  // Return the validation function
  return {
    validate: func
  }
}

module.exports = Compiler;
