var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils');

var Custom = require('./special').Custom,
  Pattern = require('./special').Pattern,
  AdditionalProperties = require('./special').AdditionalProperties,
  Required = require('./special').Required,
  Prohibited = require('./special').Prohibited;

var Node = function(parent, field, options) {  
  options = options || {};
  // Unique id for this node's generated method
  this.id = utils.generateId();
  // Link to parent node
  this.parent = parent;
  // The field related to this node
  this.field = field;
  // Perform type check or not on generation
  this.typeCheck = typeof options.typeCheck == 'boolean' ? options.typeCheck : false;
  // Validation language
  this.validation = options.validation ? options.validation : null;
  // Any options
  this.options = options;
  // All children attached to this node
  this.children = [];
  // Just some metadata
  this.type = 'object';
}

Node.prototype.addValidation = function(validation) {
  this.validation = this.validation || {};
  // Merge in validation
  for(var name in validation) {
    this.validation[name] = validation[name];
  }
}

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

Node.prototype.addChild = function(field, node) {
  this.children.push({field: field, node: node});
}

Node.prototype.addAdditionalPropertiesValidator = function(validation) {
  this.additionalPropertiesValidator = validation;
}

Node.prototype.addPatternPropertiesValidator = function(validation) {
  this.patternPropertiesValidator = validation;
}

Node.prototype.requiredFields = function(required) {
  this.required = required;
}

Node.prototype.prohibitedFields = function(prohibited) {
  this.prohibited = prohibited;
}

Node.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

Node.prototype.generate = function(context) {
  // Shortcut the rendering
  if(this.defaultValue != null) return;
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules.push(self);
  // Validation template
  var validationTemplate = M(function(){/***
    var object_validation_{{index}} = function(path, object, context) {
      if(object === undefined) return;
      // We have a type validation
      {{type}}
      // Prohibits fields override
      {{prohibited}}
      // Requires fields override
      {{required}}
      // Validations
      {{validations}}
      // Additional field validations
      {{fieldValidations}}
      // Custom validations
      {{custom}}
      // Perform validations on object fields
      {{statements}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    required: '',
    prohibited: '',
    validations: '',
    custom: '',
    fieldValidations: '',
    statements: '',
    type: '',
    index: this.id
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
        throw new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object);
      } else if(object == null || typeof object != 'object' || Array.isArray(object)) {
        return errors.push(new ValidationError('field is not an object', path, rules[{{ruleIndex}}], object));
      }
    ***/}), {
      ruleIndex: this.id
    });      
  } else {
    renderingOptions.type = M(function(){/***
      if(object == null || typeof object != 'object' || Array.isArray(object)) {
        return;
      }
    ***/});         
  }

  // Do we have validations on object shape
  if(this.validation) {
    renderingOptions.validations = generateValidationLanguage(this, this.validation);
  }

  // Do we have required fields
  if(this.required) {
    renderingOptions.required = generateRequiredFields(this, this.required);
  }

  // Do we have prohibited fields
  if(this.prohibited) {
    renderingOptions.prohibited = generateProhibited(this, this.prohibited);
  }

  // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ general")
  // console.dir(this.patternPropertiesValidator)
  // console.dir(this.additionalPropertiesValidator)

  // Generates the field validation code
  renderingOptions.fieldValidations = generateFieldValidations(self, context, this.patternPropertiesValidator, this.additionalPropertiesValidator);
 
  // Add the statements
  var statements = [];

  // Create all the field validations
  this.children.forEach(function(x) {
    var field = x.field;
    var node = x.node;

    // Create an inner context
    var innerContext = {
      functions: context.functions,
      functionCalls: [],
      rules: context.rules,
      object: f('object.%s', field)
    }

    // Generate the code
    node.generate(innerContext);
    // Add to statements
    statements = statements.concat(innerContext.functionCalls);
  });

  // Generate path
  var path = 'path';
  // If we are in an array
  if(context.inArray && !context.inArrayIndex) {
    path = f('path.slice(0).concat([i])');
  } else if(context.inArray && context.inArrayIndex) {
    path = f('path.slice(0).concat([%s])', context.inArrayIndex);
  } else if(context.path) {
    path = context.path;
  } else if(this.parent == null) {
    path = ['["object"]'];
  }

  // Set the object
  var objectPath = 'object';
  // Do we have a custom object path generator
  if(context.inArray && !context.inArrayIndex) {
    objectPath = 'object[i]';
  } else if(context.inArray && context.inArrayIndex) {
    objectPath = f('object[%s]', context.inArrayIndex);
  } else if(context.object) {
    objectPath = context.object;
  }

  // Set rendering statements
  renderingOptions.statements = statements.join('\n');
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      object_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: path,
      object: objectPath
    }));

  // Set rendering statements
  renderingOptions.statements = statements.join('\n');
}

