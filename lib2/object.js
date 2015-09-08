var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils');

var Custom = require('./special').Custom,
  Pattern = require('./special').Pattern,
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

  // Special validators, custom, pattern, required, prohibited
  // ----------------------------------------------------------
  this.specials = [];
}

Node.prototype.addValidation = function(validation) {
  this.validation = this.validation || {};
  // Merge in validation
  for(var name in validation) {
    this.validation[name] = validation[name];
  }
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

Node.prototype.addChild = function(field, node) {
  this.children.push({field: field, node: node});
}

Node.prototype.addSpecialValidator = function(validator) {
  this.special.push(validator);
}

Node.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

Node.prototype.generate = function(context) {
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules.push(self);
  // Validation template
  var validationTemplate = M(function(){/***
    var object_validation_{{index}} = function(path, object, context) {
      console.log("--------------------------------------------------------")
      console.dir(object)
      if(object === undefined) return;
      // We have a type validation
      {{type}}
      // Prohibits fields override
      {{prohibited}}
      // Requires fields override
      {{required}}
      // Validations
      {{validations}}
      // Field name pattern validation
      {{pattern}}
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
    pattern: '',
    statements: '',
    type: '',
    index: this.id
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = M(function(){/***
      if((object == null || typeof object != 'object' || Array.isArray(object)) && context.failOnFirst) {
        throw new ValidationError('field is not an object', '{{path}}', rules[{{ruleIndex}}], object);
      } else if((object == null || typeof object != 'object' || Array.isArray(object))) {       
        return errors.push(new ValidationError('field is not an object', '{{path}}', rules[{{ruleIndex}}], object));
      }
    ***/}, {
      ruleIndex: this.id, path: this.path().join('.')
    });      
  } else {
    renderingOptions.type = M(function(){/***
      if((object == null || typeof object != 'object' || Array.isArray(object))) {
        return;
      }
    ***/});         
  }

  if(this.validation) {
    renderingOptions.validations = generateValidationLanguage(this, this.validation);
  }
 
  // Check all the specials
  this.specials.forEach(function(x) {
    if(x instanceof Pattern) {
      renderingOptions.pattern = x.generate(self);
    } else if(x instanceof Required) {
      renderingOptions.required = x.generate(self);
    } else if(x instanceof Prohibited) {
      renderingOptions.prohibited = x.generate(self);
    }
  });

  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      object_validation_{{index}}({{path}}, object, context);
    ***/}), {
      index: this.id,
      path: JSON.stringify(this.path())
    }));
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

module.exports = Node;