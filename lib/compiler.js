"use strict"

var f = require('util').format,
  fs = require('fs'),
  jsfmt = require('jsfmt'),
  cc = require('closure-compiler'),
  M = require('mstring'),
  utils = require('./utils'),
  Optimizer = require('./optimizer'),
  Mark = require("markup-js");

var clone = require('./utils').clone,
  decorate = require('./utils').decorate;

var ObjectNode = require('./object');

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
    var path = ['object'];

    {{functions}}

    {{statements}}

    return errors;
  };

  func = validate;
***/});

var generate = function(ast, options) {
  options = options || {};
  options = clone(options);

  // Reset count
  utils.resetId();

  // Total generation context
  var context = {
    functions: [],
    functionCalls: [],
    rules: options.rules,
    custom: options.custom,
    regexps: options.regexps,
    optimize: options.optimize
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

  // Transform the source code
  if(options.optimize) {
    source = new Optimizer(options).optimize(source, ast);
  }

  // We enabled debugging, print the generated source
  if(options.debug) {
    // Format the final code
    var source = jsfmt.format(source);
    source = source.replace(/\n\n/g, "\n");
    // Output the source
    console.log(source);
  }

  return source;
}

/*
 * The Compiler class
 * 
 * @class
 * @return {Compiler} a Compiler instance.
 */
var Compiler = function() {
}

/**
 * compile a AST into a validator function
 *
 * @method
 * @param {object} ast AST of validation nodes
 * @param {object} [options.optimize=true] optimize enable/disable basic optimizations for the generated code
 * @return {object} returns the object containing the validator function
 */
Compiler.prototype.compile = function(ast, options) {
  options = options ? clone(options) : {};
  // Variables used in the eval
  var rules = [];
  var regexps = {};
  var custom = {};
  var func = null;
  // Add to the options
  options.regexps = regexps;
  options.rules = rules;
  options.custom = custom;
  options.optimize = typeof options.optimize == 'boolean'
    ? options.optimize : true;

  // Generate the source
  var source = generate(ast, options);

  // Compile the function
  eval(source)

  // Return the validation function
  return {
    validate: func
  }
}

/*
 * The ClosureCompiler class that wraps the Google closure compiler
 * 
 * @class
 * @return {ClosureCompiler} a ClosureCompiler instance.
 */
var ClosureCompiler = function() {}

/**
 * compile a AST into a validator function
 *
 * @method
 * @param {object} ast AST of validation nodes
 * @param {object} options compiler options
 * @param {function} callback returns the validation function
 */
ClosureCompiler.prototype.compile = function(ast, options, callback) {
  if(typeof options == 'function') callback = options; options = {};
  options = options ? clone(options) : {};
  // Variables used in the eval
  var rules = [];
  var regexps = {};
  var custom = {};
  var func = null;
  // Add to the options
  options.regexps = regexps;
  options.rules = rules;
  options.custom = custom;
  // Generate the source code
  var source = generate(ast, options);
  // Run closure compiler on the result
  // Compiler flags
  var compilerFlags = {
  };

  // Handle closure compiler result
  var done = function(err, stdout, stderr) {
    if(err) return callback(err);
    // Get the transformed source
    var source = stdout;
    // Compile the function
    eval(source)
    // Return the validation function
    callback(null, {
      validate: func
    });
  }

  // Execute the closure compiler
  cc.compile(source, compilerFlags, done);
}


module.exports = {
  Compiler: Compiler, ClosureCompiler: ClosureCompiler
}
