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
  AST = require('./ast');

var ValidationError = function(message, field, parent, rule, object) {
  this.message = message;
  this.field = field;
  this.parent = parent;
  this.rule = rule;
  this.object = object;
}

var Compiler = function(options) {

}

Compiler.prototype.compile = function(ast, options) {
  options = options || {};
  options = Utils.clone(options);
  // The functions we have generated
  var path = ['object'];
  var functions = [];
  var functionCallContexts = [];
  // Contains the rules
  var rules = [];
  // Set the index
  options.index = 0
  // Generate the code
  generate(ast, path, rules, functions, functionCallContexts, options);
  // // Show the source
  // var source = functions.map(function(x) {
  //   return x;
  // });

  // var calls = functionCallContexts.map(function(x) {
  //   return x;
  // });

  // Create function source
  // var source = functions.join('\n') + functionCallContexts.join('\n');  
  // Wrap in validation method
  var syncTemplate = `
    %s

    var validate = function(object, context) {
      context = context || {};
      var errors = [];
      %s

      return errors;
    };

    func = validate;
  `

  // Create the sync code
  source = f(syncTemplate, functions.join('\n'), functionCallContexts.join('\n'));
  // Format source
  source = jsfmt.format(source);

  console.log("-------------------------------------------------- START")
  console.log(source)
  console.log("-------------------------------------------------- END")

  // Variables used in the eval
  var func = null;

  // Compile the function
  eval(source)

  // Return the validation function
  return {
    validate: func
  }
}

