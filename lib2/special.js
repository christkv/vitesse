var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring');

var Custom = function() {  
}

var Pattern = function() {  
  this.patterns = {};
}

Pattern.prototype.add = function(pattern, validation) {
  this.patterns[pattern] = validation;
}

Pattern.prototype.generate = function(obj, context) {
  // Get the fields
  var fields = obj.children || [];
  var patternProperties = this.patterns || {};
  var fieldNames = {};

  // // Add the list of field
  // for(var name in fields) fieldNames[name] = {};
  for(var i = 0; i < fields.length; i++) {
    fieldNames[fields[i].field] = {};
  }


  // Validation template
  var validationTemplate = M(function(){/***
    var fieldNames = {{fieldNames}};
    var keys = Object.keys(object);
    var properties = keys.slice(0);

    // The sets
    var validSet = {};

    // Go over all the keys
    for(var i = 0; i < keys.length; i++) {
      var key = keys[i];
  
      if(fieldNames[key]) {
        // Set the valid key
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
      }

      // Pattern validations
      {{patterns}}
    }
  ***/});

  // Stores all the patterns
  var patterns = [];
  // Go over all the patterns
  for(var regexp in patternProperties) {
    // Create inner context
    var innerContext = {
      functions: context.functions, 
      functionCalls: [],
      rules: context.rules, 
      regexps: context.regexps,
      object: 'object[key]'
    }

    // // Get the validation pattern
    // var validation = generatePatternMatch(patternProperties[regexp], innerContext, ruleIndex)

    // Get the validation
    var validation = patternProperties[regexp];

    // Generate the validation
    validation.generate(innerContext);

    // Generate the pattern
    patterns.push(Mark.up(M(function(){/***
      var pattern = /{{pattern}}/;
  
      if(key.match(pattern) != null) {
        validSet[key] = {};
        // Remove the property
        properties.splice(properties.indexOf(key), 1);
        // Validation
        {{validation}}
      }
    ***/}), {
      pattern: regexp,
      validation: innerContext.functionCalls.join('\n')
    }));
  }

  // Create template
  return Mark.up(validationTemplate, {
    fieldNames: JSON.stringify(fieldNames),
    patterns: patterns.join('\n'),
    totalPatterns: patterns.length
  });    
}

var Required = function() {  
}

var Prohibited = function() {  
}

module.exports = {
  Custom: Custom,
  Pattern: Pattern,
  Required: Required,
  Prohibited: Prohibited
}