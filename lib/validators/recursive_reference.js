"use strict"

var f = require('util').format,
  Mark = require("markup-js"),
  M = require('mstring'),
  Utils = require('./utils');

var ArrayType = require('../ast').ArrayType,
  NestedArrayType = require('../ast').NestedArrayType,
  StringType = require('../ast').StringType,
  NumberType = require('../ast').NumberType,
  BooleanType = require('../ast').BooleanType,
  DocumentType = require('../ast').DocumentType,
  IntegerType = require('../ast').IntegerType;

var StringValidator = require('./string'),
  NumericValidator = require('./numeric'),
  IntegerValidator = require('./integer'),
  BooleanValidator = require('./boolean'),
  NestedArrayValidator = require('./nested_array'),
  ExistsValidator = require('./exists'),
  ArrayValidator = require('./array');

var Validator = function() {
}

Validator.generate = function generate(key, object, path, context, generateDocumentType) {
  // Get the objects
  var objectMetaData = context.objectMetaData;
  var referenceObject = object.object.node;
  var referenceNode = null;
  console.log(f("============================== Generate Recursion %s.%s :: ", path, key, objectMetaData.length))
  console.dir(object)

  // objectMetaData nodes {index: index, field: key, path: path, node: object}
  // Locate the instance we are calling
  for(var i = 0; i < objectMetaData.length; i++) {
    var _object = objectMetaData[i];

    if(_object.node === referenceObject) {
      referenceNode = _object;
      break;
    }
  }

  // If we have a reference node, generate the calling code
  if(referenceNode) {
  console.log("================== RECURSIVE")
    console.log(f("============================== referenceNode %s.%s ", path, key))
    console.log(Mark.up(M(function(){/***
      object_validation{{index}}('object', object.{{key}}, context);
    ***/}), {key: key, index: referenceNode.index}))
    context.functionCallContexts.push(Mark.up(M(function(){/***
      object_validation{{index}}('object', object.{{key}}, context);
    ***/}), {key: key, index: referenceNode.index}));
  }
}

module.exports = Validator; 