var generate = function(ast, path, rules, functions, functionCallContexts, options) {
  // console.log("-------------------------- generate")
  options = options || {};
  var self = this;
  var keys = ast.keys();

  // Iterate over the keys
  for(var i = 0; i < keys.length; i++) {
    var field = keys[i];
    var value = ast.value(field);
    // Take a copy of the path
    var p = path.slice(0);
    p.push(field);
    // Push the rule
    rules.push(value);

    if(value.exists) {
      var existsTemplateFunction = `
        var exists_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if(object == null && context.failOnFirst) {
            throw new ValidationError('field does not exist', field, parent, rule, object);
          } else if(object == null) {
            errors.push(new ValidationError('field does not exist', field, parent, rule, object));
          }
        }  
      `

      var existsArrayTemplateFunction = `
        var exists_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if({{name}} == null && context.failOnFirst) {
            throw new ValidationError('field does not exist', field, parent, rule, object);
          } else if({{name}} == null) {
            errors.push(new ValidationError('field does not exist', field, parent, rule, object));
          }
        }  
      `
      
      // Get current index
      var index = options.index;

      if(options.isInArray) {
        functions.push(Mark.up(existsArrayTemplateFunction, {
          index: index, name: f('object.%s', field)
        }));

        // Function call template
        var functionCallTemplate = `
          exists_validation{{index}}("{{field}}", object[i], f("%s.%s[%s]", parent, field, i), rules[{{index}}], context, errors);
        `

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field
        }).trim());

        // Increment the index
        options.index++;
      } else {
        // console.log("-------------------------- generate exists")
        functions.push(Mark.up(existsTemplateFunction, {
          index: index
        }));   

        // Function call template
        var functionCallTemplate = `
          exists_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
        `

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p.join('.'),
          parent: path.join('.')
        }).trim());

        // Increment the index
        options.index++;
      }
    }

    // Do we have a type we need to test if it's valid
    if(value.type) {
      var typeTemplateFunction = `
        var type_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if({{validation}} && context.failOnFirst) {
            throw new ValidationError('field does not have the correct type', field, parent, rule, object);
          } else if({{validation}}) {
            errors.push(new ValidationError('field does not have the correct type', field, parent, rule, object));
          }
        }  
      `

      var typeArrayTemplateFunction = `
        var type_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if({{validation}} && context.failOnFirst) {
            throw new ValidationError('field does not have the correct type', field, parent, rule, object);
          } else if({{name}} == null) {
            errors.push(new ValidationError('field does not have the correct type', field, parent, rule, object));
          }
        }  
      `

      // Get current index
      var index = options.index;

      if(options.isInArray) {
        // functions.push(Mark.up(existsArrayTemplateFunction, {
        //   index: index, name: f('object.%s', field)
        // }));

        // // Function call template
        // var functionCallTemplate = `
        //   func{{index}}("{{field}}", object[i], f("%s.%s[%s]", parent, field, i), rules[{{index}}], context, errors);
        // `

        // // Create a function call context
        // functionCallContexts.push(Mark.up(functionCallTemplate, {
        //   index: index,
        //   field: field
        // }).trim());

        // // Increment the index
        // options.index++;
      } else {
        // Contains the validation string
        var validation = '';
        // Function call template
        var functionCallTemplate = `
          type_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
        `
     
        // Add basic null validation
        var paths = [];

        // Create the validation string
        if(value.type === Number) {
          paths.push(f('(typeof object != "number")'));
        } else if(value.type === String) {
          paths.push(f('(typeof object != "string")'));
        } else if(value.type === Boolean) {
          paths.push(f('(typeof object != "boolean")'));
        } else if(value.type === Array) {
          paths.push(f('!Array.isArray(object)'));
        }

        // console.log("-------------------------- generate exists")
        functions.push(Mark.up(typeTemplateFunction, {
          index: index,
          validation: f('object != null && ', paths.join(' || '))
        }));   

        // console.log("----------------------------------------------")
        // console.dir(paths)
        // process.exit(0)

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p.join('.'),
          parent: path.join('.'),
        }).trim());

        // Increment the index
        options.index++;
      }
    }

    // Do we have a validation
    if(value.type && value.validation) {
      var validationTemplateFunction = `
        var validation_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if({{validation}} && context.failOnFirst) {
            throw new ValidationError('field fails validation', field, parent, rule, object);
          } else if({{validation}}) {
            errors.push(new ValidationError('field fails validation', field, parent, rule, object));
          }
        }  
      `

      var validationArrayTemplateFunction = `
        var validation_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if({{validation}} && context.failOnFirst) {
            throw new ValidationError('field does not have the correct type', field, parent, rule, object);
          } else if({{name}} == null) {
            errors.push(new ValidationError('field does not have the correct type', field, parent, rule, object));
          }
        }  
      `

      // Get current index
      var index = options.index;

      if(options.isInArray) {

      } else {
        // Contains the validation string
        var validation = '';
        // Function call template
        var functionCallTemplate = `
          validation_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
        `

        // // Generate validation
        // var currentPath = [];
        // var paths = [];
        // // Full path
        // var fullPath = path.slice(0);
        // fullPath.push(field);

        // // Generate the paths
        // fullPath.forEach(function(x) {
        //   currentPath.push(x);
        //   paths.push(f('%s != null', currentPath.join('.')))
        // });

        // Add basic null validation
        var paths = [];

        // Get the validation
        var validation = value.validation;

        // Create the validation string
        if(value.type === Number) {
          // Parse the validation
          for(var name in validation) {
            // We need to parse the validation statement
            if(name == '$gt') {
              paths.push(f('object <= %s', validation[name]));
            } else if(name == '$gte') {
              paths.push(f('object < %s', validation[name]));
            } else if(name == '$lte') {
              paths.push(f('object > %s', validation[name]));
            } else if(name == '$lt') {
              paths.push(f('object >= %s', validation[name]));
            } else if(name == '$eq') {
              paths.push(f('object == %s', validation[name]));
            }
          }
        } else if(value.type === String || value.type === Array) {
          // Parse the validation
          for(var name in validation) {
            if(name == '$gt') {
              paths.push(f('object.length <= %s', validation[name]));
            } else if(name == '$gte') {
              paths.push(f('object.length < %s', validation[name]));
            } else if(name == '$lte') {
              paths.push(f('object.length > %s', validation[name]));
            } else if(name == '$lt') {
              paths.push(f('object.length >= %s', validation[name]));
            } else if(name == '$eq') {
              paths.push(f('object.length == %s', validation[name]));
            }
          }
        }

        console.log("=========================================================")
        console.dir(paths)

        // console.log("-------------------------- generate exists")
        functions.push(Mark.up(validationTemplateFunction, {
          index: index,
          validation: f('object != null && (%s)', paths.join(' || '))
        }));   

        // console.log("----------------------------------------------")
        // console.dir(paths)
        // process.exit(0)

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p.join('.'),
          parent: path.join('.'),
        }).trim());

        // Increment the index
        options.index++;        
      }
    }

    // Generate the 
    if(value.type === Array && value.of) {
      var arrayTemplateFunction =`
        var array_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if(object == null) { return; }

          for(var i = 0; i < object.length; i++) {
            {{statements}}
          }
        }  
      `

      // console.log("-------------------------- generate array of")
      var funcC = [];

      // Get the index
      var index = options.index;

      // Generate options
      var generateOptions = {
        isInArray: true, index: index + 1
      };

      // Generate the underlying code
      generate(value.of, p, rules, functions, funcC, generateOptions);

      // Add the generated code to the list of functions
      functions.push(Mark.up(arrayTemplateFunction, {
        index: index, statements: funcC.join('\n')
      }));       

      // Call the actual context
      if(options.isInArray) {
        // // TotalPath
        // var totalPath = p.join('.');
        // // Add to call contexts
        // functionCallContexts.push(f('func%s("%s", object[i], %s, rules[%s], context, errors);', index, field, '""', rules.length - 1));
        // Function call template
        var functionCallTemplate = `
          array_validation{{index}}("{{field}}", object[i].{{field}}, f("%s.%s[%s]", parent, field, i), rules[{{index}}], context, errors);
        `

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field
        }).trim());

      } else {
        // Function call template
        var functionCallTemplate = `
          array_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
        `
        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p.join('.'),
          parent: path.join('.')
        }).trim());        
      }

      // Increment the index
      options.index++;
    }


    // console.log(field)
  }  
}



