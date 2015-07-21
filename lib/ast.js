var AST = function(object) {
  this.object = object;
}

AST.prototype.keys = function() {
  return Object.keys(this.object);
}

AST.prototype.value = function(key) {
  return this.object[key];
}

module.exports = AST;
