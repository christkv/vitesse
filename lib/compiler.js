"use strict"

var f = require('util').format,
  Utils = require('./validators/utils'),
  NumericValidator = require('./validators/numeric'),
  StringValidator = require('./validators/string'),
  ArrayValidator = require('./validators/array'),
  jsfmt = require('jsfmt'),
  Mark = require("markup-js"),
  escodegen = require('escodegen'),
  esprima = require('esprima'),
  ArrayType = require('./ast').ArrayType,
  NestedArrayType = require('./ast').NestedArrayType,
  StringType = require('./ast').StringType,
  NumberType = require('./ast').NumberType,
  DocumentType = require('./ast').DocumentType;

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
  generateDocumentType('object', ast, ['object'], context);

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

var generateDocumentType = function(key, object, path, context) {
  // Get all the keys
  var keys = object.keys();

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
  var validationTemplate = `
    var object_validation{{index}} = function(path, object, context) {
      if((object == null || typeof object != 'object') && context.failOnFirst) {
        throw new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object);
      } else if(object == null || typeof object != 'object') {       
        errors.push(new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object));
      }

      // Not possible to perform any validations on the object as it does not exist
      if(object == null) return;

      // Perform validations on object fields
      {{statements}}
    }
  `;

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules
  }

  // Iterate over all the document keys
  keys.forEach(function(key) {
    // Get the rule
    var rule = object.value(key);
    var p = path.slice(0);
    p.push(key)

    // Do we have an exists statement
    if(rule.object.exists) {
      generateExists(key, rule, p, innerContext);
    } else if(rule.options && rule.options.exists) {
      generateExists(key, rule, p, innerContext);
    }

    // Check if we have a rule
    if(rule instanceof ArrayType) {
      generateArrayType(key, rule, p, innerContext);
    } else if(rule instanceof NestedArrayType) {
      generateNestedArrayType(key, rule, p, innerContext);
    } else if(rule instanceof StringType) {
      generateStringType(key, rule, path, innerContext);
    } else if(rule instanceof NumberType) {
      generateNumberType(key, rule, path, innerContext);
    } else if(rule instanceof DocumentType) {
      generateDocumentType(key, rule, path, innerContext);
    }
  });

  // Get the adjusted values
  context.ruleIndex = innerContext.ruleIndex;
  context.index = innerContext.index;

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
  var callTemplate = `object_validation{{index}}({{path}}, {{object}}, context);`
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
    finalPath = Mark.up("f('%s.{{key}}', path)", {key: key});
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
}

var generateArrayType = function(key, object, path, context) {
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
    validation = generateArrayValidation('object', 
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

var generateArrayValidation = function(path, actualPath, ruleIndex,validations) {
  var stmts = [];

  // Go through all the validations
  for(var name in validations) {
    if(name == '$gt') {
      stmts.push(f('%s.length <= %s', path, validations[name]));
    } else if(name == '$gte') {
      stmts.push(f('%s.length < %s', path, validations[name]));
    } else if(name == '$lte') {
      stmts.push(f('%s.length > %s', path, validations[name]));
    } else if(name == '$lt') {
      stmts.push(f('%s.length >= %s', path, validations[name]));
    } else if(name == '$eq') {
      stmts.push(f('%s.length == %s', path, validations[name]));
    }
  }

  // Generate validation string
  return Mark.up(`
    if({{validation}} && context.failOnFirst) {
      throw new ValidationError('array failed length validation {{rule}}', {{path}}, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('array failed length validation {{rule}}', {{path}}, rules[{{ruleIndex}}], object));
    }
  `, {
    ruleIndex: ruleIndex,
    rule: JSON.stringify(validations),
    validation: f('(%s)', stmts.join(' || ')),
    path: actualPath
  });
}

var generateNestedArrayType = function(key, object, path, context) {
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

  for(var i = 0; i < depth; i++) {
    innermostParent += f('[i%s]', i);
  }

  path.push(innermostParent)

  // Validation string
  var validation = "";

  // Generate validations
  if(validations && validations[depth - 1]) {
    validation = generateArrayValidation(str, 
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
      validation = generateArrayValidation(str, f("generatePath(path, %s)", levels.join(',')), ruleIndex, validations[i]);
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
      if(!object) return;

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
    generatedField: f("generatePath(path, %s)", topLevels.join(','))
  }

  // Generate the document type
  generateDocumentType(key, object.object.of, path, innerContext);

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

var generateExists = function(key, object, path, context) {
  var functionTemplate = `
    var exists_validation{{index}} = function(path, object, context) {
      if((object == null || object == undefined) && context.failOnFirst) {
        throw new ValidationError('field does not exist', path, rules[{{ruleIndex}}], object);
      } else if(object == null || object == undefined) {
        errors.push(new ValidationError('field does not exist', path, rules[{{ruleIndex}}], object));
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
  var callTemplate = `exists_validation{{index}}({{path}}, {{object}}, context);`
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

var generateStringType = function(key, object, path, context) {
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

var generateNumberType = function(key, object, path, context) {
  var functionTemplate = `
    var array_validation{{index}}()
  `
}

module.exports = Compiler;
