"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  Utils = require('./utils');

var Validator = function() {
}

Validator.generate = function(key, object, path, context) {
  var functionTemplate = `
    var string_validation{{index}} = function(path, object, context) {
      if(!object) return;

      if(!(typeof object == 'string') && context.failOnFirst) {
        throw new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object);
      } else if(!(typeof object == 'string')) {
        errors.push(new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object));
      }
    }
  `

  // Get the array
  var functions = context.functions;
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push to rules
  context.rules.push(object);

  // Push the function to the list of complete functions
  functions.push(Mark.up(functionTemplate, {
    ruleIndex: ruleIndex, index: index
  }));

  // Create a functionCallContext
  var callTemplate = `string_validation{{index}}({{path}}, {{object}}, context);`
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Set up the final
  var finalPath = f("'%s'", path.join('.'));

  // Generate the actual path
  if(!context.generatedField) {
    finalPath = Mark.up("f('%s.{{key}}', path)", {key: key});
  }

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: ['object', key].join('.')
  }));
}


// //
// // String validation handler
// //
// Validator.validator = function(field, rule, options) {
//   var template = `
//     if(%s && context.failOnFirst) {
//       throw new ValidationError('field %s fails validation %s', rules[%s], %s);
//     } else if(%s) {
//       errors.push(new ValidationError('field %s fails validation %s', rules[%s], %s));
//     }`

//   // Get the index
//   var index = options.index;
//   // Do we have a parent namespace for this validation
//   var parent = options.parent;

//   // Object name
//   var fieldName = parent
//     ? f('object.%s.%s', parent, field)
//     : f('object.%s' , field);

//   // Get the validation chain
//   var validations = Utils.generatePathValidation(fieldName);

//   // Generate our validation
//   var valueValidations = [];

//   // Process the validation
//   for(var operator in rule.validation) {
//     if(operator === '$gt') {
//       valueValidations.push(f('%s.length <= %s', fieldName, rule.validation[operator]));
//     } else if(operator === '$gte') {
//       valueValidations.push(f('%s.length < %s', fieldName, rule.validation[operator]));
//     } else if(operator === '$lte') {
//       valueValidations.push(f('%s.length > %s', fieldName, rule.validation[operator]));
//     } else if(operator === '$lt') {
//       valueValidations.push(f('%s.length >= %s', fieldName, rule.validation[operator]));
//     } else if(operator === '$in') {
//       valueValidations.push(f('[%s].indexOf(%s) != -1', Utils.generateArray(rule.validation[operator]), fieldName));
//     } else {
//       throw new Error(f('validation operator %s is not supported by String type', operator));
//     }
//   }

//   // Add the validation
//   validations.push(f('(%s)', valueValidations.join(' || ')));

//   // Generate the validation
//   var source = f(template,
//     validations.join(' && '),
//     fieldName,
//     JSON.stringify(rule.validation),
//     index,
//     fieldName,
//     validations.join(' && '),
//     fieldName,
//     JSON.stringify(rule.validation),
//     index,
//     fieldName
//   );

//   // log the generated code
//   if(options.logger) {
//     options.logger.info(f('[INFO] generated exists code for %s: %s', fieldName, source));
//   }

//   // Indent the source
//   source = Utils.indent(source, options);

//   // Return the source
//   return source;
// }

module.exports = Validator;
