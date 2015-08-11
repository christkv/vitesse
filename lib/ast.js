var NestedArrayType = function(object) {
  if(!(this instanceof NestedArrayType)) return new NestedArrayType(object);
  this.object = object;
}

var ArrayType = function(object) {
  if(!(this instanceof ArrayType)) return new ArrayType(object);
  this.object = object;
}

var StringType = function(object) {
  if(!(this instanceof StringType)) return new StringType(object);
  this.object = object;
}

var NumberType = function(object) {
  if(!(this instanceof NumberType)) return new NumberType(object);
  this.object = object;
}

var DocumentType = function(object) {
  if(!(this instanceof DocumentType)) return new DocumentType(object);
  this.object = object;
}

DocumentType.prototype.keys = function() {
  return Object.keys(this.object);
}

DocumentType.prototype.value = function(key) {
  return this.object[key];
}

exports.DocumentType = DocumentType;
exports.ArrayType = ArrayType;
exports.NestedArrayType = NestedArrayType;
exports.StringType = StringType;
exports.NumberType = NumberType;
