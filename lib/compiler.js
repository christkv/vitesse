// "use strict"

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

var ValidationError = function(message, field, parent, rule, value) {
  this.message = message;
  this.field = field;
  this.parent = parent;
  this.rule = rule;
  this.value = value;
}

var Compiler = function() {
}

Compiler.prototype.compile = function(ast, options) {
  options = options || {};
  options = Utils.clone(options);

  // Contains all the rules used
  rules = [];

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
    rules: rules
  }

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

  console.log("############################################################")
  console.log(source)

}

var generateDocumentType = function(key, object, path, context) {
  console.log("=========================== generateDocumentType")
  var keys = object.keys();

  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Validation template
  var validationTemplate = `
    object_validation{{index}} = function(parent, field, object, context) {
      if((object == null || typeof object != 'object') && context.failOnFirst) {
        throw new ValidationError('field is not an object', parent, rules[{{ruleIndex}}], object);
      } else if(object == null || typeof object != 'object') {       
        errors.push(new ValidationError('field is not an object', parent, rules[{{ruleIndex}}], object));
      }

      {{statements}}
    }
  `  

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
    console.log("  generateDocumentType :: " + key)
    // Get the rule
    var rule = object.value(key);
    var p = path.slice(0);
    p.push(key)
    console.log("  generateDocumentType :: " + rule)

    // Do we have an exists statement
    if(rule.object.exists) {
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
    statements: innerContext.functionCallContexts.join('\n'), index: index, ruleIndex: ruleIndex
  });

  // Add to list of functions
  context.functions.push(final);

  //
  // Generate the caller method
  // ---------------------------------------------

  // Create a functionCallContext
  var callTemplate = `object_validation{{index}}("{{parent}}", "{{field}}", {{object}}, context);`
  // Generate the field
  var field = path.slice(0).pop();
  // Full parent path
  var parentPath = path.slice(0);
  parentPath.pop();

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    parent: parentPath,
    field: field,
    object: ['object', field].join('.')
  }));
}

var generateArrayType = function(key, object, path, context) {
  var functionTemplate = `
    var array_validation{{index}}()
  `
}

var generateArrayValidation = function(path, ruleIndex,validations) {
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
      throw new ValidationError('array failed length validation {{rule}}', parent, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('array failed length validation {{rule}}', parent, rules[{{ruleIndex}}], object));
    }
  `, {
    ruleIndex: ruleIndex,
    rule: JSON.stringify(validations),
    validation: stmts.join(' && ')
  });
}

var generateNestedArrayType = function(key, object, path, context) {
  console.log("========================== generateNestedArrayType :: " + object.object.depth + " :: " + path)
  // Depth of nested array
  var depth = object.object.depth;
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;
  var validations = object.object.validations;

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
  // var innermostParent = path;
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
    validation = generateArrayValidation(str, ruleIndex, validations[depth - 1]);
  }

  // Generate innermost
  var innermost = Mark.up(innermostForLoop, {
    variable: depth - 1, 
    array:str, 
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
      validation = generateArrayValidation(str, ruleIndex, validations[i]);
    }

    // Generate code
    forloops.unshift(Mark.up(forloopTemplate, {
      variable: i,
      array: str, 
      statement: "{{statement}}",
      path: f("generatePath(parent, %s)", levels.join(',')),
      ruleIndex: ruleIndex,
      validations: validation
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
    nested_array_validation{{index}} = function(parent, field, object, context) {
      var generatePath = function(parent) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        return f('%s%s', parent, args.map(function(x) {
          return f('[%s]', x);
        })).join('');
      }

      if(!Array.isArray(object) && context.failOnFirst) {
        throw new ValidationError('field is not an array', parent, rules[{{ruleIndex}}], object);
      } else if(!Array.isArray(object)) {       
        errors.push(new ValidationError('field is not an array', parent, rules[{{ruleIndex}}], object));
      }

      {{statement}}
    }
  `



  // console.log("=====================================")
  // console.log(final)

  // Merged template
  final = Mark.up(validationTemplate, {
    statement: final, index: index, ruleIndex: ruleIndex
  });

  // console.log("=====================================")
  // console.log(final)

  // Create inner context
  var innerContext = {
    functions: context.functions,
    functionCallContexts: [],
    index: index,
    ruleIndex: context.ruleIndex,
    rules: context.rules
  }

  console.log("----------------------- generate inner type" + path)
  // Split up the type to correctly create the values
  // var index = path.indexOf('[');
  // var parts = path.split

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
  var callTemplate = `nested_array_validation{{index}}("{{parent}}", "{{field}}", {{object}}, context);`
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Create the function call
  context.functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    parent: originalParentPath.join('.'),
    field: key,
    object: ['object', key].join('.')
  }));

  // // Format source
  // var source = jsfmt.format(final);
  // source = source.replace(/\n\n/g, "\n");
  // console.log("=====================================")
  // console.log(source)

  // Push the final function to the tree
  context.functions.push(final);

  // Adjust the context
  context.index = innerContext.index;
  context.ruleIndex = innerContext.ruleIndex;
}

