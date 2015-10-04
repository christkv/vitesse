"use strict";

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

/**
 * @fileOverview The AllOfNode class represents a set of validation nodes that must all be valid for this node to be valid
 *
 * @example
 * var MongoClient = require('mongodb').MongoClient,
 *   test = require('assert');
 * // Connection url
 * var url = 'mongodb://localhost:27017/test';
 * // Connect using MongoClient
 * MongoClient.connect(url, function(err, db) {
 *   // Get an additional db
 *   var testDb = db.db('test');
 *   db.close();
 * });
 */

/**
 * The AllOfNode class represents a set of validation nodes that must all be valid for this node to be valid
 * 
 * @class
 * @return {AllOfNode} a AllOfNode instance.
 */
var AllOfNode = function(parent, field, options) {  
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
  this.type = 'allof';
}

/**
 * Type check value
 *
 * @method
 * @param {boolean} typeCheck type check value
 * @return {AllOfNode}
 */
AllOfNode.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
  return this;
}

/**
 * @ignore
 */
AllOfNode.prototype.setDefault = function(value) {
  this.defaultValue = value;
  return this;
}

/**
 * Add validation nodes that must all be satisfied for the provided value
 *
 * @method
 * @param {array} validations an array of validation nodes
 * @return {AllOfNode}
 */
AllOfNode.prototype.addValidations = function(validations) {
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
AllOfNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
AllOfNode.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function all_of_validation_{{index}}(path, object, context) {
      // Not possible to perform any validations on the object as it does not exist
      if(!(object === undefined)) {
        // Total validations to perform
        var totalValidations = {{totalValidations}};
        // Total validations that were successful
        var successfulValidations = 0;
        // Keep track of the local errors
        var currentErrors = errors;
        errors = [];      
        
        // Perform validations on object fields
        {{statements}}

        // Check if we had more than one successful validation
        if((successfulValidations != totalValidations) && context.failOnFirst) {
          throw new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[{{ruleIndex}}], object, errors);
        } else if((successfulValidations != totalValidations) && !context.failOnFirst) {
          currentErrors.push(new ValidationError('one or more schema\'s did not match the allOf rule', path, rules[{{ruleIndex}}], object, errors));
        }

        // Reset the errors
        errors = currentErrors;
      }
    }
  ***/});

  // Create an inner context
  var innerContext = {
    functions: context.functions,
    functionCalls: [],
    custom: context.custom,
    rules: context.rules,
    regexps: context.regexps,
    optimize: context.optimize
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
    ruleIndex: this.id,
    totalValidations: this.validations.length
  }

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      all_of_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

module.exports = AllOfNode;