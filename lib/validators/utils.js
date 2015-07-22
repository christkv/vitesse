var f = require('util').format;

var Utils = function() {
}

Utils.indent = function(source, options) {
  options = options || {};
  // Get the depth
  var depth = options.depth || 0;
  var padding = '';
  // If we have a depth > 0
  if(depth > 0) {
    for(var i = 0; i < depth; i++) {
      padding += "  ";
    }
  }

  var lines = source.split('\n');
  lines = lines.map(function(x) {
    return padding + x;
  });

  return lines.join('\n');
}

Utils.generatePathNotExistValidation = function(fieldName) {
  // Split up the path
  var paths = fieldName.split('.');
  paths.shift();

  // Statements
  var exists = [];
  var currentPath = [];

  // Exercise the path
  for(var i = 0; i < paths.length; i++) {
    var field = paths[i];
    currentPath.push(field);
    exists.push(f('object.%s == null', currentPath.join('.')));
  }

  return exists;
}

Utils.generatePathValidation = function(fieldName) {
  // Split up the path
  var paths = fieldName.split('.');
  paths.shift();

  // Statements
  var exists = [];
  var currentPath = [];

  // Exercise the path
  for(var i = 0; i < paths.length; i++) {
    var field = paths[i];
    currentPath.push(field);
    exists.push(f('object.%s != null', currentPath.join('.')));
  }

  return exists;
}

// Generate array
Utils.generateArray = function(a) {
  return a.map(function(x) {
    return f('"%s"', x);
  })
}

Utils.clone = function(o) {
  var opts = {};
  for(var name in o) opts[name] = o[name];
  return opts;
}

module.exports = Utils;
