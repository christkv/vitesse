var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');

var Syntax = jstransform.Syntax;

var Optimizer = function(options) {
  this.options = options;
}

Optimizer.prototype.optimize = function(source) {
  function visitEvalCallExpressions(traverse, node, path, state) {
    // if(node.type === Syntax.FunctionDeclaration) {
    //   console.log("================================================================= 0")
    //   console.log(source.substring(node.range[0], node.range[1]))
    //   console.log("================================================================= 1")
    // }
    // console.log("================================ function declaration :: " + node.type)
    // console.dir(node)
    // // Appends an alert() call to the output buffer *before* the visited node
    // // (in this case the eval call) is appended to the output buffer
    // utils.append('alert("...eval?...really?...");', state);

    // // Now we copy the eval expression to the output buffer from the original
    // // source
    // utils.catchup(node.range[1], state);
  }
  visitEvalCallExpressions.test = function(node, path, state) {
    // console.log("--------------------------------------------- test :: " + node.type)
    // console.dir(node)
    // console.dir(node.type)
    // console.dir(node)
    // return node.type === Syntax.CallExpression
    //        && node.callee.type === Syntax.Identifier
    //        && node.callee.name === 'eval';
    return node.type === Syntax.FunctionDeclaration
      || node.type === Syntax.CallExpression;
  };

  var transformedFileData = jstransform.transform(
    [visitEvalCallExpressions], // Multiple visitors may be applied at once, so an
                                // array is always expected for the first argument
    source
  );

  return source;
}

module.exports = Optimizer;