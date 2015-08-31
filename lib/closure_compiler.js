"use strict"

var f = require('util').format,
  Utils = require('./validators/utils'),
  jsfmt = require('jsfmt'),
  M = require('mstring'),
  shared = require('./shared'),
  Mark = require("markup-js"),
  cc = require('closure-compiler'),
  ArrayType = require('./ast').ArrayType,
  NestedArrayType = require('./ast').NestedArrayType,
  StringType = require('./ast').StringType,
  NumberType = require('./ast').NumberType,
  IntegerType = require('./ast').IntegerType,
  BooleanType = require('./ast').BooleanType,
  NullType = require('./ast').NullType,
  DocumentType = require('./ast').DocumentType,
  OneOfType = require('./ast').OneOfType,
  AnyOfType = require('./ast').AnyOfType,
  NotType = require('./ast').NotType,
  AllOfType = require('./ast').AllOfType,
  EnumType = require('./ast').EnumType;

var StringValidator = require('./validators/string'),
  ObjectValidator = require('./validators/object'),
  NumericValidator = require('./validators/numeric'),
  IntegerValidator = require('./validators/integer'),
  BooleanValidator = require('./validators/boolean'),
  NullValidator = require('./validators/null'),
  NestedArrayValidator = require('./validators/nested_array'),
  ExistsValidator = require('./validators/exists'),
  ArrayValidator = require('./validators/array'),
  OneOfValidator = require('./validators/one_of'),
  AnyOfValidator = require('./validators/any_of'),
  NotValidator = require('./validators/not'),
  EnumValidator = require('./validators/enum'),
  AllOfValidator = require('./validators/all_of');

var Compiler = function() {
}

Compiler.prototype.compile = function(ast, options, callback) {
  options = options || {};
  options = Utils.clone(options);

  // Contains all the rules used
  var rules = [];
  var regexps = {};
  var custom = {};

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
    functionCallContexts: [],
    index: 0,
    ruleIndex: 0,
    rules: rules,
    custom: custom,
    regexps: regexps,
    depth: 0
  }

  // Add shared functions
  shared.decorate(context);

  // We have an object validator as the top AST
  if(ast instanceof DocumentType) {
    ObjectValidator.generate('object', ast, ['object'], context);   
  } else if(ast instanceof OneOfType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // OfOne validation generation
    OneOfValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof AllOfType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // OfOne validation generation
    AllOfValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof AnyOfType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // OfOne validation generation
    AnyOfValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof NotType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // OfOne validation generation
    NotValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof IntegerType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // Integer validation generation
    IntegerValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof NullType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // Integer validation generation
    NullValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof NumberType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // Integer validation generation
    NumericValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof StringType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // Integer validation generation
    StringValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof ArrayType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "object";
    context.object = 'object';
    // Integer validation generation
    ArrayValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof BooleanType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "'object'";
    context.object = 'object';
    // Integer validation generation
    BooleanValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof NestedArrayType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "object";
    context.object = 'object';
    // Integer validation generation
    NestedArrayValidator.generate('object', ast, ['object'], context);
  } else if(ast instanceof EnumType) {
    // Top level context, needs to ensure top level for path and object
    context.generatedField = "object";
    context.object = 'object';
    // Integer validation generation
    EnumValidator.generate('object', ast, ['object'], context);
  }

  // Generate final code
  var source = Mark.up(syncTemplate, {
    functions: context.functions.join('\n'),
    statements: context.functionCallContexts.map(function(x) {
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

  // Variables used in the eval
  var func = null;

  // Compiler flags
  var compilerFlags = {
  };

  var done = function(err, stdout, stderr) {
    if(err) return callback(err);
    // Get the transformed source
    source = stdout;
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

module.exports = Compiler;
