var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

/*
 * The IntegerNode class represents a value that can be anything
 * 
 * @class
 * @return {IntegerNode} a IntegerNode instance.
 */
var IntegerNode = function(parent, field, options) {  
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
  this.type = 'integer';

  // Special validators, custom, pattern, required, prohibited
  // ----------------------------------------------------------
  this.customValidators = [];
}

/**
 * Add a validation language node
 *
 * @method
 * @param {object} validation validation operation valid ones are $gt,$gte,$lt,$lte,$multipleOf,$in
 * @return {IntegerNode}
 */
IntegerNode.prototype.addValidation = function(validation) {
  this.validation = this.validation || {};
  // Merge in validation
  for(var name in validation) {
    this.validation[name] = validation[name];
  }

  return this;
}

/**
 * Type check value
 *
 * @method
 * @param {boolean} typeCheck type check value
 * @return {IntegerNode}
 */
IntegerNode.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
  return this;
}

/**
 * @ignore
 */
IntegerNode.prototype.setDefault = function(value) {
  this.defaultValue = value;
  return this;
}

/**
 * Add a custom object validator
 *
 * @method
 * @param {CustomNode} node custom validation node to be used for this field validation
 * @return {IntegerNode}
 */
IntegerNode.prototype.addCustomValidator = function(validator) {
  this.customValidators.push(validator);
  return this;
}

/**
 * Return the current object path
 *
 * @method
 * @return {array} an array containing the path to this node
 */
IntegerNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
IntegerNode.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function integer_validation_{{index}}(path, object, context) {
      {{type}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    validations: '',
    custom: '',
    type: '',
    index: this.id,
    ruleIndex: this.id
  }

  if(this.validation) {
    renderingOptions.validations = generateValidationLanguage(this, this.validation);
  }

  if(this.customValidators.length > 0) {
    renderingOptions.custom = generateCustomValidations(this, this.customValidators, context);
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined) {
        if((!(typeof object == 'number') || !(typeof object == 'number' && object%1 === 0)) && context.failOnFirst) {
          throw new ValidationError('field is not a number', path, rules[{{ruleIndex}}], object);
        } else if((!(typeof object == 'number') || !(typeof object == 'number' && object%1 === 0))) {       
          errors.push(new ValidationError('field is not a number', path, rules[{{ruleIndex}}], object));
        } else {
          // Validations
          {{validations}}       
          // Custom validations
          {{custom}}
        }
      }
    ***/}), renderingOptions);      
  } else {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined && typeof object == 'number') {
        // Validations
        {{validations}}       
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
      integer_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
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

var generateValidationLanguage = function(self, validations) {
  var validationTemplate = M(function(){/***
    if(({{validation}}) && context.failOnFirst) {
      throw new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object);
    } else if(({{validation}})) {
      errors.push(new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('object <= %s', validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('object < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('object > %s', validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('object >= %s', validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(object) == -1', validations[operator].toString()));
    } else if(operator === '$multipleOf') {
      valueValidations.push(f('(object / %s % 1) != 0', validations[operator]));
    } else {
      throw new Error(f('validation operator %s is not supported by Number type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    rule: JSON.stringify(validations),
    validation: (valueValidations.length > 0 ? valueValidations.join(' || ') : 'true')
  }); 
}

module.exports = IntegerNode;