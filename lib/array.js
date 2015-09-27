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
  // Perform type check or not on generation
  this.typeCheck = typeof options.typeCheck == 'boolean' ? options.typeCheck : false;
  // Validation language
  this.validation = options.validation ? options.validation : null;
  // Any options
  this.options = options;
  // Just some metadata
  this.type = 'array';

  // Special validators, custom, pattern, required, prohibited
  // ----------------------------------------------------------
  this.specials = [];

  // Item specific validations
  // ----------------------------------------------------------
  this.positionalItemValidation = {};

  // Item validation
  // ----------------------------------------------------------
  this.itemValidation = null;

  // AdditionalItems validation
  // -----------------------------------------------------------
  this.additionalItemsValidation = null;
}

Node.prototype.addValidation = function(validation) {
  this.validation = this.validation || {};
  // Merge in validation
  for(var name in validation) {
    this.validation[name] = validation[name];
  }

  return this;
}

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
  return this;
}

Node.prototype.addPositionalItemValidation = function(i, validation) {
  this.positionalItemValidation[i] = validation;
  return this;
}

Node.prototype.addItemValidation = function(validation) {
  this.itemValidation = validation;
  this.itemValidation.parent = this;
  return this;
}

Node.prototype.addAdditionalItemsValidation = function(validation) {
  this.additionalItemsValidation = validation;
  return this;
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
  return this;
}

Node.prototype.uniqueItems = function(uniqueItems) {
  this.uniqueItemsFunction = uniqueItems;
  return this;
}

Node.prototype.addSpecialValidator = function(validator) {
  this.special.push(validator);
  return this;
}

Node.prototype.path = function() {
  if(this.parent == null) return ['object'];
  return this.parent.path().concat([this.field]);
}

Node.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function array_validation_{{index}}(path, object, context) {
      if(object === undefined) return;
      // We have a type validation
      {{type}}
      // Validations
      {{validations}}
      // Uniqueness validation
      {{unique}}
      // Custom validations
      {{custom}}
      // Per item validation
      {{perItemValidations}}
      // Additional items validation
      {{additionalItemsValidation}}
      // Iterate over all the items
      {{allItemValidations}}
    }
  ***/});

  // Rendering context
  var renderingOptions = {
    validations: '',
    custom: '',
    type: '',
    perItemValidations: '',
    allItemValidations: '',
    additionalItemsValidation: '',
    unique: '',
    index: this.id
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(!Array.isArray(object) && context.failOnFirst) {
        throw new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object);
      } else if(!Array.isArray(object)) {
        errors.push(new ValidationError('field is not an array', path, rules[{{ruleIndex}}], object));
        return errors;
      }
    ***/}), {
      ruleIndex: this.id
    });      
  } else {
    renderingOptions.type = M(function(){/***
      if(!Array.isArray(object)) {
        return errors;
      }
    ***/});         
  }

  // We have specific validation rules
  if(this.validation) {
    renderingOptions.validations = generateValidationLanguage(this, this.validation);
  }

  // We have a general all items validation
  if(this.itemValidation) {
    renderingOptions.allItemValidations = generateAllItemValidation(this, this.itemValidation, context);
  }

  // We have a uniqueness constraint on the array items
  if(this.uniqueItemsFunction) {
    renderingOptions.unique = generateUniqueItems(this);
  }

  // We have array positional items
  if(Object.keys(this.positionalItemValidation).length > 0) {
    renderingOptions.perItemValidations = generatePerItemValidations(this, this.positionalItemValidation, context);
  }

  // Do we have an additional items validation
  if(typeof this.additionalItemsValidation == 'boolean' || this.additionalItemsValidation instanceof Object) {
    renderingOptions.additionalItemsValidation = generateAdditionalItemsValidation(this, this.additionalItemsValidation, this.positionalItemValidation, context);
  }

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      array_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

