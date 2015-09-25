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
  // All children attached to this node
  this.children = [];
  // Just some metadata
  this.type = 'enum';
}

Node.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
}

Node.prototype.setDefault = function(value) {
  this.defaultValue = value;
}

Node.prototype.addEnums = function(enums) {
  this.enums = enums;
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
  // Validation template
  var validationTemplate = M(function(){/***
    function enum_validation_{{index}}(path, object, context) {
      var valid = false;

      if(!(object === undefined)) {
        // Enum validations
        {{validations}}

        // Check if we have the validation
        if(!valid && context.failOnFirst) {
          throw new ValidationError('field does not match enumeration {{enumeration}}', path, rules[{{ruleIndex}}], object);
        } else if(!valid) {
          errors.push(new ValidationError('field does not match enumeration {{enumeration}}', path, rules[{{ruleIndex}}], object));
        }
      }
    }
  ***/});

  // Unroll the enum
  var validations = self.enums.map(function(x, i) {
    // Start conditional
    var conditional = '} else ';
    if(i == 0) conditional = '';
    if(i == self.enums.length) conditional = '}';

    // End conditional
    var endConditional = '';
    if(i == self.enums.length -1 ) endConditional = '}';

    // Generate the code
    if(typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean') {
      return Mark.up(M(function(){/***
        {{conditional}}if(object === {{value}}) {
          valid = true;
        {{endConditional}}
      ***/}), {
        value: typeof x === 'string' ? f("'%s'", x) : x, 
        index: i,
        conditional: conditional,
        endConditional: endConditional,
        enumeration: JSON.stringify(self.enums)
      });
    } else if(x instanceof Object) {
      return Mark.up(M(function(){/***
        {{conditional}}if(deepCompareStrict({{value}}, object)) {
          valid = true;
        {{endConditional}}
      ***/}), {
        value: JSON.stringify(x), 
        index: i,
        conditional: conditional,
        endConditional: endConditional,
        enumeration: JSON.stringify(self.enums)
      });
    } else if(Array.isArray(x)) {
      return Mark.up(M(function(){/***
        {{conditional}}if(deepCompareStrict({{value}}, object)) {
          valid = true;
        {{endConditional}}
      ***/}), {
        value: JSON.stringify(x), 
        index: i,
        conditional: conditional,
        endConditional: endConditional,
        enumeration: JSON.stringify(self.enums)
      });
    }
  });

  // Rendering context
  var renderingOptions = {
    index: this.id,
    ruleIndex: this.id,
    enumeration: JSON.stringify(this.enums),
    validations: validations.join('\n'),
  }

  // Generate path and objectPath
  var paths = generatePathAndObject(self, context);
  // Generate object validation function
  context.functions.push(Mark.up(validationTemplate, renderingOptions));
  // Generate function call
  context.functionCalls.push(Mark.up(M(function(){/***
      enum_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

module.exports = Node;