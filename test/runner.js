"use strict";

var Runner = require('integra').Runner
  , FileFilter = require('integra').FileFilter
  , FileFilter = require('integra').FileFilter
  , TestNameFilter = require('integra').TestNameFilter

var testFiles =[
  '/test/all_of_tests.js',
  '/test/one_of_tests.js',
  '/test/any_of_tests.js',
  '/test/array_tests.js',
  '/test/object_tests.js',
  '/test/not_tests.js',
  '/test/any_tests.js',
  '/test/string_tests.js',
  '/test/boolean_tests.js',
  '/test/compiler_tests.js',
  '/test/null_tests.js',
  '/test/number_tests.js',
  '/test/enum_tests.js',
  '/test/integer_tests.js'
]

// Set up the runner
var runner = new Runner({ 
  logLevel:'info', runners: 1, failFast: true
});

// Add all the tests to run
testFiles.forEach(function(t) {
  if(t != "") runner.add(t);
});

// Exit when done
runner.on('exit', function(errors, results) {
  process.exit(0)
});

runner.run(function() {
  return { 
    start: function(callback) { callback(); },
    stop: function(callback) { callback(); },
    setup: function(callback) { callback(); },
    teardown: function(callback) { callback(); }
  };
});