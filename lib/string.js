var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

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
  // Just some metadata
  this.type = 'string';

  // Special validators, custom, pattern, required, prohibited
  // ----------------------------------------------------------
  this.customValidators = [];
}

Node.prototype.addValidation = function(validation) {
  this.validation = this.validation || {};
  // Merge in validation
  for(var name in validation) {
    this.validation[name] = validation[name];
  }

  return this;
}

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
  return this;
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
  return this;
}

Node.prototype.addCustomValidator = function(validator) {
  this.customValidators.push(validator);
  return this;
}
 
Node.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

Node.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function string_validation_{{index}}(path, object, context) {
      // We have a type validation
      {{type}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    validations: '',
    custom: '',
    type: '',
    index: this.id,
    ruleIndex: this.id
  }

  if(this.validation) {
    renderingOptions.validations = generateValidationLanguage(this, this.validation, context);
  }

  if(this.customValidators.length > 0) {
    renderingOptions.custom = generateCustomValidations(this, this.customValidators, context);
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined) {
        if(typeof object != 'string' && context.failOnFirst) {
          throw new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object);
        } else if(typeof object != 'string') {       
          errors.push(new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object));
        } else {
          // Validations
          {{validations}}       
          // Custom validations
          {{custom}}
        }
      }
    ***/}), renderingOptions);
  } else {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined && typeof object == 'string') {
        // Validations
        {{validations}}       
        // Custom validations
        {{custom}}
      }
    ***/}), renderingOptions);
  }

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      string_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

var generateArray = function(a) {
  return a.map(function(x) {
    return f('"%s"', x);
  });
}

var generateCustomValidations = function(self, validations, context) {
  // Create an inner context
  var innerContext = {
    functions: context.functions,
    functionCalls: [],
    custom: context.custom,
    rules: context.rules
  }

  // Generate custom validation functions and call contexts
  validations.forEach(function(validation) {
    validation.generate(innerContext);
  });

  // Return custom validator calls
  return innerContext.functionCalls.join('\n');
}

var generateValidationLanguage = function(self, validations, context, options) {
  options = options || {object: 'object', path: 'path'};
  var validationTemplate = M(function(){/***
    if(({{validation}}) && context.failOnFirst) {
      throw new ValidationError('string fails validation {{rule}}', {{path}}, rules[{{ruleIndex}}], {{object}});
    } else if(({{validation}})) {
      errors.push(new ValidationError('string fails validation {{rule}}', {{path}}, rules[{{ruleIndex}}], {{object}}));
    }
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('%s.length <= %s', options.object, validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('%s.length < %s', options.object, validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('%s.length > %s', options.object, validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('%s.length >= %s', options.object, validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(%s) == -1', generateArray(validations[operator]), options.object));
    } else if(operator === '$regexp') {
      // Add the value validation
      valueValidations.push(f('regexps[%s].test(%s) == false', self.id, options.object));
      // Add the validation to the regexp object
      context.regexps[self.id] = typeof validations[operator] == 'string'
        ? new RegExp(validations[operator]) : validations[operator];
    } else {
      throw new Error(f('validation operator %s is not supported by String type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    rule: JSON.stringify(validations, function(k, v) {
      if(k == '$regexp') {
        return v.toString();
      }

      return v;
    }),
    object: options.object,
    path: options.path,
    validation: (valueValidations.length > 0 ? valueValidations.join(' || ') : 'true')
  }); 
}

module.exports = Node;
