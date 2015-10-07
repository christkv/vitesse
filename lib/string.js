var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  utils = require('./utils'),
  generatePathAndObject = utils.generatePathAndObject;

/**
 * The StringNode class represents a value that a string
 * 
 * @class
 * @return {StringNode} a StringNode instance.
 */
var StringNode = function(parent, field, options) {  
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
  this.customValidators = [];
}

/**
 * Add a validation language node, valid nodes are
 * 
 * * `$gt` greater than `{$gt: 5}`
 * * `$gte` greater or equal to `{$gte: 10}`
 * * `$lt` less than `{$lt: 5}`
 * * `$lte` less or equal to `{$lte: 5}`
 * * `$regexp` regular expression match `{$regexp: /^[0-9]+$/}`
 * * `$in` string must be in provided values `{$in: ['dog', 'cat', 'hamster']}`
 * * `$format` string must match one of the following formats 
 *
 *   * `date-time` - validates a date-time string
 *   * `date` - validates a date string
 *   * `time` - validates a time string
 *   * `email` - validates email addresses
 *   * `ipv4` - validates IP4 addresses
 *   * `ipv6` - validates IP6 addresses
 *   * `uri` - validates URI strings
 *   * `color` - validates basic HTML colors
 *   * `hostname` - validate hostnames
 *   * `alpha` - validate string containing only a-Z characters
 *   * `alphanumeric` - validate string containing only numbers
 *   * `style` - validate css style
 *   * `phone` - validate phone number
 *
 * @method
 * @param {object} validation validation operation valid ones are $gt,$gte,$lt,$lte,$regexp,$in
 * @return {StringNode}
 */
StringNode.prototype.addValidation = function(validation) {
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
 * @return {StringNode}
 */
StringNode.prototype.setTypeCheck = function(typeCheck) {  
  this.typeCheck = typeCheck;
  return this;
}

/**
 * @ignore
 */
StringNode.prototype.setDefault = function(value) {
  this.defaultValue = value;
  return this;
}

/**
 * Add a custom object validator
 *
 * @method
 * @param {CustomNode} node custom validation node to be used for this field validation
 * @return {StringNode}
 */
StringNode.prototype.addCustomValidator = function(validator) {
  this.customValidators.push(validator);
  return this;
}
 
/**
 * Return the current object path
 *
 * @method
 * @return {array} an array containing the path to this node
 */
StringNode.prototype.path = function() {
  if(this.parent == null) return [];
  return this.parent.path().concat([this.field]);
}

/**
 * Generate the code for this node
 *
 * @method
 * @param {object} context the generation context for this node
 */
StringNode.prototype.generate = function(context) {
  // Set self
  var self = this;
  // Get the path
  var path = this.path().join('.');
  // Push ourselves to the rules array
  context.rules[this.id] = this;
  // Validation template
  var validationTemplate = M(function(){/***
    function string_validation_{{index}}(path, object, context) {
      // We have a type validation
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
    renderingOptions.validations = generateValidationLanguage(this, this.validation, context);
  }

  if(this.customValidators.length > 0) {
    renderingOptions.custom = generateCustomValidations(this, this.customValidators, context);
  }

  // Generate type validation if needed
  if(this.typeCheck) {
    renderingOptions.type = Mark.up(M(function(){/***
      if(object !== undefined) {
        if(typeof object != 'string' && context.failOnFirst) {
          throw new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object);
        } else if(typeof object != 'string') {       
          errors.push(new ValidationError('field is not a string', path, rules[{{ruleIndex}}], object));
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
      if(object !== undefined && typeof object == 'string') {
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
      string_validation_{{index}}({{path}}, {{object}}, context);
    ***/}), {
      index: this.id,
      path: paths.path,
      object: paths.objectPath
    }));
}

var generateArray = function(a) {
  return a.map(function(x) {
    return f('"%s"', x);
  });
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

var generateValidationLanguage = function(self, validations, context, options) {
  options = options || {object: 'object', path: 'path'};
  var validationTemplate = M(function(){/***
    if(({{validation}}) && context.failOnFirst) {
      throw new ValidationError('string fails validation {{rule}}', {{path}}, rules[{{ruleIndex}}], {{object}});
    } else if(({{validation}})) {
      errors.push(new ValidationError('string fails validation {{rule}}', {{path}}, rules[{{ruleIndex}}], {{object}}));
    }
  ***/});

  // Store validation string parts
  var valueValidations = [];

  // Process the validation
  for(var operator in validations) {
    if(operator === '$gt') {
      valueValidations.push(f('%s.length <= %s', options.object, validations[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('%s.length < %s', options.object, validations[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('%s.length > %s', options.object, validations[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('%s.length >= %s', options.object, validations[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(%s) == -1', generateArray(validations[operator]), options.object));
    } else if(operator === '$format') {
      // Add the value validation
      valueValidations.push(f("regexps['%s_format'].test(%s) == false", self.id, options.object));
      // If we don't have a regexp for the format
      if(!format_regexes[validations[operator]]) {
        throw new Error(f('validation $format = %s is not supported by String type', validations[operator]));
      }

      // Add the validation to the regexp object
      context.regexps[f("%s_format", self.id)] = format_regexes[validations[operator]];
    } else if(operator === '$regexp') {
      // Add the value validation
      valueValidations.push(f('regexps[%s].test(%s) == false', self.id, options.object));
      // Add the validation to the regexp object
      context.regexps[self.id] = typeof validations[operator] == 'string'
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
    object: options.object,
    path: options.path,
    validation: (valueValidations.length > 0 ? valueValidations.join(' || ') : 'true')
  }); 
}

var format_regexes = {
  "date-time": /^(\d{4}-(?:0[0-9]|1[0-2])-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.\d+)?(Z|(\-|\+)[0-9]{2}:[0-9]{2})?)?)$/,
  date: /^(\d{4}-(?:0[0-9]|1[0-2])-[0-9]{2})$/,
  time: /^\d{2}:\d{2}:\d{2}$/,
  email: /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,
  uri: /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/,
  color: /^(((#[0-9A-Fa-f]{3,6}))|(aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow)|(rgb\(\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,
  hostname: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])){0,3}\.?)$/,
  alpha: /^[a-zA-Z]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  style: /\s*(.+?):\s*([^;]+);?/g,
  phone: /^\+(?:[0-9] ?){6,14}[0-9]$/
}

module.exports = StringNode;
