var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

/*
 * The CustomNode class represents a value that can be anything
 * 
 * @class
 * @return {CustomNode} a CustomNode instance.
 */
var CustomNode = function(parent, field, options) {  
  options = options || {};
  // Unique id for this node's generated method
  this.id = utils.generateId();
  // Link to parent node
  this.parent = parent;
  // The field related to this node
  this.field = field;
  // Any options
  this.options = options;
  // Just some metadata
  this.type = 'custom';
  // Custom context
  this.context = {};  
}

/**
 * Set the custom context for the custom validator (might include pre-compiled regular expressions)
 *
 * @method
 * @param {object} context the context for this custom validator node
 */
CustomNode.prototype.setContext = function(context) {
  this.context = context;
  return this;
}

/**
 * Set the custom validator function
 *
 * @method
 * @param {function} func the custom function validator
 */
CustomNode.prototype.setValidator = function(func) {
  this.validator = func;
  return this;
}

/**
 * Return the current object path
 *
 * @method
 * @return {array} an array containing the path to this node
 */
CustomNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
CustomNode.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  
  // Add this node context to the custom context object
  context.custom[this.id] = this.context;

  // Validation template
  var functionCallTemplate = M(function(){/***
    var error = custom_{{index}}(object, custom['{{index}}']);

    if(error instanceof Error && context.failOnFirst) {
      throw new ValidationError(error.message, path, rules[{{ruleIndex}}], object);       
    } else if(error instanceof Error) {
      errors.push(new ValidationError(error.message, path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Function template
  var functionTemplate = M(function(){/***
     var custom_{{index}} = {{function}};
  ***/});

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);

  // Unpack the custom validation
  var func = this.validator.toString();

  // Transform function
  var transformFunction = Mark.up(functionTemplate, {
    index: this.id, function: func
  });

  // Add the function to the complete list of functions
  context.functions.push(transformFunction);

  // Generate function call
  context.functionCalls.push(Mark.up(functionCallTemplate, {
      index: this.id,
      path: paths.path,
      ruleIndex: this.id,
      object: paths.objectPath
    }));
}

module.exports = CustomNode;