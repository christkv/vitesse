// Export module entities
var ex = {
  // Compilers
  Compiler: require('./lib/compiler'),
  ClosureCompiler: require('./lib/closure_compiler'),

  // AST classes
  NestedArrayType: require('./lib/ast').NestedArrayType,
  StringType: require('./lib/ast').StringType,
  NumberType: require('./lib/ast').NumberType,
  DocumentType: require('./lib/ast').DocumentType,

  // Validators
  StringValidator: require('./lib/validators/string'),
  ObjectValidator: require('./lib/validators/object'),
  NumericValidator: require('./lib/validators/numeric'),
  NestedArrayValidator: require('./lib/validators/nested_array'),
  ExistsValidator: require('./lib/validators/exists'),
  ArrayValidator: require('./lib/validators/array')
}

module.exports = ex;
