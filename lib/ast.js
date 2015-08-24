var CustomType = function(object, options) {
  if(!(this instanceof CustomType)) return new CustomType(object);
  this.object = object || {};
  this.options = options || {};  
}

var NestedArrayType = function(object, options) {
  if(!(this instanceof NestedArrayType)) return new NestedArrayType(object);
  this.object = object || {};
  this.options = options || {};
}

var ArrayType = function(object, options) {
  if(!(this instanceof ArrayType)) return new ArrayType(object);
  this.object = object || {};
  this.options = options || {};
}

var StringType = function(object, options) {
  if(!(this instanceof StringType)) return new StringType(object);
  this.object = object || {};
  this.options = options || {};
}

var NumberType = function(object, options) {
  if(!(this instanceof NumberType)) return new NumberType(object);
  this.object = object || {};
  this.options = options || {};
}

var IntegerType = function(object, options) {
  if(!(this instanceof IntegerType)) return new IntegerType(object);
  this.object = object || {};
  this.options = options || {};
}

var OneOfType = function(object, options) {
  if(!(this instanceof OneOfType)) return new OneOfType(object);
  this.object = object || {};
  this.options = options || {}; 
}

var DocumentType = function(object, options) {
  if(!(this instanceof DocumentType)) return new DocumentType(object);
  this.object = object || {};
  this.options = options || {};
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
exports.IntegerType = IntegerType;
exports.CustomType = CustomType;
exports.OneOfType = OneOfType;
