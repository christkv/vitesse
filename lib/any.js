var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils');

/**
 * @fileOverview The AnyNode class represents a validation that accepts any value.
 */

/**
 * The AnyNode class represents a value that can be anything
 * 
 * @class
 * @return {AnyNode} a AnyNode instance.
 */
var AnyNode = function(parent, field, options) {  
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
  this.type = 'any';
}

/**
 * Type check value
 *
 * @method
 * @param {boolean} typeCheck type check value
 * @return {AnyNode}
 */
AnyNode.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

/**
 * @ignore
 */
AnyNode.prototype.setDefault = function(value) {
  this.defaultValue = value;
}

/**
 * Return the current object path
 *
 * @method
 * @return {array} an array containing the path to this node
 */
AnyNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
AnyNode.prototype.generate = function(context) {
}

module.exports = AnyNode;