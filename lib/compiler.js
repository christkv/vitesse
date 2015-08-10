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

var ValidationError = function(message, field, parent, rule, value) {
  this.message = message;
  this.field = field;
  this.parent = parent;
  this.rule = rule;
  this.value = value;
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
    var validate = function(object, context) {
      context = context || {};
      var errors = [];
      
      %s
  
      %s

      return errors;
    };

    func = validate;
  `

  // Create the sync code
  source = f(syncTemplate, functions.join('\n'), functionCallContexts.join('\n'));

  // console.log("-------------------------------------------------- START")
  // console.log(source)
  // console.log("-------------------------------------------------- END")

  // Format source
  source = jsfmt.format(source);
  source = source.replace(/\n\n/g, "\n");

  // If we have defined debug output the source
  if(options.debug) {
    console.log(source);
  }

  // console.log("-------------------------------------------------- START")
  // console.log(source)
  // console.log("-------------------------------------------------- END")

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

    //
    // Co-ordinate the indexes of rules with the
    // number of validation methods generated
    if(value.exists) rules.push(value);
    if(value.type) rules.push(value);
    if(value.of) rules.push(value);

    // If the rule specifies that the field must exist
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

      // Get current index
      var index = options.index;

      // Render the template
      functions.push(Mark.up(existsTemplateFunction, {
        index: index
      }));

      if(options.isInArray) {
        // Function call template
        var functionCallTemplate = `
          exists_validation{{index}}("{{field}}", object[i].{{field}}, f("%s.%s[%s]", parent, field, i), rules[{{index}}], context, errors);
        `

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field
        }).trim());
      } else {
        // Function call template
        var functionCallTemplate = `
          exists_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
        `

        // Object
        var p1 = ['object', p.slice(0).pop()];

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p1.join('.'),
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

      // Get current index
      var index = options.index;

      if(options.isInArray) {
        // Function call template
        var functionCallTemplate = `
          type_validation{{index}}("{{field}}", object[i].{{field}}, f("%s.%s[%s]", parent, field, i), rules[{{index}}], context, errors);
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
        } else if(value.type === Object) {
          paths.push(f('(typeof object !== "object")'));
        }

        // Push validation
        functions.push(Mark.up(typeTemplateFunction, {
          index: index,
          validation: f('object != null && ', paths.join(' || '))
        }));   

        // Object
        var p1 = ['object', p.slice(0).pop()];

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p1.join('.'),
          parent: path.join('.'),
        }).trim());
      } else {
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
        } else if(value.type === Object) {
          paths.push(f('(typeof object !== "object")'));
        }

        // Push validation
        functions.push(Mark.up(typeTemplateFunction, {
          index: index,
          validation: f('object != null && ', paths.join(' || '))
        }));   

        // Object
        var p1 = ['object', p.slice(0).pop()];

        // Create a function call context
        functionCallContexts.push(Mark.up(functionCallTemplate, {
          index: index,
          field: field,
          object: p1.join('.'),
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

        // Push the validation
        functions.push(Mark.up(validationTemplateFunction, {
          index: index,
          validation: f('object != null && (%s)', paths.join(' || '))
        }));   

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

      // The statements
      var funcC = [];

      // Get the index
      var index = options.index;

      // Generate options
      var generateOptions = {
        isInArray: true, index: index + 1
      };

      // Generate type validation
      var generateArrayElementTypeValidaton = function(value) {
        if(typeof value.of == 'object') {
          return Mark.up(`if(object == null || (object[i] != null && typeof object[i] != 'object') && context.failOnFirst) {
            throw new ValidationError('field does not have the correct type', f('%s[%s]', field, i), parent, rule, object);
          } else if(object == null || (object[i] != null && typeof object[i] != 'object')) {            
            errors.push(new ValidationError('field does not have the correct type', f('%s[%s]', field, i), parent, rule, object));
          }
        `, {});
        }
      }

      // Push the entry
      funcC.push(generateArrayElementTypeValidaton(value));

      // Generate the underlying code
      generate(value.of, p, rules, functions, funcC, generateOptions);

      // Add the generated code to the list of functions
      functions.push(Mark.up(arrayTemplateFunction, {
        index: index, statements: funcC.join('\n')
      }));       

      // Call the actual context
      if(options.isInArray) {
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
    } else if(value.type === Object && value.of) {
      var arrayTemplateFunction =`
        var object_validation{{index}} = function(field, object, parent, rule, context, errors) {
          if(object == null) { return; }
          {{statements}}
        }  
      `

      // The statements
      var funcC = [];

      // Get the index
      var index = options.index;

      // Generate options
      var generateOptions = {
        isInArray: false, index: index + 1
      };

      // Generate the underlying code
      generate(value.of, p, rules, functions, funcC, generateOptions);

      // Add the generated code to the list of functions
      functions.push(Mark.up(arrayTemplateFunction, {
        index: index, statements: funcC.join('\n')
      }));       

      // Function call template
      var functionCallTemplate = `
        object_validation{{index}}("{{field}}", {{object}}, "{{parent}}", rules[{{index}}], context, errors);
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
}

module.exports = Compiler;
