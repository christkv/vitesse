"use strict";

var Runner = require('integra').Runner
  , FileFilter = require('integra').FileFilter
  , FileFilter = require('integra').FileFilter
  , TestNameFilter = require('integra').TestNameFilter

var testFiles =[
  '/test/doc_tests/all_of_tests.js',
  '/test/doc_tests/one_of_tests.js',
  '/test/doc_tests/any_of_tests.js',
  '/test/doc_tests/not_tests.js',
  '/test/doc_tests/string_tests.js',
  '/test/doc_tests/boolean_tests.js',
  '/test/doc_tests/null_tests.js',
  '/test/doc_tests/number_tests.js',
  '/test/doc_tests/integer_tests.js'
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