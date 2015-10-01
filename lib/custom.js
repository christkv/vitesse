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
  // Any options
  this.options = options;
  // Just some metadata
  this.type = 'custom';
  // Custom context
  this.context = {};  
}

Node.prototype.setContext = function(context) {
  this.context = context;
  return this;
}

Node.prototype.setValidator = function(validator) {
  this.validator = validator;
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

module.exports = Node;