// var Compiler = function(options) {
//   options = options || {};
//   this.options = options;
//   // this.failOnFirst = (typeof options.failOnFirst == 'boolean') ? options.failOnFirst | false;
// }

// Compiler.prototype.compile = function(ast) {
//   // The rules
//   var rules = [];
//   var path = ['object'];
//   // Set the options
//   this.options.depth = 0;
//   this.options.parent = 'object';
//   // Get the structure
//   var nodes = parseSchema(path, ast, rules, this.options);
//   // console.log("####################################################### 0")
//   // console.dir(nodes)

//   // console.log("####################################################### 1")
//   // To source on all the code
//   var sources = nodes.map(function(x) {
//     return x.toSource();
//   });

//   var syncTemplate = `
//     var validate = function(object, context) {
//       context = context || {};
//       var errors = [];
//       %s

//       return errors;
//     };

//     func = validate;
//   `

//   // Create the sync code
//   var source = f(syncTemplate, sources.join('\n\n'));
//   source = jsfmt.rewrite(source);
//   source = jsfmt.format(source);


//   // // Compile the validation
//   // var functionString = parseSchema(ast, nodes, this.options);
//   console.log("####################################################### 1")
//   console.log(source)

//   // Variables used in the eval
//   var func = null;

//   // Compile the function
//   eval(source)

//   // Return the validation function
//   return {
//     validate: func
//   }
// }

// var Exists = function(path, key, rule, rules, options) {
//   this.path = path;
//   this.key = key;
//   this.rule = rule;
//   this.rules = rules;
//   this.options = Utils.clone(options);
// }

// Exists.prototype.toSource = function(options) {
//   options = options || {};
//   return '';
// }

// var Type = function(path, field, rule, rules, options) {
//   this.path = path;
//   this.field = field;
//   this.rule = rule;
//   this.rules = rules;
//   this.options = Utils.clone(options);
// }

// Type.prototype.toSource = function(options) {
//   options = options || {};
//   // Do we have an array
//   var isArray = typeof options.isArray == 'boolean' ? options.isArray : false;

//   // Field
//   var parent = options.path || this.options.parent;

//   // Default template
//   var template = `
//     if(%s && context.failOnFirst) {
//       throw new ValidationError(%s,
//         %s,
//         rules[%s],
//         %s);
//     } else if(%s) {
//       errors.push(new ValidationError(%s,
//         %s,
//         rules[%s],
//         %s));
//     }`

//   // Array rendering template
//   var arrayTemplate = `
//     if(%s && context.failOnFirst) {
//       throw new ValidationError(%s,
//         %s,
//         rules[%s],
//         %s);
//     } else if(%s) {
//       errors.push(new ValidationError(%s,
//         %s,
//         rules[%s],
//         %s));
//     }`

//   // Push the rules
//   this.rules.push(this.rule);
//   // Get the index
//   var index = this.rules.length - 1;

//   // Basic sourc
//   var source = ''
//   // Do we have an array
//   if(isArray) {
//     var variableName = options.variableName || 'i';

