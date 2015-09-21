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
  this.type = 'boolean';

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

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
}

Node.prototype.addSpecialValidator = function(validator) {
  this.special.push(validator);
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
    function boolean_validation_{{index}}(path, object, context) {
      if(object === undefined) return;
      // We have a type validation
      {{type}}
      // Custom validations
      {{custom}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    custom: '',
    type: '',
    index: this.id
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(typeof object != 'boolean' && context.failOnFirst) {
        throw new ValidationError('field is not a boolean', path, rules[{{ruleIndex}}], object);
      } else if(typeof object != 'boolean') {       
        return errors.push(new ValidationError('field is not a boolean', path, rules[{{ruleIndex}}], object));
      }
    ***/}), {
      ruleIndex: this.id
    });      
  } else {
    renderingOptions.type = M(function(){/***
      if(typeof object != 'boolean') {
        return;
      }
    ***/});         
  }

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      boolean_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      // path: path,
      // object: objectPath
      path: paths.path,
      object: paths.objectPath
    }));
}

module.exports = Node;