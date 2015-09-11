"use strict"

var f = require('util').format,
  jsfmt = require('jsfmt'),
  M = require('mstring'),
  utils = require('./utils'),
  Mark = require("markup-js");

var clone = require('./utils').clone,
  decorate = require('./utils').decorate;

var ObjectNode = require('./object');

var Compiler = function() {
}

Compiler.prototype.compile = function(ast, options) {
  options = options || {};
  options = clone(options);

  // Contains all the rules used
  var rules = [];
  var regexps = {};
  var custom = {};

  // Reset count
  utils.resetId();

  // Wrap in validation method
  var syncTemplate = M(function(){/***
    var ValidationError = function(message, path, rule, value, errors) {
      this.message = message;
      this.path = path;
      this.rule = rule;
      this.value = value;
      this.errors = errors;
    }

    var validate = function(object, context) {
      var context = context == null ? {} : context;
      var errors = [];

      {{functions}}

      {{statements}}

      return errors;
    };

    func = validate;
  ***/});

  // Total generation context
  var context = {
    functions: [],
    functionCalls: [],
    rules: rules,
    custom: custom,
    regexps: regexps
  }

  // Decorate the context
  decorate(context);

  // Generate the code
  ast.generate(context);

  // Generate final code
  var source = Mark.up(syncTemplate, {
    functions: context.functions.join('\n'),
    statements: context.functionCalls.map(function(x) {
      return x.replace('object.object', 'object');
    }).join('\n')
  });

  // console.log(source)

  // Format the final code
  var source = jsfmt.format(source);
  source = source.replace(/\n\n/g, "\n");

  // We enabled debugging, print the generated source
  if(options.debug) {
    console.log(source);
  }

  // console.log(source)

  // Variables used in the eval
  var func = null;

  // Compile the function
  eval(source)
  // console.log("########################################## EVAL")

  // Return the validation function
  return {
    validate: func
  }
}

module.exports = Compiler;