var generateUniqueItems = function(self) {
  //
  // Generate uniqueness validation function
  // ---------------------------------------------
  // Validation template
  var uniqueValidationTemplate = M(function(){/***
    if(!object.every(testArrays) && context.failOnFirst) {
      throw new ValidationError('array contains duplicate values', path, rules[{{ruleIndex}}], object);
    } else if(!object.every(testArrays)) {      
      errors.push(new ValidationError('array contains duplicate values', path, rules[{{ruleIndex}}], object));
    }
  ***/});

  // Generate uniqueness validation
  return Mark.up(uniqueValidationTemplate, {
      ruleIndex: self.id
    });
}

var generateAdditionalItemsValidation = function(self, additionalItemsValidation, positionalItemValidation, context) {
  // No per item validations, just ignore the additional validations option
  if(Object.keys(positionalItemValidation).length == 0) return '';

  // Locate highest index and then add a statement to ban anything over it
  var length = -1;
  for(var i in positionalItemValidation) {
    if(parseInt(i, 10) > length) length = parseInt(i, 10);
  }

  // We have perItemValidation and additionalItems == false
  if(Object.keys(positionalItemValidation).length > 0 && additionalItemsValidation == false) {
    // Return validation
    return Mark.up(M(function(){/***
      if(object.length > {{length}} && context.failOnFirst) {
        throw new ValidationError('array contains invalid items', path, rules[{{ruleIndex}}], object);
      } else if(object.length > {{length}}) {
        return errors.push(new ValidationError('array contains invalid items', path, rules[{{ruleIndex}}], object));
      }
    ***/}), {
      ruleIndex: self.id,
      length: (length + 1)
    });
  }

  // We have perItemValidation and additionalItems == Object
  if(Object.keys(positionalItemValidation).length > 0 && additionalItemsValidation instanceof Object) {
    // Create an inner context
    var innerContext = {
      functions: context.functions,
      functionCalls: [],
      rules: context.rules,
      regexps: context.regexps,
      inArray:true,
      regexps: context.regexps,
      optimize: context.optimize
    }

    // Generate the code for the validation
    additionalItemsValidation.generate(innerContext)
    // Generate the validation
    return Mark.up(M(function(){/***
      for(var i = {{length}}; i < object.length; i++) {
        {{validation}}
      }
    ***/}), {
      validation: innerContext.functionCalls.join('\n'), length: (length + 1)
    });
  }

  return '';
}

var generatePerItemValidations = function(self, validations, context) {
  var statements = [];

  // Get the indexes
  for(var index in validations) {
    // Create an inner context
    var innerContext = {
      functions: context.functions,
      functionCalls: [],
      rules: context.rules,
      regexps: context.regexps,
      optimize: context.optimize,

      // Array specific fields
      inArray:true,
      inArrayIndex: index
    }

    // Generate code
    validations[index].generate(innerContext);
    // Add to the statements
    statements = statements.concat(innerContext.functionCalls);
  }

  return Mark.up(M(function(){/***
    {{statements}}
  ***/}), {
    statements: statements.join('\n')
  });
}

var generateAllItemValidation = function(self, validation, context) {
  // Create an inner context
  var innerContext = {
    functions: context.functions,
    functionCalls: [],
    rules: context.rules,
    regexps: context.regexps,
    optimize: context.optimize,
    inArray:true
  }

  // Generate the code for the validation
  validation.generate(innerContext)
  // Generate the validation
  return Mark.up(M(function(){/***
    for(var i = 0; i < object.length; i++) {
      {{validation}}
    }
  ***/}), {
    validation: innerContext.functionCalls.join('\n')
  });
}

var generateValidationLanguage = function(self, validations) {
  var validationTemplate = M(function(){/***
    if(({{validation}}) && context.failOnFirst) {
      throw new ValidationError('array fails length validation {{rule}}', path, rules[{{ruleIndex}}], object);
    } else if(({{validation}})) {
      errors.push(new ValidationError('array fails length validation {{rule}}', path, rules[{{ruleIndex}}], object));
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
    } else {
      throw new Error(f('validation operator %s is not supported by Array type', operator));
    }
  }

  // Generate the validation code
  return Mark.up(validationTemplate, {
    ruleIndex: self.id, 
    rule: JSON.stringify(validations),
    validation: (valueValidations.length > 0 ? valueValidations.join(' || ') : 'true')
  }); 
}

module.exports = Node;