//     source = f(arrayTemplate,
//       // Top part of template
//       f('%s[%s].%s', parent, variableName, this.field),
//       f("f('%s[%s].%s is not of type %s', i)", parent, '%s', this.field, this.rule.type.name),
//       f("f('%s[%s].%s', %s)", parent, '%s', this.field, variableName),
//       index,
//       f('%s[%s].%s', parent, variableName, this.field),
//       // Bottom part of template
//       f('%s[%s].%s', parent, variableName, this.field),
//       f("f('%s[%s].%s is not of type %s', %s)", parent, '%s', this.field, this.rule.type.name, variableName),
//       f("f('%s[%s].%s', %s)", parent, '%s', this.field, variableName),
//       index,
//       f('%s[%s].%s', parent, variableName, this.field)
//     )
//   } else {
//     // Path validation
//     var pathValidation = Utils.generatePathValidation(f('%s.%s', parent, this.field));

//     source = f(template,
//       // Top part
//       pathValidation.join(' && '),
//       f("'%s.%s is not of type %s'", parent, this.field, this.rule.type.name),
//       f('"%s.%s"', parent, this.field),
//       index,
//       f('%s.%s', parent, this.field),
//       // Bottom part
//       pathValidation.join(' && '),
//       f("'%s.%s is not of type %s'", parent, this.field, this.rule.type.name),
//       f('"%s.%s"', parent, this.field),
//       index,
//       f('%s.%s', parent, this.field)
//     )
//   }

//   // Set the depth
//   this.options.depth = this.options.depth + 2;

//   // Indent code correctly
//   return source;
// }

// var ArrayOf = function(path, field, rule, rules, options) {
//   this.path = path;
//   this.field = field;
//   this.rule = rule;
//   this.rules = rules;
//   this.options = Utils.clone(options);
// }

// ArrayOf.prototype.resolve = function() {
//   this.nodes = [];
//   // Parse the schema
//   this.nodes = parseSchema(this.path, this.rule.of, this.rules, this.options);
//   return this;
// }

// ArrayOf.prototype.toSource = function(options) {
//   var self = this;
//   options = options || {};
//   // Final rendering template
//   var template = `
//     if(%s) {
//       for(var i%s = 0; i%s < %s.length; i%s++) {
//         %s
//       }
//     }
//   `

//   // Parent field
//   var path = f('%s.%s', this.options.parent, this.field);
//   // Overwrite the path
//   if(options.isArray) {
//     path = f('%s.%s[%s]', options.path, this.field, options.variableName);
//   }

//   console.log("-----------------------------------------------")
//   console.dir(this.path)

//   var generateArrayPathValidation = function(_path, _variableName) {
//     var validations = [];
//     var currentPath = [];

//     for(var i = 0; i < _path.length - 1; i++) {
//       currentPath.push(_path[i]);
//       validations.push(f('%s != null', currentPath.join('.')));
//     }

//     console.log("=")

//     return validations;
//   }

//   // Get the loop variable name
//   var variableName = self.rules.length - 1;

//   // Generate the validations
//   var pathValidation = generateArrayPathValidation(this.path, variableName);

//   // // Path validation
//   // var pathValidation = Utils.generatePathValidation(path);

//   // We need to parse iterate over all the node entries
//   var statements = this.nodes.map(function(x) {
//     return x.toSource({isArray:true, path: path, variableName: f('i%s', variableName)})
//   });

//   // Generate the code
//   var source = f(template,
//     pathValidation.join(' && '),
//     variableName, variableName,
//     path,
//     variableName,
//     statements.join('\n')
//   );

//   // Set the depth
//   this.options.depth = this.options.depth + 2;

//   // Indent code correctly
//   return source;
// }

// // var ArrayOfBasicType = function(path, field, rule, rules, options) {
// //   this.path = path;
// //   this.field = field;
// //   this.rule = rule;
// //   this.rules = rules;
// //   this.options = Utils.clone(options);
// // }

// // ArrayOfBasicType.prototype.toSource = function(options) {
// //   options = options || {};
// //   // Final rendering template
// //   var template = `
// //     if(%s) {
// //       for(var i%s = 0; i%s < %s.length; i%s++) {
// //         %s
// //       }
// //     }
// //   `

// //   // Parent field
// //   var path = f('%s.%s', options.path || this.options.parent, this.field);
// //   if(options.variableName) {
// //     path = f('%s.%s[%s]', options.path || this.options.parent, this.field, options.variableName);
// //   }

// //   // // Path validation
// //   // var pathValidation = Utils.generatePathValidation(path);

// //   // Get the loop variable name
// //   var variableName = this.rules.length - 1;

