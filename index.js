// Export module entities
var ex = {
  // Compilers
  Compiler: require('./lib/compiler'),
  ClosureCompiler: require('./lib/closure_compiler'),

  // AST classes
  NestedArrayType: require('./lib/ast').NestedArrayType,
  StringType: require('./lib/ast').StringType,
  NumberType: require('./lib/ast').NumberType,
  IntegerType: require('./lib/ast').IntegerType,
  DocumentType: require('./lib/ast').DocumentType,
  OneOfType: require('./lib/ast').OneOfType,
  AllOfType: require('./lib/ast').AllOfType,
  AnyOfType: require('./lib/ast').AnyOfType,
  NotType: require('./lib/ast').NotType,

  // Validators
  StringValidator: require('./lib/validators/string'),
  ObjectValidator: require('./lib/validators/object'),
  NumericValidator: require('./lib/validators/numeric'),
  IntegerValidator: require('./lib/validators/integer'),
  NestedArrayValidator: require('./lib/validators/nested_array'),
  ExistsValidator: require('./lib/validators/exists'),
  ArrayValidator: require('./lib/validators/array'),
  OneOfValidator: require('./lib/validators/one_of'),
  AnyOfValidator: require('./lib/validators/any_of'),
  NotValidator: require('./lib/validators/not')
}

module.exports = ex;
