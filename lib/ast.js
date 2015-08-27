var CustomType = function(object) {
  if(!(this instanceof CustomType)) return new CustomType(object);
  this.object = object || {};
}

var NestedArrayType = function(object) {
  if(!(this instanceof NestedArrayType)) return new NestedArrayType(object);
  this.object = object || {};
}

var AnyType = function(object) {
  if(!(this instanceof AnyType)) return new AnyType(object);
  this.object = object || {};
}

var ArrayType = function(object) {
  if(!(this instanceof ArrayType)) return new ArrayType(object);
  this.object = object || {};
}

var StringType = function(object) {
  if(!(this instanceof StringType)) return new StringType(object);
  this.object = object || {};
}

var NumberType = function(object) {
  if(!(this instanceof NumberType)) return new NumberType(object);
  this.object = object || {};
}

var IntegerType = function(object) {
  if(!(this instanceof IntegerType)) return new IntegerType(object);
  this.object = object || {};
}

var BooleanType = function(object) {
  if(!(this instanceof BooleanType)) return new BooleanType(object);
  this.object = object || {};
}

var OneOfType = function(object) {
  if(!(this instanceof OneOfType)) return new OneOfType(object);
  this.object = object || {};
}

var AnyOfType = function(object) {
  if(!(this instanceof AnyOfType)) return new AnyOfType(object);
  this.object = object || {};
}

var AllOfType = function(object) {
  if(!(this instanceof AllOfType)) return new AllOfType(object);
  this.object = object || {};
}

var NotType = function(object) {
  if(!(this instanceof NotType)) return new NotType(object);
  this.object = object || {};
}

var DocumentType = function(object) {
  if(!(this instanceof DocumentType)) return new DocumentType(object);
  this.object = object || {};
}

DocumentType.prototype.keys = function() {
  return Object.keys(this.object.fields);
}

DocumentType.prototype.value = function(key) {
  return this.object.fields[key];
}

exports.DocumentType = DocumentType;
exports.ArrayType = ArrayType;
exports.NestedArrayType = NestedArrayType;
exports.StringType = StringType;
exports.NumberType = NumberType;
exports.IntegerType = IntegerType;
exports.BooleanType = BooleanType;
exports.CustomType = CustomType;
exports.OneOfType = OneOfType;
exports.AnyOfType = AnyOfType;
exports.AllOfType = AllOfType;
exports.NotType = NotType;
exports.AnyType = AnyType;