var generateExists = function(key, object, path, context) {
  console.log("---------------------------------------------- generateStringType :: " + path)
  var functionTemplate = `
    var exists_validation{{index}} = function(parent, field, object, context) {
      if((object[field] == null || object[field] == undefined) && context.failOnFirst) {
        throw new ValidationError('field does not exist', parent, rules[{{ruleIndex}}], object);
      } else if(object[field] == null || object[field] == undefined) {
        errors.push(new ValidationError('field does not exist', parent, rules[{{ruleIndex}}], object));
      }
    }
  `

  // Get the array
  var functions = context.functions;
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push the function to the list of complete functions
  functions.push(Mark.up(functionTemplate, {
    ruleIndex: ruleIndex, index: index
  }));

  // Create a functionCallContext
  var callTemplate = `exists_validation{{index}}("{{parent}}", "{{field}}", {{object}}, context);`
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Original parent path
  var originalParentPath = path.slice(0);
  originalParentPath.pop();
  var originalFieldPath = path.slice(0);

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    parent: originalParentPath.join('.'),
    field: key,
    object: ['object', key].join('.')
  }));
  console.log("========================================== string_validation")
  console.dir(functionCallContexts) 
}

var generateStringType = function(key, object, path, context) {
  console.log("---------------------------------------------- generateStringType :: " + path)
  var functionTemplate = `
    var string_validation{{index}} = function(parent, field, object, context) {
      if(!(typeof object[field] == 'string') && context.failOnFirst) {
        throw new ValidationError('field is not an array', parent, rules[{{ruleIndex}}], object);
      } else if(!(typeof object[field] == 'string')) {
        errors.push(new ValidationError('field is not an array', parent, rules[{{ruleIndex}}], object));
      }
    }
  `

  // Get the array
  var functions = context.functions;
  var functionCallContexts = context.functionCallContexts;

  // Push the rule index
  var ruleIndex = context.ruleIndex++;
  var index = ++context.index;

  // Push the function to the list of complete functions
  functions.push(Mark.up(functionTemplate, {
    ruleIndex: ruleIndex, index: index
  }));

  // Create a functionCallContext
  var callTemplate = `string_validation{{index}}("{{parent}}", "{{field}}", {{object}}, context);`
  // Generate the field
  var field = path.slice(0);
  field.push(key);

  // Create the function call
  functionCallContexts.push(Mark.up(callTemplate, {
    index: index,
    parent: path.join('.'),
    field: key,
    object: ['object', key].join('.')
  }));
  console.log("========================================== string_validation")
  console.dir(functionCallContexts)
}

var generateNumberType = function(key, object, path, context) {
  var functionTemplate = `
    var array_validation{{index}}()
  `
}