// //   var generateArrayPathValidation = function(_path, _variableName) {
// //     var validations = [];
// //     var currentPath = [];

// //     for(var i = 0; i < _path.length; i++) {
// //       currentPath.push(_path[i]);
// //       validations.push(f('%s != null', currentPath.join('.')));
// //     }

// //     console.log("=")

// //     return validations;
// //   }

// //   // Generate the validations
// //   var pathValidation = generateArrayPathValidation(this.path, variableName);

// //   // Clone options
// //   // var opts =

// //   // Create a type validation
// //   var type = new Type(this.path, this.field, this.rule, this.rules, this.options);

// //   // // We need to parse iterate over all the node entries
// //   // var statements = this.nodes.map(function(x) {
// //   //   return x.toSource({isArray:true, path: path})
// //   // });

// //   console.log("------------------------------------------------------------------------------- " + path)
// //   console.dir(this.options)
// //   console.dir(options)

// //   // Generate the code
// //   var source = f(template,
// //     pathValidation.join(' && '),
// //     variableName, variableName,
// //     path,
// //     variableName,
// //     type.toSource()
// //   );

// //   // Set the depth
// //   this.options.depth = this.options.depth + 2;

// //   // Indent code correctly
// //   return source;
// // }

// var parseSchema = function(path, ast, rules, options) {
//   options = Utils.clone(options);
//   // Throw an error due to the schema not being an AST
//   if(!(ast instanceof AST)) throw new Error('schema not an instance of AST');
//   // Set up the nodes we are going to use
//   var nodes = [];

//   // Explore entire schema for async method (will require additional code to be generated)
//   var keys = ast.keys();

//   // Iterate over all the keys
//   for(var i = 0; i < keys.length; i++) {
//     // Get the field and rule
//     var field = keys[i];
//     var rule = ast.value(keys[i]);
//     // Copy the path
//     var p = path.slice(0);
//     // Push the field to the path
//     p.push(field);

//     // Add an exists node
//     if(rule.exists) {
//       nodes.push(new Exists(p, field, rule, rules, options));
//     }

//     // Add a type node
//     if(rule.type) {
//       nodes.push(new Type(p, field, rule, rules, options));
//     }

//     // Add an of node
//     if(rule.type === Array && rule.of instanceof AST) {
//       nodes.push(new ArrayOf(p, field, rule, rules, options).resolve());
//     // } else if(rule.type === Array && rule.with) {
//     //   nodes.push(new ArrayOfBasicType(field, rule, rules, options));
//     }
//   }

//   return nodes;
// }

