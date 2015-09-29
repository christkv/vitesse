var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');
var f = require('util').format;

var Syntax = jstransform.Syntax;

var Optimizer = function(options) {
  this.options = options;
}

Optimizer.prototype.optimize = function(source, ast) {
  var functions = {};
  var topLevelOptimizeMethod = null;
  var skipTopLevelOptimization = false;

  var ValidationFunction = function(name, params, code, range) {
    this.name = name;
    this.params = params;
    this.code = code;
    this.range = range;
  }

  // Functions to optimize
  var optimizeFunction = function(value) {
    return value.indexOf('string_validation_') != -1
        || value.indexOf('integer_validation_') != -1;
  }

  var extractId = function(value) {
    return value.split('_validation_')[1];
  }

  //
  // If we have any recursive fields we cannot apply top level execution (at least not yet)
  // ----------------------------------------------------------------------
  if(ast.type == 'object') {
    var method = f('object_validation_%s', ast.id);
    var matches = 0;
    var index = 0;

    // Go over all the indexes
    while(source.indexOf(method, index) != -1) {
      matches = matches + 1;
      index = source.indexOf(method, index) + method.length;
    }

    // Do we have more than 2 then disable
    if(matches > 2) skipTopLevelOptimization = true;
  }

  //
  // Extract all the functions
  // ----------------------------------------------------------------------
  function visitFunctionExpressions(traverse, node, path, state) {
    functions[node.id.name] = new ValidationFunction(node.id.name, 
        node.params, 
        source.substring(node.body.range[0], node.body.range[1]),
        node.body);
    
    utils.catchup(node.range[1], state, function(value) {
      if(optimizeFunction(node.id.name)) {
        return '';
      } else if(!skipTopLevelOptimization && ast.type == 'object' && node.id.name === f('object_validation_%s', ast.id)) {
        return source.substring(node.body.range[0], node.body.range[1]);
      }

      return value;
    });
  }

  visitFunctionExpressions.test = function(node, path, state) {
    return node.type === Syntax.FunctionDeclaration;
  }

  // Go through all the source
  var transformedFileData1 = jstransform.transform(
    [visitFunctionExpressions], // Multiple visitors may be applied at once, so an
                                // array is always expected for the first argument
    source
  );

  //
  // Replace the call expressions
  // ----------------------------------------------------------------------
  function visitEvalCallExpressions(traverse, node, path, state) {
    utils.catchup(node.range[1], state, function(value) {
      if(optimizeFunction(node.callee.name)) {
        // Unpack the id
        var id = extractId(node.callee.name);
        // Create path and object call
        var pathDeclaration = f('var path_%s = %s;\n', id, transformedFileData1.code.substring(node.arguments[0].range[0], node.arguments[0].range[1]));
        var objectDeclaration = f('var object_%s = %s;\n', id, transformedFileData1.code.substring(node.arguments[1].range[0], node.arguments[1].range[1]));

        // Get the function code
        var code = functions[node.callee.name].code;

        // Replace path and object in source
        var functionSource = code
          .replace(/object/g, f('object_%s', id))
          .replace(/path/g, f('path_%s', id))
          .replace(/return errors\;/, '');

        // Return the in-lined function
        return f('%s\n%s\n%s', objectDeclaration, pathDeclaration, functionSource);
      } else if(!skipTopLevelOptimization && ast.type == 'object' && node.callee.name === f('object_validation_%s', ast.id)) {
        return '';
      } else {
        return value;
      }
    });
  }

  visitEvalCallExpressions.test = function(node, path, state) {
    return node.type === Syntax.CallExpression
      && node.callee.name
      && node.callee.name.indexOf('_validation_') != -1;
  }

  var transformedFileData = jstransform.transform(
    [visitEvalCallExpressions], // Multiple visitors may be applied at once, so an
                                // array is always expected for the first argument
    transformedFileData1.code
  );

  // Return the code
  return transformedFileData.code;
}

module.exports = Optimizer;