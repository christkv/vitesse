var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

var Node = function(parent, field, callpath, options) {  
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
  this.callpath = options.callpath ? options.callpath : '#';
  // Any options
  this.options = options;
  // Just some metadata
  this.type = 'recursive';

  // Special validators, custom, pattern, required, prohibited
  // ----------------------------------------------------------
  this.specials = [];
}

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
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

  // Call path is to top object
  if(this.callpath == '#') {
    var object = this;
    // Locate top object (where .parent == null)
    while(object.parent != null) {
      object = object.parent;
    }

    // Generate function call
    context.functionCalls.push(Mark.up(M(function(){/***
        object_validation_{{index}}({{path}}, {{object}}, context);
      ***/}), {
        index: object.id,
        path: path,
        object: objectPath
      }));
  }
}

module.exports = Node;