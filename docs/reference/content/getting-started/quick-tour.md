+++
date = "2015-03-17T15:36:56Z"
title = "Quick Tour"
[menu.main]
  parent = "Getting Started"
  identifier = "Quick Tour"
  weight = 10
  pre = "<i class='fa'></i>"
+++

# QuickStart

This quick guide will give you an introduction on what Vitesse is and how to leverage it in your application for high performance validations.

## Introduction

Vitesse is a framework that lets you easily create your own Domain Specific Validation languages (DSVL). The goal of Vitesse it to generate efficient fast code while allowing you to freely express yourself when designing your favorite style of validation framework.

It can serve as a target for JSON Schema implementations, a Joi like framework or whatever you can think of.

## Under the covers

To understand how Vitesse works it's easier to show a simple example. Let's look at a very simple Object validator.

```js
var ObjectNode = require('vitesse').ObjectNode,
  StringNode = require('vitesse').StringNode,
  IntegerNode = require('vitesse').IntegerNode,
  Compiler = require('vitesse').Compiler;

var schema = new ObjectNode(null, null, {typeCheck:true})
  .addChild('name', new StringNode(null, null, {typeCheck:true}))
  .addChild('age', new IntegerNode(null, null, {typeCheck:true}))
  .requiredFields(['name', 'age']);

var compiler = new Compiler();
var validator = compiler.compile(schema);
console.dir(validator.validate({name: 'peter'}))
console.dir(validator.validate({name: 'peter', age: '10'}))
console.dir(validator.validate({name: 'peter', age: 10}))
```

The first part of the code

```js
var schema = new ObjectNode(null, null, {typeCheck:true})
  .addChild('name', new StringNode(null, null, {typeCheck:true}))
  .addChild('age', new IntegerNode(null, null, {typeCheck:true}))
  .requiredFields(['name', 'age']);
```

Constructs a object hierarchy that represents the intended validations we want applied to an object.

The next part.

```js
var compiler = new Compiler();
var validator = compiler.compile(schema);
```

Compiles that object hierarchy into `Javascript` code and then uses `eval` to return you a instantiated validation function that is optimized to perform the validation as close to hand-coded validations as possible.

Finally we print the results of a couple of example validations.

```js
console.dir(validator.validate({name: 'peter'}))
console.dir(validator.validate({name: 'peter', age: '10'}))
console.dir(validator.validate({name: 'peter', age: 10}))
```

## Closure Compiler

The `Vitesse` module also comes with an alternative compiler that leverages the Google Closure compiler. This requires a `Java` runtime to be installed on the system as the module will execute a child process to compile the generated JavaScript with the Closure Compiler to maximize the performance.

Be aware that the Closure Compiler is a magnitude slower than the normal Compiler as it requires to execute Java in a child process each time you call compile.

Let's look at how we can compile the example above using the Closure Compiler. Notice that we require a callback as the operation is Asynchronous.

```js
var ObjectNode = require('vitesse').ObjectNode,
  StringNode = require('vitesse').StringNode,
  IntegerNode = require('vitesse').IntegerNode,
  ClosureCompiler = require('vitesse').ClosureCompiler;

var schema = new ObjectNode(null, null, {typeCheck:true})
  .addChild('name', new StringNode(null, null, {typeCheck:true}))
  .addChild('age', new IntegerNode(null, null, {typeCheck:true}))
  .requiredFields(['name', 'age']);

var compiler = new ClosureCompiler();
compiler.compile(schema, function(err, validator) {
  console.dir(validator.validate({name: 'peter'}))
  console.dir(validator.validate({name: 'peter', age: '10'}))
  console.dir(validator.validate({name: 'peter', age: 10}))  
});
```
