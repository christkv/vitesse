var M = require('mstring'),
  f = require('util').format;

var id = 0;

var generateId = function() {
  return id++;
}

var resetId = function() {
  id = 0;
}

var clone = function(o) {
  var opts = {};
  for(var name in o) opts[name] = o[name];
  return opts;
}

var generatePathAndObject = function(self, context) {
// Generate path
  var path = 'path';
  // If we are in an array
  if(context.inArray && !context.inArrayIndex) {
    path = f('path.slice(0).concat(["" + i])');
  } else if(context.inArray && context.inArrayIndex) {
    path = f('path.slice(0).concat([%s])', context.inArrayIndex);
  } else if(context.path) {
    path = context.path;
  } else if(self.parent == null) {
    path = ['["object"]'];
  } else if(self.parent) {
    path = f('path.slice(0).concat(["%s"])', self.field);
  }

  // Set the object
  var objectPath = 'object';
  // Do we have a custom object path generator
  if(context.inArray && !context.inArrayIndex) {
    objectPath = 'object[i]';
  } else if(context.inArray && context.inArrayIndex) {
    objectPath = f('object[%s]', context.inArrayIndex);
  } else if(context.object) {
    objectPath = context.object;
  }

  // Return the object
  return {path: path, objectPath: objectPath};  
}

var decorate = function(context) {
  // Generate generatePath function
  context.functions.push(M(function(){/***
    var generatePath = function(parent) {
      var args = Array.prototype.slice.call(arguments);
      args.shift();
      return f('%s%s', parent, args.map(function(x) {
        return f('[%s]', x);
      }).join(''));
    }
  ***/}));

  // Add a isRegExp function
  context.functions.push(M(function(){/***
    var isRegEx = function(value) {
      try {
        new RegExp(value);
      } catch(err) {
        return false;
      }

      return true;
    }
  ***/}));

  // Push deepCompare function
  context.functions.push(M(function(){/***
    var deepCompareStrict = function(a, b) {
      if (typeof a !== typeof b) {
        return false;
      }
      if (a instanceof Array) {
        if (!(b instanceof Array)) {
          return false;
        }
        if (a.length !== b.length) {
          return false;
        }
        return a.every(function (v, i) {
          return deepCompareStrict(a[i], b[i]);
        });
      }
      if (typeof a === 'object') {
        if (!a || !b) {
          return a === b;
        }
        var aKeys = Object.keys(a);
        var bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) {
          return false;
        }
        return aKeys.every(function (v) {
          return deepCompareStrict(a[v], b[v]);
        });
      }
      return a === b;
    };
  ***/})); 

  // Push deepCompare function
  context.functions.push(M(function(){/***
    var testArrays = function(v, i, a) {
      for (var j = i + 1; j < a.length; j++) if (deepCompareStrict(v, a[j])) {
        return false;
      }
      return true;
    }
  ***/})); 
}

module.exports = {
  generateId: generateId,
  resetId: resetId,
  clone: clone,
  decorate: decorate,
  generatePathAndObject: generatePathAndObject
}