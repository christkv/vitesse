"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  Utils = require('./utils');

var ArrayType = require('../ast').ArrayType,
  NestedArrayType = require('../ast').NestedArrayType,
  StringType = require('../ast').StringType,
  NumberType = require('../ast').NumberType,
  DocumentType = require('../ast').DocumentType; 

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  NestedArrayValidator = require('./nested_array'),
  ExistsValidator = require('./exists');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, generateDocumentType) {
  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  var validations = object.object.validations;

  // Push to rules
  context.rules.push(object);

  // Generate top level field name for validation errors
  var topLevels = [];
  for(var i = 0; i < depth; i++) {
    topLevels.push(f('i%s', i));
  }

  // General for loop
  var forloopTemplate = `
    {{validations}}

    for(var i{{variable}} = 0; i{{variable}} < {{array}}.length; i{{variable}}++) {
      if(!Array.isArray({{array}}[i{{variable}}]) && context.failOnFirst) {
        throw new ValidationError('field is not an array', {{path}}, rules[{{ruleIndex}}], {{array}}[i{{variable}}]);
      } else if(!Array.isArray({{array}}[i{{variable}}])) {       
        errors.push(new ValidationError('field is not an array', {{path}}, rules[{{ruleIndex}}], {{array}}[i{{variable}}]));
      }

      {{statement}}
    }
  `

  // innermost for loop
  var innermostForLoop = `
    {{validations}}

    for(var i{{variable}} = 0; i{{variable}} < {{array}}.length; i{{variable}}++) {
      {{statements}}
    }
  `

  var str = 'object';
  // Generate the innermost validation
  for(var i = 0; i < depth - 1; i++) {
    str += f('[i%s]', i);
  }

  // Original parent path
  var originalParentPath = path.slice(0);
  originalParentPath.pop();
  var originalFieldPath = path.slice(0);

  // The innermost parent object used
  path = path.slice(0);
  var innermostParent = path.pop();
  var indexPath = "";

  for(var i = 0; i < depth; i++) {
    innermostParent += f('[i%s]', i);
    indexPath += f('[i%s]', i);
  }

  path.push(innermostParent)

  // Validation string
  var validation = "";

  // Generate validations
  if(validations && validations[depth - 1]) {
    validation = Utils.generateArrayValidation(str, 
      f("generatePath(path, %s)", 
      topLevels.slice(0, topLevels.length - 1).join(',')), 
      ruleIndex, 
      validations[depth - 1]);
  }

  // Generate innermost
  var innermost = Mark.up(innermostForLoop, {
    variable: depth - 1, 
    array: str,
    statements: "{{statements}}",
    validations: validation
  });

  // Innermost value reference
  var valuePath = path;

  // All generated for loops
  var forloops = [];

  // Iterate over the depth
  for(var i = depth - 2; i > -1; i--) {
    var str = 'object';

    // Generate the array reference
    for(var j = 0; j < i; j++) {
      str += f('[i%s]', j);
    }

    // Generate path
    var levels = [];

    // Generate the total list
    for(var k = 0; k <= i; k++) {
      levels.push(f('i%s', k));
    }

    // Validation string
    var validation = "";
    // Generate validations
    if(validations && validations[i]) {
      validation = Utils.generateArrayValidation(str, f("generatePath(path, %s)", levels.join(',')), ruleIndex, validations[i]);
    }

    // Generate code
    forloops.unshift(Mark.up(forloopTemplate, {
      variable: i,
      array: str, 
      statement: "{{statement}}",
      path: f("generatePath(path, %s)", levels.join(',')),
      ruleIndex: ruleIndex,
      validations: validation,
    }));
  }  

  // Previous
  var final = null;

  // Roll up the for loops
  forloops.forEach(function(x, i) {
    if(final) {
      final = Mark.up(final, {
        statement: x
      });      

    } else {
      final = x;
    }
  })

  // Inject the innermost forloop
  final = Mark.up(final, {
    statement: innermost
  });

  // Validation template
  var validationTemplate = `
    var nested_array_validation{{index}} = function(path, object, context) {
      if(object == undefined) return;

      if(!Array.isArray(object) && context.failOnFirst) {
        throw new ValidationError('field is not an array', {{path}}, rules[{{ruleIndex}}], object);
      } else if(!Array.isArray(object)) {       
        errors.push(new ValidationError('field is not an array', {{path}}, rules[{{ruleIndex}}], object));
      }

      {{statement}}
    }
  `

  // Merged template
  final = Mark.up(validationTemplate, {
    statement: final, 
    index: index, 
    ruleIndex: ruleIndex, 
    path: f("'%s'", originalFieldPath.join('.'))
  });

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom,
    generatedField: f("generatePath(path, %s)", topLevels.join(','))
  }

  // Generate the document type
  if(object.object.of instanceof DocumentType) {
    generateDocumentType(key, object.object.of, path, innerContext);
  } else if(object.object.of instanceof StringType) {
    // Generate the key and path correctly
    innerContext.object = ['object', indexPath].join('');
    // Generate string validation
    StringValidator.generate(key, object.object.of, path, innerContext);
  } else if(object.object.of instanceof NumberType) {
    // Generate the key and path correctly
    innerContext.object = ['object', indexPath].join('');
    // Generate string validation
    NumericValidator.generate(key, object.object.of, path, innerContext);
  }

  // Merge in the content
  final = Mark.up(final, {
    statements: innerContext.functionCallContexts.join('\n')
  });

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = `nested_array_validation{{index}}('{{path}}', {{object}}, context);`
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: originalFieldPath.join('.'),
    object: ['object', key].join('.')
  }));

  // Push the final function to the tree
  context.functions.push(final);

  // Adjust the context
  context.index = innerContext.index;
  context.ruleIndex = innerContext.ruleIndex;
}

module.exports = Validator;