// Compiler.prototype.compile = function(ast, options) {
//   options = options || {};
//   options = Utils.clone(options);
//   // The functions we have generated
//   var path = ['object'];
//   var functions = [];
//   var functionCallContexts = [];
//   // Contains the rules
//   var rules = [];
//   // Set the index
//   options.index = 0
//   // Generate the code
//   generate(ast, path, rules, functions, functionCallContexts, options);
//   // // Show the source
//   // var source = functions.map(function(x) {
//   //   return x;
//   // });

//   // var calls = functionCallContexts.map(function(x) {
//   //   return x;
//   // });

//   // Create function source
//   // var source = functions.join('\n') + functionCallContexts.join('\n');  
//   // Wrap in validation method
//   var syncTemplate = `
//     var validate = function(object, context) {
//       context = context || {};
//       var errors = [];
      
//       %s
  
//       %s

//       return errors;
//     };

//     func = validate;
//   `

//   // Create the sync code
//   source = f(syncTemplate, functions.join('\n'), functionCallContexts.join('\n'));

//   // console.log("-------------------------------------------------- START")
//   // console.log(source)
//   // console.log("-------------------------------------------------- END")

//   // Format source
//   source = jsfmt.format(source);
//   source = source.replace(/\n\n/g, "\n");

//   // If we have defined debug output the source
//   if(options.debug) {
//     console.log(source);
//   }

//   // console.log("-------------------------------------------------- START")
//   // console.log(source)
//   // console.log("-------------------------------------------------- END")

//   // Variables used in the eval
//   var func = null;

//   // Compile the function
//   eval(source)

//   // Return the validation function
//   return {
//     validate: func
//   }
// }

// var generate = function(ast, path, rules, functions, functionCallContexts, options) {
//   options = options || {};
//   var self = this;

//   // We have a document type
//   if(ast instanceof BasicType) {
//     console.log("---------------------------------------- BasicType " + path)
//     var value = ast.object;
//     // Get current index
//     var index = options.index;

//     if(value.type === Array) {
//       // The statements
//       var funcC = [];

//       // Array template function
//       var arrayTemplateFunction =`
//         var array_validation{{index}} = function(field, object, parent, rule, context, errors) {
//           if(object == null) { return; }

//           for(var i = 0; i < object.length; i++) {
//             {{statements}}
//           }
//         }  
//       `

//       // Generate type validation
//       var generateArrayElementTypeValidaton = function(value, context) {
//         if(typeof value.of == 'object') {
//           return Mark.up(`if(object == null || {{validation}} && context.failOnFirst) {
//             throw new ValidationError('field does not have the correct type', f('%s[%s]', field, i), parent, rule, object);
//           } else if(object == null || {{validation}}) {            
//             errors.push(new ValidationError('field does not have the correct type', f('%s[%s]', field, i), parent, rule, object));
//           }
//         `, context);
//         }
//       }

//       // Get the validation
//       var validation = "(object[i] != null && !Array.isArray(object[i]))";

//       // Push the entry
//       funcC.push(generateArrayElementTypeValidaton(value, {
//         validation: validation
//       }));

//       // Get the field
//       var field = path.slice(0).pop();

//       // Take a copy of the path
//       var p = path.slice(0);
//       // p.push(field);

//       // Generate options
//       var generateOptions = {
//         isInArray: true, index: index + 1, nestedArray:true
//       };

//       // Generate the underlying code
//       generate(value.of, p, rules, functions, funcC, generateOptions);

//       // Add the generated code to the list of functions
//       functions.push(Mark.up(arrayTemplateFunction, {
//         index: index, statements: funcC.join('\n'), parent: f('"%s"', path.join('.'))
//       }));       

//       // Function call template
//       var functionCallTemplate = `
//         array_validation{{index}}(f("{{field}}[%s]", i), object[i], {{parent}}, rules[{{index}}], context, errors);
//       `