// // // Create the statement
// // var compileSchema = function(schema, rules, result, options) {
// //   options = Utils.clone(options);
// //   // Throw an error due to the schema not being an AST
// //   if(!(schema instanceof AST)) throw new Error('schema not an instance of AST');
// //   // Explore entire schema for async method (will require additional code to be generated)
// //   var keys = schema.keys();
// //   // Iterate over all the keys
// //   for(var i = 0; i < keys.length; i++) {
// //     // Get the field and rule
// //     var field = keys[i];
// //     var rule = schema.value(keys[i]);
// //     // Add rule to rule object
// //     rules.push(rule);
// //
// //     // If no type is specified throw an error
// //     if(rule.type == null) {
// //       throw new Error('a validation rule must specify a type');
// //     }
// //
// //     // Value must exist
// //     if(rule.exists === true) {
// //       result.sync.push(createExistsValidation(field, rule, options));
// //     }
// //
// //     // We have an async function
// //     if(typeof rule.customAsync == 'function') {
// //       async = true;
// //     } else {
// //
// //       // Generate code depending on the content
// //       if(rule.type === Number) {
// //         result.sync.push(createNativeTypeValidation(field, rule, '!(typeof %s == "number")', options));
// //         // If we have a validation specification let's generate it
// //         if(rule.validation) {
// //           result.sync.push(NumericValidator.validator(field, rule, options));
// //         }
// //       } else if(rule.type === String) {
// //         result.sync.push(createNativeTypeValidation(field, rule, '!(typeof %s == "string")', options));
// //         // If we have a validation specification let's generate it
// //         if(rule.validation) {
// //           result.sync.push(StringValidator.validator(field, rule, options));
// //         }
// //       } else if(rule.type === Boolean) {
// //         result.sync.push(createNativeTypeValidation(field, rule, '!(typeof %s == "boolean")', options));
// //       } else if(rule.type === Array) {
// //         result.sync.push(createNativeTypeValidation(field, rule, '!Array.isArray(%s)', options));
// //
// //         // If we have a validation specification let's generate it
// //         if(rule.validation) {
// //           result.sync.push(ArrayValidator.validator(field, rule, options));
// //         }
// //
// //         // Do we have array object type specification
// //         if(rule.of) {
// //           var opts = Utils.clone(options);
// //           // Add the validation code for the array type
// //           result.sync.push(ArrayValidator.of(compileSchema, rules, field, rule, opts));
// //         }
// //       }
// //
// //       // We have one or more custom validator applied
// //     }
// //
// //     // Update option index
// //     options.index = options.index + 1;
// //   }
// // }
// //
// // // The compile step
// // var compile = function(schema, rules, options) {
// //   // Result object
// //   var result = {
// //     sync: [],
// //     async: []
// //   };
// //
// //   // Set the options async
// //   options.async = false;
// //
// //   // Compile the schema
// //   compileSchema(schema, rules, result, options);
// //
// //   // Create the sync code
// //   var syncCode = f(syncTemplate, result.sync.join('\n\n'));
// //
// //   // Return final function
// //   return syncCode;
// // }
// //
// // var syncTemplate = `
// //   var validate = function(object, context) {
// //     context = context || {};
// //     var errors = [];
// //     %s
// //
// //     return errors;
// //   };
// //
// //   func = validate;
// // `
// //
// // //
// // // Exists handler
// // //
// // var createExistsValidation = function(field, rule, options) {
// //   var template = `
// //     if(%s && context.failOnFirst) {
// //       throw new ValidationError("%s", rules[%s]);
// //     } else if(%s) {
// //       errors.push(new ValidationError("%s", rules[%s]));
// //     }`
// //
// //   // Get the index
// //   var index = options.index;
// //   // Do we have a parent namespace for this validation
// //   var parent = options.parent;
// //
// //   // Object name
// //   var fieldName = parent
// //     ? f('object.%s.%s', parent, field)
// //     : f('object.%s' , field);
// //
// //   // Get the validation chain
// //   var validations = Utils.generatePathNotExistValidation(fieldName);
// //
// //   // Error message
// //   var message = f('field %s fails validation', fieldName);
// //   // // Did we set a field name rendered
// //   // if(options.fieldNameRender) {
// //   //   message = options.fieldNameRender('field %s.%s fails validation');
// //   //   message = f(message, '%s', field);
// //   // }
// //
// //   // Generate the validation
// //   var source = f(template,
// //     validations.join(' || '),
// //     message,
// //     index,
// //     validations.join(' || '),
// //     message,
// //     index);
// //
// //   // log the generated code
// //   if(options.logger) {
// //     options.logger.info(f('[INFO] generated exists code for %s: %s', fieldName, source));
// //   }
// //
// //   // Indent the source
// //   source = Utils.indent(source, options);
// //
// //   // Return the source
// //   return source;
// // }
// //
// // //
// // // Number handler
// // //
// // var createNativeTypeValidation = function(field, rule, validationTemplate, options) {
// //   var template = `
// //     if(%s && context.failOnFirst) {
// //       throw new ValidationError(%s, rules[%s], %s);
// //     } else if(%s) {
// //       errors.push(new ValidationError(%s, rules[%s], %s));
// //     }`
// //
// //   // Get the index
// //   var index = options.index;
// //   // Do we have a parent namespace for this validation
// //   var parent = options.parent;
// //
// //   // Object name
// //   var fieldName = parent
// //     ? f('object.%s.%s', parent, field)
// //     : f('object.%s' , field);
// //
// //   // Get the validation chain
// //   var validations = Utils.generatePathValidation(fieldName);
// //
// //   // Push the last validation
// //   validations.push(f(validationTemplate, fieldName));
// //
// //   // Error message
// //   var message = f('"field %s fails type validation"', fieldName);
// //   // // Did we set a field name rendered
// //   // if(options.fieldNameRender) {
// //   //   message = options.fieldNameRender('"field %s fails type validation"');
// //   //   message = f(message, '%s', field);
// //   // }
// //
// //   // Generate the validation
// //   var source = f(template,
// //     validations.join(' && '),
// //     message,
// //     index,
// //     fieldName,
// //     validations.join(' && '),
// //     message,
// //     index,
// //     fieldName
// //   );
// //
// //   // log the generated code
// //   if(options.logger) {
// //     options.logger.info(f('[INFO] generated number type validation code for %s: %s', fieldName, source));
// //   }
// //
// //   // Indent the source
// //   source = Utils.indent(source, options);
// //
// //   // Return the source
// //   return source;
// // }

