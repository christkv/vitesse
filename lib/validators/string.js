var f = require('util').format,
  Utils = require('./utils');

var Validator = function() {
}

//
// String validation handler
//
Validator.validator = function(field, rule, options) {
  var template = `
    if(%s && context.failOnFirst) {
      throw new ValidationError('field %s fails validation %s', rules[%s], %s);
    } else if(%s) {
      errors.push(new ValidationError('field %s fails validation %s', rules[%s], %s));
    }`

  // Get the index
  var index = options.index;
  // Do we have a parent namespace for this validation
  var parent = options.parent;

  // Object name
  var fieldName = parent
    ? f('object.%s.%s', parent, field)
    : f('object.%s' , field);

  // Get the validation chain
  var validations = Utils.generatePathValidation(fieldName);

  // Generate our validation
  var valueValidations = [];

  // Process the validation
  for(var operator in rule.validation) {
    if(operator === '$gt') {
      valueValidations.push(f('%s.length <= %s', fieldName, rule.validation[operator]));
    } else if(operator === '$gte') {
      valueValidations.push(f('%s.length < %s', fieldName, rule.validation[operator]));
    } else if(operator === '$lte') {
      valueValidations.push(f('%s.length > %s', fieldName, rule.validation[operator]));
    } else if(operator === '$lt') {
      valueValidations.push(f('%s.length >= %s', fieldName, rule.validation[operator]));
    } else if(operator === '$in') {
      valueValidations.push(f('[%s].indexOf(%s) != -1', Utils.generateArray(rule.validation[operator]), fieldName));
    } else {
      throw new Error(f('validation operator %s is not supported by String type', operator));
    }
  }

  // Add the validation
  validations.push(f('(%s)', valueValidations.join(' || ')));

  // Generate the validation
  var source = f(template,
    validations.join(' && '),
    fieldName,
    JSON.stringify(rule.validation),
    index,
    fieldName,
    validations.join(' && '),
    fieldName,
    JSON.stringify(rule.validation),
    index,
    fieldName
  );

  // log the generated code
  if(options.logger) {
    options.logger.info(f('[INFO] generated exists code for %s: %s', fieldName, source));
  }

  // Indent the source
  source = Utils.indent(source, options);

  // Return the source
  return source;
}

module.exports = Validator;
