"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var ArrayType = require('../ast').ArrayType,
  NestedArrayType = require('../ast').NestedArrayType,
  StringType = require('../ast').StringType,
  NumberType = require('../ast').NumberType,
  DocumentType = require('../ast').DocumentType,
  IntegerType = require('../ast').IntegerType;

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  IntegerValidator = require('./integer'),
  NestedArrayValidator = require('./nested_array'),
  ExistsValidator = require('./exists'),
  ArrayValidator = require('./array');

var Validator = function() {
}

Validator.generate = function generate(key, object, path, context, generateDocumentType) {
  console.log("------------------------------------------------------- 0")
  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  var validations = object.object.validations;

  // Push to rules
  context.rules.push(object);

  // Need the first rule to be duplicated
  if(context.depth == 0) {
    context.rules.push(object);    
  }

  // Validation template
  var validationTemplate = M(function(){/***
    var of_one_validation{{index}} = function(path, object, context) {
      // Not possible to perform any validations on the object as it does not exist
      if(object == null) return;
      // Total validations that were successful
      var successfulValidations = 0;
      // Perform validations on object fields
      {{statements}}
    }
  ***/});

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules,
    regexps: context.regexps,
    custom: context.custom,
    object: 'object'
  }

  // Iterate over all the document keys
  validations.forEach(function(rule) {
    // Get the rule
    var p = path.slice(0);
    p.push(key)

    // Do we have an exists statement
    if(rule.object.exists) {
      ExistsValidator.generate(key, rule, p, innerContext);
    } else if(rule.options && rule.options.exists) {
      ExistsValidator.generate(key, rule, p, innerContext);
    }

    // Check if we have a rule
    if(rule instanceof ArrayType) {
      ArrayValidator.generate(key, rule, p, innerContext, generate);
    } else if(rule instanceof NestedArrayType) {
      NestedArrayValidator.generate(key, rule, p, innerContext, generate);
    } else if(rule instanceof StringType) {
      StringValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof NumberType) {
      NumericValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof IntegerType) {
      IntegerValidator.generate(key, rule, path, innerContext);
    } else if(rule instanceof DocumentType) {
      generate(key, rule, path, innerContext);
    }
  });

  // Get the adjusted values
  context.ruleIndex = innerContext.ruleIndex;
  context.index = innerContext.index;

  // Statement validation template
  var validationStatementTemplate = M(function(){/***
    var numberOfErrors = errors.length;

    {{statement}}

    if(numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }

    if(successfulValidations > 1 && context.failOnFirst) {
      throw new ValidationError('more than one schema matched ofOne rule', path, rules[{{ruleIndex}}], object);
    } else if(successfulValidations > 1 && !context.failOnFirst) {
      errors.push(new ValidationError('more than one schema matched ofOne rule', path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Remap the function calls
  innerContext.functionCallContexts = innerContext.functionCallContexts.map(function(x) {
    return Mark.up(validationStatementTemplate, {
      ruleIndex: ruleIndex,
      statement: x
    });
  });

  // Merged template
  var final = Mark.up(validationTemplate, {
    statements: innerContext.functionCallContexts.join('\n'), 
    index: index, 
    ruleIndex: ruleIndex
  });

  // Add to list of functions
  context.functions.push(final);

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = "of_one_validation{{index}}({{path}}, {{object}}, context);"
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
    object: objectPath
  }));

  // // Depth of nested array
  // var depth = object.object.depth;
  // var ruleIndex = context.ruleIndex++;
  // var index = ++context.index;
  // var validations = object.object.validations;

  // // Push to rules
  // context.rules.push(object);

  // // Validation template
  // var validationDepthZeroTemplate = M(function(){/***
  //   var one_of_validation{{index}} = function(path, object, context) {
  //     // Not possible to perform any validations on the object as it does not exist
  //     if(object == null) return;
  //     // Total validations that were successful
  //     var successfulValidations = 0;

  //     {{statements}}
  //   }
  // ***/});

  // // Statement validation template
  // var validationStatementTemplate = M(function(){/***
  //   var numberOfErrors = errors.length;

  //   {{statement}}

  //   if(numberOfErrors == errors.length) {
  //     successfulValidations = successfulValidations + 1;
  //   }

  //   if(successfulValidations > 1 && context.failOnFirst) {
  //     throw new ValidationError('more than one schema matched ofOne rule', path, rules[{{ruleIndex}}], object);
  //   } else if(successfulValidations > 1 && !context.failOnFirst) {
  //     errors.push(new ValidationError('more than one schema matched ofOne rule', path, rules[{{ruleIndex}}], object));
  //   }
  // ***/});

  // // Create inner context
  // var innerContext = {
  //   functions: context.functions,
  //   functionCallContexts: [],
  //   index: index,
  //   ruleIndex: context.ruleIndex,
  //   rules: context.rules,
  //   regexps: context.regexps,
  //   custom: context.custom
  // }

  // // Generate validations
  // validations.forEach(function(x, i) {
  //   console.log("----------------------------- create on path :: " + path)
  //   // Push to rules
  //   context.rules.push(x);

  //   // Execute integer type
  //   if(x instanceof IntegerType) {     
  //     IntegerValidator.generate(key, x, path, innerContext);
  //   }
  // });

  // // Remap the function calls
  // innerContext.functionCallContexts = innerContext.functionCallContexts.map(function(x) {
  //   return Mark.up(validationStatementTemplate, {
  //     ruleIndex: ruleIndex,
  //     statement: x
  //   });
  // });


  // // Add the function to the list of context
  // context.functions.push(Mark.up(validationDepthZeroTemplate, {
  //   index: index,
  //   statements: innerContext.functionCallContexts.join('\n')
  // }));

  // // Create a functionCallContext
  // var callTemplate = "one_of_validation{{index}}({{path}}, {{object}}, context);"

  // // Create the function call
  // context.functionCallContexts.push(Mark.up(callTemplate, {
  //   index: index,
  //   path: "'object'",
  //   object: 'object'
  // }));

  // console.log("-------------------------------------------------------------------")
  // innerContext.functionCallContexts.forEach(function(x) {
  //   console.log("------------------------------------------------------------------- functionCallContexts START")
  //   console.log(x)
  //   console.log("------------------------------------------------------------------- functionCallContexts END")
  // });

  // innerContext.functions.forEach(function(x) {
  //   console.log("------------------------------------------------------------------- functions START")
  //   console.log(x)
  //   console.log("------------------------------------------------------------------- functions END")
  // })
  // console.dir(innerContext.functions)

  // // Top level object
  // if(depth === 0) {
  //   // Generate validations for all the supported types
  // }


  // Push to rules
  // context.rules.push(object);

  // // Need the first rule to be duplicated
  // if(context.depth == 0) {
  //   context.rules.push(object);    
  // }

  // // Validation template
  // var validationTemplate = M(function(){/***
  //   var object_validation{{index}} = function(path, object, context) {
  //     if((object == null || typeof object != 'object') && context.failOnFirst) {
  //       throw new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object);
  //     } else if(object == null || typeof object != 'object') {       
  //       errors.push(new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object));
  //     }

  //     // Not possible to perform any validations on the object as it does not exist
  //     if(object == null) return;
  //     // Custom validations
  //     {{customValidations}}
  //     // Perform validations on object fields
  //     {{statements}}
  //   }
  // ***/});

  // // Create inner context
  // var innerContext = {
  //   functions: context.functions,
  //   functionCallContexts: [],
  //   index: index,
  //   ruleIndex: context.ruleIndex,
  //   rules: context.rules,
  //   regexps: context.regexps,
  //   custom: context.custom
  // }

  // // Iterate over all the document keys
  // keys.forEach(function(key) {
  //   // Get the rule
  //   var rule = object.value(key);
  //   var p = path.slice(0);
  //   p.push(key)

  //   // Do we have an exists statement
  //   if(rule.object.exists) {
  //     ExistsValidator.generate(key, rule, p, innerContext);
  //   } else if(rule.options && rule.options.exists) {
  //     ExistsValidator.generate(key, rule, p, innerContext);
  //   }

  //   // Check if we have a rule
  //   if(rule instanceof ArrayType) {
  //     ArrayValidator.generate(key, rule, p, innerContext, generate);
  //   } else if(rule instanceof NestedArrayType) {
  //     NestedArrayValidator.generate(key, rule, p, innerContext, generate);
  //   } else if(rule instanceof StringType) {
  //     StringValidator.generate(key, rule, path, innerContext);
  //   } else if(rule instanceof NumberType) {
  //     NumericValidator.generate(key, rule, path, innerContext);
  //   } else if(rule instanceof DocumentType) {
  //     generate(key, rule, path, innerContext);
  //   }
  // });

  // // Get the adjusted values
  // context.ruleIndex = innerContext.ruleIndex;
  // context.index = innerContext.index;

  // //
  // // Generate custom validation functions
  // // ---------------------------------------------

  // // Do we have custom validations
  // var customValidationsString = object.options.custom
  //   ? Utils.generateCustomValidations(object.options.custom, context, ruleIndex, index)
  //   : '';

  // // Merged template
  // var final = Mark.up(validationTemplate, {
  //   statements: innerContext.functionCallContexts.join('\n'), 
  //   index: index, 
  //   ruleIndex: ruleIndex,
  //   customValidations: customValidationsString
  // });

  // // Add to list of functions
  // context.functions.push(final);

  // //
  // // Generate the caller method
  // // ---------------------------------------------

  // // Create a functionCallContext
  // var callTemplate = "object_validation{{index}}({{path}}, {{object}}, context);"
  // // Generate the field
  // var field = path.slice(0).pop();

  // // If we have a []
  // if(field.indexOf('[') != -1) {
  //   field = field.substr(field.indexOf('['));
  // }

  // // Object path
  // var objectPath = ['object', field].join('');
  // // Top level object
  // if(context.depth == 0) {
  //   objectPath = ['object'];
  // } else if(field.indexOf('[') == -1) {
  //   objectPath = ['object', key].join('.');
  // }

  // // Get the finalPath
  // var finalPath = f("'%s'", path.join('.'));

  // // Set up the final path
  // if(context.generatedField) {
  //   finalPath = context.generatedField;
  // }

  //  // Generate the actual path
  // if(!context.generatedField) {
  //   finalPath = Mark.up("path + '.{{key}}'", {key: key});
  // } else {
  //   finalPath = context.generatedField; 
  // }

  // if(context.depth == 0) {
  //   finalPath = "'object'";
  // }

  // // Create the function call
  // context.functionCallContexts.push(Mark.up(callTemplate, {
  //   index: index,
  //   path: finalPath,
  //   object: objectPath
  // }));
}

module.exports = Validator;