//       // Default parent
//       var parent = Mark.up('f("{{parent}}[%s]", i)', {parent:path.join('.')});

//       if(options.nestedArray && value.of instanceof BasicType) {
//         console.log("#############################################")
//         var p1 = p.slice(0);
//         p1.pop();
//         parent = Mark.up('f("{{parent}}")', {parent:p1.join('.')});
//       }

//       // Create a function call context
//       functionCallContexts.push(Mark.up(functionCallTemplate, {
//         index: index,
//         field: field,
//         object: p.join('.'),
//         parent: parent
//       }).trim());        

//       // Increment the index
//       options.index++;
//     }
//   } else if(ast instanceof DocumentType) {
//     // console.log("---------------------------------------- DocumentType " + path)
//     var keys = ast.keys();

//     // Iterate over the keys
//     for(var i = 0; i < keys.length; i++) {
//       var field = keys[i];
//       var value = ast.value(field);
//       // Take a copy of the path
//       var p = path.slice(0);
//       p.push(field);

//       //
//       // Co-ordinate the indexes of rules with the
//       // number of validation methods generated
//       if(value.exists) rules.push(value);
//       if(value.type) rules.push(value);
//       if(value.of) rules.push(value);

//       // If the rule specifies that the field must exist
//       if(value.exists) {
//         var existsTemplateFunction = `
//           var exists_validation{{index}} = function(field, object, parent, rule, context, errors) {
//             if(object == null && context.failOnFirst) {
//               throw new ValidationError('field does not exist', field, parent, rule, object);
//             } else if(object == null) {
//               errors.push(new ValidationError('field does not exist', field, parent, rule, object));
//             }
//           }  
//         `

//         // Get current index
//         var index = options.index;

//         // Render the template
//         functions.push(Mark.up(existsTemplateFunction, {
//           index: index
//         }));

//         if(options.isInArray) {
//           // Function call template
//           var functionCallTemplate = `
//             exists_validation{{index}}("{{field}}", object[i].{{field}}, {{parent}}, rules[{{index}}], context, errors);
//           `

//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field,
//             parent: options.nestedArray ? 'f("%s[%s]", parent, i)' : 'f("%s.%s[%s]", parent, field, i)'
//           }).trim());
//         } else {
//           // Function call template
//           var functionCallTemplate = `
//             exists_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
//           `

//           // Object
//           var p1 = ['object', p.slice(0).pop()];

//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field,
//             object: p1.join('.'),
//             parent: path.join('.')
//           }).trim());

//           // Increment the index
//           options.index++;
//         }
//       }

//       // Do we have a type we need to test if it's valid
//       if(value.type) {
//         var typeTemplateFunction = `
//           var type_validation{{index}} = function(field, object, parent, rule, context, errors) {
//             if({{validation}} && context.failOnFirst) {
//               throw new ValidationError('field does not have the correct type', field, parent, rule, object);
//             } else if({{validation}}) {
//               errors.push(new ValidationError('field does not have the correct type', field, parent, rule, object));
//             }
//           }  
//         `

//         // Get current index
//         var index = options.index;

//         if(options.isInArray) {
//           // Function call template
//           var functionCallTemplate = `
//             type_validation{{index}}("{{field}}", object[i].{{field}}, {{parent}}, rules[{{index}}], context, errors);
//           `
       
//           // Add basic null validation
//           var paths = [];

//           // Create the validation string
//           if(value.type === Number) {
//             paths.push(f('(typeof object != "number")'));
//           } else if(value.type === String) {
//             paths.push(f('(typeof object != "string")'));
//           } else if(value.type === Boolean) {
//             paths.push(f('(typeof object != "boolean")'));
//           } else if(value.type === Array) {
//             paths.push(f('!Array.isArray(object)'));
//           } else if(value.type === Object) {
//             paths.push(f('(typeof object !== "object")'));
//           }

