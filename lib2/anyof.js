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
  this.type = 'anyof';
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
}

Node.prototype.addValidations = function(validations) {
  this.validations = validations;
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
    var any_of_validation_{{index}} = function(path, object, context) {
      // Not possible to perform any validations on the object as it does not exist
      if(object === undefined) return;
      // Total validations that were successful
      var successfulValidations = 0;
      // Keep track of the local errors
      var currentErrors = errors;
      errors = [];      
      
      // Perform validations on object fields
      {{statements}}

      // Check if we had more than one successful validation
      if(successfulValidations == 0 && context.failOnFirst) {
        throw new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[{{ruleIndex}}], object, errors);
      } else if(successfulValidations == 0 && !context.failOnFirst) {
        currentErrors.push(new ValidationError('value does not match any of the schema\'s in the anyOf rule', path, rules[{{ruleIndex}}], object, errors));
      }

      // Reset the errors
      errors = currentErrors;
    }
  ***/});

  // Create an inner context
  var innerContext = {
    functions: context.functions,
    functionCalls: [],
    rules: context.rules
  }

  // Create all validations
  this.validations.forEach(function(v) {
    v.generate(innerContext);
  });

  // Statement validation template
  var validationStatementTemplate = M(function(){/***
    var numberOfErrors = errors.length;

    {{statement}}

    if(numberOfErrors == errors.length) {
      successfulValidations = successfulValidations + 1;
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    statements: innerContext.functionCalls.map(function(s) {
      return Mark.up(validationStatementTemplate, {
        statement: s
      });
    }).join('\n'),
    index: this.id,
    ruleIndex: this.id
  }

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

  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      any_of_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: path,
      object: objectPath
    }));
}

module.exports = Node;