var generateProhibited = function(self, prohibited) {
  var validationTemplate = M(function(){/***
    var prohibited = {{prohibited}};
    var valid = true;

    // Iterate over all the keys
    for(var i = 0; i < prohibited.length; i++) {
      if(object[prohibited[i]] !== undefined) {
        valid = false;
        break;
      }
    }

    if(!valid && context.failOnFirst) {
      throw new ValidationError('object has prohibited fields {{prohibited}}', path, rules[{{ruleIndex}}], object);
    } else if(!valid) {
      errors.push(new ValidationError('object has prohibited fields {{prohibited}}', path, rules[{{ruleIndex}}], object));
    } 
  ***/});

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    prohibited: JSON.stringify(prohibited)
  }); 
}

var generateRequiredFields = function(self, required) {
  var validationTemplate = M(function(){/***
    var required = {{required}};
    var valid = true;

    // Iterate over all the keys
    for(var i = 0; i < required.length; i++) {
      if(object[required[i]] === undefined) {
        valid = false;
        break;
      }
    }

    if(!valid && context.failOnFirst) {
      throw new ValidationError('object is missing required fields {{required}}', path, rules[{{ruleIndex}}], object);
    } else if(!valid) {
      errors.push(new ValidationError('object is missing required fields {{required}}', path, rules[{{ruleIndex}}], object));
    } 
  ***/});

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    required: JSON.stringify(required)
  }); 
}

var generateFieldValidations = function(self, context, patterns, additional) {
  // Get the fields
  var fields = self.children || [];
  var patternProperties = patterns || {};
  var fieldNames = {};

  // // Add the list of field
  // for(var name in fields) fieldNames[name] = {};
  for(var i = 0; i < fields.length; i++) {
    fieldNames[fields[i].field] = {};
  }


  // Validation template
  var validationTemplate = M(function(){/***
    var fieldNames = {{fieldNames}};
    var keys = Object.keys(object);
    var properties = keys.slice(0);

    // The sets
    var validSet = {};

    // Go over all the keys
    for(var i = 0; i < keys.length; i++) {
      var key = keys[i];
  
      if(fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }

      // Pattern validations
      {{patterns}}
    }

    // Additional properties object
    {{additionalPropertiesObject}}

    // Additional properties false
    {{additionalPropertiesFalse}}    
  ***/});

  // Stores all the patterns
  var patterns = [];
  // Go over all the patterns
  for(var regexp in patternProperties) {
    // Create inner context
    var innerContext = {
      functions: context.functions, 
      functionCalls: [],
      rules: context.rules, 
      regexps: context.regexps,
      object: 'object[key]'
    }

    // Get the validation
    var validation = patternProperties[regexp];

    // Generate the validation
    validation.generate(innerContext);

    // Generate the pattern
    patterns.push(Mark.up(M(function(){/***
      var pattern = /{{pattern}}/;
  
      if(key.match(pattern) != null) {
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
        // Validation
        {{validation}}
      }
    ***/}), {
      pattern: regexp,
      validation: innerContext.functionCalls.join('\n')
    }));
  }

  // console.log("=================================== additional")
  // console.dir(additional)

  // Additional properties set to false
  var additionalPropertiesFalse = additional == false
    ? Mark.up(M(function(){/***
      if(properties.length > 0 && context.failOnFirst) {
        throw new ValidationError('illegal fields on object', path, rules[{{ruleIndex}}], object);
      } else if(properties.length > 0) {
        errors.push(new ValidationError('illegal fields on object', path, rules[{{ruleIndex}}], object));
      } 
    ***/}), {
      ruleIndex: self.id
    })
    : '';

  // Additional properties validation
  var additionalPropertiesObject = '';
  // Additional Properties is a schema
  if(additional != null && typeof additional == 'object') {
    // Create inner context
    var innerContext = {
      functions: context.functions, 
      functionCalls: [],
      rules: context.rules, 
      regexps: context.regexps,
      object: 'object[key]'
    }

    // Generate validations
    additional.generate(innerContext);

    // Generate the pattern
    additionalPropertiesObject = Mark.up(M(function(){/***
      // Go over all the keys
      for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        
        // Perform validation
        if(properties.indexOf(key) != -1) {
          {{validations}}
        }
      }      
    ***/}), {
      validations: innerContext.functionCalls.join('\n')
    });
  }

  // Create template
  return Mark.up(validationTemplate, {
    fieldNames: JSON.stringify(fieldNames),
    patterns: patterns.join('\n'),
    totalPatterns: patterns.length,
    additionalPropertiesFalse: additionalPropertiesFalse,
    additionalPropertiesObject: additionalPropertiesObject
  });  
}

var generateValidationLanguage = function(self, validations) {
  var validationTemplate = M(function(){/***
    if({{validation}} && context.failOnFirst) {
      throw new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
    } 
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gte') {
      valueValidations.push(f('Object.keys(object).length < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('Object.keys(object).length > %s', validations[operator]));
    } else {
      throw new Error(f('validation operator %s is not supported by Object type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    rule: JSON.stringify(validations),
    validation: valueValidations.join(' || ')
  }); 
}

Node.Pattern = Pattern;
Node.Required = Required;
Node.Prohibited = Prohibited;
module.exports = Node;