//           // Push validation
//           functions.push(Mark.up(typeTemplateFunction, {
//             index: index,
//             validation: f('object != null && ', paths.join(' || '))
//           }));   

//           // Object
//           var p1 = ['object', p.slice(0).pop()];

//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field,
//             object: p1.join('.'),
//             parent: options.nestedArray ? 'f("%s[%s]", parent, i)' : 'f("%s.%s[%s]", parent, field, i)'
//           }).trim());
//         } else {
//           // Function call template
//           var functionCallTemplate = `
//             type_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
//           `
       
//           // Add basic null validation
//           var paths = [];

//           // Create the validation string
//           if(value.type === Number) {
//             paths.push(f('(typeof object != "number")'));
//           } else if(value.type === String) {
//             paths.push(f('(typeof object != "string")'));
//           } else if(value.type === Boolean) {
//             paths.push(f('(typeof object != "boolean")'));
//           } else if(value.type === Array) {
//             paths.push(f('!Array.isArray(object)'));
//           } else if(value.type === Object) {
//             paths.push(f('(typeof object !== "object")'));
//           }

//           // Push validation
//           functions.push(Mark.up(typeTemplateFunction, {
//             index: index,
//             validation: f('object != null && ', paths.join(' || '))
//           }));   

//           // Object
//           var p1 = ['object', p.slice(0).pop()];

//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field,
//             object: p1.join('.'),
//             parent: path.join('.'),
//           }).trim());

//           // Increment the index
//           options.index++;
//         }
//       }

//       // Do we have a validation
//       if(value.type && value.validation) {
//         var validationTemplateFunction = `
//           var validation_validation{{index}} = function(field, object, parent, rule, context, errors) {
//             if({{validation}} && context.failOnFirst) {
//               throw new ValidationError('field fails validation', field, parent, rule, object);
//             } else if({{validation}}) {
//               errors.push(new ValidationError('field fails validation', field, parent, rule, object));
//             }
//           }  
//         `

//         var validationArrayTemplateFunction = `
//           var validation_validation{{index}} = function(field, object, parent, rule, context, errors) {
//             if({{validation}} && context.failOnFirst) {
//               throw new ValidationError('field does not have the correct type', field, parent, rule, object);
//             } else if({{name}} == null) {
//               errors.push(new ValidationError('field does not have the correct type', field, parent, rule, object));
//             }
//           }  
//         `

//         // Get current index
//         var index = options.index;

//         if(options.isInArray) {
//         } else {
//           // Contains the validation string
//           var validation = '';
//           // Function call template
//           var functionCallTemplate = `
//             validation_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
//           `

//           // Add basic null validation
//           var paths = [];

//           // Get the validation
//           var validation = value.validation;

//           // Create the validation string
//           if(value.type === Number) {
//             // Parse the validation
//             for(var name in validation) {
//               // We need to parse the validation statement
//               if(name == '$gt') {
//                 paths.push(f('object <= %s', validation[name]));
//               } else if(name == '$gte') {
//                 paths.push(f('object < %s', validation[name]));
//               } else if(name == '$lte') {
//                 paths.push(f('object > %s', validation[name]));
//               } else if(name == '$lt') {
//                 paths.push(f('object >= %s', validation[name]));
//               } else if(name == '$eq') {
//                 paths.push(f('object == %s', validation[name]));
//               }
//             }
//           } else if(value.type === String || value.type === Array) {
//             // Parse the validation
//             for(var name in validation) {
//               if(name == '$gt') {
//                 paths.push(f('object.length <= %s', validation[name]));
//               } else if(name == '$gte') {
//                 paths.push(f('object.length < %s', validation[name]));
//               } else if(name == '$lte') {
//                 paths.push(f('object.length > %s', validation[name]));
//               } else if(name == '$lt') {
//                 paths.push(f('object.length >= %s', validation[name]));
//               } else if(name == '$eq') {
//                 paths.push(f('object.length == %s', validation[name]));
//               }
//             }
//           }

