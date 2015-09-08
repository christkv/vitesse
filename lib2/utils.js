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

module.exports = {
  generateId: generateId,
  resetId: resetId,
  clone: clone
}