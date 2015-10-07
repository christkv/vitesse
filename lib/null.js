var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

/**
 * @fileOverview The NullNode class represents a value that must be null
 */

/**
 * The NullNode class represents a value that must be null
 * 
 * @class
 * @return {NullNode} a NullNode instance.
 */
var NullNode = function(parent, field, options) {  
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
  this.type = 'null';

  // Special validators, custom, pattern, required, prohibited
  // ----------------------------------------------------------
  this.customValidators = [];
}

/**
 * Type check value
 *
 * @method
 * @param {boolean} typeCheck type check value
 * @return {NullNode}
 */
NullNode.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

/**
 * @ignore
 */
NullNode.prototype.setDefault = function(value) {
  this.defaultValue = value;
}

/**
 * Add a custom object validator
 *
 * @method
 * @param {CustomNode} node custom validation node to be used for this field validation
 * @return {NullNode}
 */
NullNode.prototype.addCustomValidator = function(validator) {
  this.customValidators.push(validator);
  return this;
}

/**
 * Return the current object path
 *
 * @method
 * @return {array} an array containing the path to this node
 */
NullNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
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

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
NullNode.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function null_validation_{{index}}(path, object, context) {
      if(object === undefined) return;
      // We have a type validation
      {{type}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    custom: '',
    type: '',
    index: this.id,
    ruleIndex: this.id
  }

  if(this.customValidators.length > 0) {
    renderingOptions.custom = generateCustomValidations(this, this.customValidators, context);
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined) {
        if(object != null && context.failOnFirst) {
          throw new ValidationError('field is not a null', path, rules[{{ruleIndex}}], object);
        } else if(object != null) {
          errors.push(new ValidationError('field is not a null', path, rules[{{ruleIndex}}], object));
        } else {
          // Custom validations
          {{custom}}
        }
      }
    ***/}), renderingOptions);
  } else {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined && object === null) {
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
      null_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

module.exports = NullNode;