 var ValidationError = function(message, path, rule, value, errors) {
    this.message = message;
    this.path = path;
    this.rule = rule;
    this.value = value;
    this.errors = errors;
  }

  var validate = function(object, context) {
    var context = context == null ? {} : context;
    var errors = [];
    var path = ['object'];

      var generatePath = function(parent) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    return f('%s%s', parent, args.map(function(x) {
      return f('[%s]', x);
    }).join(''));
  }
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
  var testArrays = function(v, i, a) {
    for (var j = i + 1; j < a.length; j++) if (deepCompareStrict(v, a[j])) {
      return false;
    }
    return true;
  }
  function enum_validation_0(path, object, context) {
    var valid = false;
  }

      enum_validation_0(["object"], object, context);

    return errors;
  };