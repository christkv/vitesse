"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context, options) {
  options = options || {};

  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push to rules
  context.rules.push(object);

  // Need the first rule to be duplicated
  if(context.depth == 0) {
    context.rules.push(object);    
  }

  // Validation template
  var validationTemplate = M(function(){/***
    var object_validation{{index}} = function(path, object, context) {
      var valid = false;
      if(object === undefined) return;

      // Enum validations
      {{validations}}

      // Check if we have the validation
      if(!valid && context.failOnFirst) {
        throw new ValidationError('field does not match enumeration {{enumeration}}', path, rules[{{ruleIndex}}], object);
      } else if(!valid) {
        errors.push(new ValidationError('field does not match enumeration {{enumeration}}', path, rules[{{ruleIndex}}], object));
      }
    }
  ***/});

  // The list of enum
  var enumerations = object.object.enum;

  // Unroll the enum
  var validations = enumerations.map(function(x, i) {
    // Start conditional
    var conditional = '} else ';
    if(i == 0) conditional = '';
    if(i == enumerations.length) conditional = '}';

    // End conditional
    var endConditional = '';
    if(i == enumerations.length -1 ) endConditional = '}';

    // Generate the code
    if(typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean') {
      console.log("--------------------------------------- number")
      return Mark.up(M(function(){/***
        {{conditional}}if(object === {{value}}) {
          valid = true;
        {{endConditional}}
      ***/}), {
        value: typeof x === 'string' ? f("'%s'", x) : x, 
        index: i,
        conditional: conditional,
        endConditional: endConditional,
        enumeration: JSON.stringify(object.object.enum)
      });
    } else if(x instanceof Object) {
      console.log("--------------------------------------- object")
      return Mark.up(M(function(){/***
        {{conditional}}if(deepCompareStrict({{value}}, object)) {
          valid = true;
        {{endConditional}}
      ***/}), {
        value: JSON.stringify(x), 
        index: i,
        conditional: conditional,
        endConditional: endConditional,
        enumeration: JSON.stringify(object.object.enum)
      });
    } else if(Array.isArray(x)) {
      console.log("--------------------------------------- array")
      return Mark.up(M(function(){/***
        {{conditional}}if(deepCompareStrict({{value}}, object)) {
          valid = true;
        {{endConditional}}
      ***/}), {
        value: JSON.stringify(x), 
        index: i,
        conditional: conditional,
        endConditional: endConditional,
        enumeration: JSON.stringify(object.object.enum)
      });
    }
  });

  console.log("################################################################")
  console.dir(validations)

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom
  }

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex,
    validations: validations.join('\n'),
    enumeration: JSON.stringify(enumerations)
  });

  console.log(final)

  // Add to list of functions
  context.functions.push(final);

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = "object_validation{{index}}({{path}}, {{object}}, context);"
  // Generate the field
  var field = path.slice(0).pop();

  // If we have a []
  if(field.indexOf('[') != -1) {
    field = field.substr(field.indexOf('['));
  }

  // Object path
  var objectPath = ['object', field].join('');
  // Top level object
  if(context.depth == 0) {
    objectPath = ['object'];
  } else if(field.indexOf('[') == -1) {
    objectPath = ['object', key].join('.');
  }

  // Get the finalPath
  var finalPath = f("'%s'", path.join('.'));

  // Set up the final path
  if(context.generatedField) {
    finalPath = context.generatedField;
  }

   // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("path + '.{{key}}'", {key: key});
  } else {
    finalPath = context.generatedField; 
  }

  if(context.depth == 0) {
    finalPath = "'object'";
  }

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: context.object ? context.object : objectPath
  }));

  // console.log(validations.join('\n'))

  // // Skip validation
  // var skipOnWrongType = typeof object.object.skipOnWrongType === 'boolean'
  //   ? !object.object.skipOnWrongType : true;

  // // Get the array
  // var functionCallContexts = context.functionCallContexts;

  // // Push the rule index
  // var ruleIndex = context.ruleIndex++;
  // var index = ++context.index;
  
  // // Push to rules
  // context.rules.push(object);

  // // Set up the final
  // var finalPath = f("'%s'", path.join('.'));

  // // Generate the actual path
  // if(!context.generatedField) {
  //   finalPath = Mark.up("path + '.{{key}}'", {key: key});
  // } else {
  //   finalPath = context.generatedField
  // }

  // // Create the function call
  // functionCallContexts.push(Mark.up(callTemplate, {
  //   index: index,
  //   ruleIndex: ruleIndex,
  //   path: finalPath,
  //   object: context.object ? context.object : ['object', key].join('.'),
  //   skipOnWrongType: skipOnWrongType,
  //   validations: validations.join('\n')
  // }));

  // console.log("------------------------------------------------------------------------")
  // console.dir(functionCallContexts)
}

module.exports = Validator;
