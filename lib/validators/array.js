"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  Utils = require('./utils');

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

  // Get the original field path
  var originalFieldPath = path.slice(0);

  // Validation template
  var validationTemplate = `
    var array_validation{{index}} = function(path, object, context) {
      if(!object) return;

      if(!Array.isArray(object) && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object);
      } else if(!Array.isArray(object)) {       
        errors.push(new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object));
      }

      {{validations}}

      for(var i = 0; i < object.length; i++) {
        {{statements}}
      }
    }
  `

  // // Generate validations
  // if(validations && validations[depth - 1]) {
  //   validation = generateArrayValidation(str, 
  //     f("generatePath(path, %s)", 
  //     topLevels.slice(0, topLevels.length - 1).join(',')), 
  //     ruleIndex, 
  //     validations[depth - 1]);
  // }

  // Set the validation
  var validation = '';

  // Generate the validation
  if(validations) {
    validation = Utils.generateArrayValidation('object', 
        'path',
        ruleIndex, 
        validations)
  }

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    generatedField: f("generatePath(path, i)")
  }

  // The innermost parent object used
  path = path.slice(0);
  var innermostParent = path.pop();
  path.push(f('%s[i]', innermostParent));

  // Generate the document type
  generateDocumentType(key, object.object.of, path, innerContext);

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex, 
    path: f(" '%s'", originalFieldPath.join('.')),
    validations: validation
  });

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = `array_validation{{index}}({{path}}, {{object}}, context);`
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
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    path: finalPath,
    object: ['object', key].join('.')
  }));

  // Push the final function to the tree
  context.functions.push(final);

  // Adjust the context
  context.index = innerContext.index;
  context.ruleIndex = innerContext.ruleIndex; 
}

// //
// // Numeric validation handler
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
//     } else {
//       throw new Error(f('validation operator %s is not supported by Array type', operator));
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

//   // Return the source
//   return source;
// }

// Validator.of = function(compile, rules, field, rule, options) {
//   var template = `
//     if(%s) {
//       for(var i = 0; i < %s.length; i++) {
//         %s
//       }
//     }
//   `
//   // Result object
//   var result = {
//     sync: [],
//     async: []
//   };

//   // Get the schema
//   var schema = rule.of;

//   // Do we have a parent namespace for this validation
//   var parent = options.parent;

//   // Object name
//   var fieldName = parent
//     ? f('object.%s.%s', parent, field)
//     : f('object.%s' , field);

//   // Get the validation chain
//   var validations = Utils.generatePathValidation(fieldName);

//   // We need to create the actual parent variable here.
//   var parent = f('%s[i]', options.parent || field);

//   // Clone the options
//   var opts = Utils.clone(options);
//   opts.parent = parent;
//   opts.depth = options.depth + 2;
//   opts.fieldNameRender = function(str) {
//     return f('f(%s, i)',
//       f(str, f("%s[%s].%s", fieldName))
//     )
//   }

//   // Generate schema code
//   compile(schema, rules, result, opts)

//   // Return the result
//   var source = f(template,
//     validations.join(' && '),
//     fieldName,
//     result.sync.join('\n')
//   )

//   // Indent the source
//   source = Utils.indent(source, options);

//   // Return source
//   return source;
// }

module.exports = Validator;