//           // Push the validation
//           functions.push(Mark.up(validationTemplateFunction, {
//             index: index,
//             validation: f('object != null && (%s)', paths.join(' || '))
//           }));   

//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field,
//             object: p.join('.'),
//             parent: path.join('.'),
//           }).trim());

//           // Increment the index
//           options.index++;        
//         }
//       }

//       // Generate the 
//       if(value.type === Array && value.of) {
//         var arrayTemplateFunction =`
//           var array_validation{{index}} = function(field, object, parent, rule, context, errors) {
//             if(object == null) { return; }

//             for(var i = 0; i < object.length; i++) {            
//               {{statements}}
//             }
//           }  
//         `

//         // The statements
//         var funcC = [];

//         // Get the index
//         var index = options.index;

//         // Generate options
//         var generateOptions = {
//           isInArray: true, index: index + 1
//         };

//         // Generate type validation
//         var generateArrayElementTypeValidaton = function(value, context) {
//           if(typeof value.of == 'object') {
//             return Mark.up(`if(object == null || {{validation}} && context.failOnFirst) {
//               throw new ValidationError('field does not have the correct type', f('%s[%s]', field, i), parent, rule, object);
//             } else if(object == null || {{validation}}) {            
//               errors.push(new ValidationError('field does not have the correct type', f('%s[%s]', field, i), parent, rule, object));
//             }
//           `, context);
//           }
//         }

//         // Get the validation
//         var validation = "(object[i] != null && typeof object[i] != 'object')";

//         // Do Array validation if a basic type
//         if(value.of instanceof BasicType && value.of.object.type === Array) {
//           validation = "(object[i] != null && !Array.isArray(object[i]))";
//           generateOptions.nestedArray = true;
//         }

//         // Push the entry
//         funcC.push(generateArrayElementTypeValidaton(value, {
//           validation: validation
//         }));

//         // Generate the underlying code
//         generate(value.of, p, rules, functions, funcC, generateOptions);

//         // Add the generated code to the list of functions
//         functions.push(Mark.up(arrayTemplateFunction, {
//           index: index, statements: funcC.join('\n')
//         }));       

//         // Call the actual context
//         if(options.isInArray) {
//           // Function call template
//           var functionCallTemplate = `
//             array_validation{{index}}("{{field}}", object[i].{{field}}, f("%s.%s[%s]", parent, field, i), rules[{{index}}], context, errors);
//           `

//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field
//           }).trim());
//         } else {
//           // Function call template
//           var functionCallTemplate = `
//             array_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
//           `
//           // Create a function call context
//           functionCallContexts.push(Mark.up(functionCallTemplate, {
//             index: index,
//             field: field,
//             object: p.join('.'),
//             parent: path.join('.')
//           }).trim());        
//         }

//         // Increment the index
//         options.index++;
//       } else if(value.type === Object && value.of) {
//         var arrayTemplateFunction =`
//           var object_validation{{index}} = function(field, object, parent, rule, context, errors) {
//             if(object == null) { return; }
//             {{statements}}
//           }  
//         `

//         // The statements
//         var funcC = [];

//         // Get the index
//         var index = options.index;

//         // Generate options
//         var generateOptions = {
//           isInArray: false, index: index + 1
//         };

//         // Generate the underlying code
//         generate(value.of, p, rules, functions, funcC, generateOptions);

//         // Add the generated code to the list of functions
//         functions.push(Mark.up(arrayTemplateFunction, {
//           index: index, statements: funcC.join('\n')
//         }));       

//         // Function call template
//         var functionCallTemplate = `
//           object_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
//         `
//         // Create a function call context
//         functionCallContexts.push(Mark.up(functionCallTemplate, {
//           index: index,
//           field: field,
//           object: p.join('.'),
//           parent: path.join('.')
//         }).trim());        

//         // Increment the index
//         options.index++;
//       }
//     }  
//   }
// }

module.exports = Compiler;
