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

  // Item specific validations
  // ----------------------------------------------------------
  this.positionalItemValidation = {};

  // Item validation
  // ----------------------------------------------------------
  this.itemValidation = null;
}

Node.prototype.addValidation = function(validation) {
  this.validation = this.validation || {};
  // Merge in validation
  for(var name in validation) {
    this.validation[name] = validation[name];
  }
}

Node.prototype.addPositionalItemValidation = function(i, validation) {
  this.positionalItemValidation[i] = validation;
}

Node.prototype.addItemValidation = function(validation) {
  this.itemValidation = validation;
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

Node.prototype.addSpecialValidator = function(validator) {
  this.special.push(validator);
}

Node.prototype.path = function() {
  if(this.parent == null) return ['object'];
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
    var array_validation_{{index}} = function(path, object, context) {
      if(object === undefined) return;
      // We have a type validation
      {{type}}
      // Validations
      {{validations}}
      // Custom validations
      {{custom}}
      // Per item validation
      {{perItemValidations}}
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
    index: this.id
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = M(function(){/***
      if(!Array.isArray(object) && context.failOnFirst) {
        throw new ValidationError('field is not a number', '{{path}}', rules[{{ruleIndex}}], object);
      } else if(!Array.isArray(object)) {
        return errors.push(new ValidationError('field is not a number', '{{path}}', rules[{{ruleIndex}}], object));
      }
    ***/}, {
      ruleIndex: this.id, path: this.path().join('.')
    });      
  } else {
    renderingOptions.type = M(function(){/***
      if(!Array.isArray(object)) {
        return;
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

  // We have array positional items
  if(Object.keys(this.positionalItemValidation).length > 0) {
    renderingOptions.perItemValidations = generatePerItemValidations(this, this.positionalItemValidation, context);
  }

  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      array_validation_{{index}}({{path}}, object, context);
    ***/}), {
      index: this.id,
      path: JSON.stringify(this.path())
    }));
}

var generatePerItemValidations = function(self, validations, context) {
  console.log("##################################################### generatePerItemValidations")
  var statements = [];

  console.log("-------------------------------------------------------- 0")
  console.dir(validations)

  // Get the indexes
  for(var index in validations) {
    // Create an inner context
    var innerContext = {
      functions: context.functions,
      functionCalls: [],
      rules: context.rules,

      // Array specific fields
      inArray:true,
      inArrayIndex: index
    }

    // Generate code
    validations[index].generate(innerContext);
    // Add to the statements
    statements = statements.concat(innerContext.functionCalls);
  }

  console.log("-------------------------------------------------------- 1")
  console.dir(statements)

  // for(var i = 0; i < validations.length; i++) {
  //   var index = validations[i].index;

  //   statements.push()
  // }

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
    inArray:true
  }

  // Generate the code for the validation
  validation.generate(innerContext)
  // console.log("==================================================================== validationCode 0")
  // console.dir(innerContext.functionCalls)
  // // console.dir(validation)
  // // console.log(validationCode)
  // console.log("==================================================================== validationCode 1")
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
    if({{validation}} && context.failOnFirst) {
      throw new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object);
    } else if({{validation}}) {
      errors.push(new ValidationError('number fails validation {{rule}}', path, rules[{{ruleIndex}}], object));
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
    validation: valueValidations.join(' || ')
  }); 
}

module.exports = Node;