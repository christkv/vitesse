var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils');

var Custom = require('./special').Custom,
  Pattern = require('./special').Pattern,
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
  // Just some metadata
  this.type = 'string';

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

Node.prototype.addSpecialValidator = function(validator) {
  this.special.push(validator);
}

Node.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

Node.prototype.generate = function(context) {
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules.push(self);
  // Validation template
  var validationTemplate = M(function(){/***
    var string_validation_{{index}} = function(path, object, context) {
      if(object === undefined) return;
      // We have a type validation
      {{type}}
      // Validations
      {{validations}}
      // Custom validations
      {{custom}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    validations: '',
    custom: '',
    type: '',
    index: this.id
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(typeof object != 'string' && context.failOnFirst) {
        throw new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object);
      } else if(typeof object != 'string') {       
        return errors.push(new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object));
      }
    ***/}), {
      ruleIndex: this.id
    });
  } else {
    renderingOptions.type = M(function(){/***
      if(typeof object != 'string') {
        return;
      }
    ***/});         
  }

  if(this.validation) {
    renderingOptions.validations = generateValidationLanguage(this, this.validation);
  }

  // Generate path
  var path = 'path';
  // If we are in an array
  if(context.inArray && !context.inArrayIndex) {
    path = f('path.slice(0).concat([i])');
  } else if(context.inArray && context.inArrayIndex) {
    path = f('path.slice(0).concat([%s])', context.inArrayIndex);
  }

  // Set the object
  var objectPath = 'object';
  // Do we have a custom object path generator
  if(context.inArray && !context.inArrayIndex) {
    objectPath = 'object[i]';
  } else if(context.inArray && context.inArrayIndex) {
    objectPath = f('object[%s]', context.inArrayIndex);
  }

  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      string_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: path,
      object: objectPath
    }));
}

var generateValidationLanguage = function(self, validations) {
  var validationTemplate = M(function(){/***
    if({{validation}} && context.failOnFirst) {
      throw new ValidationError('string fails validation {{rule}}', path, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('string fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('object.length <= %s', validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('object.length < %s', validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('object.length > %s', validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('object.length >= %s', validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(object) == -1', Utils.generateArray(validations[operator])));
    } else if(operator === '$regexp') {
      // Add the value validation
      valueValidations.push(f('regexps[%s].test(object) == false', index));
      // Add the validation to the regexp object
      context.regexps[index] = typeof validations[operator] == 'string'
        ? new RegExp(validations[operator]) : validations[operator];
    } else {
      throw new Error(f('validation operator %s is not supported by String type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    rule: JSON.stringify(validations, function(k, v) {
      if(k == '$regexp') {
        return v.toString();
      }

      return v;
    }),
    validation: valueValidations.join(' || ')
  }); 
}

module.exports = Node;