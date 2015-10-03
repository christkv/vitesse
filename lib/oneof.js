var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

/*
 * The OneOfNode class represents a validation where the value must be one of the validation nodes
 * 
 * @class
 * @return {OneOfNode} a OneOfNode instance.
 */
var OneOfNode = function(parent, field, options) {  
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
  this.type = 'oneof';
}

/**
 * Type check value
 *
 * @method
 * @param {boolean} typeCheck type check value
 * @return {OneOfNode}
 */
OneOfNode.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
  return this;
}

/**
 * @ignore
 */
OneOfNode.prototype.setDefault = function(value) {
  this.defaultValue = value;
  return this;
}

/**
 * One of the validation nodes must be satisfied for the provided value
 *
 * @method
 * @param {array} validations an array of validation nodes
 * @return {OneOfNode}
 */
OneOfNode.prototype.addValidations = function(validations) {
  var self = this;
  // Map this object as the parent
  this.validations = validations.map(function(x) {
    x.parent = self.parent;
    x.field = self.field;
    return x;
  });

  return this;
}

/**
 * Return the current object path
 *
 * @method
 * @return {array} an array containing the path to this node
 */
OneOfNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
OneOfNode.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function one_of_validation_{{index}}(path, object, context) {
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
      if(successfulValidations != 1 && context.failOnFirst) {
        throw new ValidationError('more than one schema matched ofOne rule', path, rules[{{ruleIndex}}], object, errors);
      } else if(successfulValidations != 1 && !context.failOnFirst) {
        currentErrors.push(new ValidationError('more than one schema matched ofOne rule', path, rules[{{ruleIndex}}], object, errors));
      }

      // Reset the errors
      errors = currentErrors;
    }
  ***/});

  // Create an inner context
  var innerContext = {
    functions: context.functions,
    functionCalls: [],
    custom: context.custom,
    rules: context.rules,
    optimize: context.optimize,
    regexps: context.regexps
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

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      one_of_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

module.exports = OneOfNode;