// // class Compiler {
// //   compile(schema, options) {
// //     // Compile the validation
// //     var functionString = compile(schema, options);
// //     console.log("#######################################################")
// //     console.log(functionString)
// //
// //     // Variables used in the eval
// //     var func = null;
// //     var rules = schema.rules;
// //     // Compile the function
// //     eval(functionString)
// //     // Return the validation function
// //     return {
// //       validate: func
// //     }
// //   }
// // }
// //
// // class ValidationError {
// //   constructor(message, rule) {
// //     this.message = message;
// //     this.rule = rule;
// //   }
// // }
// //
// // class CustomValidationError {
// //   constructor(message, rule, errors) {
// //     this.message = message;
// //     this.rule = rule;
// //     this.errors = errors;
// //   }
// // }
// //
// // // Compile the schema into a text string
// // var compile = function(schema, options) {
// //   options = options || {};
// //   // Error on first
// //   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
// //   // All validation string statements
// //   var statements = [];
// //
// //   // for(let rule of schema.rules) {
// //   for(var i = 0; i < schema.rules.length; i++) {
// //     var rule = schema.rules[i];
// //
// //     // Create the statement for exists
// //     if(rule.exists) {
// //       statements.push(createExistsValidation(rule, i, options));
// //     }
// //
// //     // If we have a type specificed validate it
// //     if(rule.type) {
// //       statements.push(createTypeValidation(rule, i, options));
// //     }
// //
// //     // Basic type validations
// //     if(rule.validation) {
// //       statements.push(createBasicValidation(rule, i, options));
// //     }
// //
// //     // Custom type validations
// //     if(rule.type != null
// //       && typeof rule.type == 'object'
// //       && typeof rule.type.validate == 'function') {
// //         statements.push(createCustomValidation(rule, i, options));
// //     }
// //   }
// //
// //   // Return the code
// //   return f(validationFunction, statements.join('\n'));
// // }
// //
// // var validationFunction = `
// //   var validate = function(object) {
// //     var errors = [];
// //     %s
// //
// //     return errors;
// //   };
// //
// //   func = validate;
// // `
// //
// // //
// // // Custom type validation generator
// // //
// // var createCustomValidation = function(rule, i, options) {
// //   options = options || {};
// //
// //   // Error on first
// //   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
// //
// //   // Turn custom validation into a string
// //   var code = rule.type.validate.toString();
// //
// //   // Lets create the validator name
// //   var paths = rule.path.split('.');
// //   paths.shift();
// //   paths.push(i);
// //   var name = paths.join('');
// //
// //   // Create the statement for exists
// //   return f(customValidation
// //     , name, code
// //     , name, rule.path
// //     , !errorOnFirst
// //     , rule.path, i
// //     , rule.path, i);
// // }
// //
// // var customValidation = `
// //     // Name the custom validator function
// //     var custom%sValidator = %s;
// //
// //     // Execute the validation
// //     var result = custom%sValidator(object%s);
// //     result = Array.isArray(result) ? result :
// //       (result != null ? [result] : []);
// //
// //     // We have an error and want to abort on the first failed validation
// //     if(result.length > 0 && %s) {
// //       errors.push(new CustomValidationError('field %s fails custom validation', rules[%s], result));
// //     } else if(result.length > 0) {
// //       throw new CustomValidationError('field %s fails custom validation', rules[%s], result);
// //     }`
// //
// // //
// // // Basic type validation language generator
// // //
// // var createBasicValidation = function(rule, i, options) {
// //   options = options || {};
// //
// //   // Error on first
// //   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
// //
// //   // Ensure only supported types are used
// //   if(rule.type === Number
// //     || rule.type === String
// //     || rule.type === Boolean) {
// //
// //     // Statements compiled into final validation
// //     var statements = [];
// //     var validation = rule.validation;
// //
// //     // Valid operators for a numeric value
// //     if(rule.type !== Number &&
// //       illegalOperations(['$gt', '$gte', '$lt', '$lte'], validation)) {
// //         throw new Error('compiler does not support $gt, $gte, $lt, $lte for non numeric types');
// //     }
// //
// //     for(var name in validation) {
// //       // We need to parse the validation statement
// //       if(name == '$gt') {
// //         statements.push(f('object%s > %s', rule.path, validation[name]));
// //       } else if(name == '$gte') {
// //         statements.push(f('object%s >= %s', rule.path, validation[name]));
// //       } else if(name == '$lte') {
// //         statements.push(f('object%s <= %s', rule.path, validation[name]));
// //       } else if(name == '$lt') {
// //         statements.push(f('object%s < %s', rule.path, validation[name]));
// //       } else if(name == '$eq') {
// //         statements.push(f('object%s == %s', rule.path, validation[name]));
// //       }
// //     }
// //
// //     // Create the statement for exists
// //     return f(basicValidation
// //       , f('!(%s)', statements.join(' && '))
// //       , !errorOnFirst
// //       , rule.path
// //       , i
// //       , f('!(%s)', statements.join(' && '))
// //       , rule.path
// //       , i);
// //   } else {
// //     throw new Error('compiler only supports validation expressions for basic types');
// //   }
// // }
// //
// // var basicValidation = `
// //     if(%s && %s) {
// //       errors.push(new ValidationError('field %s fails validation', rules[%s]));
// //     } else if(%s) {
// //       throw new ValidationError('field %s fails validation', rules[%s]);
// //     }`
// //
// // // Must not contain these types
// // var illegalOperations = function(illegalOps, validation) {
// //   for(var name in validation) {
// //     if(illegalOps.indexOf(name) != -1) return true;
// //   }
// //
// //   return false;
// // }
// //
// // //
// // // Type validation generator
// // //
// // var createTypeValidation = function(rule, i, context, options) {
// //   options = options || {};
// //   // Error on first
// //   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
// //
// //   // Split up the path
// //   var paths = rule.path.split('.');
// //   paths.shift();
// //
// //   // Get the type
// //   var type = rule.type;
// //
// //   // Add the type to the context under the path
// //   context[i] = {'type': type};
// //
// //   // Statements
// //   var exists = [];
// //   var currentPath = [];
// //
// //   // Exercise the path
// //   for(let field of paths) {
// //     currentPath.push(field);
// //     exists.push(f('object.%s != null', currentPath.join('.')));
// //   }
// //
// //   // Add type the check
// //   if(type.name == 'Number') {
// //     exists.push(f('!(object.%s.constructor.name == "Number")', currentPath.join('.')));
// //   } else {
// //     exists.push(f('!(context[%s].type.prototype.isPrototypeOf(object.%s))', i, currentPath.join('.')));
// //   }
// //
// //   // Create the statement for exists
// //   return f(typeValidation
// //     , exists.join(' && ')
// //     , !errorOnFirst
// //     , rule.path
// //     , type
// //     , i
// //     , exists.join(' && ')
// //     , rule.path
// //     , type
// //     , i);
// // }
// //
// // var typeValidation = `
// //     if(%s && %s) {
// //       errors.push(new ValidationError('field %s is not of expected type %s', rules[%s]));
// //     } else if(%s) {
// //       throw new ValidationError('field %s is not of expected type %s', rules[%s]);
// //     }`
// //
// // // var typeValidation = `
// // //     function(object, context, callback) {
// // //       if(%s) {
// // //         return callback(new ValidationError('field %s is not of expected type %s', rules[%s]));
// // //       }
// // //
// // //       callback();
// // //     }`
// //
// // //
// // // Exists validation generator
// // //
// // var createExistsValidation = function(rule, i, options) {
// //   options = options || {};
// //   // Error on first
// //   var errorOnFirst = typeof options.errorOnFirst == 'boolean' ? options.errorOnFirst : false;
// //
// //   // Split up the path
// //   var paths = rule.path.split('.');
// //   paths.shift();
// //
// //   // Statements
// //   var exists = [];
// //   var currentPath = [];
// //
// //   // Exercise the path
// //   for(let field of paths) {
// //     currentPath.push(field);
// //     exists.push(f('object.%s == null', currentPath.join('.')));
// //   }
// //
// //   // Create the statement for exists
// //   return f(existsValidation
// //     , exists.join(' && ')
// //     , !errorOnFirst
// //     , rule.path
// //     , i
// //     , exists.join(' && ')
// //     , rule.path
// //     , i);
// // }
// //
// // var existsValidation = `
// //     if(%s && %s) {
// //       errors.push(new ValidationError('field %s does not exist', rules[%s]));
// //     } else if(%s) {
// //       throw new ValidationError('field %s does not exist', rules[%s]);
// //     }`

module.exports = Compiler;
