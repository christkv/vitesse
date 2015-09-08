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

  // Validation template
  var validationTemplate = M(function(){/***
    var enum_validation{{index}} = function(path, object, context) {
      var valid = false;

      if(!(object === undefined)) {
        // Enum validations
        {{validations}}

        // Check if we have the validation
        if(!valid && context.failOnFirst) {
          throw new ValidationError('field does not match enumeration {{enumeration}}', path, rules[{{ruleIndex}}], object);
        } else if(!valid) {
          errors.push(new ValidationError('field does not match enumeration {{enumeration}}', path, rules[{{ruleIndex}}], object));
        }
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

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom,
    objectMetaData: context.objectMetaData
  }

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex,
    validations: validations.join('\n'),
    enumeration: JSON.stringify(enumerations)
  });

  // Add to list of functions
  context.functions.push(final);

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = "enum_validation{{index}}({{path}}, {{object}}, context);"
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
}

module.exports = Validator;
