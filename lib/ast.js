var CustomType = function(object, options) {
  if(!(this instanceof CustomType)) return new CustomType(object, options);
  this.object = object || {};
  this.options = options || {};  
}

var NestedArrayType = function(object, options) {
  if(!(this instanceof NestedArrayType)) return new NestedArrayType(object, options);
  this.object = object || {};
  this.options = options || {};
}

var ArrayType = function(object, options) {
  if(!(this instanceof ArrayType)) return new ArrayType(object, options);
  this.object = object || {};
  this.options = options || {};
}

var StringType = function(object, options) {
  if(!(this instanceof StringType)) return new StringType(object, options);
  this.object = object || {};
  this.options = options || {};
}

var NumberType = function(object, options) {
  if(!(this instanceof NumberType)) return new NumberType(object, options);
  this.object = object || {};
  this.options = options || {};
}

var IntegerType = function(object, options) {
  if(!(this instanceof IntegerType)) return new IntegerType(object, options);
  this.object = object || {};
  this.options = options || {};
}

var OneOfType = function(object, options) {
  if(!(this instanceof OneOfType)) return new OneOfType(object, options);
  this.object = object || {};
  this.options = options || {}; 
}

var AnyOfType = function(object, options) {
  if(!(this instanceof AnyOfType)) return new AnyOfType(object, options);
  this.object = object || {};
  this.options = options || {}; 
}

var AllOfType = function(object, options) {
  if(!(this instanceof AllOfType)) return new AllOfType(object, options);
  this.object = object || {};
  this.options = options || {}; 
}

var NotType = function(object, options) {
  if(!(this instanceof NotType)) return new NotType(object, options);
  this.object = object || {};
  this.options = options || {}; 
}

var DocumentType = function(object, options) {
  if(!(this instanceof DocumentType)) return new DocumentType(object, options);
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
exports.AnyOfType = AnyOfType;
exports.AllOfType = AllOfType;
exports.NotType = NotType;
